// src/lib/expense-helpers.ts
import { z } from "zod";
import { SplitType } from "@prisma/client";
import { Decimal } from "decimal.js";

Decimal.set({ precision: 12 });

// --- Zod Schemas for Expense Body ---

const PayerSchema = z.object({
  user_id: z.string().cuid(),
  // Amount is received as a string to preserve decimal precision
  amount: z.string().refine((val) => !new Decimal(val).isNaN(), {
    message: "Invalid amount string",
  }),
});

const SplitBaseSchema = z.object({
  user_id: z.string().cuid(),
});

// This is the universal 'splits' input from the client
const SplitInputSchema = SplitBaseSchema.extend({
  // Client can send any of these, we validate based on split_type
  amount_owed: z.string().optional(),
  percent_owed: z.number().optional(),
  shares_owed: z.number().optional(),
});

export const ExpenseBodyBaseSchema = z.object({
  group_id: z.string().cuid().nullable().optional(),
  friend_id: z.string().cuid().nullable().optional(),
  description: z.string().min(1),
  currency: z.string().min(1),
  amount: z.string().refine((val) => !new Decimal(val).isNaN(), {
    message: "Invalid total amount string",
  }),
  date: z.string().datetime(),
  category: z.string().min(1),
  receipt_url: z.string().url().nullable().optional(),
  payers: z.array(PayerSchema).min(1, "At least one payer is required"),
  split_type: z.nativeEnum(SplitType),
  splits: z.array(SplitInputSchema).min(1, "At least one split is required"),
});

export const ExpenseBodySchema = ExpenseBodyBaseSchema.refine(
  (data) => !!data.group_id !== !!data.friend_id,
  {
    message: "Exactly one of group_id or friend_id must be provided",
  }
);

type ExpenseBody = z.infer<typeof ExpenseBodySchema>;

export const UpdateExpenseSchema = ExpenseBodyBaseSchema.partial().refine(
  (data) =>
    !("group_id" in data) ||
    !("friend_id" in data) ||
    !!data.group_id !== !!data.friend_id,
  {
    message: "Exactly one of group_id or friend_id must be provided",
  }
);

