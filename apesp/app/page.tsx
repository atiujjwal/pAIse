import Link from "next/link";
import { ArrowRight, CheckCircle2, Zap, Mic, Calculator } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Decorative Background Blobs - Adjusted for full coverage */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/4 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl opacity-60" />
        <div className="absolute top-1/3 right-0 h-[500px] w-[500px] rounded-full bg-purple-100/40 blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl opacity-60" />
      </div>

      {/* Glass Header */}
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between px-6 md:px-12 border-b border-white/40 bg-white/70 backdrop-blur-xl transition-all">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-purple-500 text-white shadow-lg shadow-primary/20">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            pAIse
          </span>
        </div>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="text-slate-600 hover:text-primary hover:bg-white/50 rounded-full px-6"
            asChild
          >
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button
            className="rounded-full shadow-glow transition-all hover:scale-105"
            asChild
          >
            <Link href="/auth/register">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Unified Hero + Features Section */}
        <section className="relative w-full max-w-6xl px-6 pt-16 pb-12 md:pt-24 text-center">
          {/* 1. Hero Content - Tighter Spacing */}
          <div className="mx-auto max-w-4xl mb-12">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              v1.0 is now live
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              Split expenses,
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                powered by AI.
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-500 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
              Stop arguing over math. Scan receipts, use voice commands, and let
              our AI handle the complex splitting logic instantly.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <Button
                size="lg"
                className="h-14 rounded-full px-8 text-lg shadow-xl shadow-primary/25 transition-all hover:-translate-y-1"
                asChild
              >
                <Link href="/auth/register">
                  Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-full px-8 text-lg border-slate-300 bg-white/50 hover:bg-white hover:text-primary"
                asChild
              >
                <Link href="/auth/login">Existing User</Link>
              </Button>
            </div>
          </div>

          {/* 2. Features Grid - Pulled Up & Integrated */}
          {/* Added 'animate-in' to make them float up gently */}
          <div className="grid md:grid-cols-3 gap-6 text-left animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-3xl bg-white/60 p-6 shadow-soft backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-lg border border-white/60">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 group-hover:rotate-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-800">
                Smart OCR
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Scan receipts and let us extract the line items automatically.
                No more manual data entry.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-3xl bg-white/60 p-6 shadow-soft backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-lg border border-white/60">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition-transform group-hover:scale-110 group-hover:-rotate-3">
                <Mic className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-800">
                Voice Entry
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Just say "I paid 500 for lunch" and we'll handle the rest.
                Natural language processing at its finest.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-3xl bg-white/60 p-6 shadow-soft backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-lg border border-white/60">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Calculator className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-800">
                Fair Splits
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Support for Equal, Percentage, and Share-based splitting. We
                handle the complex math for you.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/50 py-8 text-center backdrop-blur-sm mt-auto">
        <p className="text-sm font-medium text-slate-500">
          © 2025 pAIse. Crafted with intelligence.
        </p>
      </footer>
    </div>
  );
}
