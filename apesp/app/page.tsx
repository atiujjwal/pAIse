import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  Mic,
  Calculator,
  ShieldCheck,
  Users,
  Smartphone,
  HelpCircle,
  Mail,
  Github,
  Twitter,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { pAIse_LOGO } from "@/src/lib/mediaUrls";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* --- Ambient Background --- */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[800px] w-[800px] rounded-full bg-primary/10 blur-[120px] opacity-60 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-secondary/10 blur-[100px] opacity-60 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* --- Header --- */}
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between px-6 md:px-12 border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
        <div className="flex items-center gap-3">
          <img src={pAIse_LOGO} alt="pAIse" className="h-8 w-auto" />
          <span className="text-xl font-bold tracking-tight text-foreground hidden sm:block">
            pAIse
          </span>
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="rounded-xl text-muted-foreground hover:text-foreground hidden sm:flex"
            asChild
          >
            <Link href="/auth/login">Log in</Link>
          </Button>
          <Button
            className="rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            asChild
          >
            <Link href="/auth/register">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* --- Hero Section --- */}
        <section className="relative px-6 pt-20 pb-24 md:pt-32 md:pb-32 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            AI-Powered Expense Tracking V1.0
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Split bills, <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
              not friendships.
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Stop arguing over math. Scan receipts, use voice commands, and let
            our AI handle the complex splitting logic instantly.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Button
              size="lg"
              className="h-14 rounded-2xl px-8 text-lg shadow-xl shadow-primary/20 transition-transform hover:-translate-y-1"
              asChild
            >
              <Link href="/auth/register">
                Start for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 rounded-2xl px-8 text-lg border-border bg-card/50 hover:bg-card hover:text-foreground backdrop-blur-sm"
              asChild
            >
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </section>

        {/* --- Features Grid --- */}
        <section
          id="features"
          className="py-24 px-6 bg-muted/30 border-y border-border"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Everything you need to settle up
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built for roommates, trips, and couples. pAIse handles the chaos
                of shared finances so you don't have to.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group relative overflow-hidden rounded-3xl bg-card p-8 shadow-sm border border-border hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 transition-transform group-hover:scale-110 group-hover:rotate-3">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Smart OCR Scanning</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Snap a photo of any receipt. Our AI extracts items, prices,
                  and taxes automatically. No manual typing required.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group relative overflow-hidden rounded-3xl bg-card p-8 shadow-sm border border-border hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:-rotate-3">
                  <Mic className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Voice Entry</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Just say "I paid 500 for lunch with Bob" and we'll handle the
                  rest. Natural language processing at its finest.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group relative overflow-hidden rounded-3xl bg-card p-8 shadow-sm border border-border hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary transition-transform group-hover:scale-110 group-hover:rotate-3">
                  <Calculator className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Complex Splits</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Split by percentage, shares, or exact amounts. We calculate
                  who owes who what, simplifying group debts instantly.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="group relative overflow-hidden rounded-3xl bg-card p-8 shadow-sm border border-border hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 transition-transform group-hover:scale-110">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Groups & Friends</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Create groups for trips ("Goa 2025") or housemates ("Apt 4B").
                  Track balances per group or overall.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="group relative overflow-hidden rounded-3xl bg-card p-8 shadow-sm border border-border hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 transition-transform group-hover:scale-110">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Secure & Private</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your financial data is encrypted. We don't sell your data. You
                  control who sees your expenses.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="group relative overflow-hidden rounded-3xl bg-card p-8 shadow-sm border border-border hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 transition-transform group-hover:scale-110">
                  <Smartphone className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Mobile First</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Designed for your phone. Add expenses on the go with a
                  responsive, app-like experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Help & Support (FAQ) --- */}
        <section className="py-24 px-6 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Is pAIse free to use?",
                a: "Yes! The core features including splitting, groups, and basic scanning are completely free for individual users.",
              },
              {
                q: "How secure is my data?",
                a: "We use industry-standard encryption for all data in transit and at rest. We strictly do not share your financial data with third parties.",
              },
              {
                q: "Can I use it without my friends signing up?",
                a: "You can add expenses for friends, but for them to see balances and settle up, they'll need to create a free account.",
              },
              {
                q: "Does it support international currencies?",
                a: "Currently we are optimized for INR (₹), but we are rolling out multi-currency support in the next update.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/20 transition-colors"
              >
                <h3 className="font-bold text-lg mb-2 flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-muted-foreground ml-8 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* --- CTA Section --- */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-primary to-violet-700 px-6 py-16 md:px-12 text-center text-white shadow-2xl relative overflow-hidden">
            {/* Abstract Shapes */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Ready to settle up?
              </h2>
              <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                Join thousands of users who trust pAIse to manage their shared
                expenses effortlessly.
              </p>
              <Button
                size="lg"
                className="h-14 px-8 rounded-full bg-white text-primary hover:bg-slate-50 font-bold text-lg shadow-xl hover:scale-105 transition-all"
                asChild
              >
                <Link href="/auth/register">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-border bg-card py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold">pAIse</span>
            </div>
            <p className="text-muted-foreground max-w-xs leading-relaxed">
              The smartest way to split bills and track shared expenses with
              friends, roommates, and family.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2025 pAIse. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <div className="flex gap-4 ml-4">
              <Twitter className="h-5 w-5 hover:text-primary cursor-pointer" />
              <Github className="h-5 w-5 hover:text-primary cursor-pointer" />
              <Mail className="h-5 w-5 hover:text-primary cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