export const GetExpensesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),

  // Filters
  group_id: z.string().optional(),
  friend_id: z.string().optional(),
  category: z.string().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  min_amount: z.coerce.number().optional(),
  max_amount: z.coerce.number().optional(),

  // Sorting
  sort_by: z.enum(["date", "amount", "created_at"]).default("date"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

// Type for the data ready to be inserted into Prisma
export type ProcessedPayer = { user_id: string; amount: Decimal };
export type ProcessedSplit = {
  user_id: string;
  amount_owed: Decimal;
  percent_owed?: number | null;
  shares_owed?: number | null;
};

/**
 * Main validation and processing function.
 * This is the core transactional logic.
 */
export function validateAndProcessExpense(
  body: ExpenseBody,
  groupMemberIds: Set<string>
): {
  payerData: ProcessedPayer[];
  splitData: ProcessedSplit[];
} {
  const totalAmount = new Decimal(body.amount);
  if (totalAmount.isZero() || totalAmount.isNegative()) {
    throw new Error("Expense amount must be positive");
  }

  // --- Validate Payers ---
  const payerData: ProcessedPayer[] = [];
  let sumPayers = new Decimal(0);

  for (const payer of body.payers) {
    if (!groupMemberIds.has(payer.user_id)) {
      throw new Error(`Payer ${payer.user_id} is not in the group`);
    }
    const amount = new Decimal(payer.amount);
    if (amount.isNegative()) {
      throw new Error("Payer amount cannot be negative");
    }
    sumPayers = sumPayers.add(amount);
    payerData.push({ user_id: payer.user_id, amount });
  }

  // Validate sum(payers) == total_amount
  if (!sumPayers.equals(totalAmount)) {
    throw new Error(
      `Payers sum (${sumPayers}) does not equal total amount (${totalAmount})`
    );
  }

  // --- Validate and Process Splits ---
  const splitData: ProcessedSplit[] = [];
  const numSplits = body.splits.length;

  for (const split of body.splits) {
    if (!groupMemberIds.has(split.user_id)) {
      throw new Error(`Split user ${split.user_id} is not in the group`);
    }
  }

  let sumSplits = new Decimal(0);

  switch (body.split_type) {
    case SplitType.EQUAL:
      // Handle "EQUAL" split with remainder distribution
      const amounts = distributeAmountEqually(totalAmount, numSplits);
      for (let i = 0; i < numSplits; i++) {
        splitData.push({
          user_id: body.splits[i].user_id,
          amount_owed: amounts[i],
        });
        sumSplits = sumSplits.add(amounts[i]);
      }
      break;

    case SplitType.EXACT:
      for (const split of body.splits) {
        if (split.amount_owed == null) {
          throw new Error("Exact split missing 'amount_owed'");
        }
        const amount = new Decimal(split.amount_owed);
        if (amount.isNegative()) {
          throw new Error("Split amount cannot be negative");
        }
        splitData.push({
          user_id: split.user_id,
          amount_owed: amount,
        });
        sumSplits = sumSplits.add(amount);
      }
      break;

    case SplitType.PERCENTAGE:
      let totalPercent = 0;
      for (const split of body.splits) {
        if (split.percent_owed == null) {
          throw new Error("Percentage split missing 'percent_owed'");
        }
        totalPercent += split.percent_owed;
      }
      if (Math.abs(totalPercent - 100) > 1e-9) {
        throw new Error(`Percentages do not sum to 100 (got ${totalPercent})`);
      }
      // Distribute based on percentage, handling remainders
      const percentAmounts = distributeByShare(
        totalAmount,
        body.splits.map((s) => s.percent_owed!)
      );
      for (let i = 0; i < numSplits; i++) {
        splitData.push({
          user_id: body.splits[i].user_id,
          amount_owed: percentAmounts[i],
          percent_owed: body.splits[i].percent_owed,
        });
        sumSplits = sumSplits.add(percentAmounts[i]);
      }
      break;

    case SplitType.SHARE:
      let totalShares = new Decimal(0);
      for (const split of body.splits) {
        if (split.shares_owed == null) {
          throw new Error("Share split missing 'shares_owed'");
        }
        totalShares = totalShares.add(split.shares_owed);
      }
      if (totalShares.isZero()) {
        throw new Error("Total shares cannot be zero");
      }
      // Distribute based on shares, handling remainders
      const shareAmounts = distributeByShare(
        totalAmount,
        body.splits.map((s) => s.shares_owed!)
      );
      for (let i = 0; i < numSplits; i++) {
        splitData.push({
          user_id: body.splits[i].user_id,
          amount_owed: shareAmounts[i],
          shares_owed: body.splits[i].shares_owed,
        });
        sumSplits = sumSplits.add(shareAmounts[i]);
      }
      break;
  }

  // --- Final Validation ---
  // Final check to ensure splits sum to the total *exactly*
  if (!sumSplits.equals(totalAmount)) {
    throw new Error(
      `Splits sum (${sumSplits}) does not equal total amount (${totalAmount}) after processing`
    );
  }

  return { payerData, splitData };
}

/**
 * Splits an amount equally, distributing cents (remainders)
 * to the first N people.
 */
export function distributeAmountEqually(
  totalAmount: Decimal,
  numSplits: number
): Decimal[] {
  const amount = totalAmount.toDecimalPlaces(12);
  const baseAmount = amount.dividedBy(numSplits);
  const remainder = amount.minus(baseAmount.times(numSplits));

  const results: Decimal[] = [];
  // Distribute the remainder (e.g., 0.02)
  let remainderCents = remainder.times(100).toNumber();

  for (let i = 0; i < numSplits; i++) {
    let userAmount = baseAmount;
    if (remainderCents > 0) {
      userAmount = userAmount.add(0.01);
      remainderCents--;
    }
    results.push(userAmount);
  }
  return results;
}

/**
 * Splits an amount by shares/percentages, distributing remainders.
 */
export function distributeByShare(
  totalAmount: Decimal,
  shares: number[]
): Decimal[] {
  const amount = totalAmount.toDecimalPlaces(2);
  const totalShares = new Decimal(shares.reduce((sum, s) => sum + s, 0));

  let sum = new Decimal(0);
  const results = shares.map((share) => {
    const shareDecimal = new Decimal(share);
    const userAmount = amount
      .times(shareDecimal)
      .dividedBy(totalShares)
      .toDecimalPlaces(2); // Round to nearest cent
    sum = sum.add(userAmount);
    return userAmount;
  });

  // Check for rounding difference and add to first user
  const difference = amount.minus(sum);
  if (!difference.isZero()) {
    results[0] = results[0].add(difference);
  }

  return results;
}
