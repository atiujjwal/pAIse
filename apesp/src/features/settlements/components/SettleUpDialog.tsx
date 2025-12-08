"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/src/lib/types";
import { useToastStore } from "@/src/hooks/use-toast";
import { api } from "@/src/lib/api";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";


interface SettleUpProps {
  friend: User; // Who we are paying
  amountOwed: string; // Default amount to pre-fill
  groupId?: string; // Context
  onClose: () => void;
}

export function SettleUpDialog({
  friend,
  amountOwed,
  groupId,
  onClose,
}: SettleUpProps) {
  const [amount, setAmount] = useState(amountOwed);
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      // API Integration: POST /api/settlements [Source 171]
      await api.post("/settlements", {
        receiver_id: friend.id,
        amount: amount,
        group_id: groupId || null,
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      addToast(`Recorded payment to ${friend.name}`, "success");
      onClose();
    },
    onError: () => {
      addToast("Failed to record settlement", "error");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">
          Settle Up with {friend.name}
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">
                ₹
              </span>
              <Input
                type="number"
                className="pl-8"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Recording this will reduce your debt balance.
            </p>
          </div>

          <div className="rounded-md bg-yellow-50 p-3 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            <strong>Note:</strong> This does not transfer actual money. Ensure
            you have paid via UPI/Cash first.
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !amount}
              className="bg-green-600 hover:bg-green-700"
            >
              {mutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
