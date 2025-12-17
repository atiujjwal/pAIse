"use client";

import { useToastStore } from "@/src/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/src/components/ui/toast";

export function Toaster2() {
  // 1. Consume the store state directly
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <ToastProvider>
      {toasts.map((toast) => {
        // Map your store's "type" to Shadcn's "variant"
        const isError = toast.type === "error";
        const isSuccess = toast.type === "success";

        return (
          <Toast
            key={toast.id}
            // Map error to destructive, otherwise default
            variant={isError ? "destructive" : "default"}
            // Add custom styling for success since standard Shadcn doesn't have a success variant
            className={
              isSuccess
                ? "border-green-500 bg-green-50 text-green-900 dark:bg-green-900/30 dark:text-green-100"
                : ""
            }
            // 3. Connect the dismiss action
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
          >
            <div className="grid gap-1">
              {/* Capitalize the type to use as a Title (e.g., "Success", "Error") */}
              <ToastTitle className="capitalize">
                {toast.type === "info" ? "Notification" : toast.type}
              </ToastTitle>
              <ToastDescription>{toast.message}</ToastDescription>
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
