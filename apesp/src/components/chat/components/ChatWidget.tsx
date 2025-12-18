"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Loader2, Sparkles, MessageCircle, Bot } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { cn } from "@/src/lib/utils";
import { useAuthStore } from "@/src/features/auth/store";
import { api } from "@/src/lib/api";
import Link from "next/link";

const WIDGET_WIDTH = 380;
const WIDGET_HEIGHT = 550;
const BUTTON_SIZE = 64;
const MARGIN = 24;
const STORAGE_KEY = "chat-widget-pos-v3";

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

  // --- State ---
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  // Position & Drag State
  const [position, setPosition] = useState<Coordinates>({
    x: MARGIN,
    y: MARGIN,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // New hover state for tooltip

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    startPos: Coordinates;
  } | null>(null);

  // --- BOUNDARY LOGIC ---
  const clampPosition = useCallback(
    (pos: Coordinates, isWidgetOpen: boolean): Coordinates => {
      if (typeof window === "undefined") return pos;

      const currentWidth = isWidgetOpen ? WIDGET_WIDTH : BUTTON_SIZE;
      const currentHeight = isWidgetOpen ? WIDGET_HEIGHT : BUTTON_SIZE;

      const maxRight = window.innerWidth - currentWidth - MARGIN;
      const maxBottom = window.innerHeight - currentHeight - MARGIN;

      return {
        x: Math.min(Math.max(MARGIN, pos.x), maxRight),
        y: Math.min(Math.max(MARGIN, pos.y), maxBottom),
      };
    },
    []
  );

  // --- LIFECYCLE EFFECTS ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPosition(clampPosition(parsed, false));
      } catch {
        setPosition({ x: MARGIN, y: MARGIN });
      }
    }
  }, [clampPosition]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev, isOpen));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, clampPosition]);

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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  // --- DRAG HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (
      isOpen &&
      (e.target as HTMLElement).closest("button, input, a, .no-drag")
    )
      return;

    setIsDragging(true);
    setHasMoved(false);

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

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        setHasMoved(true);
      }

      const rawX = dragStartRef.current.startPos.x + deltaX;
      const rawY = dragStartRef.current.startPos.y + deltaY;

      setPosition(clampPosition({ x: rawX, y: rawY }, isOpen));
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
  }, [isDragging, isOpen, clampPosition]);

  // --- ACTION HANDLERS ---
  const toggleWidget = () => {
    if (!hasMoved) {
      setIsOpen((prev) => {
        const nextState = !prev;
        if (nextState) {
          setPosition((curr) => clampPosition(curr, true));
        }
        return nextState;
      });
    }
  };

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
        { role: "ASSISTANT", content: "Connection failed. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={widgetRef}
      className={cn(
        "fixed z-[100] flex flex-col items-end transition-all duration-75 ease-out",
        isDragging ? "cursor-grabbing select-none" : ""
      )}
      style={{ right: `${position.x}px`, bottom: `${position.y}px` }}
    >
      {/* --- OPEN WINDOW --- */}
      {isOpen && (
        <div
          style={{ width: WIDGET_WIDTH, height: WIDGET_HEIGHT }}
          className="bg-card rounded-[2rem] shadow-2xl border border-border/60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 origin-bottom-right"
        >
          {/* Header */}
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "h-16 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between px-5 shadow-md z-10 shrink-0",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
          >
            <div className="flex items-center gap-3 pointer-events-none">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">
                  pAIse Assistant
                </h3>
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
              className="no-drag hover:bg-white/20 p-2 rounded-full transition-colors active:scale-95"
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
                placeholder={
                  user ? "Ask about expenses..." : "How can pAIse help?"
                }
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
                <Link
                  href="/auth/register"
                  className="text-primary font-bold hover:underline"
                >
                  Sign in
                </Link>{" "}
                to sync your data with AI.
              </p>
            )}
          </div>
        </div>
      )}

      {/* --- CLOSED ICON --- */}
      {!isOpen && (
        <div
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* TOOLTIP LABEL
             - Positioned to the left of the button
             - Only visible on hover or optionally always for first few seconds
          */}
          <div
            className={cn(
              "absolute right-full top-1/2 -translate-y-1/2 mr-4 px-3 py-1.5 rounded-xl bg-foreground text-background text-xs font-bold whitespace-nowrap shadow-xl transition-all duration-300 origin-right",
              isHovered
                ? "opacity-100 scale-100 translate-x-0"
                : "opacity-0 scale-90 translate-x-2 pointer-events-none"
            )}
          >
            Ask AI
            {/* Tiny triangle pointing right */}
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-foreground rotate-45" />
          </div>

          <Button
            onMouseDown={handleMouseDown}
            onClick={toggleWidget}
            className={cn(
              "h-16 w-16 rounded-full",
              // --- KEY CHANGES FOR VISIBILITY ---
              // 1. Vibrant Gradient (independent of theme primary color)
              "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white",

              // 2. Thick White Ring (Separates from white background)
              "ring-[3px] ring-white dark:ring-slate-900",

              // 3. Colored Shadow (Glow effect for light mode)
              "shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]",

              "hover:scale-110 active:scale-95 transition-all duration-300 ease-out",
              isDragging ? "cursor-grabbing scale-105" : "cursor-grab"
            )}
          >
            <div className="relative">
              <MessageCircle className="h-8 w-8 stroke-[2.5px]" />

              {/* Notification Dot - Strong Contrast */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white dark:border-slate-900 items-center justify-center">
                  <Sparkles className="h-2 w-2 text-white" />
                </span>
              </span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}

