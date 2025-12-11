"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Loader2, X, ArrowRight, KeyRound, Mail } from "lucide-react";

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

export default function RegisterPage() {
  // Hooks
  const { mutate: registerUser, isPending: isRegistering } = useRegister();
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();
  const { mutate: verifyOtp, isPending: isVerifyingOtp } = useVerifyOtp();
  const { addToast } = useToastStore();

  // Local State
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

  // Timer for Resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Step 1: Intercept Submit -> Send OTP
  const onFormSubmit = (data: RegisterInput) => {
    setFormData(data); // Save form data for later

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

  // Step 2: Resend OTP
  const handleResendOtp = () => {
    if (!formData?.email) return;

    sendOtp(
      { email: formData.email, type: "register" },
      {
        onSuccess: () => setTimer(60),
      }
    );
  };

  // Step 3: Verify OTP -> Final Register
  const handleVerify = () => {
    if (!formData?.email || otp.length !== 6) return;

    verifyOtp(
      { email: formData.email, otp, type: "register" },
      {
        onSuccess: () => {
          // Close dialog and create user
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
    <>
      {/* Close Button */}
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
            Create an account
          </h1>
          <p className="text-muted-foreground">
            Join pAIse and start managing expenses smarter
          </p>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="John Doe"
              disabled={isSendingOtp}
              className="h-12 rounded-xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
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
              className="h-12 rounded-xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              disabled={isSendingOtp}
              className="h-12 rounded-xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSendingOtp || isRegistering}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
          >
            {isSendingOtp ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>

      {/* --- EMAIL VERIFICATION DIALOG --- */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Verify your Email
            </DialogTitle>
            <DialogDescription className="text-center">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-slate-900">
                {formData?.email}
              </span>
              . Enter it below to complete registration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-slate-500 tracking-wider">
                Verification Code
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  placeholder="123456"
                  className="pl-10 h-12 text-lg tracking-widest font-mono text-center"
                  maxLength={6}
                />
              </div>
            </div>

            <Button
              onClick={handleVerify}
              disabled={isVerifyingOtp || otp.length < 6}
              className="w-full h-11"
            >
              {isVerifyingOtp || isRegistering ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  Verify & Create Account{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timer > 0 || isSendingOtp}
                className={`text-xs font-medium ${
                  timer > 0 ? "text-slate-400" : "text-primary hover:underline"
                }`}
              >
                {timer > 0
                  ? `Resend code in ${timer}s`
                  : "Resend Verification Code"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
