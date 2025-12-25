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
  icons: {
    icon: "https://res.cloudinary.com/do1f9qqik/image/upload/v1766679121/favicon_e894ro.ico",
    apple: "https://res.cloudinary.com/do1f9qqik/image/upload/v1766679115/paise-favicon-apple_w9qljs.png", // Optional: for iPhone home screen
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
