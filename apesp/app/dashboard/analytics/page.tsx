"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  TooltipProps,
} from "recharts";
import {
  CalendarRange,
  Filter,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Layers,
  AlertCircle,
} from "lucide-react";

import {
  useAnalyticsSummary,
  useAnalyticsTrends,
} from "@/src/features/analytics/api/analytics-queries";
import { useGroupsList } from "@/src/features/groups/api/group-list-query"; // Reuse existing hook
import { Skeleton } from "@/src/components/ui/Skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/Select";
import { formatCurrency, cn } from "@/src/lib/utils";

// --- Constants & Helpers ---
const CHART_COLORS = [
  "#7C5CFF", // Primary
  "#17B26A", // Secondary
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#14B8A6", // Teal
];

// Date Range Presets
const DATE_RANGES = [
  { label: "Last 30 Days", value: "30d", days: 30 },
  { label: "Last 90 Days", value: "90d", days: 90 },
  { label: "This Year", value: "ytd", days: 365 }, // simplified
];

const getDatesFromRange = (rangeValue: string) => {
  const now = new Date();
  const to = now.toISOString();
  let fromDate = new Date();

  switch (rangeValue) {
    case "30d":
      fromDate.setDate(now.getDate() - 30);
      break;
    case "90d":
      fromDate.setDate(now.getDate() - 90);
      break;
    case "ytd":
      fromDate = new Date(now.getFullYear(), 0, 1); // Jan 1st
      break;
  }
  return { from: fromDate.toISOString(), to };
};

// --- Custom Chart Tooltip ---
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

export default function AnalyticsPage() {
  // --- State ---
  const [dateRange, setDateRange] = useState("30d");
  const [selectedGroupId, setSelectedGroupId] = useState("all");

  // Derived State for Queries
  const { from, to } = useMemo(() => getDatesFromRange(dateRange), [dateRange]);
  const granularity = dateRange === "ytd" ? "month" : "day";

  // --- Queries ---
  const { data: groups } = useGroupsList();

  const { data: summary, isLoading: loadingSummary } = useAnalyticsSummary({
    from_date: from,
    to_date: to,
    group_id: selectedGroupId,
  });

  const { data: trendsData, isLoading: loadingTrends } = useAnalyticsTrends({
    from_date: from,
    to_date: to,
    group_id: selectedGroupId,
    granularity,
  });

  const currency = summary?.currency || "INR";
  const categoryData = summary?.spending_by_category || [];
  const trendData = trendsData?.trends || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      {/* --- HEADER & FILTERS --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-md">
            Track your spending habits and visualize financial trends across
            your groups.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 bg-card p-1.5 rounded-2xl border border-border shadow-sm w-full md:w-auto">
          {/* Date Selector */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-10 w-[160px] rounded-xl border-transparent hover:bg-muted focus:bg-muted font-medium">
              <CalendarRange className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-px bg-border my-1" />

          {/* Group Selector */}
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="h-10 w-[180px] rounded-xl border-transparent hover:bg-muted focus:bg-muted font-medium">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups?.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Spend Card */}
        <div className="md:col-span-2 rounded-[2.5rem] bg-gradient-to-br from-primary to-violet-600 p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-white/80 font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Total Spent (
              {dateRange === "ytd" ? "Year" : "Period"})
            </p>
            {loadingSummary ? (
              <Skeleton className="h-14 w-48 bg-white/20 rounded-xl mt-2" />
            ) : (
              <h2 className="text-5xl font-mono font-bold tracking-tighter mt-2">
                {formatCurrency(String(summary?.total_spent || 0), currency)}
              </h2>
            )}
          </div>
        </div>

        {/* Context Card (e.g. Top Category) */}
        <div className="rounded-[2.5rem] border border-border bg-card p-8 flex flex-col justify-center shadow-sm">
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest mb-4">
            Top Category
          </p>
          {loadingSummary ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
            </div>
          ) : categoryData.length > 0 ? (
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-1">
                {categoryData[0].category}
              </h3>
              <p className="text-primary font-mono font-bold">
                {formatCurrency(String(categoryData[0].amount), currency)}
                <span className="text-muted-foreground font-sans text-sm font-medium ml-2">
                  ({categoryData[0].percentage}%)
                </span>
              </p>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              No spending data yet.
            </div>
          )}
        </div>
      </div>

      {/* --- CHARTS GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Category Breakdown (Pie) */}
        <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <PieChartIcon className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg text-foreground">
              Spending Breakdown
            </h3>
          </div>

          <div className="flex-1 min-h-[300px] relative">
            {loadingSummary ? (
              <Skeleton className="absolute inset-0 rounded-3xl" />
            ) : categoryData.length === 0 ? (
              <EmptyState message="No category data available for this period." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={4}
                    dataKey="amount"
                    cornerRadius={6}
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

          {/* Custom Legend */}
          {categoryData.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-3">
              {categoryData.slice(0, 6).map((cat, i) => (
                <div
                  key={cat.category}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                  <span className="font-medium text-foreground truncate flex-1">
                    {cat.category}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {cat.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Spending Trends (Bar) */}
        <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground">
                Spending Trends
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-muted/50 px-2.5 py-1 rounded-lg text-muted-foreground">
              {granularity === "day" ? "Daily" : "Monthly"} View
            </span>
          </div>

          <div className="flex-1 min-h-[300px] relative">
            {loadingTrends ? (
              <Skeleton className="absolute inset-0 rounded-3xl" />
            ) : trendData.length === 0 ||
              trendData.every((d) => d.amount === 0) ? (
              <EmptyState message="No trends data available." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey={granularity === "month" ? "display_date" : "date"}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                    dy={10}
                    tickFormatter={(val) => {
                      // Shorten date for small screens
                      if (granularity === "day") {
                        const d = new Date(val);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }
                      return val.split(" ")[0]; // Jan 2024 -> Jan
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "hsl(var(--muted)/0.2)", radius: 6 }}
                    content={
                      <CustomTooltip
                        labelKey="display_date"
                        currency={currency}
                      />
                    }
                  />
                  <Bar
                    dataKey="amount"
                    fill="#7C5CFF"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center p-6 border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
      <div className="p-3 bg-muted rounded-full mb-3">
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
}
