import { Decimal } from "decimal.js";
import { z } from "zod";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { AiSecurityService } from "./aiSecurityService";

Decimal.set({ precision: 12 });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || "");

const MAX_AUDIO_FILE_SIZE_MB = 10;
const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/webm",
  "audio/aac",
  "audio/ogg",
];

// --- Schemas ---

const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable().optional(),
});

// The context shape expected from the Frontend
export const ExpenseContextSchema = z.object({
  mode: z.enum(["GROUP", "FRIEND"]),
  current_user: ParticipantSchema,
  participants: z.array(ParticipantSchema), // Includes current user + friends
  group_id: z.string().nullable().optional(),
  friend_id: z.string().nullable().optional(),
});

export type ExpenseContext = z.infer<typeof ExpenseContextSchema>;

export const VoiceExpenseFormDataSchema = z.object({
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

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Housing & Utilities",
  "Transportation",
  "Travel & Accommodation",
  "Shopping & Personal",
  "Entertainment & Social",
  "Health & Wellness",
  "Education & Work",
  "Family",
  "Bills & Subscriptions",
  "Other",
];

export class VoiceAiService {
  /**
   * Processes audio and context to return a hydrated Expense Draft.
   */
  static async processVoiceExpense(
    filePath: string,
    mimeType: string,
    context: ExpenseContext
  ) {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            description: { type: SchemaType.STRING },
            amount: { type: SchemaType.STRING },
            currency: { type: SchemaType.STRING },
            date: { type: SchemaType.STRING, description: "ISO 8601 Date" },
            category: {
              type: SchemaType.STRING,
              format: "enum",
              enum: EXPENSE_CATEGORIES,
            },
            split_type: {
              type: SchemaType.STRING,
              format: "enum",
              enum: ["EQUAL", "EXACT", "PERCENTAGE", "SHARES"],
            },
            payers: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  user_id: { type: SchemaType.STRING },
                  amount: { type: SchemaType.STRING },
                },
                required: ["user_id", "amount"],
              },
            },
            splits: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  user_id: { type: SchemaType.STRING },
                  amount_owed: { type: SchemaType.STRING, nullable: true },
                  shares_owed: { type: SchemaType.NUMBER, nullable: true },
                  percent_owed: { type: SchemaType.NUMBER, nullable: true },
                },
                required: ["user_id"],
              },
            },
          },
          required: [
            "description",
            "amount",
            "category",
            "split_type",
            "payers",
            "splits",
          ],
        },
      },
    });

    try {
      const uploadResult = await fileManager.uploadFile(filePath, {
        mimeType,
        displayName: "Voice Expense Audio",
      });

      // Build Prompt
      const participantMap = new Map<string, string>(); // Name -> ID
      const participantsList = context.participants
        .map((p) => {
          participantMap.set(p.name.toLowerCase(), p.id);
          return `- Name: "${p.name}", ID: "${p.id}"`;
        })
        .join("\n");

      const today = new Date().toISOString();
      const safeUserName = AiSecurityService.sanitizeInput(context.current_user.name);
      const contextData = `
        - Current User: "${safeUserName}" (ID: "${context.current_user.id}")
        - Participants Available:
        ${participantsList}
        - Today's Date: ${today}
      `;

      const prompt = `
        You are a smart expense assistant. Listen to the audio and extract expense details.

        **CONTEXT_DATA (Trusted Source)**:
          ${contextData}

        **RULES**:
        1. **Who Paid**: If I say "I paid", assign payer user_id = "${context.current_user.id}".
        2. **Mapping**: Match spoken names to IDs strictly from the list above. If a name matches partially, pick the best ID.
        3. **Splits**: 
           - "Split equally" -> All participants in 'splits' array.
           - "Rahul owes 500" -> I paid full, Rahul is in 'splits' with amount_owed 500.
        4. **Category**: Pick the best fit from the allowed list. Default to "Other".
        5. **Date**: Use today's date unless a specific date is mentioned (e.g. "yesterday"). Return as ISO string.
      `;

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri,
          },
        },
        { text: prompt },
      ]);

      await fileManager.deleteFile(uploadResult.file.name);

      const rawData = JSON.parse(result.response.text());

      // Hydrate Response
      const hydrationMap = new Map(context.participants.map((p) => [p.id, p]));

      const hydratedPayers = rawData.payers.map((p: any) => ({
        user_id: p.user_id,
        amount: p.amount,
        user: hydrationMap.get(p.user_id) || {
          id: p.user_id,
          name: "Unknown",
          avatar: null,
        },
      }));

      const hydratedSplits = rawData.splits.map((s: any) => ({
        user_id: s.user_id,
        amount_owed: s.amount_owed,
        percent_owed: s.percent_owed,
        shares_owed: s.shares_owed,
        user: hydrationMap.get(s.user_id) || {
          id: s.user_id,
          name: "Unknown",
          avatar: null,
        },
      }));

      // Construct Final Object matching /expenses/[id] response format
      return {
        description: rawData.description,
        amount: rawData.amount,
        date: rawData.date || today,
        category: rawData.category,
        group_id: context.group_id || null,
        split_type: rawData.split_type,
        created_at: new Date().toISOString(),
        created_by: context.current_user,
        payers: hydratedPayers,
        splits: hydratedSplits,
        // Optional context enrichment
        friend: context.friend_id
          ? hydrationMap.get(context.friend_id)
          : undefined,
      };
    } catch (error) {
      console.error("Voice Processing Logic Error:", error);
      throw new Error("Failed to process voice expense.");
    }
  }
}
