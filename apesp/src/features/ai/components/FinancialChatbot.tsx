"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bot, Send, X, Loader2 } from "lucide-react";
import { ApiResponse } from "@/src/types/api";
import { api } from "@/src/lib/api";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";
import { Input } from "@/src/components/ui/Input";


interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: any; // Structured data (e.g., list of expenses) for rendering widgets
}

export function FinancialChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I can analyze your spending or answer questions about your budget. How can I help?",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      // [cite_start]; // Integration: POST /api/ai/query [cite: 73, 477]
      // This endpoint uses RAG to fetch financial data context
      const { data } = await api.post<
        ApiResponse<{ answer: string; data?: any }>
      >("api/ai/query", {
        prompt: text,
      });
      return data.data!;
    },
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: response.answer,
          data: response.data,
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "I'm having trouble connecting to your financial data right now. Please try again.",
        },
      ]);
    },
  });

  const handleSend = () => {
    if (!query.trim()) return;

    const userMsg = query;
    setQuery("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: userMsg },
    ]);
    mutation.mutate(userMsg);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-40"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>

      {/* Chat Drawer/Sheet */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l bg-background shadow-2xl transition-transform duration-300 sm:w-[400px]">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Financial Assistant</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-lg p-3 text-sm",
                    msg.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-muted"
                  )}
                >
                  <p>{msg.content}</p>

                  {/* Optional Widget Rendering for Data Responses */}
                  {msg.data && msg.data.total_spent && (
                    <div className="mt-2 rounded bg-background/50 p-2 text-xs font-mono">
                      Total: {msg.data.currency} {msg.data.total_spent}
                    </div>
                  )}
                </div>
              ))}

              {mutation.isPending && (
                <div className="mr-auto flex max-w-[85%] items-center gap-2 rounded-lg bg-muted p-3 text-sm">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing finances...
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about spending, budgets..."
                  disabled={mutation.isPending}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={mutation.isPending || !query.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
