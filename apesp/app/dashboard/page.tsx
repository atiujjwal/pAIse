"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/components/ui/Button";
import { StatsCards } from "@/src/features/dashboard/components/StatsCards";
import { CreateGroupDialog } from "@/src/features/groups/components/CreateGroupDialog";
import { RecentActivity } from "@/src/features/dashboard/components/RecentActivity";


export default function DashboardPage() {
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreateGroup(true)}>
            <Users className="mr-2 h-4 w-4" />
            Create Group
          </Button>
          <Button asChild>
            <Link href="dashboard/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Stats */} 
      <StatsCards />

      {/* Main Content Split */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Recent Transactions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <RecentActivity />
        </div>

        {/* Quick Balance Overview (Simplified) */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Who owes you</h2>
          <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
            <p>Check the "Friends" tab for detailed debt breakdowns.</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="dashboard/friends">View Friends</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateGroup && (
        <CreateGroupDialog onClose={() => setShowCreateGroup(false)} />
      )}
    </div>
  );
}
