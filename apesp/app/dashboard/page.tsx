"use client";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { StatsCards } from "@/src/features/dashboard/components/StatsCards";
import { RecentActivity } from "@/src/features/dashboard/components/RecentActivity";

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <div className="flex gap-2">
          {/* NEW FEATURE: Redirects to Groups Tab with ?action=create */}
          <Button
            asChild
            variant="outline"
            className="border-slate-200 hover:bg-slate-50"
          >
            <Link href="/dashboard/groups?action=create">
              <Users className="mr-2 h-4 w-4 text-slate-500" />
              Create Group
            </Link>
          </Button>

          <Button asChild className="shadow-lg shadow-primary/20">
            <Link href="/dashboard/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      {/* --- STATS (Restored original component) --- */}
      <StatsCards />

      {/* --- MAIN CONTENT SPLIT --- */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Recent Activity (Restored original component) */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">
            Recent Activity
          </h2>
          <RecentActivity />
        </div>

        {/* Quick Balance Overview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Who owes you</h2>
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500 mb-4">
              Check the "Friends" tab for detailed debt breakdowns.
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard/friends">View Friends</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
