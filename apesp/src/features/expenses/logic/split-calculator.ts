import { fromCents, toCents } from "@/src/lib/money";
import { CreateExpenseInput } from "@/src/lib/schemas";


type ExpenseDraft = Partial<CreateExpenseInput>;

export interface SplitResult {
  user_id: string;
  amount_owed: string; // The calculated visual amount
  isValid: boolean;
  error?: string;
}

/**
 * Distributes total amount based on split type.
 * Backend is the source of truth, but this provides immediate UI feedback.
 */
export function calculateSplits(
  amount: string,
  users: string[], // user_ids involved
  type: "EQUAL" | "PERCENTAGE" | "SHARE" | "EXACT",
  inputs: Record<string, number> // Map of user_id -> input (percent, shares, or exact amount)
): SplitResult[] {
  const totalCents = toCents(amount);

  if (totalCents === 0 || users.length === 0) return [];

  if (type === "EQUAL") {
    const splitCents = Math.floor(totalCents / users.length);
    let remainder = totalCents - splitCents * users.length;

    return users.map((userId, index) => {
      // Distribute remainder cents to the first few users (Deterministic rule [cite: 674])
      const extraCent = index < remainder ? 1 : 0;
      return {
        user_id: userId,
        amount_owed: fromCents(splitCents + extraCent),
        isValid: true,
      };
    });
  }

  if (type === "PERCENTAGE") {
    let currentTotalPercent = 0;
    const results = users.map((userId) => {
      const percent = inputs[userId] || 0;
      currentTotalPercent += percent;
      const owedCents = Math.round(totalCents * (percent / 100));
      return {
        user_id: userId,
        amount_owed: fromCents(owedCents),
        isValid: true,
      };
    });

    // Validation: percentages must sum to 100 [cite: 658]
    const isValid = Math.abs(currentTotalPercent - 100) < 0.01;
    return results.map((r) => ({
      ...r,
      isValid,
      error: isValid ? undefined : "Total must be 100%",
    }));
  }

  if (type === "SHARE") {
    const totalShares = Object.values(inputs).reduce(
      (sum, val) => sum + (val || 0),
      0
    );
    if (totalShares === 0)
      return users.map((id) => ({
        user_id: id,
        amount_owed: "0.00",
        isValid: false,
      }));

    return users.map((userId) => {
      const share = inputs[userId] || 0;
      const shareFraction = share / totalShares;
      const owedCents = Math.round(totalCents * shareFraction);
      return {
        user_id: userId,
        amount_owed: fromCents(owedCents),
        isValid: true,
      };
    });
  }

  if (type === "EXACT") {
    // User directly inputs amounts, we just validate sum [cite: 656]
    let inputSumCents = 0;
    const results = users.map((userId) => {
      const val = inputs[userId] || 0; // Input here acts as the amount in float
      inputSumCents += toCents(val);
      return {
        user_id: userId,
        amount_owed: val.toFixed(2),
        isValid: true,
      };
    });

    const diff = Math.abs(inputSumCents - totalCents);
    const isValid = diff === 0;
    return results.map((r) => ({
      ...r,
      isValid,
      error: isValid
        ? undefined
        : `Sum is ${fromCents(inputSumCents)}, needs ${amount}`,
    }));
  }

  return [];
}
