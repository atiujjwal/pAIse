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
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        {children}
      </div>
      {/* ChatWidget is likely already in RootLayout, so we don't add it here to avoid duplicates */}
    </div>
  );
}
