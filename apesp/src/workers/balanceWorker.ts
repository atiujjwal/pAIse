import { jobQueue } from "@/src/lib/queue";
import { balanceService } from "@/src/services/balanceService";

export const startBalanceWorker = () => {
  // Case 1: New Expense (Add)
  jobQueue.process("recalculate-balance", async (job) => {
    const { expenseId } = job.data;
    if (expenseId) {
      await balanceService.addExpenseImpact(expenseId);
    }
  });

  // Case 2: Edit Expense (Revert Old + Add New)
  jobQueue.process("recalculate-balance-edit", async (job) => {
    const { oldExpense, newExpenseId } = job.data;
    if (oldExpense && newExpenseId) {
      // oldExpense is the full JSON object passed from the API before update
      await balanceService.editExpenseImpact(oldExpense, newExpenseId);
    }
  });

  // Case 3: Delete Expense (Revert Old)
  jobQueue.process("recalculate-balance-delete", async (job) => {
    const { deletedExpense } = job.data;
    if (deletedExpense) {
      // deletedExpense is the full JSON object passed from the API before delete
      await balanceService.revertExpenseImpact(deletedExpense);
    }
  });

  // Case 4: New Settlement
  jobQueue.process("recalculate-balance-settlement", async (job) => {
    const { settlementId } = job.data;
    if (settlementId) {
      try {
        await balanceService.processSettlement(settlementId);
      } catch (error) {
        console.error(`Failed to process settlement ${settlementId}:`, error);
        // Ensure you have error handling strategy (retry or dead-letter queue)
        throw error; 
      }
    }
  });

  // Case 5: Delete Settlement (Optional, if you implement DELETE /settlements)
  jobQueue.process("recalculate-balance-settlement-delete", async (job) => {
    const { settlementSnapshot } = job.data;
    if (settlementSnapshot) {
      await balanceService.revertSettlement(settlementSnapshot);
    }
  });
};
