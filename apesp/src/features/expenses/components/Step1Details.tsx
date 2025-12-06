"use client";

import { Input } from "@/src/components/ui/Input";
import { VoiceExpenseInput } from "../../ai/components/VoiceExpenseInput";
import { useExpenseWizardStore } from "../store/wizard-store";
import { Label } from "@/src/components/ui/label";



export function Step1Details() {
  const { description, amount, date, category, updateDraft } =
    useExpenseWizardStore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* AI Integration Points [cite: 211] */}
        <VoiceExpenseInput />
        {/* Placeholder for Receipt Upload */}
        <div className="flex items-center justify-center rounded-md border border-dashed p-2 text-sm text-muted-foreground">
          Receipt Upload (Coming Soon)
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={description || ""}
          onChange={(e) => updateDraft({ description: e.target.value })}
          placeholder="Dinner at Pizza Palace"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            step="0.01"
            value={amount || ""}
            onChange={(e) => updateDraft({ amount: e.target.value })}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input value="INR" disabled className="bg-muted" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Input
          type="datetime-local"
          value={date || ""}
          onChange={(e) => updateDraft({ date: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Input
          value={category || ""}
          onChange={(e) => updateDraft({ category: e.target.value })}
          placeholder="Food, Travel, etc."
        />
      </div>
    </div>
  );
}
