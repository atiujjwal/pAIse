"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { OptimizedPayment } from "../api/group-details-query";
import { formatCurrency } from "@/src/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/Dialog";

interface SimplifyDebtDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payments: OptimizedPayment[];
  isLoading: boolean;
}

export function SimplifyDebtDialog({
  isOpen,
  onClose,
  payments,
  isLoading,
}: SimplifyDebtDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Simplified Debts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-500">
            The following transactions are the most efficient way to settle all
            debts in this group.
          </p>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-slate-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-dashed">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
              <p className="font-medium text-slate-900">All settled up!</p>
              <p className="text-xs text-slate-500">No transactions needed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {/* From User */}
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-bold text-red-700">
                        {payment.from.name[0]}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 max-w-[50px] truncate">
                        {payment.from.name}
                      </span>
                    </div>

                    <ArrowRight className="h-4 w-4 text-slate-300" />

                    {/* To User */}
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700">
                        {payment.to.name[0]}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 max-w-[50px] truncate">
                        {payment.to.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block font-bold text-slate-900">
                      {formatCurrency(payment.amount, "INR")}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                      Transfer
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
