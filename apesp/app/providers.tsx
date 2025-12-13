"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthGuard } from "@/src/features/auth/components/AuthGuard";
import { queryClient } from "@/src/lib/query-client";
import { ThemeProvider } from "@/src/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthGuard>{children}</AuthGuard>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
