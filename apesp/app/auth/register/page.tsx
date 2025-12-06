"use client";

import { useRegister } from "@/src/features/auth/api/auth-queries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/src/lib/schemas";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const { mutate, isPending, error } = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Create an account
        </h1>
        <p className="text-muted-foreground">
          Join pAIse and start managing expenses smarter
        </p>
      </div>

      <form
        onSubmit={handleSubmit((data) => mutate(data))}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="John Doe"
            disabled={isPending}
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
            disabled={isPending}
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
            disabled={isPending}
            className="h-12 rounded-xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/50 transition-all"
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {(error as any).message || "Registration failed. Please try again."}
          </div>
        )}

        <Button
          disabled={isPending}
          className="h-12 w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
        >
          {isPending ? (
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
  );
}
