import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { ForgotPasswordForm } from "@/src/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="relative bg-card border border-border shadow-2xl shadow-primary/5 rounded-[2.5rem] p-8 md:p-10 overflow-hidden">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-6 left-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl pl-2"
        asChild
      >
        <Link href="/auth/login" aria-label="Back to login">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Link>
      </Button>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[350px] mx-auto pt-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Reset Password
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your email to receive a secure code.
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  );
}
