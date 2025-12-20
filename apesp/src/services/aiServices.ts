import { Decimal } from "decimal.js";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { EXPENSE_CATEGORIES } from "./ai/voice-expense";

Decimal.set({ precision: 12 });

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || "");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

const MAX_AUDIO_FILE_SIZE_MB = 10;
const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg", // .mp3
  "audio/wav", // .wav
  "audio/mp4", // .m4a
  "audio/x-m4a", // .m4a (alternative)
  "audio/webm", // .webm (web recording)
  "audio/aac", // .aac
];

export interface AnalyticsIntent {
  action: "get_summary" | "unknown";
  period: string | null;
  category: string | null;
}

export interface DraftExpense {
  merchant: string;
  date: string;
  time: string;
  total_amount: string;
  currency: string;
  transaction_number?: string;
  payment_method?: string;
  tax_details: {
    amount: string;
    percentage?: string; // e.g., "5%" or "18%"
  };
  tip_amount: string;
  category_suggestion: string;
  confidence_score: number;
  line_items: {
    item: string;
    amount: string;
    quantity: number;
    dietary_type: "VEGAN" | "VEG" | "NON_VEG" | "ALCOHOL" | "UNKNOWN";
  }[];
}
export interface ExpenseContext {
  mode: "GROUP" | "FRIEND";
  current_user_id: string;
  current_user_name: string;
  group_id?: string | null;
  friend_id?: string | null;
  participants: { id: string; name: string }[];
}

export interface QueryIntent {
  type:
    | "GET_SPENDING"
    | "GET_BALANCE"
    | "GET_TRANSACTIONS"
    | "APP_HELP"
    | "UNKNOWN";
  parameters: {
    category?: string; // e.g., "Food"
    friend_name?: string; // e.g., "Rahul"
    group_name?: string; // e.g., "Goa Trip"
    date_range?: "LAST_MONTH" | "THIS_MONTH" | "LAST_WEEK" | "ALL_TIME";
  };
}

const ParticipantSchema = z.object({
  id: z.string().cuid({ message: "Participant ID must be a valid CUID" }),
  name: z.string().min(1, "Participant name is required"),
});

const ContextShapeSchema = z
  .object({
    mode: z.enum(["GROUP", "FRIEND"]),
    group_id: z.string().cuid().optional().nullable(),
    friend_id: z.string().cuid().optional().nullable(),
    participants: z
      .array(ParticipantSchema)
      .min(1, "At least one participant is required"),
  })
  .refine(
    (data) => {
      if (data.mode === "GROUP" && !data.group_id) return false;
      if (data.mode === "FRIEND" && !data.friend_id) return false;
      return true;
    },
    {
      message: "group_id is required for GROUP mode, friend_id for FRIEND mode",
      path: ["mode"],
    }
  );

