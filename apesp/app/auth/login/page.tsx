import { LoginForm } from "@/src/features/auth/components/LoginForm";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

export default function LoginPage() {
  return (
    <>
      {/* Close Button - Matches the "Soft" UI aesthetic */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors rounded-xl"
        asChild
      >
        <Link href="/" aria-label="Go back to home">
          <X className="h-6 w-6" />
        </Link>
      </Button>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </div>

        <LoginForm />

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    </>
  );
}
