import { useEffect, useState } from "react";
import { useStore } from "../store";

export default function useExpenses(initialFilters: Record<string, any> = {}) {
  const expenses = useStore((s) => s.expenses);
  const fetchExpenses = useStore((s) => s.fetchExpenses);
  const addExpense = useStore((s) => s.addExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchExpenses(filters);
      setLoading(false);
    };
    load();
  }, [fetchExpenses, filters]);

  return { expenses, loading, addExpense, deleteExpense, filters, setFilters };
}
