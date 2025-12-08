"use client";

import { useEffect, useState } from "react";

export function useUnsavedChanges(isDirty: boolean) {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Handle Browser Refresh / Tab Close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ""; // Standard browser requirement to trigger native dialog
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Handle In-App Navigation (Cancel Buttons, Links)
  const handleNavigationAttempt = (action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
      setShowDiscardDialog(true);
    } else {
      action();
    }
  };

  const confirmDiscard = () => {
    setShowDiscardDialog(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const cancelDiscard = () => {
    setShowDiscardDialog(false);
    setPendingAction(null);
  };

  return {
    showDiscardDialog,
    handleNavigationAttempt,
    confirmDiscard,
    cancelDiscard,
  };
}
