"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Calculator,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Github,
  LayoutDashboard,
  Linkedin,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Mic,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { FeedbackForm } from "@/src/components/forms/FeedbackForm";
import { PrivacyPolicyModal } from "@/src/components/legal/PrivacyPolicyModal";
import { SecurityFeaturesModal } from "@/src/components/legal/SecurityFeaturesModal";
import { useToastStore } from "@/src/hooks/use-toast";
import { BrandLogo } from "@/src/components/common/BrandLogo";

const navItems = ["Features", "FAQ", "Contact"];

const features = [
  {
    title: "Say it. We’ll shape it.",
    desc: "Record a natural sentence and pAIse turns it into an expense draft for you to review.",
    icon: Mic,
    number: "01",
  },
  {
    title: "Let the receipt speak.",
    desc: "Photograph a bill and pull the useful details into a clean, editable expense.",
    icon: Receipt,
    number: "02",
  },
  {
    title: "Split it your way.",
    desc: "Divide equally, by exact amount, percentage, or shares—without doing the maths twice.",
    icon: Calculator,
    number: "03",
  },
  {
    title: "Ask your own numbers.",
    desc: "Use the AI assistant for quick answers about balances, expenses, and how the app works.",
    icon: Bot,
    number: "04",
  },
  {
    title: "See the whole picture.",
    desc: "Follow balances and spending trends across the week, month, or year.",
    icon: LayoutDashboard,
    number: "05",
  },
  {
    title: "Bring your people in.",
    desc: "Connect by email, invite link, or a personal pAIse QR tag.",
    icon: UserPlus,
    number: "06",
  },
  {
    title: "Private by design.",
    desc: "Control requests, block unwanted connections, and decide who can share expenses with you.",
    icon: Lock,
    number: "07",
  },
  {
    title: "Classic when you need it.",
    desc: "Add description, amount, date, and participants manually whenever that is faster.",
    icon: Smartphone,
    number: "08",
  },
];

const faqs = [
  {
    q: "How can I add friends on the app?",
    a: "Send a friend request using their email, share an invite link, or let them scan your personal pAIse QR tag.",
  },
  {
    q: "Who can create shared expenses with me?",
    a: "Only people you have accepted as friends can create shared expenses with you.",
  },
  {
    q: "What types of expenses can I create?",
    a: "Create a direct expense with one friend or a group expense shared among the members of a group.",
  },
  {
    q: "What is the difference between a friend and group expense?",
    a: "A friend expense is shared directly with one selected friend. A group expense can include every member of a selected group.",
  },
  {
    q: "How does voice-based expense creation work?",
    a: "Record the expense in your own words. pAIse extracts the details into a draft that you can review, edit, submit, or record again.",
  },
  {
    q: "Can I create an expense by scanning a receipt?",
    a: "Yes. Upload a bill and pAIse will attempt to extract the amount and description into an editable draft.",
  },
  {
    q: "What can the AI assistant help me with?",
    a: "It can explain app features and, when you are signed in, answer questions about your own expenses and balances.",
  },
  {
    q: "Are there limits on the AI features?",
    a: "During development, guests can make up to 5 AI interactions per day and signed-in users up to 10. Voice entry and receipt scanning each allow up to 5 interactions per day.",
  },
];

