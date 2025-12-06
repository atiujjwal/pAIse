"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRegister } from "@/src/features/auth/api/auth-queries";
import { RegisterInput, registerSchema } from "@/src/lib/schemas";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";

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
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to get started
        </p>
      </div>

      <form
        onSubmit={handleSubmit((data) => mutate(data))}
        className="grid gap-4"
      >
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="John Doe"
            disabled={isPending}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="name@example.com"
            disabled={isPending}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            disabled={isPending}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {error && (
          <div className="text-sm text-destructive">
            {(error as any).message || "Registration failed"}
          </div>
        )}

        <Button disabled={isPending}>
          {isPending ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link
          href="/auth/login"
          className="hover:text-brand underline underline-offset-4"
        >
          Already have an account? Login
        </Link>
      </p>
    </div>
  );
}
