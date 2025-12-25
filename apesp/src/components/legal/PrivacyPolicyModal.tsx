"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/Dialog";
import { Button } from "@/src/components/ui/Button";
import {
  Shield,
  Lock,
  Mic,
  Image as ImageIcon,
  User,
  Share2,
  Server,
} from "lucide-react";

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyModal({
  open,
  onOpenChange,
}: PrivacyPolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 border-border bg-card shadow-2xl overflow-hidden">
        {/* --- INNER WRAPPER --- */}

        <div className="flex flex-col h-[80vh] w-full">
          <DialogHeader className="px-8 pt-8 pb-6 border-b border-border/50 bg-muted/20 shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Privacy Policy
              </DialogTitle>
            </div>
            <DialogDescription className="text-base text-muted-foreground">
              How pAIse collects, uses, and protects your data.
            </DialogDescription>
          </DialogHeader>

          {/* --- Scrollable Body --- */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-8 py-6 space-y-8 text-sm leading-relaxed text-muted-foreground">
              {/* Introduction */}
              <p>
                Your privacy is important to us. This Privacy Policy explains
                how our intelligent expense-sharing application collects, uses,
                and protects your information when you use our services.
              </p>

              {/* Section 1: Information We Collect */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  1. Information We Collect
                </h3>
                <p>
                  We collect only the information necessary to provide and
                  improve our services:
                </p>

                <div className="grid gap-4 pl-4 border-l-2 border-border ml-1">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" /> Account
                      Information
                    </h4>
                    <p>
                      When you register or log in using Google, we collect your
                      name, email address, and profile picture only after
                      receiving your explicit consent. This information is used
                      solely for account identification and app functionality.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Mic className="h-4 w-4 text-primary" /> Voice Input
                    </h4>
                    <p>
                      If you choose to use voice input to create an expense, we
                      temporarily process your voice recording only to extract
                      expense details. We do not store, retain, or reuse your
                      voice recordings after the expense is created.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" /> Image Input
                      (Bill Photos)
                    </h4>
                    <p>
                      If you upload a photo of a bill, the image is used only to
                      extract bill details such as amount and items. We do not
                      store your photos permanently once the required
                      information is extracted.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Usage */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  2. How We Use Your Information
                </h3>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Create and manage your account</li>
                  <li>Enable expense creation and sharing</li>
                  <li>Extract expense details from voice or bill images</li>
                  <li>Allow you to connect with friends and split expenses</li>
                  <li>Improve app functionality and user experience</li>
                </ul>
              </div>

              {/* Section 3: Sharing */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  3. Data Sharing and Disclosure
                </h3>
                <div className="bg-muted/40 p-4 rounded-xl space-y-3">
                  <div className="flex gap-3 items-start">
                    <Lock className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    <p>
                      We <strong>do not</strong> sell, rent, or share your email
                      address or personal information with any third-party
                      agencies or advertisers.
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Share2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <p>
                      Sharing your email or inviting other users to connect is
                      entirely your choice. Users may connect with others on the
                      app only when they explicitly choose to invite or share
                      details for expense splitting.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  4. Data Security
                </h3>
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-primary" />
                  <p>
                    We implement appropriate technical and organizational
                    measures to protect your data against unauthorized access,
                    loss, or misuse.
                  </p>
                </div>
              </div>
              <div className="h-4" />
            </div>
          </div>

          {/* --- Footer --- */}
          <div className="p-6 border-t border-border bg-background shrink-0">
            <Button
              className="w-full h-12 rounded-xl text-base font-medium"
              onClick={() => onOpenChange(false)}
            >
              Understood
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