function BrandLockup({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border p-1 shadow-sm md:h-11 md:w-11 ${
          inverse
            ? "border-white/20 bg-brand-red-s80"
            : "border-brand-lemon-s20/60 bg-brand-cream"
        }`}
      >
        <BrandLogo surface={inverse ? "dark" : "light"} decorative />
      </span>
      <span
        className={`font-display text-2xl font-semibold tracking-[-0.04em] ${
          inverse ? "text-brand-cream" : "text-brand-ink"
        }`}
      >
        p<span className={inverse ? "text-brand-lemon" : "text-brand-red"}>AI</span>se
      </span>
    </span>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[590px]">
      <div className="absolute -left-4 top-12 hidden -rotate-6 border border-brand-red-s40 bg-brand-cream px-4 py-3 text-brand-ink shadow-card sm:block">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">Voice draft</p>
        <p className="mt-1 font-display text-lg">“Dinner was ₹2,400”</p>
      </div>
      <div className="relative rounded-[1.75rem] border border-brand-lemon-s20 bg-brand-lemon p-3 shadow-[0_30px_80px_-40px_rgba(34,3,0,.65)] sm:p-5">
        <div className="overflow-hidden rounded-[1.25rem] border border-brand-border bg-brand-cream text-brand-ink">
          <div className="flex items-center justify-between border-b border-brand-border px-4 py-3 sm:px-6">
            <BrandLockup />
            <span className="rounded-lg bg-brand-red px-3 py-2 text-xs font-bold text-brand-cream">+ Expense</span>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
            <div className="rounded-xl bg-brand-red p-5 text-brand-cream">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-25">Your balance</p>
              <p className="mt-3 font-display text-4xl font-semibold">₹1,260</p>
              <p className="mt-2 text-xs text-brand-red-10">You are owed across 3 groups</p>
            </div>
            <div className="rounded-xl border border-brand-border bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-body">This month</p>
                <Sparkles className="h-4 w-4 text-brand-red" />
              </div>
              <p className="mt-3 font-display text-3xl font-semibold">₹8,450</p>
              <div className="mt-4 flex h-9 items-end gap-1.5" aria-hidden="true">
                {[35, 58, 42, 75, 55, 90, 68].map((height, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-t-sm bg-brand-red-25 last:bg-brand-red"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-brand-border bg-white p-4 sm:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">Recent expenses</p>
                <p className="text-xs font-semibold text-brand-red">View all</p>
              </div>
              {[
                ["Sunday lunch", "The Weekend Table", "₹2,400"],
                ["Airport cab", "Goa Trip", "₹860"],
                ["Groceries", "Flatmates", "₹1,280"],
              ].map(([title, group, amount], index) => (
                <div key={title} className="flex items-center gap-3 border-t border-brand-border py-3 first:border-t-0">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${index === 1 ? "bg-brand-red-10" : "bg-brand-lemon"}`}>
                    {index === 1 ? <Receipt className="h-4 w-4 text-brand-red" /> : <Calculator className="h-4 w-4 text-brand-red" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{title}</span>
                    <span className="block text-xs text-brand-body">{group}</span>
                  </span>
                  <span className="font-mono text-sm font-bold">{amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { addToast } = useToastStore();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${id}`);
    }
  };

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText("paiseapesp@gmail.com");
    setCopiedEmail(true);
    addToast("Email copied to clipboard", "success");
    window.setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-brand-lemon selection:text-brand-ink">
      <header className="sticky top-0 z-50 border-b border-white/15 bg-brand-red text-brand-cream shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-20">
          <Link href="/" aria-label="pAIse home" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <BrandLockup inverse />
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={(event) => {
                  event.preventDefault();
                  scrollTo(item.toLowerCase());
                }}
                className="text-sm font-semibold text-brand-red-10 transition-colors hover:text-brand-lemon"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden border-transparent text-brand-cream hover:bg-white/10 hover:text-brand-lemon md:inline-flex">
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild className="hidden border-brand-lemon bg-brand-lemon text-brand-ink hover:bg-brand-cream md:inline-flex">
              <Link href="/auth/register">Start free</Link>
            </Button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-cream transition-colors hover:bg-white/10 md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-x-0 top-16 border-b border-brand-red-s40 bg-brand-red-s20 p-5 shadow-xl md:hidden"
            >
              <nav className="flex flex-col" aria-label="Mobile navigation">
                {navItems.map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setMobileMenuOpen(false);
                      scrollTo(item.toLowerCase());
                    }}
                    className="flex min-h-11 items-center border-b border-white/10 font-semibold text-brand-cream last:border-0"
                  >
                    {item}
                  </a>
                ))}
              </nav>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button asChild variant="outline" className="border-white/30 bg-transparent text-brand-cream hover:bg-white/10 hover:text-brand-cream">
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button asChild className="border-brand-lemon bg-brand-lemon text-brand-ink hover:bg-brand-cream">
                  <Link href="/auth/register">Start free</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <section className="relative overflow-hidden bg-brand-red text-brand-cream">
          <div className="absolute inset-0 opacity-25" aria-hidden="true">
            <div className="absolute -right-28 -top-36 h-96 w-96 rounded-full border border-brand-red-25" />
            <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full border border-brand-red-25" />
            <div className="absolute bottom-12 left-[46%] h-px w-36 rotate-[-16deg] bg-brand-lemon" />
          </div>
          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
            <div className="lg:col-span-6 lg:pr-8">
              <div className="mb-6 inline-flex items-center gap-2 border-b border-brand-lemon/70 pb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-lemon">
                <Sparkles className="h-4 w-4" /> Shared money, made human
              </div>
              <h1 className="font-display text-5xl font-semibold leading-[0.96] tracking-[-0.045em] sm:text-6xl md:text-7xl lg:text-[5.4rem]">
                Split bills.
                <span className="block italic text-brand-lemon">Keep the good part.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-brand-red-10 md:text-xl">
                Say the expense, scan the receipt, or add it by hand. pAIse keeps the maths tidy so shared moments stay easy.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-14 border-brand-lemon bg-brand-lemon px-7 text-brand-ink hover:bg-brand-cream">
                  <Link href="/auth/register">Create free account <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 border-white/35 bg-transparent px-7 text-brand-cream hover:bg-white/10 hover:text-brand-cream">
                  <a href="#features" onClick={(event) => { event.preventDefault(); scrollTo("features"); }}>Explore pAIse</a>
                </Button>
              </div>
              <button
                type="button"
                onClick={() => scrollTo("feedback")}
                className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-red-10 transition-colors hover:text-brand-lemon"
              >
                <MessageSquare className="h-4 w-4" /> Share a suggestion or bug
              </button>
            </div>
            <div className="lg:col-span-6">
              <ProductPreview />
            </div>
          </div>
        </section>

        <section className="border-b border-brand-border bg-brand-lemon text-brand-ink">
          <div className="mx-auto grid max-w-7xl divide-y divide-brand-lemon-s20/70 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6">
            {[
              ["Voice", "Speak naturally"],
              ["Receipt", "Review before saving"],
              ["Flexible", "Equal, exact, percent, or shares"],
            ].map(([label, detail]) => (
              <div key={label} className="flex items-baseline gap-3 py-5 sm:px-6 first:pl-0">
                <span className="font-display text-2xl font-semibold text-brand-red">{label}</span>
                <span className="text-sm text-brand-body">{detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="scroll-mt-20 bg-background px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">The everyday toolkit</p>
                <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-0.035em] text-foreground sm:text-5xl md:text-6xl">
                  Less admin between you and a settled bill.
                </h2>
              </div>
              <p className="max-w-xl text-base leading-7 text-muted-foreground lg:col-span-5 lg:justify-self-end">
                From the first receipt to the final balance, each step is designed to be quick, reviewable, and clear to everyone involved.
              </p>
            </div>

            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.number} className="group min-h-64 bg-card p-6 transition-colors duration-200 hover:bg-secondary dark:hover:bg-accent">
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs font-bold tracking-[0.18em] text-muted-foreground">{feature.number}</span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <h3 className="mt-10 font-display text-2xl font-semibold leading-tight text-foreground">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-brand-red-s80 px-4 py-16 text-brand-cream sm:px-6 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-red-40">One calm flow</p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">
                Capture now. Confirm once. Carry on.
              </h2>
              <p className="mt-5 max-w-lg leading-7 text-brand-red-25">
                AI creates a draft—not a surprise. You stay in control of the people, amount, category, and split before anything is saved.
              </p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
              {[
                ["01", "Capture", "Speak, scan, or enter the expense."],
                ["02", "Review", "Check every extracted detail."],
                ["03", "Share", "Choose the split and save."],
              ].map(([number, title, body]) => (
                <li key={number} className="border border-brand-red-s40 bg-brand-red-s60 p-5">
                  <span className="font-mono text-xs font-bold text-brand-red-40">{number}</span>
                  <h3 className="mt-8 font-display text-2xl font-semibold text-brand-lemon">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand-red-25">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 bg-secondary px-4 py-16 text-secondary-foreground sm:px-6 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-red">Good to know</p>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Questions, clearly settled.</h2>
              <p className="mt-4 max-w-sm leading-7 text-brand-body">The practical details behind friends, groups, voice, receipts, and AI limits.</p>
            </div>
            <div className="border-t border-brand-lemon-s20 lg:col-span-8">
              {faqs.map((faq, index) => (
                <details key={faq.q} className="group border-b border-brand-lemon-s20">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 py-4 marker:content-none">
                    <span className="font-mono text-[11px] font-bold text-brand-red">{String(index + 1).padStart(2, "0")}</span>
                    <span className="flex-1 font-semibold text-brand-ink">{faq.q}</span>
                    <ChevronDown className="h-5 w-5 text-brand-red transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="pb-5 pl-10 pr-8 text-sm leading-6 text-brand-body">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="feedback" className="scroll-mt-20 border-y border-border bg-background px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Built in conversation</p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-0.035em] text-foreground sm:text-5xl">Help shape what pAIse becomes.</h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                Found something awkward? Have an idea that would make settling up easier? Send it straight to the team.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-2 shadow-card sm:p-5">
              <FeedbackForm />
            </div>
          </div>
        </section>

        <section className="bg-brand-red px-4 py-16 text-center text-brand-cream sm:px-6 md:py-24">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-lemon">The next bill can be easier</p>
            <h2 className="mt-5 font-display text-5xl font-semibold leading-none tracking-[-0.04em] sm:text-6xl">Ready to settle up?</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-brand-red-10">Create an account and keep shared expenses clear from the first rupee to the final payment.</p>
            <Button asChild size="lg" className="mt-8 h-14 border-brand-lemon bg-brand-lemon px-8 text-brand-ink hover:bg-brand-cream">
              <Link href="/auth/register">Create free account <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 bg-background px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Come say hello</p>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">Get in touch.</h2>
              <p className="mt-4 leading-7 text-muted-foreground">Contribute, collaborate, or share what you are building with pAIse.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="mt-5 font-display text-2xl font-semibold">Email</h3>
                <div className="mt-3 flex items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span className="truncate">paiseapesp@gmail.com</span>
                  <button type="button" onClick={handleCopyEmail} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary hover:bg-accent" aria-label="Copy email address">
                    {copiedEmail ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Link href="https://github.com/atiujjwal/pAIse" target="_blank" rel="noreferrer" className="group rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary">
                <Github className="h-5 w-5 text-primary" />
                <h3 className="mt-5 font-display text-2xl font-semibold">GitHub</h3>
                <span className="mt-3 flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary">Contribute <ExternalLink className="h-3.5 w-3.5" /></span>
              </Link>
              <Link href="https://www.linkedin.com/in/atiujjwal/" target="_blank" rel="noreferrer" className="group rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary">
                <Linkedin className="h-5 w-5 text-primary" />
                <h3 className="mt-5 font-display text-2xl font-semibold">LinkedIn</h3>
                <span className="mt-3 flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary">Connect <ExternalLink className="h-3.5 w-3.5" /></span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-brand-red-s40 bg-brand-red-s80 px-4 py-10 text-brand-cream sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" aria-label="pAIse home"><BrandLockup inverse /></Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-brand-red-25">Shared expenses, handled with clarity—and a little more warmth.</p>
          </div>
          <div className="flex flex-col gap-4 text-sm text-brand-red-25 sm:flex-row sm:items-center sm:gap-6">
            <button type="button" onClick={() => setShowPrivacy(true)} className="min-h-11 text-left transition-colors hover:text-brand-lemon">Privacy Policy</button>
            <button type="button" onClick={() => setShowSecurity(true)} className="flex min-h-11 items-center gap-2 transition-colors hover:text-brand-lemon"><ShieldCheck className="h-4 w-4" /> Security Features</button>
            <span>© {new Date().getFullYear()} pAIse</span>
          </div>
        </div>
      </footer>

      <PrivacyPolicyModal open={showPrivacy} onOpenChange={setShowPrivacy} />
      <SecurityFeaturesModal open={showSecurity} onOpenChange={setShowSecurity} />
    </div>
  );
}
