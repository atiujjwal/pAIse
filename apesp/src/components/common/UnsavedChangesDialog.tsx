"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/Dialog";
import { Button } from "@/src/components/ui/Button";
import { AlertTriangle } from "lucide-react";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onContinueEditing: () => void;
  onDiscard: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  onContinueEditing,
  onDiscard,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onContinueEditing()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <div className="p-2 bg-amber-100/20 rounded-full border border-amber-200/50">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Unsaved Changes
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-2">
          <p className="text-muted-foreground leading-relaxed">
            You have unsaved changes. Are you sure you want to discard them?
            This action cannot be undone.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onContinueEditing}
            className="font-medium"
          >
            Keep Editing
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            Discard Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
