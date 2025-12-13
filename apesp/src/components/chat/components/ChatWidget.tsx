"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { cn } from "@/src/lib/utils";
import { useAuthStore } from "@/src/features/auth/store";
import Link from "next/link";
import axios from "axios";
import { api } from "@/src/lib/api";

// --- Configuration ---
const WIDGET_WIDTH = 380;
const WIDGET_HEIGHT = 500;
const BUTTON_SIZE = 54;
const MARGIN = 14;
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

  // --- State ---
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

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    startPos: Coordinates;
  } | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // --- Position & Boundary Logic ---

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch {
        /* use default */
      }
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
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  // --- Click Outside Logic ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;

      if (
        widgetRef.current &&
        widgetRef.current.contains(event.target as Node)
      ) {
        return;
      }

      if (isDragging) return;

      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isDragging]);

  // --- Data Logic ---
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

  // --- Drag Handlers ---
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

      const newX = dragStartRef.current.startPos.x + deltaX;
      const newY = dragStartRef.current.startPos.y + deltaY;

      const width = isOpen ? WIDGET_WIDTH : BUTTON_SIZE;
      const height = isOpen ? WIDGET_HEIGHT : BUTTON_SIZE;

      const clampedX = Math.min(
        Math.max(MARGIN, newX),
        window.innerWidth - width - MARGIN
      );
      const clampedY = Math.min(
        Math.max(MARGIN, newY),
        window.innerHeight - height - MARGIN
      );

      setPosition({ x: clampedX, y: clampedY });
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
      const payload = {
        message: userMsg,
        publicHistory: !user ? messages.slice(-4) : undefined,
      };
      const { data } = await api.post("/ai/chat", payload);

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
        "fixed z-50 flex flex-col items-end transition-shadow duration-300",
        isDragging ? "cursor-grabbing" : ""
      )}
      style={{
        right: `${position.x}px`,
        bottom: `${position.y}px`,
      }}
    >
      {/* --- OPEN CHAT WINDOW --- */}
      {isOpen && (
        <div
          style={{ width: WIDGET_WIDTH, height: WIDGET_HEIGHT }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom-right"
        >
          {/* Header */}
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "h-16 bg-slate-900 text-white flex items-center justify-between px-4 shadow-md z-10 select-none",
              isDragging
                ? "cursor-grabbing"
                : "cursor-grab active:cursor-grabbing"
            )}
          >
            <div className="flex items-center gap-3 pointer-events-none">
              <div className="bg-indigo-500/20 p-2 rounded-lg backdrop-blur-sm border border-indigo-500/30">
                <Sparkles className="h-5 w-5 text-indigo-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">
                  pAIse Assistant
                </h3>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  {user ? "Personal Accountant" : "Online"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="no-drag hover:bg-white/10 p-2 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === "USER" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed",
                    msg.role === "USER"
                      ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm"
                      : "bg-white text-slate-700 border border-slate-100 rounded-tl-sm"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-in fade-in">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  user ? "Ask about expenses..." : "How can pAIse help?"
                }
                className="pr-12 py-6 rounded-full bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 shadow-inner"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="absolute right-2 h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all hover:scale-105"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Send className="h-4 w-4 text-white ml-0.5" />
                )}
              </Button>
            </div>
            {!user && (
              <p className="text-[13px] text-center text-slate-400 mt-2">
                <Link
                  href="/auth/register"
                  className="text-indigo-500 font-medium cursor-pointer hover:underline"
                >
                  Sign in
                </Link>{" "}
                to sync your financial data.
              </p>
            )}
          </div>
        </div>
      )}

      {/* --- TOGGLE BUTTON --- */}
      {!isOpen && (
        <Button
          onMouseDown={handleMouseDown}
          onClick={() => !isDragging && setIsOpen(true)}
          className={cn(
            "h-16 w-16 rounded-full shadow-[0_8px_30px_rgb(79,70,229,0.3)] bg-gradient-to-br from-indigo-600 to-violet-600 text-white transition-all duration-300 border-2 border-white/20",
            "hover:scale-110 hover:shadow-[0_8px_40px_rgb(79,70,229,0.5)] active:scale-95",
            isDragging ? "cursor-grabbing scale-105" : "cursor-grab"
          )}
        >
          <div className="relative">
            <MessageCircle className="h-8 w-8 text-white/90" />
            <Sparkles className="h-4 w-4 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </Button>
      )}
    </div>
  );
}
