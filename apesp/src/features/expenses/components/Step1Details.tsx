"use client";

import { Input } from "@/src/components/ui/Input";
import { VoiceExpenseInput } from "../../../components/forms/expense/VoiceExpenseInput";
import { useExpenseWizardStore } from "../store/wizard-store";
import { Label } from "@/src/components/ui/label";

export function Step1Details() {
  const { description, amount, date, category, updateDraft } =
    useExpenseWizardStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 gap-4">
        <VoiceExpenseInput />
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border p-2 text-sm font-medium text-muted-foreground bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
          Receipt Upload (Coming Soon)
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={description || ""}
          onChange={(e) => updateDraft({ description: e.target.value })}
          placeholder="e.g., Dinner at Pizza Palace"
          className="h-12 rounded-xl text-base"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Amount</Label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-muted-foreground font-bold">
              ₹
            </span>
            <Input
              type="number"
              step="0.01"
              value={amount || ""}
              onChange={(e) => updateDraft({ amount: e.target.value })}
              placeholder="0.00"
              className="h-12 pl-10 rounded-xl text-lg font-bold"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input
            value="INR"
            disabled
            className="h-12 rounded-xl bg-muted/30 text-muted-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Input
          type="datetime-local"
          value={date || ""}
          onChange={(e) => updateDraft({ date: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Input
          value={category || ""}
          onChange={(e) => updateDraft({ category: e.target.value })}
          placeholder="Food, Travel, etc."
          className="h-12 rounded-xl"
        />
      </div>
    </div>
  );
}
