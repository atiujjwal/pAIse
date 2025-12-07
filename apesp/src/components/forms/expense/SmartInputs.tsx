"use client";

import { useState, useRef } from "react";
import { Mic, ScanLine, Loader2, StopCircle, Sparkles } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { useToastStore } from "@/src/hooks/use-toast";
import { api } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

interface SmartInputsProps {
  onDraftReceived: (draft: any) => void;
  // Context helps the AI understand "Rahul" or "Trip Group"
  contextData: { type: "group" | "friend"; id: string | null; name: string };
}

export function SmartInputs({
  onDraftReceived,
  contextData,
}: SmartInputsProps) {
  const { addToast } = useToastStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Voice Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        await processVoice(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      addToast("Microphone access denied", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const processVoice = async (audioBlob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice_note.webm");
    formData.append("context", JSON.stringify(contextData));

    try {
      const { data } = await api.post("/ai/voice-expense", formData);
      if (data.success) {
        onDraftReceived(data.data);
        addToast("Expense details extracted!", "success");
      }
    } catch (error) {
      addToast("Could not process voice note", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- OCR Logic ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const { data } = await api.post("api/ai/scan-receipt", formData);
      if (data.success) {
        onDraftReceived(data.data);
        addToast("Receipt scanned!", "success");
      }
    } catch (error) {
      addToast("Scanning failed", "error");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Button
        type="button"
        variant="outline"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={cn(
          "h-16 border-purple-200 bg-purple-50/50 hover:bg-purple-100 hover:border-purple-300 transition-all group",
          isRecording && "bg-red-50 border-red-200 text-red-600 animate-pulse"
        )}
      >
        <div className="flex flex-col items-center gap-1">
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          ) : isRecording ? (
            <StopCircle className="h-6 w-6 text-red-500" />
          ) : (
            <Mic className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-xs font-semibold text-purple-900">
            {isProcessing
              ? "Thinking..."
              : isRecording
              ? "Stop"
              : "Voice Entry"}
          </span>
        </div>
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="h-16 border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-300 transition-all group"
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <div className="flex flex-col items-center gap-1">
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          ) : (
            <ScanLine className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-xs font-semibold text-blue-900">
            Scan Receipt
          </span>
        </div>
      </Button>
    </div>
  );
}
