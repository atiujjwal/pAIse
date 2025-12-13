import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ChatWidget } from "@/src/components/chat/components/ChatWidget";
import { cn } from "@/src/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
          {children}
          <ChatWidget />
          </Providers>
      </body>
    </html>
  );
}
