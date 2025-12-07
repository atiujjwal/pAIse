import "./globals.css";
// REMOVED: import { Inter } from 'next/font/google';
import { Providers } from "./providers";
import { cn } from "@/src/lib/utils";

// REMOVED: const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "pAIse - AI Expense Manager",
  description: "Smart splitting and expense tracking",
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
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
