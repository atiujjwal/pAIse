"use client";

import Link from "next/link";
import {
  ArrowRight,
  Mic,
  Calculator,
  Smartphone,
  HelpCircle,
  Mail,
  Github,
  Linkedin,
  MessageSquare,
  Copy,
  Receipt,
  Bot,
  LayoutDashboard,
  UserPlus,
  Lock,
  ChevronDown,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { pAIse_LOGO } from "@/src/lib/mediaUrls";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { FeedbackForm } from "@/src/components/forms/FeedbackForm";
import { useToastStore } from "@/src/hooks/use-toast";
import { PrivacyPolicyModal } from "@/src/components/legal/PrivacyPolicyModal";
import { SecurityFeaturesModal } from "@/src/components/legal/SecurityFeaturesModal";
import { useState } from "react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- FEATURES DATA ---
const features = [
  {
    title: "Voice-Powered Entry",
    desc: "Just say 'I paid 500 for lunch with Bob' and our AI processes the audio instantly.",
    icon: Mic,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    title: "Smart Receipt Scanning",
    desc: "Snap a photo of any bill. We extract amounts, items, and taxes automatically.",
    icon: Receipt,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    title: "Flexible Splits",
    desc: "Handle complex math: Equal, Exact, Percentage, or Shares based splitting.",
    icon: Calculator,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-500/10",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  {
    title: "AI Financial Assistant",
    desc: "Chat with your data. Ask 'How much do I owe Rahul?' for instant answers.",
    icon: Bot,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    title: "Dynamic Insights",
    desc: "Track net balances and spending trends across weekly, monthly, or yearly views.",
    icon: LayoutDashboard,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    gradient: "from-orange-500/20 to-amber-500/20",
  },
  {
    title: "Easy Connections",
    desc: "Add friends via email, invite links, or unique pAIse QR tags.",
    icon: UserPlus,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    gradient: "from-indigo-500/20 to-blue-500/20",
  },
  {
    title: "Privacy First",
    desc: "Full control over your data. Block users, manage requests, and stay secure.",
    icon: Lock,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    gradient: "from-rose-500/20 to-red-500/20",
  },
  {
    title: "Manual Entry",
    desc: "Prefer the classic way? Quickly enter description, amount, and dates manually.",
    icon: Smartphone,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    gradient: "from-cyan-500/20 to-sky-500/20",
  },
];

// --- FAQ DATA ---
const faqs = [
  {
    q: "How can I add friends on the app?",
    a: "You can add friends by sending a friend request using their email, sharing an invite link, or asking them to scan your pAIse tag QR code.",
  },
  {
    q: "Who can create shared expenses with me?",
    a: "Only users who are added as your friends can create shared expenses with you on the app.",
  },
  {
    q: "What types of expenses can I create?",
    a: "You can create two types of expenses: Friend-based expenses (shared directly with a specific friend) and Group-based expenses (shared among members of a group you create or is part of).",
  },
  {
    q: "What is the difference between a friend expense and a group expense?",
    a: "A friend expense is created between you and one selected friend. A group expense is created with all members of a selected group.",
  },
  {
    q: "How does voice-based expense creation work?",
    a: "You can record your expense details using voice input. The app uses AI to extract relevant information and creates a draft expense. You can review, edit, submit the expense, or re-record if needed.",
  },
  {
    q: "Can I create an expense by scanning a receipt?",
    a: "Yes. You can scan a bill, and AI will attempt to extract relevant details such as the amount and description to create a draft expense for your review.",
  },
  {
    q: "What can the AI chatbot help me with?",
    a: "The AI chatbot can assist with app features, expense-related information, and balance details with your friends and groups. Access to personal data is available only when you are logged in.",
  },
  {
    q: "Are there any limits on using AI features?",
    a: "Yes. During the current development phase: Non-logged-in users can make up to 5 AI interactions, and logged-in users can make up to 10 AI interactions in a day. For voice-based expense entry, and receipt scanning features users can make up to 5 AI interactions in a day.",
  },
];

export default function LandingPage() {
  const { addToast } = useToastStore();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${id}`);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("paiseapesp@gmail.com");
    setCopiedEmail(true);
    addToast("Email copied to clipboard", "success");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary font-sans transition-colors duration-300">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] animate-pulse delay-700 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px] opacity-50" />
      </div>

      {/* --- Header --- */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-3 group"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5 group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                  <img
                    src={pAIse_LOGO}
                    alt="pAIse"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                pAIse
              </span>
            </Link>
          </div>

          {/* --- Navigation Menu --- */}
          <nav className="hidden md:flex items-center gap-8">
            {["Home", "Features", "FAQ", "Contact"].map((item) => (
              <Link
                key={item}
                href={item === "Home" ? "#" : `#${item.toLowerCase()}`}
                onClick={(e) =>
                  item === "Home"
                    ? window.scrollTo({ top: 0, behavior: "smooth" })
                    : handleScroll(e, item.toLowerCase())
                }
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground hover:bg-muted hidden md:flex rounded-xl"
              asChild
            >
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all border-none hidden md:flex"
              asChild
            >
              <Link href="/auth/register">Start for Free</Link>
            </Button>

            {/* Hamburger Trigger for Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center p-2 rounded-xl border border-border/50 bg-card/30 hover:bg-card text-muted-foreground hover:text-foreground transition-all h-11 w-11 touch-manipulation"
              aria-label="Toggle menu"
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 top-20 z-40 md:hidden bg-background/95 backdrop-blur-xl border-b border-border shadow-2xl p-6 flex flex-col gap-6"
            >
              <nav className="flex flex-col gap-4">
                {["Home", "Features", "FAQ", "Contact"].map((item) => (
                  <Link
                    key={item}
                    href={item === "Home" ? "#" : `#${item.toLowerCase()}`}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      item === "Home"
                        ? window.scrollTo({ top: 0, behavior: "smooth" })
                        : handleScroll(e, item.toLowerCase());
                    }}
                    className="text-lg font-semibold text-muted-foreground hover:text-foreground py-2 transition-colors border-b border-border/40 touch-manipulation"
                    style={{ minHeight: "44px" }}
                  >
                    {item}
                  </Link>
                ))}
              </nav>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl text-base font-bold bg-card touch-manipulation"
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-base font-bold border-none touch-manipulation"
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/auth/register">Start for Free</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        {/* --- Hero Section --- */}
        <section className="relative px-6 pt-20 pb-24 md:pt-32 md:pb-32 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary tracking-wide">
              AI-Powered Expense Tracking V1.0
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 text-balance">
            Split bills, <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
              not friendships.
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Stop arguing over math. Scan receipts, use voice commands, and let
            our AI handle the complex splitting logic instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400">
            <Button
              size="lg"
              className="h-14 w-full sm:w-auto px-8 text-lg font-semibold bg-gradient-to-r from-primary to-secondary text-white rounded-2xl shadow-xl hover:shadow-primary/20 transition-transform hover:-translate-y-1 border-none"
              asChild
            >
              <Link href="/auth/register">
                Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-14 w-full sm:w-auto px-8 text-lg font-semibold bg-card/50 border-border text-foreground hover:bg-muted hover:text-foreground rounded-2xl backdrop-blur-sm"
              asChild
            >
              <Link
                href="#features"
                onClick={(e) => handleScroll(e, "features")}
              >
                Learn More
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-14 w-full sm:w-auto px-6 text-lg text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl"
              onClick={(e) => handleScroll(e as any, "feedback")}
            >
              <MessageSquare className="mr-2 h-5 w-5" /> Suggestion / Bug
            </Button>
          </div>
        </section>

        {/* --- Features Grid --- */}
        <section
          id="features"
          className="py-24 px-6 border-t border-border bg-muted/20"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-foreground text-balance">
                Everything you need to settle up
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Built for friends, groups, and roommates. pAIse handles the
                chaos of shared finances so you don't have to.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={i}
                    className="group relative flex flex-col items-start p-8 rounded-[2rem] bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden"
                  >
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 rounded-[2rem] transition-all duration-500 pointer-events-none",
                        feature.gradient
                      )}
                    />
                    <div className="relative z-10">
                      <div
                        className={cn(
                          "mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner",
                          feature.bg
                        )}
                      >
                        <Icon className={cn("h-7 w-7", feature.color)} />
                      </div>

                      <h3 className="mb-3 text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>

                      <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- Help & Support (FAQ) --- */}
        <section
          id="faq"
          className="py-24 px-6 max-w-4xl mx-auto border-t border-border"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-foreground text-balance">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-border bg-card p-1 shadow-sm transition-all open:ring-1 open:ring-primary/20 hover:border-primary/30"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 rounded-xl p-5 font-bold text-lg marker:content-none transition-colors hover:bg-muted/50">
                  <span className="flex items-center gap-3 text-left text-foreground">
                    <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    {faq.q}
                  </span>
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0" />
                </summary>
                <div className="px-6 pb-6 pt-2 text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="ml-8 border-l-2 border-border pl-4 text-sm md:text-base">
                    {faq.a}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* --- Feedback Section --- */}
        <section
          id="feedback"
          className="py-24 px-6 border-t border-border bg-muted/20"
        >
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                Beta Feedback
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground text-balance">
                Help us shape the future of pAIse.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We are constantly improving. Whether you've spotted a glitch or
                have a brilliant idea for a new feature, we want to hear from
                you directly. Use the form to send us your thoughts immediately.
              </p>
            </div>

            {/* Right: Form Component */}
            <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-tr from-primary/20 to-secondary/20 shadow-2xl">
              <div className="p-6 rounded-[2.3rem] bg-card border border-border/50 backdrop-blur-xl">
                <FeedbackForm />
              </div>
            </div>
          </div>
        </section>

        {/* --- CTA Section --- */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-primary to-secondary p-1 shadow-2xl shadow-primary/20">
            <div className="relative rounded-[22px] bg-background/95 px-6 py-16 md:px-12 text-center text-foreground overflow-hidden dark:bg-slate-950">
              {/* Abstract Shapes */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-balance">
                  Ready to settle up?
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Join thousands of users who trust pAIse to manage their shared
                  expenses effortlessly.
                </p>
                <Button
                  size="lg"
                  className="h-14 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold text-lg shadow-xl hover:scale-105 transition-all border-none"
                  asChild
                >
                  <Link href="/auth/register">Create Free Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* --- Contact Section --- */}
        <section
          id="contact"
          className="py-24 px-6 max-w-5xl mx-auto border-t border-border"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-foreground text-balance">
              Get in Touch
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Want to contribute, collaborate, or just say hi? Here is how you
              can reach us.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Email Card */}
            <div className="flex flex-col items-center p-6 sm:p-8 bg-card border border-border rounded-3xl shadow-sm hover:border-primary/50 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                Email Us
              </h3>
              <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full border border-border max-w-full overflow-hidden">
                <span className="text-sm text-muted-foreground font-medium truncate">
                  paiseapesp@gmail.com
                </span>
                <button
                  onClick={handleCopyEmail}
                  className="text-primary hover:scale-110 transition-transform shrink-0"
                  title="Copy"
                >
                  {copiedEmail ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* GitHub Card */}
            <Link
              href="https://github.com/atiujjwal/pAIse"
              target="_blank"
              className="flex flex-col items-center p-6 sm:p-8 bg-card border border-border rounded-3xl shadow-sm hover:border-primary/50 transition-all group hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Github className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">GitHub</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                Contribute <ExternalLink className="h-3 w-3" />
              </div>
            </Link>

            {/* LinkedIn Card */}
            <Link
              href="https://www.linkedin.com/in/atiujjwal/"
              target="_blank"
              className="flex flex-col items-center p-6 sm:p-8 bg-card border border-border rounded-3xl shadow-sm hover:border-primary/50 transition-all group hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Linkedin className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                LinkedIn
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                Connect <ExternalLink className="h-3 w-3" />
              </div>
            </Link>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-border bg-card py-12 px-6">
        <div className="max-w-6xl mx-auto mb-12 flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-3 group mb-4">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                <img
                  src={pAIse_LOGO}
                  alt="pAIse"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
              pAIse
            </span>
          </Link>
          <p className="text-muted-foreground max-w-md leading-relaxed text-lg">
            The smartest way to split bills and track shared expenses with
            friends, roommates, and family.
          </p>
        </div>

        <div className="max-w-6xl mx-auto pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2025 pAIse. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={() => setShowPrivacy(true)}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setShowSecurity(true)}
              className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" /> Security Features
            </button>
          </div>
        </div>
      </footer>
      <PrivacyPolicyModal open={showPrivacy} onOpenChange={setShowPrivacy} />
      <SecurityFeaturesModal
        open={showSecurity}
        onOpenChange={setShowSecurity}
      />
    </div>
  );
}
