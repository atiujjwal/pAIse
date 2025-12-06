"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/src/lib/schemas";
import { useLogin } from "@/src/features/auth/api/auth-queries";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import { Loader2 } from "lucide-react";

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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-600 font-medium">
          Email
        </Label>
        <Input
          id="email"
          placeholder="name@example.com"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          disabled={isPending}
          {...form.register("email")}
          // Soft Input Styling
          className="h-12 rounded-xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/50 transition-all"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-500 font-medium">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-slate-600 font-medium">
            Password
          </Label>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            tabIndex={-1}
          >
            Forgot password?
          </button>
        </div>
        <Input
          id="password"
          type="password"
          disabled={isPending}
          {...form.register("password")}
          className="h-12 rounded-xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/50 transition-all"
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-500 font-medium">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
          {(error as any).message || "Invalid credentials. Please try again."}
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
      >
        {isPending ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