export const VoiceExpenseFormDataSchema = z.object({
  audio: z
    .custom<File>((file) => file instanceof File, "Audio must be a file")
    .refine((file) => file.size <= MAX_AUDIO_FILE_SIZE_BYTES, {
      message: `File size must be less than ${MAX_AUDIO_FILE_SIZE_MB}MB`,
    })
    .refine((file) => ACCEPTED_AUDIO_TYPES.includes(file.type), {
      message: "Invalid audio format. Supported: mp3, wav, m4a, webm",
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
    .pipe(ContextShapeSchema), // Pipe the parsed object to the shape schema
});

// Type Inference for use in your code
export type VoiceExpenseInput = z.infer<typeof VoiceExpenseFormDataSchema>;

// --- GEMINI supported OCR Service ---
export class OcrService {
  static async scan(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<DraftExpense> {
    console.log(
      `[OcrService] Scanning ${imageBuffer.length} bytes via Gemini...`
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            merchant: {
              type: SchemaType.STRING,
              description: "Name of the establishment",
            },
            date: { type: SchemaType.STRING, description: "YYYY-MM-DD" },
            time: {
              type: SchemaType.STRING,
              description: "HH:MM (24-hour format)",
            },
            total_amount: {
              type: SchemaType.STRING,
              description: "Grand total including tax/tip",
            },
            currency: {
              type: SchemaType.STRING,
              description: "3-letter ISO code (e.g., INR, USD)",
            },
            transaction_number: {
              type: SchemaType.STRING,
              description: "Invoice # or Slip #",
            },
            payment_method: {
              type: SchemaType.STRING,
              description: "e.g., Cash, UPI, Visa, Amex",
            },
            category_suggestion: {
              type: SchemaType.STRING,
              description:
                "Suggest one: Food & Dining, Housing & Utilities,Transportation,Travel & Accommodation,Shopping & Personal,Entertainment & Social,Health & Wellness,Education & Work, Family,Bills & Subscriptions or Other",
            },
            confidence_score: {
              type: SchemaType.NUMBER,
              description: "0.0 to 1.0 confidence level",
            },

            // Nested Tax Object
            tax_details: {
              type: SchemaType.OBJECT,
              properties: {
                amount: {
                  type: SchemaType.STRING,
                  description: "Total tax amount",
                },
                percentage: {
                  type: SchemaType.STRING,
                  description: "Tax rate if visible (e.g. 5%)",
                },
              },
              required: ["amount"],
            },

            tip_amount: {
              type: SchemaType.STRING,
              description: "Tip/Service Charge if any, else 0",
            },

            // Detailed Line Items
            line_items: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  item: { type: SchemaType.STRING },
                  amount: {
                    type: SchemaType.STRING,
                    description: "Total price for this line (qty * unit)",
                  },
                  quantity: { type: SchemaType.NUMBER },
                  dietary_type: {
                    type: SchemaType.STRING,
                    format: "enum",
                    enum: ["VEGAN", "VEG", "NON_VEG", "ALCOHOL", "UNKNOWN"],
                    description:
                      "Infer based on food name. Chicken/Egg=NON_VEG. Dairy/Paneer=VEG. Plant=VEGAN.",
                  },
                },
                required: ["item", "amount", "quantity", "dietary_type"],
              },
            },
          },
          required: [
            "merchant",
            "date",
            "total_amount",
            "currency",
            "line_items",
            "tax_details",
          ],
        },
      },
    });

    try {
      // 2. The System Prompt (Context & Instructions)
      const prompt = `
        Analyze this receipt image specifically for an expense sharing app.
        
        Extraction Rules:
        1. **Dietary Classification**: Use your knowledge of food to strictly classify every edible line item.
           - "Chicken", "Fish", "Egg", "Mutton" -> NON_VEG
           - "Paneer", "Milk", "Cheese", "Butter" -> VEG
           - "Tofu", "Salad", "Roti" (if plain) -> VEGAN
           - "Beer", "Whiskey", "Cocktail" -> ALCOHOL
           - If it's a non-food item (like "Service Charge" or "Packaging"), mark as UNKNOWN.
        
        2. **Financials**: 
           - Extract the tax amount explicitly. 
           - If there is a "Service Charge" or written tip, put it in 'tip_amount'.
           - Ensure 'total_amount' matches the final bill value.
        
        3. **Metadata**:
           - If the date is ambiguous (e.g. 01/02/24), prefer DD/MM/YYYY for international receipts, or use context. Convert to YYYY-MM-DD.
           - If no currency symbol is found, infer it from the location/merchant address if visible (e.g. India = INR).
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: mimeType,
          },
        },
      ]);

      const data = JSON.parse(result.response.text());
      return data as DraftExpense;
    } catch (error) {
      console.error("Gemini AI Error:", error);
      throw new Error("Failed to extract data from image");
    }
  }
}

export class VoiceAiService {
  static async processVoiceExpense(
    filePath: string,
    mimeType: string,
    context: ExpenseContext
  ) {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            description: { type: SchemaType.STRING },
            amount: { type: SchemaType.STRING },
            currency: { type: SchemaType.STRING },
            date: { type: SchemaType.STRING },
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
                  user_id: { type: SchemaType.STRING }, // AI must pick from provided context IDs
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
                  user_id: { type: SchemaType.STRING }, // AI must pick from provided context IDs
                  amount_owed: { type: SchemaType.STRING }, // If EXACT
                  shares_owed: { type: SchemaType.NUMBER }, // If SHARES
                  percent_owed: { type: SchemaType.NUMBER }, // If PERCENTAGE
                },
                required: ["user_id"],
              },
            },
            missing_info: {
              type: SchemaType.STRING,
              nullable: true,
              description: "If critical info is missing, explain what.",
            },
          },
          required: [
            "description",
            "amount",
            "currency",
            "date",
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
        displayName: "Voice Expense Context",
      });

      // 2. Build the Dynamic Prompt
      // We explicitly list the valid Names and IDs so the AI can map them.
      const participantsList = context.participants
        .map((p) => `- Name: "${p.name}", ID: "${p.id}"`)
        .join("\n");

      const prompt = `
        You are an expense assistant. Listen to the audio and create a JSON draft for an expense.
        
        **CONTEXT (STRICTLY USE THESE IDs):**
        My User ID: "${context.current_user_id}" and My name: "${
        context.current_user_name
      }" (If I say "I paid", use this ID).
        Valid Participants:
        ${participantsList}

        **INSTRUCTIONS:**
        1. **Mapping:** Convert spoken names to the matching "ID" from the list above. 
        2. **Payers:** If the user says "I paid", set payer user_id to "${
          context.current_user_id
        }". If they say "Rahul paid", find Rahul's ID.
        3. **Splits:** - If "split equally", include all participants in the 'splits' array.
           - If "Rahul owes me 500", it means I paid full, and Rahul has a split of 500.
        4. **Date:** Today is ${new Date().toISOString()}.
        5. **Missing Info:** If amount or description is missing, fill 'missing_info'.
      `;

      // 3. Generate
      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri,
          },
        },
        { text: prompt },
      ]);

      // 4. Cleanup
      await fileManager.deleteFile(uploadResult.file.name);

      const response = JSON.parse(result.response.text());

      // Merge the AI response with the context IDs so the frontend receives a complete payload
      return {
        ...response,
        group_id: context.group_id || null,
        friend_id: context.friend_id || null,
      };
    } catch (error) {
      console.error("Voice Processing Error:", error);
      throw new Error("Failed to process voice expense");
    }
  }
}

export class NlpService {
  static async parseQueryIntent(query: string): Promise<QueryIntent> {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analyze this query: "${query}". Return the intent. If asking about features/how-to, use APP_HELP.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",

        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            type: {
              type: SchemaType.STRING,
              format: "enum",
              enum: [
                "GET_SPENDING",
                "GET_BALANCE",
                "GET_TRANSACTIONS",
                "APP_HELP",
                "UNKNOWN",
              ],
            },
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                category: {
                  type: SchemaType.STRING,
                  format: "enum",
                  enum: EXPENSE_CATEGORIES,
                },
                friend_name: { type: SchemaType.STRING, nullable: true },
                group_name: { type: SchemaType.STRING, nullable: true },
                date_range: {
                  type: SchemaType.STRING,
                  format: "enum",
                  enum: ["LAST_MONTH", "THIS_MONTH", "LAST_WEEK", "ALL_TIME"],
                  nullable: true,
                },
              },
              required: [],
            },
          },
          required: ["type", "parameters"],
        },
      },
    });

    // Now this will be valid JSON
    return JSON.parse(result.response.text()) as QueryIntent;
  }

  static async generateRagResponse(
    query: string,
    retrievedData: any
  ): Promise<string> {
    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a friendly financial assistant for the app "pAIse".
      
      USER QUERY: "${query}"
      
      CONTEXT DATA (Database Results or Help Docs):
      ${JSON.stringify(retrievedData, null, 2)}

      INSTRUCTIONS:
      1. Answer the user's question based ONLY on the Context Data provided.
      2. If the data is empty or zero, politely say so.
      3. Be concise and conversational.
      4. If the data shows debts, mention who owes whom clearly.
      5. Currency is INR (₹).
    `;

    const result = await chatModel.generateContent(prompt);
    return result.response.text();
  }
}
