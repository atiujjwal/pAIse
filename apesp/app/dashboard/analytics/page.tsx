"use client";

import { Skeleton } from "@/src/components/ui/Skeleton";
import { api } from "@/src/lib/api";
import { formatCurrency } from "@/src/lib/utils";
import { ApiResponse } from "@/src/types/api";
import { useQuery } from "@tanstack/react-query";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";


export default function AnalyticsPage() {
  // Fetch Spending Summary [cite: 331]
  const { data: summary, isLoading } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>(
        "api/analytics/summary?period=2025"
      );
      return data.data;
    },
  });

  // Mock data transformation if backend returns raw lists
  // Ideally, backend returns { spending_by_category: [{ category: 'Food', amount: 500 }] } [cite: 202]
  const categoryData = summary?.spending_by_category || [];
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  if (isLoading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Financial Analytics</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Category Breakdown */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold">Spending by Category</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent! * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(String(value), "INR")}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend (Mocked for visual if backend trends endpoint not fully ready) */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold">Monthly Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Jan", amount: 4000 },
                  { name: "Feb", amount: 3000 },
                  { name: "Mar", amount: 2000 },
                  { name: "Apr", amount: 2780 },
                  { name: "May", amount: 1890 },
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(String(value), "INR")}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}