"use client";

import { useForm, ValidationError } from "@formspree/react";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/Select";
import { Label } from "@/src/components/ui/label";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  CheckCircle2,
  Loader2,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Textarea } from "../ui/textarea";

export function FeedbackForm() {
  const formspreeId = process.env.NEXT_PUBLIC_FORMSPREE_ID!;

  const [state, handleSubmit] = useForm(`${formspreeId}`);
  const [category, setCategory] = useState("feedback");

  if (state.succeeded) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="font-display text-2xl font-semibold mb-2">Thanks for your input!</h3>
        <p className="text-muted-foreground max-w-md text-sm">
          We appreciate you taking the time to help make pAIse better. We'll
          review your message shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="font-display text-2xl font-semibold mb-2 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          Have a suggestion?
        </h3>
        <p className="text-muted-foreground text-sm">
          Found a bug or have a feature idea? Let us know directly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Name</Label>
            <Input
              id="name"
              type="text"
              name="name"
              placeholder="Your name"
              className="bg-muted/30 focus:bg-background border border-border/50 focus:border-primary/50 h-12 text-sm transition-all"
              required
            />
            <ValidationError prefix="Name" field="name" errors={state.errors} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              className="bg-muted/30 focus:bg-background border border-border/50 focus:border-primary/50 h-12 text-sm transition-all"
              required
            />
            <ValidationError
              prefix="Email"
              field="email"
              errors={state.errors}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Feedback Type</Label>
          <Select
            name="category"
            defaultValue="feedback"
            onValueChange={setCategory}
          >
            <SelectTrigger className="bg-muted/30 focus:bg-background border border-border/50 focus:border-primary/50 h-12 text-sm transition-all">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feedback">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" /> General
                  Feedback
                </div>
              </SelectItem>
              <SelectItem value="bug">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-rose-500" /> Report a Bug
                </div>
              </SelectItem>
              <SelectItem value="feature">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Feature Request
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Message</Label>
          <Textarea
            id="message"
            name="message"
            placeholder={
              category === "bug"
                ? "Describe what happened, steps to reproduce, and what you expected..."
                : "Tell us what's on your mind..."
            }
            className="min-h-[120px] bg-muted/30 focus:bg-background border border-border/50 focus:border-primary/50 text-sm transition-all resize-none"
            required
          />
          <ValidationError
            prefix="Message"
            field="message"
            errors={state.errors}
          />
        </div>

        <Button
          type="submit"
          disabled={state.submitting}
          className="h-12 w-full text-base md:h-14"
        >
          {state.submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...
            </>
          ) : (
            "Send Feedback"
          )}
        </Button>
      </form>
    </div>
  );
}
