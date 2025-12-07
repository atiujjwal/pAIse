"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@/src/types/api";
import { Input } from "@/src/components/ui/Input";
import { cn, formatCurrency } from "@/src/lib/utils";
import { Check } from "lucide-react";

interface PayerSelectorProps {
  members: User[];
  totalAmount: string;
  currentUser: User | null;
  onChange: (payers: { user_id: string; amount: string }[]) => void;
}

export function PayerSelector({
  members,
  totalAmount,
  onChange,
  currentUser,
}: PayerSelectorProps) {
  // Store amounts as strings to prevent jumping cursors
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const lastEmittedRef = useRef<string>("");

  // Sort: Me first, then others
  const sortedMembers = [
    ...(currentUser ? [currentUser] : []),
    ...members.filter((m) => m.id !== currentUser?.id),
  ];

  const numericTotal = parseFloat(totalAmount) || 0;

  // Initialize: If amounts are empty, default "Me" to total
  useEffect(() => {
    if (Object.keys(amounts).length === 0 && currentUser && numericTotal > 0) {
      setAmounts({ [currentUser.id]: totalAmount });
    }
  }, [totalAmount, currentUser, amounts, numericTotal]);

  // Sync to Parent
  useEffect(() => {
    const payers = Object.entries(amounts)
      .map(([user_id, amount]) => ({ user_id, amount }))
      .filter((p) => parseFloat(p.amount) > 0);

    const signature = JSON.stringify(payers);
    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onChange(payers);
    }
  }, [amounts, onChange]);

  // Calculations
  const currentSum = Object.values(amounts).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );
  const remaining = numericTotal - currentSum;
  // Use a small epsilon for float comparison
  const isBalanced = Math.abs(remaining) < 0.05;

  const handleAmountChange = (userId: string, val: string) => {
    setAmounts((prev) => ({ ...prev, [userId]: val }));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Validation Header */}
      <div className="flex justify-between items-center text-xs font-medium text-slate-500 mb-2 border-b border-slate-200 pb-2">
        <span>Enter amount paid by each:</span>
        <span
          className={cn(
            "px-2 py-0.5 rounded-full font-bold",
            isBalanced
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          )}
        >
          {isBalanced
            ? "Fully Covered"
            : `${remaining > 0 ? "Left" : "Over"}: ${formatCurrency(
                String(Math.abs(remaining)),
                "INR"
              )}`}
        </span>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {sortedMembers.map((user) => {
          const userAmount = parseFloat(amounts[user.id] || "0");
          const isPaying = userAmount > 0;

          return (
            <div
              key={user.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-all",
                isPaying
                  ? "border-primary/30 bg-primary/5"
                  : "border-slate-100 bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                    isPaying
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {user.name[0]}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">
                    {user.id === currentUser?.id ? "You" : user.name}
                  </span>
                  {isPaying && (
                    <span className="text-[10px] text-primary font-medium">
                      Paying
                    </span>
                  )}
                </div>
              </div>

              <div className="relative w-32">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                  ₹
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  className={cn(
                    "h-9 pl-7 text-right text-sm focus:ring-1",
                    isPaying
                      ? "font-bold text-slate-900 border-primary/30"
                      : "text-slate-400 border-slate-200"
                  )}
                  value={amounts[user.id] || ""}
                  onChange={(e) => handleAmountChange(user.id, e.target.value)}
                  // Quick Action: Double click to set full remaining amount
                  onDoubleClick={() =>
                    handleAmountChange(
                      user.id,
                      (userAmount + remaining).toFixed(2)
                    )
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
