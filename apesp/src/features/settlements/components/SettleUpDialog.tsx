"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/src/lib/types";
import { useToastStore } from "@/src/hooks/use-toast";
import { api } from "@/src/lib/api";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { Loader2 } from "lucide-react";

interface SettleUpProps {
  friend: User;
  amountOwed: string;
  groupId?: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-card border border-border p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="mb-6 text-xl font-bold text-foreground">
          Settle Up with {friend.name}
        </h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-muted-foreground font-bold">
                ₹
              </span>
              <Input
                type="number"
                className="pl-9 h-12 rounded-xl text-lg font-bold"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Recording this will reduce your debt balance.
            </p>
          </div>

          <div className="rounded-xl bg-amber-500/10 p-4 text-xs text-amber-600 dark:text-amber-400 border border-amber-500/20 leading-relaxed">
            <strong>Note:</strong> This does not transfer actual money. Ensure
            you have paid via UPI/Cash first.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !amount}
              className="h-11 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg shadow-secondary/20"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Record Payment"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
