"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, Sparkles, MessageCircle, Bot } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import { api } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";
import { useAuthStore } from "@/src/features/auth/store";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";

interface Message {
  role: "USER" | "ASSISTANT";
  content: string;
}

export function ChatWidget() {
  const { user } = useAuthStore();

  // --- State ---
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  // --- Click Outside Handler ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;
      if (widgetRef.current && widgetRef.current.contains(event.target as Node))
        return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // --- Fetch Chat History ---
  useEffect(() => {
    if (isOpen && !isHistoryLoaded) {
      if (user) {
        setIsLoading(true);
        api
          .get("/ai/chat/history")
          .then(({ data }) => {
            if (data.success) {
              if (data.data?.messages.length === 0) {
                setMessages([
                  {
                    role: "ASSISTANT",
                    content: "Hi, I hope you are doing good. How can I help you?",
                  },
                ]);
              } else setMessages(data.data.messages);
            }
          })
          .catch(() =>
            setMessages([
              { role: "ASSISTANT", content: "Failed to load history." },
            ])
          )
          .finally(() => {
            setIsLoading(false);
            setIsHistoryLoaded(true);
          });
      } else {
        setMessages([
          { role: "ASSISTANT", content: "Hi! Ask me about pAIse features." },
        ]);
        setIsHistoryLoaded(true);
      }
    }
  }, [isOpen, user, isHistoryLoaded]);

  // --- Auto Scroll ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  // --- Send Handler ---
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "USER", content: userMsg }]);
    setIsLoading(true);

    try {
      const { data } = await api.post("/ai/chat", {
        message: userMsg,
        publicHistory: !user ? messages.slice(-4) : undefined,
      });
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "ASSISTANT", content: data.data.content },
        ]);
      }
    } catch (error) {
      let errorMessage = "AI chat is temporarily unavailable. Please try again later.";
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 429) {
          errorMessage =
            "You've reached the AI usage limit for today. Please try again tomorrow or refer to the FAQs.";
        }
      }
      setMessages((prev) => [
        ...prev,
        { role: "ASSISTANT", content: errorMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" ref={constraintsRef}>
      {/* --- CLOSED TRIGGER BUTTON --- */}
      {!isOpen ? (
        <motion.div
          drag
          dragConstraints={constraintsRef}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="pointer-events-auto absolute right-4 bottom-[200px]"
          onTap={() => {
            if (!isDraggingRef.current) {
              setIsOpen(true);
            }
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative group cursor-grab active:cursor-grabbing">
            {/* Tooltip Label */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 px-3 py-1.5 rounded-xl bg-foreground text-background text-xs font-bold whitespace-nowrap shadow-xl opacity-0 scale-90 translate-x-2 transition-all duration-300 origin-right group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none">
              Ask AI
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-foreground rotate-45" />
            </div>

            <Button
              className={cn(
                "h-12 w-12 rounded-full p-0 flex items-center justify-center",
                "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white",
                "ring-[3px] ring-white dark:ring-slate-900",
                "shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]"
              )}
            >
              <div className="relative flex items-center justify-center">
                <MessageCircle className="h-5 w-5 stroke-[2.5px]" />
                <span className="absolute -top-2.5 -right-2.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white dark:border-slate-900 items-center justify-center">
                    <Sparkles className="h-1.5 w-1.5 text-white" />
                  </span>
                </span>
              </div>
            </Button>
          </div>
        </motion.div>
      ) : (
        /* --- OPENED WINDOW --- */
        <div
          ref={widgetRef}
          className="pointer-events-auto absolute right-4 bottom-20 md:bottom-6 w-[calc(100vw-32px)] sm:w-[380px] h-[500px] sm:h-[550px] bg-card rounded-[2rem] shadow-2xl border border-border/60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 origin-bottom-right"
        >
          {/* Header */}
          <div className="h-16 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between px-5 shadow-md z-10 shrink-0">
            <div className="flex items-center gap-3 pointer-events-none">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">pAIse Assistant</h3>
                <span className="flex items-center gap-1.5 text-[10px] text-white/80 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  {user ? "Personal Accountant" : "Online"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-full transition-colors active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20 scroll-smooth"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex w-full animate-in fade-in slide-in-from-bottom-2",
                  msg.role === "USER" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed",
                    msg.role === "USER"
                      ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm"
                      : "bg-card text-foreground border border-border rounded-tl-sm"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in">
                <div className="bg-card px-4 py-3 rounded-2xl rounded-tl-sm border border-border shadow-sm flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card border-t border-border shrink-0">
            <div className="relative flex items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={user ? "Ask about expenses..." : "How can pAIse help?"}
                className="pr-12 py-6 rounded-full bg-muted/50 border-transparent focus-visible:ring-indigo-500 shadow-inner text-sm transition-all"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="absolute right-1.5 h-9 w-9 rounded-full shadow-md hover:scale-105 transition-transform bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 ml-0.5" />
                )}
              </Button>
            </div>
            {!user && (
              <p className="text-[11px] text-center text-muted-foreground mt-3">
                <Link href="/auth/register" className="text-primary font-bold hover:underline">
                  Sign in
                </Link>{" "}
                to sync your data with AI.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
