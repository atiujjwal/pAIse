"use client";
import { useEffect } from "react";
import Card, { CardContent, CardHeader } from "./../../src/components/ui/Card";

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Loading from "../../src/components/ui/Loading";
import useDashboard from "../../src/hooks/useDashboard";
import Button from "../../src/components/ui/Button";
import { formatAmount } from "../../src/lib/utils";
import { CardTitle } from "../../src/components/ui/Card";
import Badge from "../../src/components/ui/Badge";

export default function DashboardPage() {
  const { summary, loading } = useDashboard();

  if (loading) return <Loading fullScreen message="Loading dashboard..." />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-mono-900">Dashboard</h1>
          <p className="text-mono-600 mt-1">
            Welcome back! Here's your Dashboard Summary.
          </p>
        </div>
        <Link href="/dashboard/expenses/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>Add Expense</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-mono-600">
                Total Spent
              </span>
              <TrendingUp className="w-4 h-4 text-danger" />
            </div>
            <div className="text-2xl font-bold text-mono-900">
              {formatAmount(summary?.monthly_metrics?.total_spent || 0)}
            </div>
            <p className="text-xs text-mono-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-mono-600">
                Budget Limit
              </span>
              <Wallet className="w-4 h-4 text-mono-500" />
            </div>
            <div className="text-2xl font-bold text-mono-900">
              {formatAmount(summary?.monthly_metrics?.budget_limit || 0)}
            </div>
            <p className="text-xs text-mono-500 mt-1">Monthly budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-mono-600">
                Remaining
              </span>
              <TrendingDown className="w-4 h-4 text-success" />
            </div>
            <div className="text-2xl font-bold text-mono-900">
              {formatAmount(summary?.monthly_metrics?.remaining || 0)}
            </div>
            <p className="text-xs text-mono-500 mt-1">Left to spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-mono-600">
                Budget Used
              </span>
              <Target className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-mono-900">
              {summary?.monthly_metrics?.budget_used_percent}%
            </div>
            <div className="w-full bg-mono-200 rounded-full h-2 mt-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(summary?.monthly_metrics?.budget_used_percent || 0, 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary?.spending_by_category?.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      // API doesn't provide color, using a placeholder
                      style={{ backgroundColor: "#8884d8" }}
                    />
                    <span className="text-sm font-medium text-mono-700">
                      {cat.category}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-mono-900 mr-2">
                      {formatAmount(cat.amount)}
                    </span>
                    {/* API doesn't provide percentage, it can be calculated if needed */}
                    {/* <span className="text-mono-500">{cat.percentage}</span> */}
                  </div>
                </div>
                <div className="w-full bg-mono-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      // API doesn't provide percentage, calculating it here
                      width: `${(cat.amount / (summary?.monthly_metrics?.total_spent || 1)) * 100}%`,
                      backgroundColor: "#8884d8", // Placeholder color
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Expenses</CardTitle>
            <Link href="/dashboard/expenses">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary?.recent_expenses?.slice(0, 5).map((exp) => (
              <div key={exp.id} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-mono-900 truncate">
                    {exp.description}
                  </p>
                  <p className="text-xs text-mono-500">{exp.group || "Personal"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-mono-900">
                    {formatAmount(exp.amount)}
                  </p>
                  <Badge className="text-xs">
                    {new Date(exp.date).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
