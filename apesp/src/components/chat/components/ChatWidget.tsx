"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, Sparkles, MessageCircle, Bot, Link } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { cn } from "@/src/lib/utils";
import { useAuthStore } from "@/src/features/auth/store";
import { api } from "@/src/lib/api";

const WIDGET_WIDTH = 380;
const WIDGET_HEIGHT = 500;
const BUTTON_SIZE = 64;
const MARGIN = 20;
const STORAGE_KEY = "chat-widget-pos-v2";

interface Message {
  role: "USER" | "ASSISTANT";
  content: string;
}

interface Coordinates {
  x: number;
  y: number;
}

export function ChatWidget() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  const [position, setPosition] = useState<Coordinates>({
    x: MARGIN,
    y: MARGIN,
  });
  const [isDragging, setIsDragging] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    startPos: Coordinates;
  } | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch {}
    } else if (typeof window !== "undefined") {
      setPosition({ x: MARGIN, y: MARGIN });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    const handleResize = () => {
      const maxX =
        window.innerWidth - (isOpen ? WIDGET_WIDTH : BUTTON_SIZE) - MARGIN;
      const maxY =
        window.innerHeight - (isOpen ? WIDGET_HEIGHT : BUTTON_SIZE) - MARGIN;
      setPosition((prev) => ({
        x: Math.min(Math.max(MARGIN, prev.x), maxX),
        y: Math.min(Math.max(MARGIN, prev.y), maxY),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;
      if (widgetRef.current && widgetRef.current.contains(event.target as Node))
        return;
      if (isDragging) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isDragging]);

  useEffect(() => {
    if (isOpen && !isHistoryLoaded) {
      if (user) {
        setIsLoading(true);
        api
          .get("/ai/chat/history")
          .then(({ data }) => {
            if (data.success) setMessages(data.data.messages || []);
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

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading, isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (
      isOpen &&
      (e.target as HTMLElement).closest("button, input, a, .no-drag")
    )
      return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPos: { ...position },
    };
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaX = dragStartRef.current.x - e.clientX;
      const deltaY = dragStartRef.current.y - e.clientY;
      const width = isOpen ? WIDGET_WIDTH : BUTTON_SIZE;
      const height = isOpen ? WIDGET_HEIGHT : BUTTON_SIZE;
      const newX = dragStartRef.current.startPos.x + deltaX;
      const newY = dragStartRef.current.startPos.y + deltaY;

      setPosition({
        x: Math.min(Math.max(MARGIN, newX), window.innerWidth - width - MARGIN),
        y: Math.min(
          Math.max(MARGIN, newY),
          window.innerHeight - height - MARGIN
        ),
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isOpen]);

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
      setMessages((prev) => [
        ...prev,
        { role: "ASSISTANT", content: "Connection failed." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={widgetRef}
      className={cn(
        "fixed z-50 flex flex-col items-end transition-shadow duration-300",
        isDragging ? "cursor-grabbing" : ""
      )}
      style={{ right: `${position.x}px`, bottom: `${position.y}px` }}
    >
      {isOpen && (
        <div
          style={{ width: WIDGET_WIDTH, height: WIDGET_HEIGHT }}
          className="bg-card rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom-right"
        >
          {/* Header */}
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "h-16 bg-foreground text-background flex items-center justify-between px-4 shadow-md z-10 select-none",
              isDragging
                ? "cursor-grabbing"
                : "cursor-grab active:cursor-grabbing"
            )}
          >
            <div className="flex items-center gap-3 pointer-events-none">
              <div className="bg-primary/20 p-2 rounded-xl backdrop-blur-sm border border-primary/30">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">
                  pAIse Assistant
                </h3>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {user ? "Personal Accountant" : "Online"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="no-drag hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30 scroll-smooth"
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
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
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
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-card border-t border-border">
            <div className="relative flex items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  user ? "Ask about expenses..." : "How can pAIse help?"
                }
                className="pr-12 py-6 rounded-full bg-muted/50 border-transparent focus-visible:ring-primary shadow-inner"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="absolute right-2 h-9 w-9 rounded-full shadow-md hover:scale-105"
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
              <p className="text-[13px] text-center text-muted-foreground mt-2">
                <Link
                  href="/auth/register"
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </Link>{" "}
                to sync data.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <Button
          onMouseDown={handleMouseDown}
          onClick={() => !isDragging && setIsOpen(true)}
          className={cn(
            "h-16 w-16 rounded-full shadow-2xl bg-primary text-primary-foreground border-2 border-background",
            "hover:scale-110 active:scale-95",
            isDragging ? "cursor-grabbing scale-105" : "cursor-grab"
          )}
        >
          <div className="relative">
            <MessageCircle className="h-8 w-8" />
            <Sparkles className="h-4 w-4 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </Button>
      )}
    </div>
  );
}
