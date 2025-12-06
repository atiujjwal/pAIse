import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between px-6 border-b">
        <div className="font-bold text-xl text-primary">pAIse</div>
        <div className="flex gap-4">
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/register">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-24 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-6">
            Split expenses,
            <br />
            <span className="text-primary">powered by AI.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Stop arguing over math. Scan receipts, use voice commands, and let
            our AI handle the complex splitting logic instantly.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-lg" asChild>
              <Link href="/auth/register">
                Start for Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900 py-24">
          <div className="mx-auto max-w-5xl px-6 grid md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-xl border shadow-sm">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                <CheckCircle2 />
              </div>
              <h3 className="font-bold text-lg mb-2">Smart OCR</h3>
              <p className="text-muted-foreground">
                Scan receipts and let us extract the line items automatically.
              </p>
            </div>
            <div className="bg-background p-6 rounded-xl border shadow-sm">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                <CheckCircle2 />
              </div>
              <h3 className="font-bold text-lg mb-2">Voice Entry</h3>
              <p className="text-muted-foreground">
                Just say "I paid 50 for lunch" and we'll handle the rest.
              </p>
            </div>
            <div className="bg-background p-6 rounded-xl border shadow-sm">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                <CheckCircle2 />
              </div>
              <h3 className="font-bold text-lg mb-2">Fair Splits</h3>
              <p className="text-muted-foreground">
                Support for Equal, Percentage, and Share-based splitting.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2025 pAIse. All rights reserved.
      </footer>
    </div>
  );
}
