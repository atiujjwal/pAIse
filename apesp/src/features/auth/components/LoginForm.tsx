"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "../api/auth-queries";
import { LoginInput, loginSchema } from "@/src/lib/schemas";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";


export function LoginForm({ className }: { className?: string }) {
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
    <div className={cn("grid gap-6", className)}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isPending}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isPending}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm font-medium text-destructive">
              {(error as any).message || "Invalid credentials"}
            </div>
          )}

          <Button disabled={isPending}>
            {isPending && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            Sign In
          </Button>
        </div>
      </form>
    </div>
  );
}
