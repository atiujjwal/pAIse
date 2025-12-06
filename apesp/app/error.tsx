"use client";

import { Button } from "@/src/components/ui/Button";
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
    <div className="flex h-screen flex-col items-center justify-center space-y-4 text-center">
      <h2 className="text-3xl font-bold tracking-tight text-destructive">
        Something went wrong!
      </h2>
      <p className="text-muted-foreground">
        A critical error occurred while rendering this page.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/dashboard")}
        >
          Go Home
        </Button>
      </div>
    </div>
  );
}
