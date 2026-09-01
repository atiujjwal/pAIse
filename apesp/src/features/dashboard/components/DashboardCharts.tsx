"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon, AlertCircle } from "lucide-react";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { formatCurrency } from "@/src/lib/utils";
import { DashboardTrends } from "../api/dashboard-queries";

// --- Constants ---
const CHART_COLORS = ["#7C5CFF", "#17B26A", "#F59E0B", "#EF4444", "#3B82F6"];

const CustomTooltip = ({ active, payload, label, currency = "INR" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-xl">
        <p className="font-semibold text-foreground mb-1 text-sm">{label}</p>
        <p className="text-sm font-mono font-bold text-primary">
          {formatCurrency(String(payload[0].value), currency)}
        </p>
      </div>
    );
  }
  return null;
};

interface DashboardChartsProps {
  data?: DashboardTrends;
  isLoading: boolean;
  currency?: string;
}

export function DashboardCharts({
  data,
  isLoading,
  currency = "INR",
}: DashboardChartsProps) {
  const trendList = data?.trends || [];
  const categoryData = data?.spending_by_category || [];

  const hasTrendData = trendList.some((t) => t.amount > 0);
  const hasCategoryData = categoryData.some((c) => c.amount > 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="h-[350px] rounded-2xl lg:col-span-2" />
        <Skeleton className="h-[350px] rounded-2xl" />
      </div>
    );
  }

  // If no data at all in either chart, hide the section entirely
  if (!hasTrendData && !hasCategoryData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
      {/* SPENDING TRENDS (Bar Chart) */}
      <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg text-foreground">
              Spending Trends
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-muted/50 px-2.5 py-1 rounded-lg text-muted-foreground border border-border">
            {data?.granularity === "day" ? "Daily" : "Monthly"} View
          </span>
        </div>

        <div className="flex-1 min-h-[250px]">
          {!hasTrendData ? (
            <EmptyState message="No spending activity in this period." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendList}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="display_date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <RechartsTooltip
                  cursor={{ fill: "hsl(var(--muted)/0.2)", radius: 6 }}
                  content={<CustomTooltip currency={currency} />}
                />
                <Bar
                  dataKey="amount"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* CATEGORY BREAKDOWN (Pie Chart) */}
      <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <PieChartIcon className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Top Categories</h3>
        </div>

        <div className="flex-1 min-h-[250px] relative">
          {!hasCategoryData ? (
            <EmptyState message="No category data available." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="amount"
                  cornerRadius={5}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={<CustomTooltip currency={currency} />}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        {hasCategoryData && (
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center">
            {categoryData.slice(0, 4).map((cat, i) => (
              <div
                key={cat.category}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                  }}
                />
                {cat.category}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center">
      <div className="p-3 bg-muted/50 rounded-full mb-3">
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground font-medium">{message}</p>
    </div>
  );
}
