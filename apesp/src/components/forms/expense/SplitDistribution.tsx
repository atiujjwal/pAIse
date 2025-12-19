"use client";

import { useEffect, useState, useRef } from "react";
import { User } from "@/src/types/api";
import { Input } from "@/src/components/ui/Input";
import { cn, formatCurrency } from "@/src/lib/utils";
import { UseFormSetValue } from "react-hook-form";
import { CreateExpenseInput } from "@/src/lib/schemas";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
import { ExpenseMember } from "./ExpenseForm";

interface Split {
  user_id: string;
  amount_owed?: string;
  percent_owed?: number;
  shares_owed?: number;
}

interface SplitProps {
  splitType: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARE";
  amount: string;
  members: ExpenseMember[];
  value?: Split[]; // Initial/Controlled value
  setValue: UseFormSetValue<CreateExpenseInput>;
}

export function SplitDistribution({
  splitType,
  amount,
  members,
  value = [],
  setValue,
}: SplitProps) {
  // Initialize Inputs from Props (Edit Mode)
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (value && value.length > 0) {
      value.forEach((s) => {
        if (s.amount_owed) initial[s.user_id] = s.amount_owed;
        if (s.percent_owed) initial[s.user_id] = s.percent_owed.toString();
        if (s.shares_owed) initial[s.user_id] = s.shares_owed.toString();
      });
    }
    return initial;
  });

  // Initialize Checkboxes for Equal Split
  const [selectedForEqual, setSelectedForEqual] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    if (value.length > 0) {
      // Edit Mode: check only present members
      members.forEach((m) => {
        const isInSplit = value.some((s) => s.user_id === m.id);
        initial[m.id] = isInSplit;
      });
    } else {
      // Create Mode: Default everyone checked
      members.forEach((m) => (initial[m.id] = true));
    }
    return initial;
  });

  const lastUpdateRef = useRef<string>("");
  const lastValueRef = useRef<string>("");
  const totalAmount = parseFloat(amount) || 0;

  // Sync with incoming value prop changes (for AI draft data)
  useEffect(() => {
    const valueSignature = JSON.stringify(value);

    // Only update if value prop has actually changed and has data
    if (valueSignature !== lastValueRef.current && value && value.length > 0) {
      console.log("SplitDistribution: Syncing with new value prop", value);

      const newInputs: Record<string, string> = {};
      const newSelected: Record<string, boolean> = {};

      value.forEach((s) => {
        // Mark as selected for EQUAL split
        newSelected[s.user_id] = true;

        // Set input values based on split type
        if (s.amount_owed) newInputs[s.user_id] = s.amount_owed;
        if (s.percent_owed) newInputs[s.user_id] = s.percent_owed.toString();
        if (s.shares_owed) newInputs[s.user_id] = s.shares_owed.toString();
      });

      setInputs(newInputs);
      setSelectedForEqual(newSelected);
      lastValueRef.current = valueSignature;
    }
  }, [value]);

  // Fallback for first render if empty (Reset logic)
  useEffect(() => {
    if (
      value.length === 0 &&
      Object.keys(selectedForEqual).length === 0 &&
      members.length > 0
    ) {
      const initial: Record<string, boolean> = {};
      members.forEach((m) => (initial[m.id] = true));
      setSelectedForEqual(initial);
    }
  }, [members, value.length]);

  const selectedCount = Object.values(selectedForEqual).filter(Boolean).length;
  const equalShare =
    totalAmount > 0 && selectedCount > 0
      ? (totalAmount / selectedCount).toFixed(2)
      : "0.00";

  // Calculation & Sync Logic
  useEffect(() => {
    if (!members.length) return;

    const activeMembers =
      splitType === "EQUAL"
        ? members.filter((m) => selectedForEqual[m.id])
        : members;

    const splits = activeMembers.map((user) => {
      const valStr = inputs[user.id] || "0";
      const valNum = parseFloat(valStr) || 0;

      if (splitType === "EQUAL") return { user_id: user.id };
      else if (splitType === "EXACT")
        return { user_id: user.id, amount_owed: valStr };
      else if (splitType === "PERCENTAGE")
        return { user_id: user.id, percent_owed: valNum };
      else
        return {
          user_id: user.id,
          shares_owed: parseFloat(inputs[user.id] || "1"),
        };
    });

    const signature = JSON.stringify({ type: splitType, splits });
    if (signature !== lastUpdateRef.current) {
      lastUpdateRef.current = signature;
      setValue("splits", splits);
    }
  }, [splitType, inputs, selectedForEqual, members, setValue]);

  const handleInputChange = (id: string, val: string) => {
    setInputs((prev) => ({ ...prev, [id]: val }));
  };

  const toggleSelection = (id: string) => {
    setSelectedForEqual((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3">
      {members.map((user) => {
        const isSelected = splitType !== "EQUAL" || selectedForEqual[user.id];

        return (
          <div
            key={user.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-2xl border transition-all",
              isSelected
                ? "bg-card border-border shadow-sm"
                : "bg-muted/30 border-transparent opacity-60"
            )}
          >
            <div className="flex items-center gap-3">
              {splitType === "EQUAL" && (
                <input
                  type="checkbox"
                  checked={!!selectedForEqual[user.id]}
                  onChange={() => toggleSelection(user.id)}
                  className="h-5 w-5 rounded-md border-border text-primary focus:ring-primary accent-primary"
                />
              )}

              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="text-xs">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {user.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {splitType === "EQUAL" && isSelected && (
                <span className="font-mono text-sm font-bold text-foreground">
                  {formatCurrency(equalShare, "INR")}
                </span>
              )}

              {splitType === "EXACT" && (
                <div className="relative w-28">
                  <span className="absolute left-2 top-2 text-xs text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={inputs[user.id] || ""}
                    className="h-9 pl-5 text-right text-sm bg-background"
                    onChange={(e) => handleInputChange(user.id, e.target.value)}
                  />
                </div>
              )}

              {splitType === "PERCENTAGE" && (
                <div className="relative w-24">
                  <Input
                    type="number"
                    placeholder="0"
                    value={inputs[user.id] || ""}
                    className="h-9 pr-6 text-right text-sm bg-background"
                    onChange={(e) => handleInputChange(user.id, e.target.value)}
                  />
                  <span className="absolute right-2 top-2 text-xs text-muted-foreground">
                    %
                  </span>
                </div>
              )}

              {splitType === "SHARE" && (
                <div className="relative w-20">
                  <Input
                    type="number"
                    defaultValue="1"
                    value={inputs[user.id] || "1"}
                    className="h-9 text-center text-sm bg-background"
                    onChange={(e) => handleInputChange(user.id, e.target.value)}
                  />
                  <span className="absolute -bottom-3 left-0 w-full text-center text-[9px] text-muted-foreground">
                    shares
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
