import Link from "next/link";
import { Wallet } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left: Artistic Side (Hidden on mobile) */}
      <div className="hidden w-1/2 bg-slate-900 lg:block relative overflow-hidden">
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl mix-blend-screen animate-pulse" />
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-3xl mix-blend-screen" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl mix-blend-screen" />

        {/* Content Overlay */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">pAIse</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight mb-6">
              Simplify your shared expenses.
            </h2>
            <p className="text-lg text-slate-300">
              Stop stressing over the math. Let our AI handle the splits while
              you enjoy the moment.
            </p>
          </div>

          <div className="text-sm text-slate-500">© 2025 pAIse Inc.</div>
        </div>
      </div>

      {/* Right: Form Side */}
      <div className="flex w-full flex-col justify-center items-center bg-white p-8 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
