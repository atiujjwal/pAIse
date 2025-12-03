import { Balance, Settlement, User } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { Decimal } from "decimal.js";
import { formatPublicUser } from "../lib/formatter";

Decimal.set({ precision: 12 });

type BalanceWithUsers = Balance & { user_a: User; user_b: User };
type UserNetBalance = { user: User; net: Decimal };

interface NetBalance {
  userId: string;
  amount: Decimal; // Positive = Creditor (Owed money), Negative = Debtor (Owes money)
}

interface PairwiseDelta {
  user_A_id: string; // Alphabetically lower ID
  user_B_id: string; // Alphabetically higher ID
  delta: Decimal; // Positive = B owes A, Negative = A owes B
}

export type SimplifiedPayment = {
  from: ReturnType<typeof formatPublicUser>;
  to: ReturnType<typeof formatPublicUser>;
  amount: string;
};

interface NetBalance {
  userId: string;
  amount: Decimal;
}

interface PairwiseDelta {
  user_A_id: string;
  user_B_id: string;
  delta: Decimal;
}

type ExpenseSnapshot = {
  id: string;
  group_id: string | null;
  friend_id?: string | null;
  payers: { user_id: string; amount: Decimal | string | number }[];
  splits: { user_id: string; amount_owed: Decimal | string | number }[];
};

/**
 * Implements a debt minimization algorithm (using heaps/greedy approach).
 * Takes a list of group balances and calculates the minimum set of payments.
 */
export function simplifyGroupDebts(
  balances: BalanceWithUsers[]
): SimplifiedPayment[] {
  const netBalance = new Map<string, UserNetBalance>();

  // 1. Calculate the net balance for each user in the group
  for (const b of balances) {
    const amount = b.amount; // Convention: Positive = B owes A

    // Get or initialize user objects
    if (!netBalance.has(b.user_A_id)) {
      netBalance.set(b.user_A_id, { user: b.user_a, net: new Decimal(0) });
    }
    if (!netBalance.has(b.user_B_id)) {
      netBalance.set(b.user_B_id, { user: b.user_b, net: new Decimal(0) });
    }

    // Apply the balance
    // Positive amount: B owes A. A's net increases, B's net decreases.
    // Negative amount: A owes B. A's net decreases, B's net increases.
    netBalance.get(b.user_A_id)!.net = netBalance
      .get(b.user_A_id)!
      .net.add(amount);
    netBalance.get(b.user_B_id)!.net = netBalance
      .get(b.user_B_id)!
      .net.sub(amount);
  }

  // 2. Separate users into two lists: debtors and creditors
  const debtors: UserNetBalance[] = [];
  const creditors: UserNetBalance[] = [];

  for (const entry of netBalance.values()) {
    if (entry.net.isNegative()) {
      debtors.push(entry);
    } else if (entry.net.isPositive()) {
      creditors.push(entry);
    }
  }

  // Sort by largest debt/credit first (heaps are more efficient, but sort is fine)
  debtors.sort((a, b) => a.net.comparedTo(b.net)); // Most negative first
  creditors.sort((a, b) => b.net.comparedTo(a.net)); // Most positive first

  const payments: SimplifiedPayment[] = [];

  // 3. Settle debts greedily
  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];

    // Amount to transfer is the minimum of what is owed or what is due
    const paymentAmount = Decimal.min(debtor.net.abs(), creditor.net);

    // Record the payment
    payments.push({
      from: formatPublicUser(debtor.user),
      to: formatPublicUser(creditor.user),
      amount: paymentAmount.toFixed(2),
    });

    // Update balances
    debtor.net = debtor.net.add(paymentAmount);
    creditor.net = creditor.net.sub(paymentAmount);

    // 4. Remove settled users
    if (debtor.net.abs().lessThan(0.01)) {
      // Use a small epsilon for float comparison
      debtors.shift();
    }
    if (creditor.net.lessThan(0.01)) {
      creditors.shift();
    }
  }

  return payments;
}

