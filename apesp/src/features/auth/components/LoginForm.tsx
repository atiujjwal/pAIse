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

const passwordLoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  otp: z.string().optional(),
});

const otpLoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().optional(),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

type LoginMethod = "password" | "otp";

export function LoginForm() {
  const { mutate: login, isPending: isLoginPending } = useLogin();
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();

  const [method, setMethod] = useState<LoginMethod>("password");
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

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
    defaultValues: { email: "", password: "", otp: "" },
    mode: "onSubmit",
  });

  const emailValue = watch("email");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const toggleMethod = () => {
    const newMethod = method === "password" ? "otp" : "password";
    setMethod(newMethod);
    setOtpSent(false);
    setValue("otp", "");
    setValue("password", "");
    clearErrors();
  };

  const handleSendOtp = async () => {
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
        {/* --- Email Field --- */}
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              {...register("email")}
              placeholder="name@example.com"
              className="pl-9"
              disabled={otpSent}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
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
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="pl-9"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
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
                className="w-full bg-foreground text-background hover:bg-foreground/90"
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
                  <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("otp")}
                    placeholder="123456"
                    className="pl-9 font-mono tracking-widest text-lg"
                    maxLength={6}
                  />
                </div>
                {errors.otp && (
                  <p className="text-xs text-destructive">
                    {errors.otp.message}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Change Email
                  </button>
                  {timer > 0 ? (
                    <span className="text-xs text-muted-foreground flex items-center">
                      <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
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
        {(method === "password" || (method === "otp" && otpSent)) && (
          <Button
            type="submit"
            disabled={isLoginPending}
            className="w-full shadow-lg shadow-primary/20"
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
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={toggleMethod}
        className="w-full border-border hover:bg-muted"
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
