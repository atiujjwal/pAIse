import { z } from "zod";

// --- Primitives ---
const decimalString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid currency format");

// --- Auth Schemas ---
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  device: z.string().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email(),
  password: z.string().min(10, "Password must be at least 10 characters"), // Backend constraint [85]
  phone: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().default("INR"),
});

// --- Expense Schemas (Complex) ---
export const expensePayerSchema = z.object({
  user_id: z.string().cuid(),
  amount: decimalString,
});

export const expenseSplitSchema = z.object({
  user_id: z.string().cuid(),
  // Calculated by backend, but present in responses
  amount_owed: decimalString.optional(),
  // Inputs for creation
  percent_owed: z.number().min(0).max(100).optional(),
  shares_owed: z.number().min(0).optional(),
});

export const splitTypeSchema = z.enum([
  "EQUAL",
  "EXACT",
  "PERCENTAGE",
  "SHARE",
]);

const payerSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Amount must be a valid number",
  }),
});

// Matches SplitInputSchema from backend
const splitSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  amount_owed: z.string().optional(),
  percent_owed: z.number().optional(),
  shares_owed: z.number().optional(),
});

export const createExpenseSchema = z
  .object({
    description: z.string().min(1, "Description is required"),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be greater than 0",
    }),
    currency: z.string().default("INR"),
    date: z.string().transform((val) => {
      const iso = new Date(val).toISOString();
      return iso;
    }),
    category: z.string().min(1, "Category is required"),
    receipt_url: z.string().nullable().optional(),
    group_id: z.string().nullable().optional(),
    friend_id: z.string().nullable().optional(),
    split_type: splitTypeSchema,
    payers: z.array(payerSchema).min(1, "At least one payer is required"),
    splits: z
      .array(splitSchema)
      .min(1, "At least one person must split the bill"),
  })
  .refine(
    (data) => {
      const hasGroup = !!data.group_id;
      const hasFriend = !!data.friend_id;
      return (hasGroup && !hasFriend) || (!hasGroup && hasFriend);
    },
    {
      message: "Please select either a Group or a Friend to split with.",
      path: ["group_id"],
    }
  );

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
