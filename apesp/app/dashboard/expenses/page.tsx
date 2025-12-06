"use client";

import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { api } from "@/src/lib/api";
import { formatCurrency } from "@/src/lib/utils";
import { ApiResponse } from "@/src/types/api";
import { useQuery } from "@tanstack/react-query";

import { Plus, Search, Filter } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ExpensesPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", "all", search],
    queryFn: async () => {
      // Integration: GET /expenses with search/filter
      const { data } = await api.get<ApiResponse<{ items: any[] }>>(
        "api/expenses",
        {
          params: {
            limit: 20,
            // Assuming backend supports simple text search on description
            search: search || undefined,
          },
        }
      );
      return data.data!.items;
    },
    keepPreviousData: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <Button asChild>
          <Link href="/expenses/create">
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Link>
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex gap-2">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Expenses List */}
      <div className="rounded-md border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No expenses found matching your criteria.
          </div>
        ) : (
          <div className="divide-y">
            {data?.map((expense) => (
              <Link
                key={expense.id}
                href={`/expenses/${expense.id}`}
                className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{expense.description}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                      {expense.category}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(expense.date).toLocaleDateString()}
                    {expense.group_id && " • Group Expense"}
                  </span>
                </div>

                <div className="text-right">
                  <div className="font-bold">
                    {formatCurrency(expense.amount, expense.currency)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {/* Simplified status for list view */}
                    {expense.payers.length > 1
                      ? `${expense.payers.length} payers`
                      : `paid by ${expense.payers[0]?.user?.name || "someone"}`}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
