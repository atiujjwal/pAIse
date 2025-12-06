"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthGuard } from "@/src/features/auth/components/AuthGuard";
import { queryClient } from "@/src/lib/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>{children}</AuthGuard>
    </QueryClientProvider>
  );
}
