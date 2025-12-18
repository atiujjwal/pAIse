import { NextRequest } from "next/server";
import { withAuth } from "@/src/middleware/auth";
import { badRequest, errorResponse, successResponse } from "@/src/lib/response";
import { FileStorageService } from "@/src/services/storageService";
import { prisma } from "@/src/lib/db";
import { VoiceAiService, VoiceExpenseFormDataSchema } from "@/src/services/ai/voice-expense";

/**
 * POST /api/ai/voice-expense
 * Processes voice notes into structured expense drafts.
 * Requires: 'audio' (file) and 'context' (JSON string with participants).
 */
const postHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;
    const formData = await request.formData();

    // 1. Extract Fields
    const contextValue = formData.get("context");
    const rawAudio = formData.get("audio");

    if (!contextValue || typeof contextValue !== "string") {
      return badRequest("Missing or invalid 'context' JSON string.");
    }
    if (!(rawAudio instanceof File)) {
      return badRequest("Missing audio file.");
    }

    // 2. Validate using Zod (Schema handles JSON parsing of context)
    const validation = VoiceExpenseFormDataSchema.safeParse({
      audio: rawAudio,
      context: contextValue,
    });

    if (!validation.success) {
      return errorResponse(
        "Invalid input data",
        400,
        "BAD_REQUEST",
        validation.error.issues
      );
    }

    const { audio, context } = validation.data;

    // 3. Security Check: Ensure authenticated user is in the participants list
    // (This prevents users from processing expenses for purely 3rd parties)
    const currentUserInContext = context.participants.find(
      (p) => p.id === userId
    );
    if (!currentUserInContext) {
      // Auto-inject current user if missing, fetching from DB
      const user = await prisma.user.findUnique({
        where: { id: userId, is_deleted: false },
        select: { id: true, name: true, avatar: true },
      });
      if (!user) return errorResponse("User not found", 404);

      // Patch the context
      context.current_user = {
        id: user.id,
        name: user.name,
        avatar: user.avatar || null,
      };
      // Ensure they are in the participants list for mapping
      if (!context.participants.some((p) => p.id === userId)) {
        context.participants.push(context.current_user);
      }
    }

    // 4. File Handling (Upload to temp storage or use buffer directly)
    // Using a temp file path is safer for large files/libraries expecting paths
    const buffer = Buffer.from(await audio.arrayBuffer());
    const filename = `voice_${userId}_${Date.now()}_${audio.name}`;
    const filePath = await FileStorageService.upload(buffer, filename);

    // 5. Process with AI
    const draftExpense = await VoiceAiService.processVoiceExpense(
      filePath,
      audio.type,
      context
    );

    // 6. Cleanup
    await FileStorageService.delete(filePath);

    return successResponse("Expense draft created successfully", draftExpense);
  } catch (error: any) {
    console.error("Voice API Error:", error);
    if (error.message?.includes("token")) {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse("Internal server error");
  }
};

export const POST = withAuth(postHandler);
