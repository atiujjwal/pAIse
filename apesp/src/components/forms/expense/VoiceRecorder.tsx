"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Check, Loader2 } from "lucide-react";
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

  // Cleanup on unmount
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

      // Start Timer
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
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
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-red-200 bg-red-50 rounded-xl text-center">
        <p className="text-red-600 font-medium mb-2">
          Microphone access denied
        </p>
        <p className="text-sm text-red-500 mb-4">
          Please enable microphone permissions in your browser settings.
        </p>
        <Button variant="outline" onClick={onCancel} size="sm">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in slide-in-from-top-2">
      {/* Visualizer / Timer Display */}
      <div className="flex items-center justify-center w-full mb-6">
        {recordingState === "recording" ? (
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-2xl font-mono font-medium text-slate-700 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        ) : recordingState === "review" ? (
          <div className="flex items-center gap-3 w-full bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
            </Button>

            {/* Hidden Audio Element */}
            <audio
              ref={audioRef}
              src={audioUrl!}
              onEnded={handleAudioEnded}
              className="hidden"
            />

            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              {/* Simple indeterminate progress bar for visual feedback */}
              <div
                className={cn(
                  "h-full bg-primary transition-all duration-300",
                  isPlaying ? "w-full opacity-50 animate-pulse" : "w-0"
                )}
              />
            </div>
            <span className="text-xs font-mono text-slate-500">
              {formatTime(duration)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Ready to record expense details...
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {recordingState === "idle" && (
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-slate-500"
            >
              Cancel
            </Button>
            <Button
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 shadow-md shadow-red-200"
            >
              <Mic className="w-4 h-4 mr-2" /> Start Recording
            </Button>
          </div>
        )}

        {recordingState === "recording" && (
          <Button
            onClick={stopRecording}
            className="h-14 w-14 rounded-full border-4 border-red-100 bg-red-500 hover:bg-red-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <Square className="w-5 h-5 fill-current" />
          </Button>
        )}

        {recordingState === "review" && (
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Discard
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" /> Submit
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
