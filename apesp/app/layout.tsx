import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        {/* The Providers component MUST wrap the children here */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
