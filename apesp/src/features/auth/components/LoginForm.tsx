"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Lock, KeyRound, RefreshCw } from "lucide-react";

import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import { useLogin, useSendOtp } from "../api/auth-queries";

// Combined Schema for both modes
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().optional(),
  otp: z.string().length(6, "OTP must be 6 digits").optional(),
});

type LoginMethod = "password" | "otp";

export function LoginForm() {
  const { mutate: login, isPending: isLoginPending } = useLogin();
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();

  // State
  const [method, setMethod] = useState<LoginMethod>("password");
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      otp: "",
    },
  });

  const emailValue = watch("email");

  // Timer Logic for Resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handler: Switch Login Method
  const toggleMethod = () => {
    setMethod(method === "password" ? "otp" : "password");
    setOtpSent(false); // Reset OTP state if switching
    setValue("otp", ""); // Clear OTP field
  };

  // Handler: Send OTP
  const handleSendOtp = async () => {
    const isValidEmail = await trigger("email"); // Validate email field only
    if (!isValidEmail) return;

    // UPDATED: Pass object with type 'login'
    sendOtp(
      { email: emailValue, type: "login" },
      {
        onSuccess: () => {
          setOtpSent(true);
          setTimer(60); // Start 60s cooldown
        },
      }
    );
  };

  // Handler: Submit Final Login
  const onSubmit = (data: any) => {
    const payload =
      method === "password"
        ? { email: data.email, password: data.password }
        : { email: data.email, otp: data.otp };

    login(payload);
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* --- Email Field (Always Visible) --- */}
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              {...register("email")}
              placeholder="name@example.com"
              className="pl-9 h-11 bg-slate-50 focus:bg-white transition-colors"
              disabled={otpSent} // Lock email after OTP is sent
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* --- Password Mode --- */}
        {method === "password" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <Label>Password</Label>
              {/* UPDATED: Link to the new Forgot Password Page */}
              <Link
                href="/auth/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="pl-9 h-11"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
        )}

        {/* --- OTP Mode --- */}
        {method === "otp" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            {!otpSent ? (
              <Button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || !emailValue}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800"
              >
                {isSendingOtp ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Send Login OTP
              </Button>
            ) : (
              <div className="space-y-2">
                <Label>One-Time Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    {...register("otp")}
                    placeholder="123456"
                    className="pl-9 h-11 font-mono tracking-widest text-lg"
                    maxLength={6}
                  />
                </div>
                {errors.otp && (
                  <p className="text-xs text-red-500">{errors.otp.message}</p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Change Email
                  </button>
                  {timer > 0 ? (
                    <span className="text-xs text-slate-400 flex items-center">
                      <RefreshCw className="mr-1 h-3 w-3 animate-spin duration-[3000ms]" />
                      Resend in {timer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Submit Button (Final Login) --- */}
        {(method === "password" || (method === "otp" && otpSent)) && (
          <Button
            type="submit"
            disabled={isLoginPending}
            className="w-full h-11 shadow-lg shadow-primary/20"
          >
            {isLoginPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>
        )}
      </form>

      {/* --- Toggle Method --- */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">Or</span>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={toggleMethod}
        className="w-full h-11 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
      >
        {method === "password" ? (
          <>
            <KeyRound className="mr-2 h-4 w-4" /> Login with OTP
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" /> Login with Password
          </>
        )}
      </Button>
    </div>
  );
}
