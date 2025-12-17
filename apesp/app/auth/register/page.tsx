"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { Loader2, X, ArrowRight, KeyRound, RefreshCw } from "lucide-react";

import {
  useRegister,
  useSendOtp,
  useVerifyOtp,
} from "@/src/features/auth/api/auth-queries";
import { registerSchema, RegisterInput } from "@/src/lib/schemas";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/Dialog";
import { useToastStore } from "@/src/hooks/use-toast";
import { cn } from "@/src/lib/utils";

export default function RegisterPage() {
  const { mutate: registerUser, isPending: isRegistering } = useRegister();
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();
  const { mutate: verifyOtp, isPending: isVerifyingOtp } = useVerifyOtp();
  const { addToast } = useToastStore();

  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [formData, setFormData] = useState<RegisterInput | null>(null);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const onFormSubmit = (data: RegisterInput) => {
    setFormData(data);
    sendOtp(
      { email: data.email, type: "register" },
      {
        onSuccess: () => {
          setShowVerifyDialog(true);
          setTimer(60);
        },
      }
    );
  };

  const handleResendOtp = () => {
    if (!formData?.email) return;
    sendOtp(
      { email: formData.email, type: "register" },
      { onSuccess: () => setTimer(60) }
    );
  };

  const handleVerify = () => {
    if (!formData?.email || otp.length !== 6) return;
    verifyOtp(
      { email: formData.email, otp, type: "register" },
      {
        onSuccess: () => {
          setShowVerifyDialog(false);
          registerUser(formData);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || "Invalid OTP";
          addToast(msg, "error");
        },
      }
    );
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
            Create an account
          </h1>
          <p className="text-muted-foreground">
            Join pAIse and start managing expenses smarter
          </p>
        </div>

        <div className="space-y-6">
          {/* Google OAuth Button */}
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
            Sign up with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or sign up with email
              </span>
            </div>
          </div>

          {/* Email Registration Form */}
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="John Doe"
                disabled={isSendingOtp}
                className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/50"
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="name@example.com"
                disabled={isSendingOtp}
                className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/50"
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                disabled={isSendingOtp}
                className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/50"
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSendingOtp || isRegistering}
              className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
            >
              {isSendingOtp ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>

      {/* --- EMAIL VERIFICATION DIALOG --- */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">
              Verify your Email
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-foreground">
                {formData?.email}
              </span>
              . Enter it below to complete registration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            <div className="space-y-4">
              <Label className="text-xs uppercase text-muted-foreground tracking-wider font-bold text-center block">
                Verification Code
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  placeholder="123456"
                  className="pl-12 h-14 text-2xl tracking-[0.5em] font-mono text-center rounded-2xl border-2 focus:border-primary"
                  maxLength={6}
                />
              </div>
            </div>

            <Button
              onClick={handleVerify}
              disabled={isVerifyingOtp || otp.length < 6}
              className="w-full h-12 rounded-xl text-lg shadow-lg"
            >
              {isVerifyingOtp || isRegistering ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  Verify & Create Account{" "}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timer > 0 || isSendingOtp}
                className={cn(
                  "text-sm font-medium transition-colors",
                  timer > 0
                    ? "text-muted-foreground flex items-center justify-center gap-2 cursor-not-allowed"
                    : "text-primary hover:underline"
                )}
              >
                {timer > 0 ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" /> Resend code
                    in {timer}s
                  </>
                ) : (
                  "Resend Verification Code"
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
