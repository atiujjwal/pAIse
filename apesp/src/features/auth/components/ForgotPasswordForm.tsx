"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Mail,
  KeyRound,
  Lock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import { useSendOtp, useChangePassword } from "../api/auth-queries";

// --- SCHEMAS ---

// Step 1: Email Only
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

// Step 2: OTP + New Password
const resetSchema = z
  .object({
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Step = "EMAIL" | "RESET";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [timer, setTimer] = useState(0);

  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();
  const { mutate: changePassword, isPending: isChangingPassword } =
    useChangePassword();

  // --- Step 1 Form ---
  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  // --- Step 2 Form ---
  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
  });

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handlers
  const handleSendOtp = (data: { email: string }) => {
    sendOtp(
      { email: data.email, type: "forgot_password" },
      {
        onSuccess: () => {
          setEmail(data.email);
          setStep("RESET");
          setTimer(60);
        },
      }
    );
  };

  const handleResend = () => {
    if (timer > 0) return;
    sendOtp(
      { email, type: "forgot_password" },
      {
        onSuccess: () => setTimer(60),
      }
    );
  };

  const handleReset = (data: z.infer<typeof resetSchema>) => {
    // We combine the stored email with the new form data
    changePassword({
      email,
      otp: data.otp,
      newPassword: data.newPassword,
    });
  };

  // --- RENDER ---

  if (step === "EMAIL") {
    return (
      <form
        onSubmit={emailForm.handleSubmit(handleSendOtp)}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label>Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              {...emailForm.register("email")}
              placeholder="name@example.com"
              className="pl-9 h-11"
              disabled={isSendingOtp}
            />
          </div>
          {emailForm.formState.errors.email && (
            <p className="text-xs text-red-500">
              {emailForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-slate-900 hover:bg-slate-800"
          disabled={isSendingOtp}
        >
          {isSendingOtp ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Send Reset OTP"
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-6">
      <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Sent to</p>
          <p className="text-sm font-semibold text-slate-900">{email}</p>
        </div>
        <button
          type="button"
          onClick={() => setStep("EMAIL")}
          className="text-xs text-primary font-medium hover:underline"
        >
          Change
        </button>
      </div>

      <div className="space-y-4">
        {/* OTP Input */}
        <div className="space-y-2">
          <Label>Enter OTP</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              {...resetForm.register("otp")}
              placeholder="123456"
              className="pl-9 h-11 font-mono tracking-widest text-lg"
              maxLength={6}
            />
          </div>
          {resetForm.formState.errors.otp && (
            <p className="text-xs text-red-500">
              {resetForm.formState.errors.otp.message}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleResend}
              disabled={timer > 0 || isSendingOtp}
              className={`text-xs ${
                timer > 0 ? "text-slate-400" : "text-primary hover:underline"
              }`}
            >
              {timer > 0 ? `Resend code in ${timer}s` : "Resend code"}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 my-4" />

        {/* Password Inputs */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                {...resetForm.register("newPassword")}
                type="password"
                placeholder="Min 8 chars"
                className="pl-9 h-11"
              />
            </div>
            {resetForm.formState.errors.newPassword && (
              <p className="text-xs text-red-500">
                {resetForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                {...resetForm.register("confirmPassword")}
                type="password"
                placeholder="Re-enter password"
                className="pl-9 h-11"
              />
            </div>
            {resetForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500">
                {resetForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 shadow-lg shadow-primary/20"
        disabled={isChangingPassword}
      >
        {isChangingPassword ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <span className="flex items-center">
            Set New Password <ArrowRight className="ml-2 h-4 w-4" />
          </span>
        )}
      </Button>
    </form>
  );
}
