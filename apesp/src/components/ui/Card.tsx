"use client";
import React from "react";
import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "flat" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, variant = "default", padding = "md", children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl bg-card text-card-foreground transition-[border-color,box-shadow,background-color] duration-200 ease-out",
          variant === "default" && "border border-border shadow-sm",
          variant === "flat" && "border border-border bg-muted/30",
          variant === "elevated" &&
            "shadow-xl shadow-black/5 border border-border/50",
          padding === "sm" && "p-4",
          padding === "md" && "p-6",
          padding === "lg" && "p-8",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("flex flex-col space-y-1.5 p-6", props.className)}
    />
  );
}

export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...props}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        props.className
      )}
    />
  );
}

export function CardDescription(
  props: React.HTMLAttributes<HTMLParagraphElement>
) {
  return (
    <p
      {...props}
      className={cn("text-sm text-muted-foreground", props.className)}
    />
  );
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("p-6 pt-0", props.className)} />;
}

export function CardFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("flex items-center p-6 pt-0", props.className)}
    />
  );
}

export default Card;
