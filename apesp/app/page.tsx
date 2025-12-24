"use client";

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
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { pAIse_LOGO } from "@/src/lib/mediaUrls";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { FeedbackForm } from "@/src/components/forms/FeedbackForm";
import { useToastStore } from "@/src/hooks/use-toast";
import { PrivacyPolicyModal } from "@/src/components/legal/PrivacyPolicyModal";
import { useState } from "react";
import { cn } from "@/src/lib/utils";

// --- FEATURES DATA ---
const features = [
  {
    title: "Voice-Powered Entry",
    desc: "Just say 'I paid 500 for lunch with Bob where I paid 150 and Bob paid 350' and our AI processes the audio instantly.",
    icon: Mic,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "group-hover:border-primary/50",
  },
  {
    title: "Smart Receipt Scanning",
    desc: "Snap a photo of any bill. We extract amounts, items, and taxes automatically, saving you from manual data entry.",
    icon: Receipt,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    border: "group-hover:border-blue-500/50",
  },
  {
    title: "Flexible Splits",
    desc: "Create expenses directly with friends or within groups. We handle the complex math for who owes whom.",
    icon: Calculator,
    color: "text-violet-600",
    bg: "bg-violet-500/10",
    border: "group-hover:border-violet-500/50",
  },
  {
    title: "AI Financial Assistant",
    desc: "Chat with your data. Ask 'How much do I owe Rahul?' or 'What did I spend on food this month?' for instant answers.",
    icon: Bot,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "group-hover:border-emerald-500/50",
  },
  {
    title: "Dynamic Insights",
    desc: "Track net balances, spending trends, and category breakdowns across weekly, monthly, or yearly views.",
    icon: LayoutDashboard,
    color: "text-orange-600",
    bg: "bg-orange-500/10",
    border: "group-hover:border-orange-500/50",
  },
  {
    title: "Easy Connections",
    desc: "Add friends via email, invite links, or pAIse QR tags. Manage your network easily to start sharing expenses.",
    icon: UserPlus,
    color: "text-pink-600",
    bg: "bg-pink-500/10",
    border: "group-hover:border-pink-500/50",
  },
  {
    title: "Privacy First",
    desc: "Full control over who interacts with you. Accept/reject requests and block users if needed. Your data is yours.",
    icon: Lock,
    color: "text-rose-600",
    bg: "bg-rose-500/10",
    border: "group-hover:border-rose-500/50",
  },
  {
    title: "Manual Entry",
    desc: "Prefer the classic way? Quickly enter description, amount, date, and split details manually whenever you need.",
    icon: Smartphone,
    color: "text-indigo-600",
    bg: "bg-indigo-500/10",
    border: "group-hover:border-indigo-500/50",
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
    q: "Is it possible to create an expense manually without using AI?",
    a: "Yes. You can manually enter expense details such as description, amount, date, payers, and split information without using AI-assisted features.",
  },
  {
    q: "What can the AI chatbot help me with?",
    a: "The AI chatbot can assist with app features, expense-related information, and balance details with your friends and groups. Access to personal data is available only when you are logged in.",
  },
  {
    q: "What information is shown on the dashboard?",
    a: "The dashboard shows your net balance, expenses created by you, spending trends, category-wise spending charts, recent expense activity, and information about who owes you and whom you owe.",
  },
  {
    q: "Are there any limits on using AI features?",
    a: "Yes. During the current development phase: Non-logged-in users can make up to 5 AI interactions, and logged-in users can make up to 10 AI interactions in a day. For voice-based expense entry, and receipt scanning features users can make up to 5 AI interactions in a day.",
  },
];

