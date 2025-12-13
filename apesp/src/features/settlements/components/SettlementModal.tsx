"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar, ArrowRight, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/Dialog";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import { useCreateSettlement } from "../api/settlement-queries";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
import { cn } from "@/src/lib/utils";

const settlementSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  date: z.string(),
});

interface UserSummary {
  id: string;
  name: string;
  avatar?: string | null;
}

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSummary;
  counterparty: UserSummary;
  context?:
    | { type: "group"; groupId: string; groupName: string }
    | { type: "friend" };
  defaultAmount?: string;
  defaultDirection?: "PAY" | "RECEIVE";
}

export function SettlementModal({
  isOpen,
  onClose,
  currentUser,
  counterparty,
  context = { type: "friend" },
  defaultAmount = "",
  defaultDirection = "PAY",
}: SettlementModalProps) {
  const [direction, setDirection] = useState<"PAY" | "RECEIVE">(
    defaultDirection
  );
  const { mutate: createSettlement, isPending } = useCreateSettlement();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amount: defaultAmount,
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ amount: defaultAmount, date: format(new Date(), "yyyy-MM-dd") });
      setDirection(defaultDirection);
    }
  }, [isOpen, defaultAmount, defaultDirection, reset]);

  const onSubmit = (data: { amount: string; date: string }) => {
    if (direction === "RECEIVE") {
      console.warn("Recording 'Received' payments not supported in this view.");
      return;
    }

    createSettlement(
      {
        receiver_id: counterparty.id,
        group_id: context.type === "group" ? context.groupId : null,
        amount: data.amount,
        date: new Date(data.date).toISOString(),
      },
      { onSuccess: onClose }
    );
  };

  const isGroup = context.type === "group";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">Record Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-2">
          {/* Visual Payment Flow */}
          <div className="flex items-center justify-between px-4 py-6 bg-muted/30 rounded-2xl border border-border">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                <AvatarImage src={currentUser.avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {currentUser.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold text-muted-foreground">
                You
              </span>
            </div>

            <div className="flex flex-col items-center gap-1 flex-1 px-4">
              <div className="flex items-center gap-2 text-secondary-foreground font-bold text-xs bg-secondary px-4 py-1.5 rounded-full shadow-sm">
                <span>Paying</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                <AvatarImage src={counterparty.avatar || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                  {counterparty.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold text-muted-foreground">
                {counterparty.name.split(" ")[0]}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-muted-foreground font-bold text-lg">
                  ₹
                </span>
                <Input
                  {...register("amount")}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-10 h-14 text-xl font-bold rounded-2xl"
                />
              </div>
              {errors.amount && (
                <p className="text-destructive text-xs font-medium">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Date Input */}
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="date"
                  {...register("date")}
                  className="pl-11 h-12 rounded-xl"
                />
              </div>
            </div>

            {/* Context Info */}
            <div className="text-xs text-muted-foreground text-center bg-muted/20 py-2 rounded-lg">
              {isGroup ? (
                <span>
                  Settling via group <strong>{context.groupName}</strong>
                </span>
              ) : (
                <span>Recording private settlement</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-12 rounded-xl border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg shadow-secondary/20"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm Payment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
