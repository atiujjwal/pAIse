import { z } from "zod";

// --- Primitives ---
// Backend expects decimal strings, not floats
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
// Matches Backend Source [329, 313]

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

export const createExpenseSchema = z.object({
  group_id: z.string().cuid().nullable().optional(),
  description: z.string().min(1, "Description is required"),
  amount: decimalString,
  currency: z.string().default("INR"),
  date: z.string().datetime(), // ISO 8601
  category: z.string().min(1, "Category is required"),
  receipt_url: z.string().url().optional().nullable(),
  payers: z.array(expensePayerSchema).min(1, "At least one payer is required"),
  split_type: z.enum(["EQUAL", "EXACT", "PERCENTAGE", "SHARE"]),
  splits: z
    .array(expenseSplitSchema)
    .min(1, "At least one person must split the cost"),
  notes: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
