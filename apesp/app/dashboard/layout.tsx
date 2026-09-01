"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Mic,
  Camera,
  X,
  Loader2,
  Play,
  Pause,
  Trash2,
  RefreshCcw,
  Check,
  Square,
  Sparkles,
} from "lucide-react";

import { Sidebar } from "@/src/components/layout/Sidebar";
import { TopNav } from "@/src/components/layout/TopNav";
import { Header } from "@/src/components/layout/Header";
import { BottomNav } from "@/src/components/layout/BottomNav";
import { Button } from "@/src/components/ui/Button";
import { useToastStore } from "@/src/hooks/use-toast";
import { useExpenseWizardStore } from "@/src/features/expenses/store/wizard-store";
import { api } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { addToast } = useToastStore();
  const updateDraft = useExpenseWizardStore((state) => state.updateDraft);
  const resetWizard = useExpenseWizardStore((state) => state.resetWizard);

  // FAB & Drawer States
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<"none" | "voice" | "scan">("none");

  // Voice Recording States
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "review">("idle");
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Scan Receipt States
  const [isScanning, setIsScanning] = useState(false);
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (scanPreviewUrl) URL.revokeObjectURL(scanPreviewUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl, scanPreviewUrl]);

  // Close FAB menu on route change
  useEffect(() => {
    setIsFabOpen(false);
  }, [pathname]);

  // Voice Entry Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingState("review");
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecordingState("recording");
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      addToast("Microphone access denied", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVoiceSubmit = async () => {
    if (!audioUrl) return;
    setIsVoiceProcessing(true);

    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice-entry.webm");

    try {
      const response = await api.post("/ai/voice-expense", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const payload = response.data;
      if (payload && payload.success && payload.data) {
        resetWizard();
        updateDraft({
          amount: payload.data.amount,
          description: payload.data.description,
          category: payload.data.category || "General",
          date: payload.data.date || new Date().toISOString().slice(0, 16),
        });
        addToast("Voice expense processed! Let's fill out details.", "success");
        setActiveDrawer("none");
        router.push("/dashboard/expenses/new");
      } else {
        throw new Error("Invalid voice processing format");
      }
    } catch (error: any) {
      addToast(error?.response?.data?.message || "Failed to process voice command.", "error");
    } finally {
      setIsVoiceProcessing(false);
      resetVoiceState();
    }
  };

  const resetVoiceState = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingState("idle");
    setDuration(0);
    setIsPlaying(false);
  };

  // Receipt Scan Logic
  const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setScanPreviewUrl(previewUrl);
    setIsScanning(true);

    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const response = await api.post("/ai/scan-receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const payload = response.data;
      if (payload && payload.success && payload.data) {
        resetWizard();
        updateDraft({
          amount: payload.data.amount,
          description: payload.data.merchant || payload.data.description,
          category: payload.data.category || "General",
          date: payload.data.date || new Date().toISOString().slice(0, 16),
        });
        addToast("Receipt scanned! Check details.", "success");
        setActiveDrawer("none");
        router.push("/dashboard/expenses/new");
      } else {
        throw new Error("Receipt parsing failed");
      }
    } catch (error) {
      addToast("Scanning failed. Please enter details manually.", "error");
    } finally {
      setIsScanning(false);
      setScanPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* 1. DESKTOP SIDEBAR (HIDDEN ON MOBILE) */}
      <div className="hidden w-72 flex-col border-r border-border/50 bg-card md:flex shadow-sm z-20">
        <Sidebar />
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* CONDITIONAL HEADERS */}
        {/* Desktop Header */}
        <div className="hidden md:block">
          <TopNav />
        </div>
        {/* Mobile Header */}
        <div className="block md:hidden">
          <Header />
        </div>

        {/* PAGE CONTENT WRAPPER */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-28 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="min-h-full flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* 2. BOTTOM NAVIGATION BAR (MOBILE ONLY) */}
        <BottomNav />

        {/* 3. MULTI-OPTION FAB (EXPANDABLE) */}
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 flex flex-col items-end gap-3">
          <AnimatePresence>
            {isFabOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-end gap-3 mb-2"
              >
                {/* Voice Entry Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveDrawer("voice");
                    setIsFabOpen(false);
                  }}
                  className="flex h-11 items-center gap-3 rounded-xl border border-primary bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-card touch-manipulation"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <span className="tracking-tight">Voice Input</span>
                  <div className="p-1 bg-white/10 rounded-lg">
                    <Mic className="h-4 w-4" />
                  </div>
                </motion.button>

                {/* Scan Receipt Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveDrawer("scan");
                    setIsFabOpen(false);
                  }}
                  className="flex h-11 items-center gap-3 rounded-xl border border-brand-lemon-s20/60 bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground shadow-card touch-manipulation"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <span className="tracking-tight">Scan Receipt</span>
                  <div className="p-1 bg-white/10 rounded-lg">
                    <Camera className="h-4 w-4" />
                  </div>
                </motion.button>

                {/* Manual Entry Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    router.push("/dashboard/expenses/new");
                    setIsFabOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-card border border-border/50 text-foreground hover:bg-muted shadow-md text-sm font-bold h-11 touch-manipulation"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <span className="tracking-tight">Manual Entry</span>
                  <div className="p-1 bg-muted rounded-lg">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trigger Button */}
          <motion.button
            onClick={() => setIsFabOpen(!isFabOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "z-50 flex h-14 w-14 items-center justify-center rounded-xl border border-primary bg-primary text-primary-foreground shadow-glow transition-colors touch-manipulation",
              isFabOpen && "rotate-45"
            )}
            style={{ minWidth: "44px", minHeight: "44px" }}
          >
            <Plus className="h-6 w-6" />
          </motion.button>
        </div>

        {/* 4. IMMERSIVE CUSTOM DRAWER / MODAL */}
        <AnimatePresence>
          {activeDrawer !== "none" && (
            <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!isVoiceProcessing && !isScanning) {
                    setActiveDrawer("none");
                    resetVoiceState();
                    setScanPreviewUrl(null);
                  }
                }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />

              {/* Drawer Container (Mobile-first slide up / Desktop Modal scale) */}
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="relative z-10 w-full max-w-lg bg-card border-t md:border border-border/50 shadow-2xl rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 max-h-[85vh] overflow-y-auto mb-0 md:mb-12"
              >
                {/* Drag / Close Handle */}
                <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-6 md:hidden" />

                {/* Close Button */}
                <button
                  onClick={() => {
                    setActiveDrawer("none");
                    resetVoiceState();
                    setScanPreviewUrl(null);
                  }}
                  disabled={isVoiceProcessing || isScanning}
                  className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <X className="h-5 w-5" />
                </button>

                {/* DRAWER CONTENT */}
                <div className="space-y-6">
                  {/* VOICE RECORDER INTERFACE */}
                  {activeDrawer === "voice" && (
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="space-y-1.5 text-balance">
                        <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                          Dictate Expense <Sparkles className="h-5 w-5 text-primary" />
                        </h3>
                        <p className="text-muted-foreground text-xs max-w-sm">
                          Tell pAIse the details: description, amount, category, and date.
                        </p>
                      </div>

                      {/* Visual Pulse / Wave Area */}
                      <div className="relative flex items-center justify-center h-44 w-full">
                        {recordingState === "recording" && (
                          <>
                            {/* Glowing Ring Animations */}
                            <motion.div
                              animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                              className="absolute h-20 w-20 rounded-full bg-red-500/20"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                              className="absolute h-20 w-20 rounded-full bg-red-500/30"
                            />
                          </>
                        )}

                        {/* Microphone Button Container */}
                        <div className="relative z-10">
                          {recordingState === "idle" && (
                            <button
                              onClick={startRecording}
                              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-colors hover:bg-primary-dark touch-manipulation"
                              style={{ minWidth: "44px", minHeight: "44px" }}
                            >
                              <Mic className="h-8 w-8" />
                            </button>
                          )}
                          {recordingState === "recording" && (
                            <button
                              onClick={stopRecording}
                              className="h-20 w-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse touch-manipulation"
                              style={{ minWidth: "44px", minHeight: "44px" }}
                            >
                              <Square className="h-7 w-7 fill-current" />
                            </button>
                          )}
                          {recordingState === "review" && (
                            <button
                              onClick={togglePlayback}
                              className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-card transition-colors hover:bg-secondary-dark touch-manipulation"
                              style={{ minWidth: "44px", minHeight: "44px" }}
                            >
                              {isPlaying ? (
                                <Pause className="h-8 w-8 fill-current" />
                              ) : (
                                <Play className="h-8 w-8 fill-current ml-1" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Timer & Transcript State */}
                      <div className="h-8 flex items-center justify-center">
                        {recordingState === "recording" && (
                          <span className="font-mono text-2xl font-bold text-red-500 tabular-nums animate-pulse">
                            {formatTime(duration)}
                          </span>
                        )}
                        {recordingState === "review" && (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-mono text-sm text-muted-foreground">
                              Recording Ready ({formatTime(duration)})
                            </span>
                            <audio
                              ref={audioRef}
                              src={audioUrl!}
                              onEnded={() => setIsPlaying(false)}
                              className="hidden"
                            />
                          </div>
                        )}
                        {recordingState === "idle" && (
                          <span className="text-sm font-medium text-muted-foreground">
                            Tap to start recording
                          </span>
                        )}
                      </div>

                      {/* Instructions */}
                      {recordingState === "idle" && (
                        <div className="bg-muted/50 border border-border/40 p-4 rounded-2xl text-left max-w-sm text-xs leading-relaxed text-muted-foreground text-balance">
                          Try: <span className="text-foreground italic">"Dinner at Olive Garden cost ₹2400 paid by me"</span> or <span className="text-foreground italic">"Uber ride was 350 rupees split equally."</span>
                        </div>
                      )}

                      {/* Action Triggers */}
                      <div className="w-full flex justify-center gap-3 pt-2">
                        {recordingState === "review" && (
                          <>
                            <Button
                              variant="outline"
                              onClick={resetVoiceState}
                              disabled={isVoiceProcessing}
                              className="rounded-2xl h-12 flex-1 touch-manipulation"
                            >
                              <RefreshCcw className="h-4 w-4 mr-2" /> Retake
                            </Button>
                            <Button
                              onClick={handleVoiceSubmit}
                              disabled={isVoiceProcessing}
                              className="rounded-2xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 touch-manipulation"
                            >
                              {isVoiceProcessing ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Decoding...
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" /> Use Voice
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* RECEIPT SCANNER INTERFACE */}
                  {activeDrawer === "scan" && (
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="space-y-1.5 text-balance">
                        <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                          Scan Receipt <Sparkles className="h-5 w-5 text-secondary" />
                        </h3>
                        <p className="text-muted-foreground text-xs max-w-sm">
                          Take a photo or upload a receipt to auto-extract details.
                        </p>
                      </div>

                      {/* Image Preview & Scanner Sweep */}
                      {scanPreviewUrl ? (
                        <div className="relative h-60 w-full max-w-xs rounded-3xl overflow-hidden border border-border/60 shadow-inner bg-black/5 flex items-center justify-center">
                          <img
                            src={scanPreviewUrl}
                            alt="Receipt Preview"
                            className="h-full w-full object-cover"
                          />
                          {isScanning && (
                            <>
                              {/* Horizontal laser scan animation */}
                              <motion.div
                                animate={{ y: ["0%", "100%", "0%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(var(--primary),0.8)] z-10"
                                style={{ top: 0 }}
                              />
                              <div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px] flex flex-col items-center justify-center text-primary-foreground font-bold text-sm bg-black/40">
                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                Extracting details...
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="h-48 w-full max-w-xs rounded-3xl border-2 border-dashed border-border/60 hover:border-primary/40 flex flex-col items-center justify-center cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all gap-3 group touch-manipulation"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleScanUpload}
                          />
                          <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Camera className="h-6 w-6 text-secondary" />
                          </div>
                          <div className="flex flex-col items-center text-xs">
                            <span className="font-bold text-foreground">Upload Receipt</span>
                            <span className="text-muted-foreground mt-0.5">Supports PNG, JPG</span>
                          </div>
                        </div>
                      )}

                      {!scanPreviewUrl && (
                        <div className="bg-muted/50 border border-border/40 p-4 rounded-2xl text-left max-w-sm text-xs leading-relaxed text-muted-foreground text-balance">
                          Our smart scanner extracts the total amount, date, and merchant name from your receipt and auto-populates the form.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
