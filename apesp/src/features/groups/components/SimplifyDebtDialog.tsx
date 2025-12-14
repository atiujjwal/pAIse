"use client";

import { useAuthStore } from "@/src/features/auth/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/Dialog";
import { Button } from "@/src/components/ui/Button";
import { Skeleton } from "@/src/components/ui/Skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
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
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border-border">
        <DialogHeader>
          <DialogTitle>Simplify Debts</DialogTitle>
          <DialogDescription>
            Efficiently settle group balances.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-2xl border-2 border-dashed border-border text-muted-foreground">
              <p>All settled up!</p>
            </div>
          ) : (
            payments.map((payment, index) => {
              const isPayer = payment.from.id === currentUser?.id;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={payment.from.avatar} />
                        <AvatarFallback className="bg-destructive/10 text-destructive font-bold text-xs">
                          {payment.from.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-muted-foreground font-medium max-w-[50px] truncate">
                        {payment.from.name.split(" ")[0]}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                    <div className="flex flex-col items-center gap-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={payment.to.avatar} />
                        <AvatarFallback className="bg-secondary/10 text-secondary font-bold text-xs">
                          {payment.to.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-muted-foreground font-medium max-w-[50px] truncate">
                        {payment.to.name.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-mono font-bold text-lg">
                      {formatCurrency(payment.amount, "INR")}
                    </span>
                    {isPayer && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-secondary/30 text-secondary hover:bg-secondary/10"
                        onClick={() => handleSettle(payment)}
                        disabled={isPending}
                      >
                        <Wallet className="h-3 w-3 mr-1.5" /> Pay
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
