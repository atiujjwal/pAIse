import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "pAIse - Authentication",
  description: "Login or Register to pAIse",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout inherits html/body from the Root Layout
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-secondary p-4 dark:bg-background">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border border-primary/20" />
      <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-primary-soft/70" />
      <div className="relative w-full max-w-md animate-in fade-in duration-500">
        {children}
      </div>
      {/* ChatWidget is likely already in RootLayout, so we don't add it here to avoid duplicates */}
    </div>
  );
}
