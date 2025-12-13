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
  TooltipProps,
} from "recharts";

// Brand Palette
const COLORS = [
  "#7C5CFF", // Electric Purple (Primary)
  "#17B26A", // Mint Green (Secondary)
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#3B82F6", // Blue
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-popover p-3 shadow-xl">
        <p className="font-semibold text-popover-foreground mb-1">{label}</p>
        <p className="text-sm font-mono text-primary">
          {formatCurrency(String(payload[0].value), "INR")}
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>(
        "/analytics/summary?period=2025"
      );
      return data.data;
    },
  });

  const categoryData = summary?.spending_by_category || [];

  if (isLoading)
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Financial Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visualize your spending habits and trends.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Category Breakdown */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h3 className="mb-8 text-xl font-bold text-foreground">
            Spending by Category
          </h3>
          <div className="h-[350px] w-full">
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
                  outerRadius={120}
                  innerRadius={60}
                  paddingAngle={5}
                  dataKey="amount"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h3 className="mb-8 text-xl font-bold text-foreground">
            Monthly Trends
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Jan", amount: 4000 },
                  { name: "Feb", amount: 3000 },
                  { name: "Mar", amount: 2000 },
                  { name: "Apr", amount: 2780 },
                  { name: "May", amount: 1890 },
                ]}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                  content={<CustomTooltip />}
                />
                <Bar
                  dataKey="amount"
                  fill="#7C5CFF" /* Primary Color */
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
