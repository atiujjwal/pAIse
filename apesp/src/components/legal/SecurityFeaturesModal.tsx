"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/Dialog";
import { Button } from "@/src/components/ui/Button";
import {
  ShieldCheck,
  Lock,
  Server,
  KeyRound,
  Code2,
  Bot,
  Database,
  GlobeLock,
  FileBadge,
} from "lucide-react";

interface SecurityFeaturesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecurityFeaturesModal({
  open,
  onOpenChange,
}: SecurityFeaturesModalProps) {
  // Helper for consistent section headers
  const SectionHeader = ({
    icon: Icon,
    title,
  }: {
    icon: any;
    title: string;
  }) => (
    <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mt-6 mb-3">
      <div className="p-1.5 bg-primary/10 rounded-md text-primary inline-flex">
        <Icon className="h-4 w-4" />
      </div>
      {title}
    </h3>
  );

  // Helper for inline code styling
  const Code = ({ children }: { children: React.ReactNode }) => (
    <code className="bg-muted/50 px-1.5 py-0.5 rounded text-[0.9em] font-mono text-foreground">
      {children}
    </code>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 border-border bg-card shadow-2xl overflow-hidden">
        {/* --- INNER WRAPPER for scroll handling --- */}
        <div className="flex flex-col h-[85vh] w-full">
          {/* --- Header (Fixed) --- */}
          <DialogHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-border/50 bg-muted/20 shrink-0 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  Security Implementation
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Technical documentation for pAIse application.
                </p>
              </div>
            </div>
            {/* Document Metadata */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 text-xs text-muted-foreground/80 font-mono border-t border-border/40 mt-2">
              <span>
                <span className="font-semibold">Version:</span> 1.0
              </span>
              <span>
                <span className="font-semibold">Date:</span> 2025/12/25
              </span>
              <span>
                <span className="font-semibold">Author:</span> Ujjwal Kashyap
              </span>
            </div>
          </DialogHeader>

          {/* --- Scrollable Body --- */}
          <div className="flex-1 overflow-y-auto font-sans">
            <div className="px-5 sm:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 text-sm leading-relaxed text-muted-foreground">
              {/* 1. Executive Summary */}
              <div>
                <SectionHeader icon={FileBadge} title="1. Executive Summary" />
                <p>
                  This document details the security architecture implemented
                  for the &quot;pAIse&quot; application. Given the sensitive
                  nature of financial data, a &quot;Defense-in-Depth&quot;
                  strategy has been adopted. The implementation prioritizes
                  stateless mechanisms compatible with the Vercel serverless
                  environment, focusing on strict HTTP compliance, rate
                  limiting, and input sanitization.
                </p>
              </div>

              {/* 2. Overview */}
              <div>
                <SectionHeader
                  icon={ShieldCheck}
                  title="2. Security Layers Overview"
                />
                <ul className="grid sm:grid-cols-2 gap-3 pl-2">
                  <li className="flex items-center gap-2">
                    <GlobeLock className="h-4 w-4 text-blue-500" />
                    <span>
                      <strong className="text-foreground">
                        Network Layer:
                      </strong>{" "}
                      Headers & Rate Limiting.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-emerald-500" />
                    <span>
                      <strong className="text-foreground">Auth Layer:</strong>{" "}
                      Strict Cookie Management.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-primary" />
                    <span>
                      <strong className="text-foreground">
                        App Logic Layer:
                      </strong>{" "}
                      Validation & Authorization.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-orange-500" />
                    <span>
                      <strong className="text-foreground">AI Layer:</strong>{" "}
                      Prompt Injection Defense.
                    </span>
                  </li>
                </ul>
              </div>

              <hr className="border-border/40 my-6" />

              {/* 3. Detailed Implementation */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">
                  3. Detailed Implementation
                </h2>

                {/* 3.1 Network & Transport */}
                <div className="mb-8">
                  <h4 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
                    <GlobeLock className="h-5 w-5 text-primary" /> 3.1. Network
                    & Transport Security
                  </h4>
                  <p className="mb-4">
                    <strong>Objective:</strong> Mitigate common web
                    vulnerabilities (XSS, Clickjacking) and DoS attacks at the
                    edge.
                  </p>

                  <div className="space-y-4 pl-4 border-l-2 border-border/60 ml-1">
                    <div>
                      <h5 className="font-semibold text-foreground mb-1">
                        A. Secure HTTP Headers (next.config.ts)
                      </h5>
                      <ul className="space-y-2 list-disc list-inside">
                        <li>
                          <strong className="text-foreground">HSTS:</strong>{" "}
                          Enforces HTTPS for 2 years, including subdomains and
                          preload, to mitigate MitM attacks.
                        </li>
                        <li>
                          <strong className="text-foreground">
                            X-Frame-Options: DENY:
                          </strong>{" "}
                          Prevents clickjacking by disallowing iframe embedding.
                        </li>
                        <li>
                          <strong className="text-foreground">
                            X-Content-Type-Options: nosniff:
                          </strong>{" "}
                          Prevents MIME sniffing attacks.
                        </li>
                        <li>
                          <strong className="text-foreground">
                            Content Security Policy (CSP):
                          </strong>{" "}
                          Strict policy restricting resource loading to{" "}
                          <Code>'self'</Code> and explicitly whitelisted domains
                          like Pexels for images.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-foreground mb-1">
                        B. Edge Rate Limiting (middleware.ts)
                      </h5>
                      <p className="mb-2">
                        Implemented using <Code>@upstash/ratelimit</Code> backed
                        by Redis (Vercel KV) for stateless, low-latency
                        protection.
                      </p>
                      <div className="bg-muted/30 p-3 rounded-lg text-xs font-mono grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-semibold text-foreground">
                            Auth Routes:
                          </span>{" "}
                          5 req / 60s (Brute-force protection)
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">
                            General API (POST):
                          </span>{" "}
                          5 req / 10s (Spam prevention)
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">
                            AI Chat (Private):
                          </span>{" "}
                          10 req / 24h
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">
                            AI Voice/Scan:
                          </span>{" "}
                          5 req / 24h
                        </div>
                      </div>
                      <p className="mt-2 text-xs">
                        Blocked requests receive a{" "}
                        <Code>429 Too Many Requests</Code> status with standard
                        retry headers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3.2 Authentication */}
                <div className="mb-8">
                  <h4 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
                    <KeyRound className="h-5 w-5 text-primary" /> 3.2.
                    Authentication & Session Management
                  </h4>
                  <p className="mb-4">
                    <strong>Objective:</strong> Secure sessions against XSS and
                    CSRF attacks.
                  </p>
                  <div className="pl-4 border-l-2 border-border/60 ml-1 space-y-3">
                    <p>
                      <strong className="text-foreground">JWT Storage:</strong>{" "}
                      JSON Web Tokens are strictly stored in{" "}
                      <Code>HTTP-only</Code> Cookies, making them inaccessible
                      to client-side JavaScript and preventing XSS token theft.
                    </p>
                    <div>
                      <strong className="text-foreground">
                        Cookie Attributes:
                      </strong>
                      <ul className="list-disc list-inside pl-2 mt-1">
                        <li>
                          <Code>Secure</Code>: Sent only over encrypted HTTPS.
                        </li>
                        <li>
                          <Code>SameSite=Strict</Code>: Prevents CSRF by
                          restricting cross-site transmission.
                        </li>
                      </ul>
                    </div>
                    <p>
                      <strong className="text-foreground">Verification:</strong>{" "}
                      Dual-layer check via Edge Middleware for token presence
                      and a Higher-Order Component (<Code>withAuth</Code>) for
                      cryptographic verification before route execution.
                    </p>
                  </div>
                </div>

                {/* 3.3 Application Logic */}
                <div className="mb-8">
                  <h4 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
                    <Code2 className="h-5 w-5 text-primary" /> 3.3. Application
                    Logic Security
                  </h4>
                  <p className="mb-4">
                    <strong>Objective:</strong> Ensure data integrity and
                    prevent unauthorized access.
                  </p>
                  <div className="pl-4 border-l-2 border-border/60 ml-1 space-y-3">
                    <p>
                      <strong className="text-foreground">
                        Input Validation (Zod):
                      </strong>{" "}
                      All API endpoints use strict Zod schemas. Extra fields are
                      stripped, and data types (e.g., positive numbers for
                      amounts, CUID formats) are enforced at runtime.
                    </p>
                    <p>
                      <strong className="text-foreground">
                        Route Protection Wrapper:
                      </strong>{" "}
                      A centralized <Code>withAuth</Code> HOC wraps API
                      handlers. It guarantees authentication and securely passes
                      the decoded user payload to the handler context,
                      preventing accidental public endpoints.
                    </p>
                  </div>
                </div>

                {/* 3.4 AI Security */}
                <div className="mb-8">
                  <h4 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
                    <Bot className="h-5 w-5 text-primary" /> 3.4. AI Security
                  </h4>
                  <p className="mb-4">
                    <strong>Objective:</strong> Prevent Prompt Injection and
                    unauthorized data access.
                  </p>
                  <div className="pl-4 border-l-2 border-border/60 ml-1 space-y-3">
                    <p>
                      <strong className="text-foreground">
                        Input Sanitization:
                      </strong>{" "}
                      User inputs are passed through an{" "}
                      <Code>AiSecurityService</Code> to remove potential control
                      characters before processing.
                    </p>
                    <div>
                      <strong className="text-foreground">
                        Contextual Isolation ("Sandwich Defense"):
                      </strong>
                      <ul className="list-disc list-inside pl-2 mt-1 space-y-1">
                        <li>
                          <strong>System Prompt:</strong> The AI is initialized
                          with strict constraints ("FORBIDDEN from revealing
                          system prompts").
                        </li>
                        <li>
                          <strong>Knowledge Base:</strong> Provided as the sole
                          source of truth.
                        </li>
                        <li>
                          <strong>Guardrails:</strong> Explicit instructions to
                          refuse requests for personal data if unauthenticated.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-border/40 my-6" />

              {/* 4. Infrastructure */}
              <div>
                <SectionHeader
                  icon={Database}
                  title="4. Infrastructure & Database"
                />
                <div className="pl-4 border-l-2 border-border/60 ml-1 space-y-3">
                  <p>
                    <strong className="text-foreground">Prisma ORM:</strong>{" "}
                    Utilized to prevent SQL Injection attacks through
                    parameterized queries.
                  </p>
                  <p>
                    <strong className="text-foreground">Soft Deletes:</strong>{" "}
                    Data integrity is preserved using <Code>is_deleted</Code>{" "}
                    flags instead of permanent deletion, allowing recovery from
                    accidental actions.
                  </p>
                  <p>
                    <strong className="text-foreground">Secure IDs:</strong>{" "}
                    Usage of CUIDs (Collision Resistant Unique Identifiers)
                    prevents enumeration attacks inherent with sequential
                    integer IDs.
                  </p>
                </div>
              </div>

              {/* Extra space at bottom */}
              <div className="h-8" />
            </div>
          </div>

          {/* --- Footer (Fixed) --- */}
          <div className="p-5 sm:p-6 border-t border-border bg-background shrink-0">
            <Button
              className="w-full h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/10"
              onClick={() => onOpenChange(false)}
            >
              Close Documentation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
