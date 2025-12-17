import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ChatWidget } from "@/src/components/chat/components/ChatWidget";
import { AuthSync } from "@/src/features/auth/components/AuthSync";
import { cn } from "@/src/lib/utils";
import { Toaster } from "@/src/hooks/use-toast";
import { Toaster2 } from "@/src/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "pAIse - AI Expense Manager",
  description: "Smart splitting for smart groups.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* FIXED: Replaced inter.className with standard Tailwind classes */}
      {/* "font-sans" uses the native system font stack (San Francisco, Segoe UI, etc.) */}
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <AuthSync />
          {children}
          <Toaster2 />
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
