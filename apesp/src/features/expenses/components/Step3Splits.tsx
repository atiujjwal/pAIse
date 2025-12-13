"use client";

import { User } from "@/src/lib/types";
import { useEffect, useState } from "react";
import { useExpenseWizardStore } from "../store/wizard-store";
import { calculateSplits, SplitResult } from "../logic/split-calculator";
import { cn } from "@/src/lib/utils";
import { Input } from "@/src/components/ui/Input";
import { Avatar, AvatarFallback } from "@/src/components/ui/Avatar";

interface Step3Props {
  members: User[];
}

export function Step3Splits({ members }: Step3Props) {
  const { amount, split_type, setSplitType, splits, updateDraft } =
    useExpenseWizardStore();
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [results, setResults] = useState<SplitResult[]>([]);

  const TABS = ["EQUAL", "PERCENTAGE", "SHARE", "EXACT"] as const;

  useEffect(() => {
    if (!amount) return;
    const memberIds = members.map((m) => m.id);
    const calculated = calculateSplits(amount, memberIds, split_type!, inputs);

    setResults(calculated);

    const validSplits = calculated.map((r) => ({
      user_id: r.user_id,
      amount_owed: r.amount_owed,
      percent_owed: split_type === "PERCENTAGE" ? inputs[r.user_id] : undefined,
      shares_owed: split_type === "SHARE" ? inputs[r.user_id] : undefined,
    }));

    updateDraft({ splits: validSplits });
  }, [amount, split_type, inputs, members, updateDraft]);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Segmented Control */}
      <div className="flex rounded-2xl bg-muted p-1.5">
        {TABS.map((type) => (
          <button
            key={type}
            onClick={() => {
              setSplitType(type);
              setInputs({});
            }}
            className={cn(
              "flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200",
              split_type === type
                ? "bg-background shadow-sm text-primary"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {members.map((user) => {
          const result = results.find((r) => r.user_id === user.id);

          return (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-2xl border border-border p-4 bg-card hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-foreground">
                  {user.name}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {split_type !== "EQUAL" && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="h-10 w-20 text-right rounded-lg bg-muted/30 border-transparent focus:bg-background"
                      placeholder="0"
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [user.id]: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                    <span className="text-xs font-bold text-muted-foreground w-8 uppercase">
                      {split_type === "PERCENTAGE"
                        ? "%"
                        : split_type === "SHARE"
                        ? "shr"
                        : "INR"}
                    </span>
                  </div>
                )}

                <div className="w-24 text-right">
                  <span
                    className={cn(
                      "font-mono font-bold text-lg",
                      result?.isValid === false
                        ? "text-destructive"
                        : "text-foreground"
                    )}
                  >
                    ₹{result?.amount_owed || "0.00"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {results.some((r) => !r.isValid) && (
        <div className="rounded-2xl bg-destructive/10 p-4 text-center text-sm font-medium text-destructive border border-destructive/20">
          {results.find((r) => r.error)?.error ||
            "Please adjust splits to match the total amount."}
        </div>
      )}
    </div>
  );
}
