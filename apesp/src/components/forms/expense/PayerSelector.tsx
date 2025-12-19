"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@/src/types/api";
import { Input } from "@/src/components/ui/Input";
import { cn, formatCurrency } from "@/src/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
import { ExpenseMember } from "./ExpenseForm";

interface Payer {
  user_id: string;
  amount: string;
}

interface PayerSelectorProps {
  members: ExpenseMember[];
  totalAmount: string;
  currentUser: User | null;
  value?: Payer[]; // Controlled value
  onChange: (payers: Payer[]) => void;
}

export function PayerSelector({
  members,
  totalAmount,
  onChange,
  currentUser,
  value = [],
}: PayerSelectorProps) {
  // Initialize from props if available (Edit Mode), else default to empty
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (value && value.length > 0) {
      value.forEach((p) => {
        initial[p.user_id] = p.amount;
      });
    }
    return initial;
  });

  const lastEmittedRef = useRef<string>("");
  const isInitialized = useRef(false);
  const lastValueRef = useRef<string>("");

  const sortedMembers = [
    ...(currentUser ? [currentUser] : []),
    ...members.filter((m) => m.id !== currentUser?.id),
  ];

  const numericTotal = parseFloat(totalAmount) || 0;

  // Sync with incoming value prop changes (for AI draft data)
  useEffect(() => {
    const valueSignature = JSON.stringify(value);

    // Only update if value prop has actually changed
    if (valueSignature !== lastValueRef.current && value && value.length > 0) {
      console.log("PayerSelector: Syncing with new value prop", value);
      const newAmounts: Record<string, string> = {};
      value.forEach((p) => {
        newAmounts[p.user_id] = p.amount;
      });
      setAmounts(newAmounts);
      lastValueRef.current = valueSignature;
    }
  }, [value]);

  // Auto-fill "Me" on first load ONLY if it's a new creation (value is empty)
  useEffect(() => {
    if (
      !isInitialized.current &&
      value.length === 0 &&
      currentUser &&
      numericTotal > 0
    ) {
      setAmounts({ [currentUser.id]: totalAmount });
    }
    isInitialized.current = true;
  }, [totalAmount, currentUser, value.length, numericTotal]);

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

  const currentSum = Object.values(amounts).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const remaining = parseFloat((numericTotal - currentSum).toFixed(2));
  const isBalanced = Math.abs(remaining) === 0;

  const handleAmountChange = (userId: string, val: string) => {
    setAmounts((prev) => ({ ...prev, [userId]: val }));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center text-xs font-medium text-muted-foreground mb-2">
        <span>Enter amount paid by each:</span>
        <span
          className={cn(
            "px-3 py-1 rounded-full font-bold transition-colors",
            isBalanced
              ? "bg-secondary/10 text-secondary"
              : "bg-destructive/10 text-destructive"
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

      <div className="space-y-3">
        {sortedMembers.map((user) => {
          const userAmount = parseFloat(amounts[user.id] || "0");
          const isPaying = userAmount > 0;

          return (
            <div
              key={user.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-2xl border transition-all duration-200",
                isPaying
                  ? "border-primary/30 bg-primary/5 shadow-sm"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback
                    className={
                      isPaying
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }
                  >
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {user.id === currentUser?.id ? "You" : user.name}
                  </span>
                  {isPaying && (
                    <span className="text-[10px] text-primary font-medium">
                      Paying
                    </span>
                  )}
                </div>
              </div>

              <div className="relative w-36">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-bold">
                  ₹
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  className={cn(
                    "h-10 pl-7 text-right text-sm font-medium focus-visible:ring-1",
                    isPaying
                      ? "text-foreground border-primary/30 bg-white dark:bg-black/20"
                      : "text-muted-foreground border-border bg-muted/20"
                  )}
                  value={amounts[user.id] || ""}
                  onChange={(e) => handleAmountChange(user.id, e.target.value)}
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
