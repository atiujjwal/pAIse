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

// --- DYNAMIC SCHEMAS ---
// 1. Password Login Schema
const passwordLoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  otp: z.string().optional(), // Allowed but ignored
});

// 2. OTP Login Schema
const otpLoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().optional(), // Allowed but ignored
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

type LoginMethod = "password" | "otp";

export function LoginForm() {
  const { mutate: login, isPending: isLoginPending } = useLogin();
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();

  // State
  const [method, setMethod] = useState<LoginMethod>("password");
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  // Dynamic Resolver based on active method
  const activeSchema =
    method === "password" ? passwordLoginSchema : otpLoginSchema;

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(activeSchema),
    defaultValues: {
      email: "",
      password: "",
      otp: "",
    },
    mode: "onSubmit", // Validate on submit to prevent premature errors
  });

  const emailValue = watch("email");

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Toggle Login Method
  const toggleMethod = () => {
    const newMethod = method === "password" ? "otp" : "password";
    setMethod(newMethod);
    setOtpSent(false);
    setValue("otp", ""); // Clear OTP
    setValue("password", ""); // Clear Password
    clearErrors(); // Clear stale errors from previous mode
  };

  // Handler: Send OTP
  const handleSendOtp = async () => {
    // Manually validate email only before sending
    const isEmailValid = await trigger("email");
    if (!isEmailValid) return;

    sendOtp(
      { email: emailValue, type: "login" },
      {
        onSuccess: () => {
          setOtpSent(true);
          setTimer(60);
        },
      }
    );
  };

  // Handler: Submit Final Login
  const onSubmit = (data: any) => {
    // Construct payload based on method
    const payload =
      method === "password"
        ? { email: data.email, password: data.password }
        : { email: data.email, otp: data.otp };

    login(payload);
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* --- Email Field --- */}
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              {...register("email")}
              placeholder="name@example.com"
              className="pl-9 h-11 bg-slate-50 focus:bg-white transition-colors"
              disabled={otpSent}
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

        {/* --- Sign In Button --- */}
        {/* Render only if using password OR if OTP has been sent */}
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

      {/* --- Toggle Method Button --- */}
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
