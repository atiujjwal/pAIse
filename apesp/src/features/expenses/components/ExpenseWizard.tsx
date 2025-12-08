'use client';


import { useToastStore } from '@/src/hooks/use-toast';
import { Step1Details } from './Step1Details';
import { Step3Splits } from './Step3Splits';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/src/lib/api';
import { useExpenseWizardStore } from '../store/wizard-store';
import { Button } from '@/src/components/ui/Button';

// Mock members for now - in production this comes from Group context
const MOCK_MEMBERS = [
    { id: 'u1', name: 'Alice', email: 'alice@test.com', currency: 'INR', timezone: 'UTC' },
    { id: 'u2', name: 'Bob', email: 'bob@test.com', currency: 'INR', timezone: 'UTC' },
];

export default function ExpenseWizard() {
  const { currentStep, nextStep, prevStep, totalSteps, resetWizard, ...draft } = useExpenseWizardStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      // Construct payload strictly matching Schema [cite: 601]
      const payload = {
        ...draft,
        // Ensure defaults if missing
        currency: draft.currency || 'INR',
        // In real app, "Step 2" would populate payers. Defaulting to current user for single payer MVP.
        payers: draft.payers?.length ? draft.payers : [{ user_id: 'u1', amount: draft.amount! }],
      };

      await api.post('/expenses', payload);
      
      addToast('Expense created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      resetWizard();
      router.push('/dashboard');
    } catch (error: any) {
      addToast(error.message || 'Failed to create expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">New Expense</h2>
        <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
      </div>

      <div className="min-h-[300px]">
        {currentStep === 1 && <Step1Details />}
        {/* Skipping Step 2 (Payer) for brevity, straightforward list selection similar to Step 3 */}
        {currentStep === 2 && <div className="p-4 text-center text-muted-foreground">Payer Selection (Assuming You Paid for MVP)</div>}
        {currentStep === 3 && <Step3Splits members={MOCK_MEMBERS} />}
        {currentStep === 4 && (
            <div className="space-y-4">
                <h3 className="font-medium">Review</h3>
                <div className="rounded-md bg-muted p-4 text-sm">
                    <p><strong>Total:</strong> {draft.currency} {draft.amount}</p>
                    <p><strong>For:</strong> {draft.description}</p>
                    <p><strong>Split:</strong> {draft.split_type}</p>
                </div>
            </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          Back
        </Button>
        
        {currentStep < totalSteps ? (
          <Button onClick={nextStep}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Confirm Expense'}
          </Button>
        )}
      </div>
    </div>
  );
}