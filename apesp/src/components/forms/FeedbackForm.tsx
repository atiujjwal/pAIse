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
  const FORMSPREE_ID = process.env.FORMSPREE_ID!;

  const [state, handleSubmit] = useForm(`${FORMSPREE_ID}`);
  const [category, setCategory] = useState("feedback");

  if (state.succeeded) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-3xl shadow-sm animate-in fade-in duration-500">
        <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Thanks for your input!</h3>
        <p className="text-muted-foreground max-w-md">
          We appreciate you taking the time to help make pAIse better. We'll
          review your message shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          Have a suggestion?
        </h3>
        <p className="text-muted-foreground">
          Found a bug or have a feature idea? Let us know directly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              name="name"
              placeholder="Your name"
              className="bg-background"
              required
            />
            <ValidationError prefix="Name" field="name" errors={state.errors} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              className="bg-background"
              required
            />
            <ValidationError
              prefix="Email"
              field="email"
              errors={state.errors}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Feedback Type</Label>
          <Select
            name="category"
            defaultValue="feedback"
            onValueChange={setCategory}
          >
            <SelectTrigger className="bg-background">
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
                  <Zap className="h-4 w-4 text-violet-500" /> Feature Request
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            placeholder={
              category === "bug"
                ? "Describe what happened, steps to reproduce, and what you expected..."
                : "Tell us what's on your mind..."
            }
            className="min-h-[120px] bg-background resize-none"
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
          className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20"
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
