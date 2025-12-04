"use client";
import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search as SearchIcon,
  Filter,
  MoreVertical,
  Pencil,
  Trash2,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import useExpenses from "../../../src/hooks/useExpenses";
import Loading from "../../../src/components/ui/Loading";
import Button from "../../../src/components/ui/Button";
import Card from "../../../src/components/ui/Card";
import Input from "../../../src/components/ui/Input";
import EmptyState from "../../../src/components/ui/EmptyState";
import Badge from "../../../src/components/ui/Badge";
import { formatAmount } from "../../../src/lib/utils";

export default function ExpensesPage() {
  const { expenses, loading, deleteExpense, setFilters } = useExpenses();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");

  useEffect(() => {
    const newFilters: Record<string, any> = {};
    if (search) newFilters.search = search;
    if (category !== "All") newFilters.category = category;
    setFilters(newFilters);
  }, [search, category, setFilters]);

  if (loading) return <Loading fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-mono-900">Expenses</h1>
          <p className="text-mono-600 mt-1">
            Track and manage all your expenses
          </p>
        </div>
        <Link href="/dashboard/expenses/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>Add Expense</Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<SearchIcon className="w-4 h-4" />}
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 px-4 rounded-lg border border-mono-300 bg-white text-mono-900 focus:outline-none focus:ring-2 focus:ring-mono-400"
          >
            {[
              "All",
              "DINING",
              "TRAVEL",
              "SHOPPING",
              "GROCERIES",
              "UTILITIES",
              "OTHER",
            ].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {expenses.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-16 h-16" />}
            title="No expenses found"
            description="Start tracking your expenses by adding your first entry."
            action={{
              label: "Add Expense",
              onClick: () => (window.location.href = "/dashboard/expenses/new"),
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-mono-50 border-b border-mono-200">
                <tr>
                  {[
                    "Date",
                    "Description",
                    "Category",
                    "Amount",
                    "Paid By",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-mono-600 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-mono-200">
                {expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-mono-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-mono-900">
                      {new Date(exp.date).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-mono-900 truncate max-w-xs">
                        {exp.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge>{exp.category}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-mono-900">
                      {formatAmount(exp.amount, exp.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-mono-600">
                      {exp.payers?.[0]?.user?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/expenses/${exp.id}`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteExpense(exp.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
