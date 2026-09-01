import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
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

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "pAIse — Split bills, not friendships",
  description: "Voice, receipts, and flexible splits make shared expenses feel effortless.",
  icons: {
    icon: [{ url: "/paiseLogo1.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/paiseLogo1.png",
    apple: [{ url: "/paiseLogo1.png", type: "image/png", sizes: "512x512" }],
  },
  openGraph: {
    title: "pAIse — Split bills, not friendships",
    description: "Voice, receipts, and flexible splits make shared expenses feel effortless.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "pAIse shared expense manager" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "pAIse — Split bills, not friendships",
    description: "Voice, receipts, and flexible splits make shared expenses feel effortless.",
    images: ["/og.png"],
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
      <body className={`${inter.variable} ${fraunces.variable} font-sans`}>
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
