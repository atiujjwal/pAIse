import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/src/middleware/auth";
import { badRequest, errorResponse, successResponse } from "@/src/lib/response";
import { FileStorageService } from "@/src/services/storageService";
import { VoiceAiService } from "@/src/services/ai/voice-expense";

// --- 1. Define Schemas (As per your request) ---

const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  email: z.string().nullable().optional(), // Added email as it might be useful for 'friend' object
});

const ExpenseContextSchema = z.object({
  mode: z.enum(["GROUP", "FRIEND"]),
  current_user: ParticipantSchema,
  participants: z.array(ParticipantSchema),
  group_id: z.string().nullable().optional(),
  friend_id: z.string().nullable().optional(),
});

// Helper type for the context
type ExpenseContext = z.infer<typeof ExpenseContextSchema>;

// Config constants
const MAX_AUDIO_FILE_SIZE_MB = 10;
const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-m4a",
  "audio/webm",
  "audio/mp4", // iOS voice memos often record as mp4 audio
];

const VoiceExpenseFormDataSchema = z.object({
  audio: z
    .custom<File>((file) => file instanceof File, "Audio must be a file")
    .refine((file) => file.size <= MAX_AUDIO_FILE_SIZE_BYTES, {
      message: `File size must be less than ${MAX_AUDIO_FILE_SIZE_MB}MB`,
    })
    .refine((file) => ACCEPTED_AUDIO_TYPES.includes(file.type), {
      message: "Invalid audio format.",
    }),
  context: z
    .string()
    .transform((str, ctx) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid JSON format for context",
        });
        return z.NEVER;
      }
    })
    .pipe(ExpenseContextSchema),
});

// --- 2. Hydration Helper ---

/**
 * Merges the AI raw result (ids and amounts) with the Frontend context (names, avatars)
 */
function hydrateDraftExpense(
  aiResult: any,
  context: ExpenseContext,
  currentUserId: string
) {
  const findUser = (id: string) => {
    return (
      context.participants.find((p) => p.id === id) || {
        id,
        name: "Unknown",
        avatar: null,
      }
    );
  };

  // 1. Identify Creator
  const creator = findUser(currentUserId);

  // 2. Hydrate Payers
  const hydratedPayers = aiResult.payers.map((payer: any) => ({
    ...payer,
    user: findUser(payer.user_id),
  }));

  // 3. Hydrate Splits
  const hydratedSplits = aiResult.splits.map((split: any) => ({
    ...split,
    user: findUser(split.user_id),
  }));

  // 4. Determine Target (Friend or Group details)
  let targetDetails = null;
  if (context.mode === "FRIEND" && context.friend_id) {
    targetDetails = findUser(context.friend_id);
  } else if (context.mode === "GROUP" && context.group_id) {
    // If you pass group name in context, map it here.
    // Otherwise returning simple object or null.
    targetDetails = { id: context.group_id, name: "Group Expense" };
  }

  return {
    description: aiResult.description,
    amount: aiResult.amount.toString(),
    date: new Date().toISOString(),
    category: aiResult.category || "Other",
    group_id: context.group_id || null,
    split_type: aiResult.split_type || "EQUAL",
    created_at: new Date().toISOString(),
    created_by: creator,
    payers: hydratedPayers,
    splits: hydratedSplits,
    [context.mode === "FRIEND" ? "friend" : "group"]: targetDetails,
  };
}

// --- 3. Main Handler ---

const postHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;
    const formData = await request.formData();

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

    const buffer = Buffer.from(await audio.arrayBuffer());
    const filename = `voice_${userId}_${Date.now()}_${audio.name}`;
    const filePath = await FileStorageService.upload(buffer, filename);

    const aiDraftResult = await VoiceAiService.processVoiceExpense(
      filePath,
      audio.type,
      context
    );
    await FileStorageService.delete(filePath);

    const richResponse = hydrateDraftExpense(aiDraftResult, context, userId);

    return successResponse("Expense draft created successfully", richResponse);
  } catch (error: any) {
    console.error("Voice API Error:", error);
    if (error.message?.includes("token")) {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse("Internal server error");
  }
};

export const POST = withAuth(postHandler);
