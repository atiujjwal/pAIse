"use client";

import { User } from "@/src/lib/types";
import { useEffect, useState } from "react";
import { useExpenseWizardStore } from "../store/wizard-store";
import { calculateSplits, SplitResult } from "../logic/split-calculator";
import { cn } from "@/src/lib/utils";
import { Input } from "@/src/components/ui/Input";


interface Step3Props {
  members: User[]; // Passed from parent container
}

export function Step3Splits({ members }: Step3Props) {
  const { amount, split_type, setSplitType, splits, updateDraft } =
    useExpenseWizardStore();
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [results, setResults] = useState<SplitResult[]>([]);

  // Split Types as defined in Schema [cite: 65]
  const TABS = ["EQUAL", "PERCENTAGE", "SHARE", "EXACT"] as const;

  // Real-time calculation effect
  useEffect(() => {
    if (!amount) return;
    const memberIds = members.map((m) => m.id);
    const calculated = calculateSplits(amount, memberIds, split_type!, inputs);

    setResults(calculated);

    // Sync valid calculations back to store draft
    const validSplits = calculated.map((r) => ({
      user_id: r.user_id,
      amount_owed: r.amount_owed,
      // Map inputs back to schema fields based on type
      percent_owed: split_type === "PERCENTAGE" ? inputs[r.user_id] : undefined,
      shares_owed: split_type === "SHARE" ? inputs[r.user_id] : undefined,
    }));

    updateDraft({ splits: validSplits });
  }, [amount, split_type, inputs, members, updateDraft]);

  return (
    <div className="space-y-6">
      <div className="flex rounded-md bg-muted p-1">
        {TABS.map((type) => (
          <button
            key={type}
            onClick={() => {
              setSplitType(type);
              setInputs({}); // Reset inputs on type switch
            }}
            className={cn(
              "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
              split_type === type
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:bg-background/50"
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
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                  {user.name[0]}
                </div>
                <span className="text-sm font-medium">{user.name}</span>
              </div>

              <div className="flex items-center gap-4">
                {/* Dynamic Input based on Split Type */}
                {split_type !== "EQUAL" && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      className="h-8 w-20 text-right"
                      placeholder="0"
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [user.id]: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {split_type === "PERCENTAGE"
                        ? "%"
                        : split_type === "SHARE"
                        ? "shares"
                        : "INR"}
                    </span>
                  </div>
                )}

                <div className="w-24 text-right">
                  <span
                    className={cn(
                      "font-bold",
                      result?.isValid === false ? "text-destructive" : ""
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

      {/* Validation Message */}
      {results.some((r) => !r.isValid) && (
        <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
          {results.find((r) => r.error)?.error ||
            "Please adjust splits to match total amount"}
        </div>
      )}
    </div>
  );
}
