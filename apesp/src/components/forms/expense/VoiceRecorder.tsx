"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Check } from "lucide-react";
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
        <Button variant="outline" onClick={onCancel} size="sm">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 bg-card border border-border rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-2">
      {/* Timer / Visualizer */}
      <div className="flex items-center justify-center w-full mb-8">
        {recordingState === "recording" ? (
          <div className="flex items-center gap-4">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive"></span>
            </span>
            <span className="text-3xl font-mono font-medium text-foreground tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        ) : recordingState === "review" ? (
          <div className="flex items-center gap-3 w-full bg-muted/40 p-3 rounded-2xl border border-border">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
            </Button>
            <audio
              ref={audioRef}
              src={audioUrl!}
              onEnded={handleAudioEnded}
              className="hidden"
            />
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full bg-primary transition-all duration-300",
                  isPlaying ? "w-full opacity-70 animate-pulse" : "w-0"
                )}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground font-medium">
            Ready to record details...
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {recordingState === "idle" && (
          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={startRecording}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-full px-8 h-12 shadow-lg shadow-destructive/20"
            >
              <Mic className="w-5 h-5 mr-2" /> Start Recording
            </Button>
          </div>
        )}

        {recordingState === "recording" && (
          <Button
            onClick={stopRecording}
            className="h-16 w-16 rounded-full border-4 border-destructive/20 bg-destructive hover:bg-destructive/90 text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
          >
            <Square className="w-6 h-6 fill-current" />
          </Button>
        )}

        {recordingState === "review" && (
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Discard
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary/90 shadow-md"
            >
              <Check className="w-4 h-4 mr-2" /> Submit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