export class BalanceService {
  /**
   * Updates the Balance table based on a newly created Expense.
   * This is an INCREMENTAL update. It calculates the net flow of this specific
   * expense and adds it to the existing balances.
   * * @param expenseId - The ID of the newly created expense
   */
  public async updateBalanceFromExpense(expenseId: string): Promise<void> {
    console.log(`[BalanceService] Processing expense: ${expenseId}`);

    // Fetch the full expense details
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        payers: true,
        splits: true,
      },
    });

    if (!expense) {
      console.error(`[BalanceService] Expense ${expenseId} not found.`);
      return;
    }

    if (expense.status === "DELETED") {
      console.warn(`[BalanceService] Skipped deleted expense ${expenseId}`);
      return;
    }

    // Calculate the Net Flow for this specific expense per user
    // (e.g., Alice paid 100 (+100), Split was 50 (-50). Net: +50)
    const netBalances = new Map<string, Decimal>();

    // Add credits (Payers)
    for (const payer of expense.payers) {
      const current = netBalances.get(payer.user_id) || new Decimal(0);
      netBalances.set(payer.user_id, current.add(payer.amount));
    }

    // Subtract debits (Splits)
    for (const split of expense.splits) {
      const current = netBalances.get(split.user_id) || new Decimal(0);
      netBalances.set(split.user_id, current.sub(split.amount_owed));
    }

    const debtors: NetBalance[] = []; // Separate into Debtors (Negative)
    const creditors: NetBalance[] = []; // and Creditors (Positive)

    for (const [userId, amount] of netBalances.entries()) {
      if (amount.abs().lessThan(0.01)) continue; // Filter out negligible amounts (floating point safety)

      if (amount.isNegative()) debtors.push({ userId, amount });
      else creditors.push({ userId, amount });
    }

    // Resolve debts to determine Pairwise Deltas
    // We match debtors to creditors to find out "Who owes Whom" for this expense.
    const deltas = this.resolveDebts(debtors, creditors);

    // Apply updates to the DB
    await this.applyDeltasToDb(deltas, expense.group_id);

    console.log(
      `[BalanceService] Successfully updated balances for expense ${expenseId}`
    );
  }

  /**
   * Matches Debtors to Creditors to create a list of pairwise transactions.
   * This uses a greedy approach: take the first debtor and pay off the first creditor.
   */
  private resolveDebts(
    debtors: NetBalance[],
    creditors: NetBalance[]
  ): PairwiseDelta[] {
    const deltas: PairwiseDelta[] = [];

    // Sort to ensure deterministic behavior (optional but good for testing)
    debtors.sort((a, b) => a.amount.comparedTo(b.amount));
    creditors.sort((a, b) => b.amount.comparedTo(a.amount));

    let dIndex = 0;
    let cIndex = 0;

    while (dIndex < debtors.length && cIndex < creditors.length) {
      const debtor = debtors[dIndex];
      const creditor = creditors[cIndex];

      // The amount to settle is the minimum of what Debtor owes vs what Creditor is owed
      const amountToSettle = Decimal.min(debtor.amount.abs(), creditor.amount);

      // Determine correct ID ordering for the Balance Table Schema constraint
      // Schema requires: user_A_id < user_B_id
      const isALower = debtor.userId < creditor.userId;
      const user_A_id = isALower ? debtor.userId : creditor.userId;
      const user_B_id = isALower ? creditor.userId : debtor.userId;

      // Determine the sign of the delta
      // Convention: Positive (+) means B owes A. Negative (-) means A owes B.

      let deltaAmount: Decimal;

      if (isALower) {
        // User A is Debtor, User B is Creditor.
        // A owes B. Convention says Negative.
        deltaAmount = amountToSettle.negated();
      } else {
        // User B is Debtor, User A is Creditor.
        // B owes A. Convention says Positive.
        deltaAmount = amountToSettle;
      }

      deltas.push({ user_A_id, user_B_id, delta: deltaAmount });

      // Update remaining amounts in memory
      debtor.amount = debtor.amount.add(amountToSettle); // moving towards 0
      creditor.amount = creditor.amount.sub(amountToSettle); // moving towards 0

      // Move indices if settled
      if (debtor.amount.abs().lessThan(0.01)) dIndex++;
      if (creditor.amount.lessThan(0.01)) cIndex++;
    }

    return deltas;
  }

  /**
   * CREATE: Adds the impact of a new expense to the balance table.
   */
  public async addExpenseImpact(expenseId: string): Promise<void> {
    const expense = await this.fetchExpense(expenseId);
    if (!expense) return;

    // Calculate deltas with POSITIVE multiplier (Add impact)
    const deltas = this.calculatePairwiseDeltas(expense, 1);
    await this.applyDeltasToDb(deltas, expense.group_id);
  }

  /**
   * DELETE: Reverts (subtracts) the impact of a deleted expense.
   * Accepts the full object because the record no longer exists in DB.
   */
  public async revertExpenseImpact(
    expenseSnapshot: ExpenseSnapshot
  ): Promise<void> {
    // Calculate deltas with NEGATIVE multiplier (Reverse impact)
    const deltas = this.calculatePairwiseDeltas(expenseSnapshot, -1);
    await this.applyDeltasToDb(deltas, expenseSnapshot.group_id || null);
  }

  /**
   * EDIT: Reverts the old state and Applies the new state.
   */
  public async editExpenseImpact(
    oldExpenseSnapshot: ExpenseSnapshot,
    newExpenseId: string
  ): Promise<void> {
    // Revert Old
    const revertDeltas = this.calculatePairwiseDeltas(oldExpenseSnapshot, -1);

    // Fetch New
    const newExpense = await this.fetchExpense(newExpenseId);
    if (!newExpense) {
      // If new expense not found, we still apply revert to ensure data integrity
      await this.applyDeltasToDb(
        revertDeltas,
        oldExpenseSnapshot.group_id || null
      );
      return;
    }

    const addDeltas = this.calculatePairwiseDeltas(newExpense, 1); // Add New

    // await Promise.all([
    //   this.applyDeltasToDb(revertDeltas, oldExpenseSnapshot.group_id || null),
    //   this.applyDeltasToDb(addDeltas, newExpense.group_id),
    // ]);

    await this.applyDeltasToDb(
      revertDeltas,
      oldExpenseSnapshot.group_id || null
    );
    await this.applyDeltasToDb(addDeltas, newExpense.group_id);
  }

  // --- PRIVATE HELPERS ---

  private async fetchExpense(id: string) {
    return await prisma.expense.findUnique({
      where: { id },
      include: { payers: true, splits: true },
    });
  }

  /**
   * Core logic: Calculates who owes whom for a specific expense.
   * @param multiplier 1 for Adding, -1 for Reverting
   */
  private calculatePairwiseDeltas(
    expense: ExpenseSnapshot,
    multiplier: number
  ): PairwiseDelta[] {
    const netBalances = new Map<string, Decimal>();

    // Add credits (Payers)
    for (const payer of expense.payers) {
      const val = new Decimal(payer.amount);
      const current = netBalances.get(payer.user_id) || new Decimal(0);
      netBalances.set(payer.user_id, current.add(val));
    }

    // Subtract debits (Splits)
    for (const split of expense.splits) {
      const val = new Decimal(split.amount_owed);
      const current = netBalances.get(split.user_id) || new Decimal(0);
      netBalances.set(split.user_id, current.sub(val));
    }

    const debtors: NetBalance[] = [];
    const creditors: NetBalance[] = [];

    for (const [userId, amount] of netBalances.entries()) {
      if (amount.abs().lessThan(0.01)) continue;
      if (amount.isNegative()) debtors.push({ userId, amount });
      else creditors.push({ userId, amount });
    }

    // Resolve debts
    debtors.sort((a, b) => a.amount.comparedTo(b.amount));
    creditors.sort((a, b) => b.amount.comparedTo(a.amount));

    const deltas: PairwiseDelta[] = [];
    let dIndex = 0;
    let cIndex = 0;

    while (dIndex < debtors.length && cIndex < creditors.length) {
      const debtor = debtors[dIndex];
      const creditor = creditors[cIndex];
      const amountToSettle = Decimal.min(debtor.amount.abs(), creditor.amount);

      const isALower = debtor.userId < creditor.userId;
      const user_A_id = isALower ? debtor.userId : creditor.userId;
      const user_B_id = isALower ? creditor.userId : debtor.userId;

      // Logic: If A is Debtor, A owes B (Negative). If B is Debtor, B owes A (Positive).
      // We multiply by the 'multiplier' (-1 for revert) to flip the flow in the DB.
      let rawDelta = isALower ? amountToSettle.negated() : amountToSettle;
      const finalDelta = rawDelta.mul(multiplier);

      deltas.push({ user_A_id, user_B_id, delta: finalDelta });

      debtor.amount = debtor.amount.add(amountToSettle);
      creditor.amount = creditor.amount.sub(amountToSettle);

      if (debtor.amount.abs().lessThan(0.01)) dIndex++;
      if (creditor.amount.lessThan(0.01)) cIndex++;
    }

    return deltas;
  }

  /**
   * Upserts the calculated deltas into the Balance table.
   */
  private async applyDeltasToDb(
    deltas: PairwiseDelta[],
    groupId: string | null
  ) {
    // Process sequentially for safety
    for (const item of deltas) {
      const { user_A_id, user_B_id, delta } = item;

      // Optimization: Don't write zero updates
      if (delta.isZero()) continue;

      await prisma.$transaction(async (tx) => {
        // Safe findFirst to handle nullable group_id compound key issues
        const existing = await tx.balance.findFirst({
          where: {
            user_A_id,
            user_B_id,
            group_id: groupId,
          },
        });

        if (existing) {
          const newAmount = existing.amount.add(delta);

          // Optimization: If balance becomes 0, we could delete it,
          // but keeping it with 0 is safer for history unless cleaning up.
          await tx.balance.update({
            where: { id: existing.id },
            data: { amount: newAmount },
          });
        } else {
          await tx.balance.create({
            data: {
              user_A_id,
              user_B_id,
              group_id: groupId,
              amount: delta,
            },
          });
        }
      });
    }
  }

  /**
   * SETTLEMENT: Processes a new settlement (payment) and updates balances.
   */
  public async processSettlement(settlementId: string): Promise<void> {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      console.error(`[BalanceService] Settlement ${settlementId} not found.`);
      return;
    }

    // Calculate the Delta
    const delta = this.calculateSettlementDelta(
      settlement.payer_id,
      settlement.receiver_id,
      new Decimal(settlement.amount)
    );

    // Apply to DB
    await this.applyDeltasToDb([delta], settlement.group_id);

    console.log(`[BalanceService] Applied settlement ${settlementId}`);
  }

  /**
   * SETTLEMENT DELETE: Reverts a settlement if it is deleted.
   * Requires the settlement object snapshot since it's gone from DB.
   */
  public async revertSettlement(settlementSnapshot: Settlement): Promise<void> {
    // Calculate Delta (Same logic as create)
    const originalDelta = this.calculateSettlementDelta(
      settlementSnapshot.payer_id,
      settlementSnapshot.receiver_id,
      new Decimal(settlementSnapshot.amount)
    );

    // Negate it to Revert
    const revertDelta = {
      ...originalDelta,
      delta: originalDelta.delta.negated(),
    };

    // Apply to DB
    await this.applyDeltasToDb([revertDelta], settlementSnapshot.group_id);

    console.log(
      `[BalanceService] Reverted settlement ${settlementSnapshot.id}`
    );
  }

  /**
   * Calculates the pairwise delta for a direct payment.
   * Logic:
   * - Balance Table convention: Positive = B owes A.
   * - If A pays B: B owes A more (Positive Delta).
   * - If B pays A: B owes A less (Negative Delta).
   */
  private calculateSettlementDelta(
    payerId: string,
    receiverId: string,
    amount: Decimal
  ): PairwiseDelta {
    // Determine A and B based on ID sorting (Schema Requirement)
    const isPayerLower = payerId < receiverId;
    const user_A_id = isPayerLower ? payerId : receiverId;
    const user_B_id = isPayerLower ? receiverId : payerId;

    // Logic:
    // If Payer is A (Lower ID): A gives money -> Balance (B owes A) increases.
    // If Payer is B (Higher ID): B gives money -> Balance (B owes A) decreases.
    const deltaAmount = isPayerLower ? amount : amount.negated();

    return {
      user_A_id,
      user_B_id,
      delta: deltaAmount,
    };
  }
}

// Export a singleton instance
export const balanceService = new BalanceService();
