"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ExpenseForm from "../../../../src/components/forms/ExpenseForm";
import Loading from "../../../../src/components/ui/Loading";
import { getExpenseDetailsApi } from "../../../../src/services/apiClient";
import { toast } from "react-hot-toast";

export default function EditExpensePage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // NOTE: Next.js App Router params can be string or string[].
      // We assume [expenseId] folder structure, so it's a string.
      // If you named the folder [id], use params.id. If [expenseId], use params.expenseId.
      // Based on previous code, assuming [expenseId]. If your file is [id], change below:
      const expenseId = params.expenseId || params.id;

      if (!expenseId || typeof expenseId !== "string") return;

      try {
        const res = await getExpenseDetailsApi(expenseId);
        // Handle API response structure ( { success: true, data: {...} } vs direct {...} )
        setData(res.data || res);
      } catch (error) {
        toast.error("Failed to load expense details");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params]);

  if (loading)
    return <Loading fullScreen message="Fetching expense details..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mono-900">Edit Expense</h1>
        <p className="text-mono-600">Update transaction details</p>
      </div>
      {data ? (
        <ExpenseForm initialData={data} isEditing />
      ) : (
        <div className="text-center py-10 text-mono-500">Expense not found</div>
      )}
    </div>
  );
}
