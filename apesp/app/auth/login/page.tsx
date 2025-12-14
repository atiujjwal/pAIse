import { LoginForm } from "@/src/features/auth/components/LoginForm";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

export default function LoginPage() {
  return (
    <div className="relative bg-card border border-border shadow-2xl shadow-primary/5 rounded-[2.5rem] p-8 md:p-10 overflow-hidden">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 right-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
        asChild
      >
        <Link href="/" aria-label="Go back to home">
          <X className="h-5 w-5" />
        </Link>
      </Button>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
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
            className="font-semibold text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
