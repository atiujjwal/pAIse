import { CreateExpenseInput } from '@/src/lib/schemas';
import { create } from 'zustand';

// Partial type allows building the object step-by-step
type WizardState = Partial<CreateExpenseInput> & {
  // UI State
  currentStep: number;
  totalSteps: number;
  isMultiPayer: boolean;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateDraft: (data: Partial<CreateExpenseInput>) => void;
  resetWizard: () => void;
  setSplitType: (type: CreateExpenseInput['split_type']) => void;
};

const INITIAL_STATE = {
  currentStep: 1,
  totalSteps: 4,
  isMultiPayer: false,
  [cite_start]currency: 'INR', // Default [cite: 801]
  payers: [],
  splits: [],
  split_type: 'EQUAL' as const,
};

export const useExpenseWizardStore = create<WizardState>((set) => ({
  ...INITIAL_STATE,

  setStep: (step) => set({ currentStep: step }),
  
  nextStep: () => set((state) => ({ 
    currentStep: Math.min(state.currentStep + 1, state.totalSteps) 
  })),
  
  prevStep: () => set((state) => ({ 
    currentStep: Math.max(state.currentStep - 1, 1) 
  })),

  updateDraft: (data) => set((state) => ({ ...state, ...data })),

  setSplitType: (type) => set({ split_type: type }),

  resetWizard: () => set(INITIAL_STATE),
}));