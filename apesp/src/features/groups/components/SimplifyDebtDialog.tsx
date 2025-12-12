"use client";

import { useAuthStore } from "@/src/features/auth/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/Dialog"; // Fixed import case (Dialog vs dialog)
import { Button } from "@/src/components/ui/Button";
import { Skeleton } from "@/src/components/ui/Skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar"; // New Import
import { Check, ArrowRight, Wallet } from "lucide-react";
import { formatCurrency } from "@/src/lib/utils";
import { OptimizedPayment } from "../api/group-details-query";
import { useCreateSettlement } from "@/src/features/settlements/api/settlement-queries";

interface SimplifyDebtDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payments: OptimizedPayment[];
  isLoading: boolean;
  groupId: string;
}

export function SimplifyDebtDialog({
  isOpen,
  onClose,
  payments,
  isLoading,
  groupId,
}: SimplifyDebtDialogProps) {
  const currentUser = useAuthStore((state) => state.user);
  const { mutate: settleDebt, isPending } = useCreateSettlement();

  const handleSettle = (payment: OptimizedPayment) => {
    settleDebt({
      receiver_id: payment.to.id,
      group_id: groupId,
      amount: payment.amount,
      date: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Simplify Debts</DialogTitle>
          <DialogDescription>
            The most efficient way to settle all balances in this group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Check className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
              <p>All settled up! No payments needed.</p>
            </div>
          ) : (
            payments.map((payment, index) => {
              const isPayer = payment.from.id === currentUser?.id;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  {/* Left: Avatar Flow */}
                  <div className="flex items-center gap-3 flex-1">
                    {/* PAYER AVATAR */}
                    <div className="flex flex-col items-center">
                      <Avatar className="h-9 w-9 border border-white shadow-sm">
                        <AvatarImage src={payment.from.avatar} />
                        <AvatarFallback className="bg-rose-100 text-rose-600 font-bold text-xs">
                          {payment.from.name.trim().split(" ")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-slate-400 mt-1 font-medium">
                        {payment.from.name.trim().split(" ")[0]}
                      </span>
                    </div>

                    <ArrowRight className="h-4 w-4 text-slate-300" />

                    {/* RECEIVER AVATAR */}
                    <div className="flex flex-col items-center">
                      <Avatar className="h-9 w-9 border border-white shadow-sm">
                        <AvatarImage src={payment.to.avatar} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-600 font-bold text-xs">
                          {payment.to.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-slate-400 mt-1 font-medium">
                        {payment.to.name.trim().split(" ")[0]}
                      </span>
                    </div>

                    <div className="ml-2">
                      <p className="text-sm font-medium text-slate-900 leading-tight">
                        {isPayer ? "You owe" : `${payment.from.name} owes`}
                        <span className="block font-bold text-slate-700">
                          {payment.to.name.trim().split(" ")[0]}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Action */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(payment.amount, "INR")}
                    </span>

                    {isPayer && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                        onClick={() => handleSettle(payment)}
                        disabled={isPending}
                      >
                        <Wallet className="h-3 w-3 mr-1" /> Pay
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
