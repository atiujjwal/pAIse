"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/src/lib/schemas";
import { useLogin } from "@/src/features/auth/api/auth-queries";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import { Loader2, Mail, Lock } from "lucide-react";

export function LoginForm() {
  const { mutate: login, isPending, error } = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      device:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    },
  });

  const onSubmit = (data: LoginInput) => {
    login(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-600 font-medium ml-1">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <Input
            id="email"
            placeholder="name@example.com"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={isPending}
            {...form.register("email")}
            className="pl-10 h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-sm text-red-500 font-medium ml-1">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-slate-600 font-medium ml-1">
            Password
          </Label>
          <button
            type="button"
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            tabIndex={-1}
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <Input
            id="password"
            type="password"
            disabled={isPending}
            {...form.register("password")}
            className="pl-10 h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-red-500 font-medium ml-1">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {/* API Error Display */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-sm text-red-600 font-medium">
            {(error as any).message || "Invalid credentials. Please try again."}
          </span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] hover:from-primary/90 hover:to-indigo-600/90 transition-all duration-200 font-semibold text-lg"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
