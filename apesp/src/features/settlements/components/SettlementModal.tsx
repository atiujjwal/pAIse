"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar, ArrowRight, Loader2, IndianRupee } from "lucide-react";

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
  defaultDirection?: "PAY" | "RECEIVE"; // PAY = Current User pays Counterparty
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
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amount: defaultAmount,
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // Reset form when modal opens with new props
  useEffect(() => {
    if (isOpen) {
      reset({ amount: defaultAmount, date: format(new Date(), "yyyy-MM-dd") });
      setDirection(defaultDirection);
    }
  }, [isOpen, defaultAmount, defaultDirection, reset]);

  const onSubmit = (data: { amount: string; date: string }) => {
    // If direction is PAY: Payer = Me, Receiver = Them
    // If direction is RECEIVE: Payer = Them, Receiver = Me
    // BUT the API expects `receiver_id` relative to the authenticated user?
    // No, the API uses `userId` from auth as the "Actor".
    // If I am recording "I paid", I call POST /settlements with receiver_id = Them.
    // If I am recording "They paid me", I technically cannot do that with your current API payload { receiver_id }
    // UNLESS the API infers payer from auth token.
    // Reviewing your API: `const { userId: payerId } = payload;` -> The API assumes the logged-in user is ALWAYS the payer.
    // LIMITATION: Your current backend only allows the logged-in user to record payments *they* made.
    // To support "Alice paid me", you need to update the backend or swap the IDs if you were an Admin recording it.
    // For now, based on your API code, we only support "I paid".

    if (direction === "RECEIVE") {
      // If we want to record that THEY paid US, we strictly need API support or we initiate a "Request".
      // For this implementation, we will restrict to "I Paid" to match your backend code provided.
      console.warn(
        "Recording 'Received' payments requires backend update to allow setting payer_id explicitly."
      );
      return;
    }

    createSettlement(
      {
        receiver_id: counterparty.id,
        group_id: context.type === "group" ? context.groupId : null,
        amount: data.amount,
        date: new Date(data.date).toISOString(),
      },
      {
        onSuccess: onClose,
      }
    );
  };

  const isGroup = context.type === "group";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-2">
          {/* Visual Payment Flow */}
          <div className="flex items-center justify-between px-4 py-6 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                <AvatarImage src={currentUser.avatar || ""} />
                <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-slate-600">You</span>
            </div>

            <div className="flex flex-col items-center gap-1 flex-1 px-4">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full">
                <span>Paying</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                <AvatarImage src={counterparty.avatar || ""} />
                <AvatarFallback>{counterparty.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-slate-600">
                {counterparty.name.split(" ")[0]}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <Input
                  {...register("amount")}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-10 h-12 text-lg font-bold"
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-xs">{errors.amount.message}</p>
              )}
            </div>

            {/* Date Input */}
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input type="date" {...register("date")} className="pl-10" />
              </div>
            </div>

            {/* Context Info */}
            <div className="text-xs text-slate-400 text-center">
              {isGroup ? (
                <span>
                  Settling via <strong>{context.groupName}</strong>
                </span>
              ) : (
                <span>Non-group (private) settlement</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
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
