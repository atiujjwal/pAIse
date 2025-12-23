"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Check,
  RefreshCcw,
  Info, // Import Info icon for instructions
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";

interface VoiceRecorderProps {
  onSubmit: (audioBlob: Blob) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function VoiceRecorder({
  onSubmit,
  onCancel,
  isSubmitting,
}: VoiceRecorderProps) {
  const [permissionError, setPermissionError] = useState(false);
  // States: idle -> recording -> review
  const [recordingState, setRecordingState] = useState<
    "idle" | "recording" | "review"
  >("idle");
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingState("review");

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecordingState("recording");
      setPermissionError(false);

      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic Error:", err);
      setPermissionError(true);
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

  const handleAudioEnded = () => setIsPlaying(false);

  const handleSubmit = () => {
    if (!audioUrl) return;
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    onSubmit(audioBlob);
  };

  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingState("idle");
    setDuration(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (permissionError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-destructive/30 bg-destructive/5 rounded-3xl text-center">
        <p className="text-destructive font-medium mb-2">
          Microphone access denied
        </p>
        <Button type="button" variant="outline" onClick={onCancel} size="sm">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 bg-card border border-border rounded-[2rem] shadow-sm animate-in fade-in slide-in-from-top-2 mb-6 w-full">
      {/* 1. VISUALIZER / TIMER AREA */}
      <div className="flex items-center justify-center w-full mb-6 h-16">
        {recordingState === "recording" ? (
          <div className="flex items-center gap-4 animate-pulse">
            <div className="h-4 w-4 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
            <span className="text-5xl font-mono font-medium text-foreground tabular-nums tracking-tight">
              {formatTime(duration)}
            </span>
          </div>
        ) : recordingState === "review" ? (
          <div className="flex items-center gap-3 w-full bg-muted/40 p-2 pr-4 rounded-2xl border border-border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl shrink-0 hover:bg-background shadow-sm"
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" />
              )}
            </Button>

            <div className="flex-1 flex flex-col justify-center h-full gap-1.5">
              {/* Hidden Audio Element */}
              <audio
                ref={audioRef}
                src={audioUrl!}
                onEnded={handleAudioEnded}
                className="hidden"
              />
              <div className="h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden w-full">
                <div
                  className={cn(
                    "h-full bg-primary transition-all duration-300 rounded-full",
                    isPlaying ? "w-full ease-linear" : "w-0"
                  )}
                  style={{
                    animationDuration: `${duration}s`,
                    width: isPlaying ? "100%" : "0%",
                    transition: isPlaying
                      ? `width ${duration}s linear`
                      : "none",
                  }}
                />
              </div>
            </div>
            <span className="text-xs font-mono text-muted-foreground tabular-nums shrink-0">
              {formatTime(duration)}
            </span>
          </div>
        ) : (
          <p className="text-base text-muted-foreground font-medium animate-in fade-in">
            Ready to record expense...
          </p>
        )}
      </div>

      {/* --- INSTRUCTION TEXT --- */}
      {recordingState === "idle" && (
        <div className="mb-8 flex items-start gap-2 bg-blue-500/5 border border-blue-500/10 px-4 py-3 rounded-xl max-w-md">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Please mention the{" "}
            <span className="font-semibold text-foreground">description</span>,{" "}
            <span className="font-semibold text-foreground">total amount</span>,{" "}
            <span className="font-semibold text-foreground">who paid</span>, and{" "}
            <span className="font-semibold text-foreground">how to split</span>{" "}
            (e.g., "
            <i>
              <strong>
                Dhurandhar movie tickets cost ₹1500, paid by Shivam and split
                equally among everyone
              </strong>
            </i>{" "}
            Or{" "}
            <i>
              <strong>
                Lunch at McDonald's cost ₹800 — I paid ₹500, Kanchan paid ₹300.
                My share is ₹450 and Kanchan's share is ₹350
              </strong>
            </i>
            ").
          </p>
        </div>
      )}

      {/* 2. CONTROLS AREA */}
      <div className="flex items-center justify-center gap-6 w-full">
        {recordingState === "idle" && (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="rounded-xl h-12 px-6 text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={startRecording}
              className="h-14 px-8 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              <Mic className="w-5 h-5 mr-2" /> Start Recording
            </Button>
          </>
        )}

        {recordingState === "recording" && (
          <Button
            type="button"
            onClick={stopRecording}
            className="h-16 w-16 rounded-full border-4 border-red-500/20 bg-red-500 hover:bg-red-600 text-white shadow-xl transition-all hover:scale-110"
          >
            <Square className="w-6 h-6 fill-current" />
          </Button>
        )}

        {recordingState === "review" && (
          <div className="flex items-center gap-3 w-full justify-between">
            {/* Discard Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-14 w-14 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Discard Recording"
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSubmitting}
                className="h-12 px-5 rounded-xl font-medium border-border hover:bg-muted transition-all"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  "Processing..."
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" /> Use This
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
