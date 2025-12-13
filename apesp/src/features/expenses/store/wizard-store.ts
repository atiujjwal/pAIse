import { create } from "zustand";
import { CreateExpenseInput } from "@/src/lib/schemas";

interface WizardState extends Partial<CreateExpenseInput> {
  currentStep: number;
  totalSteps: number;
  isMultiPayer: boolean;

  // Actions
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  updateDraft: (data: Partial<CreateExpenseInput>) => void;
  resetWizard: () => void;
  setSplitType: (type: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARE") => void;
}

const initialState = {
  currentStep: 1,
  totalSteps: 4,
  isMultiPayer: false,
  currency: "INR", // Fixed: Removed artifact
  payers: [],
  splits: [],
  split_type: "EQUAL" as const,
  amount: "",
  description: "",
  category: "General",
  date: new Date().toISOString().slice(0, 16), // Format for datetime-local
};

export const useExpenseWizardStore = create<WizardState>((set) => ({
  ...initialState,

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, state.totalSteps),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  setStep: (step) => set({ currentStep: step }),

  updateDraft: (data) =>
    set((state) => ({
      ...state,
      ...data,
    })),

  setSplitType: (type) =>
    set((state) => ({
      ...state,
      split_type: type,
      // Reset splits when type changes to avoid validation conflicts
      splits: [],
    })),

  resetWizard: () => set(initialState),
}));
