"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/api";
import { formatCurrency } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Plus, Search, Filter, Receipt } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Skeleton } from "@/src/components/ui/Skeleton";

export default function ExpensesPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", "all", search],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ data: any[] }>>(
        "api/expenses",
        {
          params: { limit: 20, search: search || undefined },
        }
      );
      return data.data!.data;
    },
    keepPreviousData: true,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Manage and track your shared history.
          </p>
        </div>
        <Button asChild size="lg" className="shadow-md shadow-primary/20">
          <Link href="/dashboard/expenses/new">
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-10 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="bg-card">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* List */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : data?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No expenses found</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              Try adjusting your search or create a new expense to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {data?.map((expense) => (
              <Link
                key={expense.id}
                href={`/dashboard/expenses/${expense.id}`}
                className="group flex items-center justify-between p-5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Date Box */}
                  <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-secondary text-secondary-foreground">
                    <span className="text-xs font-bold uppercase">
                      {new Date(expense.date).toLocaleString("default", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-lg font-bold">
                      {new Date(expense.date).getDate()}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-semibold text-base group-hover:text-primary transition-colors">
                      {expense.description}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                        {expense.category}
                      </span>
                      {expense.group && (
                        <span className="text-xs text-muted-foreground">
                          in {expense.group.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold tabular-nums">
                    {formatCurrency(expense.amount, expense.currency)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {expense.payers.length > 1 ? (
                      <span className="flex items-center justify-end gap-1">
                        {expense.payers.length} people paid
                      </span>
                    ) : (
                      `Paid by ${expense.payers[0]?.user?.name || "Unknown"}`
                    )}
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
