"use client";

import { Button } from "@/src/components/ui/Button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="mb-6 rounded-3xl bg-destructive/10 p-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>

      <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
        Something went wrong!
      </h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        We encountered an unexpected error. Please try again or return home.
      </p>

      <div className="flex gap-4">
        <Button
          onClick={() => reset()}
          size="lg"
          className="rounded-xl shadow-lg shadow-primary/20"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="rounded-xl"
          onClick={() => (window.location.href = "/dashboard")}
        >
          <Home className="mr-2 h-4 w-4" /> Go Home
        </Button>
      </div>
    </div>
  );
}
