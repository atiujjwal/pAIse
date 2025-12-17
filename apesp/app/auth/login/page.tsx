"use client";

import { LoginForm } from "@/src/features/auth/components/LoginForm";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import Image from "next/image";

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

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

        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full h-12 rounded-xl font-medium border-border hover:bg-muted/50 transition-all flex items-center justify-center gap-3"
          >
            <Image
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              width={20}
              height={20}
            />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <LoginForm />
        </div>

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
