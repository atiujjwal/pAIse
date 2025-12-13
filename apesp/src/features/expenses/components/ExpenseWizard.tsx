"use client";

import { useToastStore } from "@/src/hooks/use-toast";
import { Step1Details } from "./Step1Details";
import { Step3Splits } from "./Step3Splits";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/src/lib/api";
import { useExpenseWizardStore } from "../store/wizard-store";
import { Button } from "@/src/components/ui/Button";

const MOCK_MEMBERS = [
  {
    id: "u1",
    name: "Alice",
    email: "alice@test.com",
    currency: "INR",
    timezone: "UTC",
  },
  {
    id: "u2",
    name: "Bob",
    email: "bob@test.com",
    currency: "INR",
    timezone: "UTC",
  },
];

export default function ExpenseWizard() {
  const { currentStep, nextStep, prevStep, totalSteps, resetWizard, ...draft } =
    useExpenseWizardStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...draft,
        currency: draft.currency || "INR",
        payers: draft.payers?.length
          ? draft.payers
          : [{ user_id: "u1", amount: draft.amount! }],
      };

      await api.post("/expenses", payload);

      addToast("Expense created successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      resetWizard();
      router.push("/dashboard");
    } catch (error: any) {
      addToast(error.message || "Failed to create expense", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-[2.5rem] border border-border bg-card p-8 md:p-10 shadow-sm">
      <div className="mb-10 flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">New Expense</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add details about your spending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Step
          </span>
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30">
            {currentStep}
          </div>
          <span className="text-sm text-muted-foreground">of {totalSteps}</span>
        </div>
      </div>

      <div className="min-h-[400px]">
        {currentStep === 1 && <Step1Details />}
        {currentStep === 2 && (
          <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl bg-muted/10">
            <p className="text-muted-foreground">
              Payer Selection Step (Skipped for MVP)
            </p>
          </div>
        )}
        {currentStep === 3 && <Step3Splits members={MOCK_MEMBERS} />}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-foreground">
              Review Details
            </h3>
            <div className="rounded-3xl bg-muted/30 p-6 space-y-4 border border-border">
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-mono font-bold text-foreground text-2xl">
                  {draft.currency} {draft.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description</span>
                <span className="font-medium text-foreground">
                  {draft.description}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Split Method</span>
                <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  {draft.split_type}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 flex justify-between pt-6 border-t border-border">
        <Button
          variant="ghost"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="h-12 px-6 rounded-xl"
        >
          Back
        </Button>

        {currentStep < totalSteps ? (
          <Button
            onClick={nextStep}
            className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
          >
            Next Step
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
          >
            {isSubmitting ? "Saving..." : "Confirm Expense"}
          </Button>
        )}
      </div>
    </div>
  );
}