export default function LandingPage() {
  const { addToast } = useToastStore();

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", `#${id}`);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("paiseapesp@gmail.com");
    addToast("Email copied to clipboard", "success");
  };

  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* --- Ambient Background --- */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[800px] w-[800px] rounded-full bg-primary/10 blur-[120px] opacity-60 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-secondary/10 blur-[100px] opacity-60 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* --- Header --- */}
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between px-6 md:px-12 border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
        <div className="flex h-20 items-center px-6">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-sm transition-transform group-hover:scale-105">
              <img
                src={pAIse_LOGO}
                alt="pAIse"
                className="h-6 w-auto object-contain"
              />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
              pAIse
            </span>
          </Link>
        </div>

        {/* --- Navigation Menu (Desktop) --- */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <Link
            href="#features"
            onClick={(e) => handleScroll(e, "features")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#faq"
            onClick={(e) => handleScroll(e, "faq")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQs
          </Link>
          <Link
            href="#contact"
            onClick={(e) => handleScroll(e, "contact")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
        </nav>

        <div className="flex gap-3">
          {/* Theme Switcher */}
          <ThemeToggle />
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
            <Link href="/auth/register">Start for Free</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* --- Hero Section --- */}
        <section className="relative px-6 pt-20 pb-24 md:pt-32 md:pb-32 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="h-3.5 w-3.5 fill-primary" />
            <span className="tracking-wide">
              AI-Powered Expense Tracking V1.0
            </span>
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

          {/* --- New Call to Action Text --- */}
          <div className="mx-auto mb-8 max-w-lg text-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <p className="text-lg font-semibold text-foreground">
              Ready to settle up?
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Join thousands of users who trust pAIse to manage their shared
              expenses effortlessly.
            </p>
          </div>

          {/* --- Action Buttons --- */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400">
            <Button
              size="lg"
              className="h-14 w-full sm:w-auto rounded-2xl px-8 text-lg shadow-xl shadow-primary/20 transition-transform hover:-translate-y-1"
              asChild
            >
              <Link href="/auth/register">
                Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-14 w-full sm:w-auto rounded-2xl px-8 text-lg border-border bg-card/50 hover:bg-card hover:text-foreground backdrop-blur-sm"
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
              className="h-14 w-full sm:w-auto rounded-2xl px-6 text-lg text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/20 transition-all"
              onClick={(e) => handleScroll(e as any, "feedback")}
            >
              <MessageSquare className="mr-2 h-5 w-5" /> Suggestion / Bug
            </Button>
          </div>
        </section>

        {/* --- Features Grid --- */}
        <section
          id="features"
          className="py-24 px-6 bg-muted/30 border-y border-border"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
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
                    className={cn(
                      "group relative flex flex-col items-start p-8 rounded-[2rem] bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden",
                      feature.border
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <div
                      className={cn(
                        "mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner",
                        feature.bg,
                        feature.color
                      )}
                    >
                      <Icon className="h-7 w-7" />
                    </div>

                    <h3 className="mb-3 text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- Help & Support (FAQ) --- */}
        <section id="faq" className="py-24 px-6 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
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
                className="group rounded-2xl border border-border bg-card p-1 shadow-sm transition-all open:shadow-md open:border-primary/20 hover:border-primary/20"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 rounded-xl p-5 font-bold text-lg marker:content-none hover:bg-muted/50 transition-colors">
                  <span className="flex items-center gap-3 text-left">
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

        {/* --- Feedback Section (Separated) --- */}
        <section
          id="feedback"
          className="py-24 px-6 bg-muted/30 border-y border-border"
        >
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                Beta Feedback
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Help us shape the future of pAIse.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We are constantly improving. Whether you've spotted a glitch or
                have a brilliant idea for a new feature, we want to hear from
                you directly. Use the form to send us your thoughts immediately.
              </p>
            </div>

            {/* Right: Form Component */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 blur-3xl -z-10 rounded-full opacity-60 transform scale-90" />
              <FeedbackForm />
            </div>
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
                className="h-14 px-8 rounded-full bg-white text-violet-600 hover:bg-slate-50 font-bold text-lg shadow-xl hover:scale-105 transition-all"
                asChild
              >
                <Link href="/auth/register">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* --- Contact Section (Separated & Last) --- */}
        <section id="contact" className="py-24 px-6 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Get in Touch
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Want to contribute, collaborate, or just say hi? Here is how you
              can reach us.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Email Card */}
            <div className="flex flex-col items-center p-8 bg-card border border-border rounded-3xl shadow-sm hover:border-primary/30 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Email Us</h3>
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                <span className="text-sm text-muted-foreground font-medium">
                  paiseapesp@gmail.com
                </span>
                <button
                  onClick={handleCopyEmail}
                  className="text-primary hover:scale-110 transition-transform"
                  title="Copy"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* GitHub Card */}
            <Link
              href="https://github.com/atiujjwal/pAIse"
              target="_blank"
              className="flex flex-col items-center p-8 bg-card border border-border rounded-3xl shadow-sm hover:border-primary/30 transition-all group hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-gray-500/10 text-foreground flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Github className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">GitHub</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                Contribute <ExternalLink className="h-3 w-3" />
              </div>
            </Link>

            {/* LinkedIn Card */}
            <Link
              href="https://www.linkedin.com/in/atiujjwal/"
              target="_blank"
              className="flex flex-col items-center p-8 bg-card border border-border rounded-3xl shadow-sm hover:border-primary/30 transition-all group hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Linkedin className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">LinkedIn</h3>
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-sm transition-transform group-hover:scale-105">
              <img
                src={pAIse_LOGO}
                alt="pAIse"
                className="h-7 w-auto object-contain"
              />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
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
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowPrivacy(true)}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>
      <PrivacyPolicyModal open={showPrivacy} onOpenChange={setShowPrivacy} />
    </div>
  );
}
