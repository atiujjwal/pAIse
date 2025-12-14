"use client";

import { useState, useRef } from "react";
import { Mic, ScanLine, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { useToastStore } from "@/src/hooks/use-toast";
import { api } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";
import { VoiceRecorder } from "./VoiceRecorder";

interface SmartInputsProps {
  onDraftReceived: (draft: any) => void;
  contextData: { type: "group" | "friend"; id: string | null; name: string };
}

export function SmartInputs({
  onDraftReceived,
  contextData,
}: SmartInputsProps) {
  const { addToast } = useToastStore();
  const [activeMode, setActiveMode] = useState<"none" | "voice">("none");
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVoiceSubmit = async (audioBlob: Blob) => {
    setIsVoiceProcessing(true);
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice_note.webm");
    formData.append("context", JSON.stringify(contextData));

    try {
      const { data } = await api.post("/ai/voice-expense", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        onDraftReceived(data.data);
        addToast("Expense details extracted!", "success");
        setActiveMode("none");
      }
    } catch (error) {
      addToast("Could not understand the audio. Please try again.", "error");
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);
    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const { data } = await api.post("/ai/scan-receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        onDraftReceived(data.data);
        addToast("Receipt scanned!", "success");
      }
    } catch (error) {
      addToast("Scanning failed. Please try a clearer image.", "error");
    } finally {
      setIsOcrProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (activeMode === "voice") {
    return (
      <div className="mb-6">
        <VoiceRecorder
          onCancel={() => setActiveMode("none")}
          onSubmit={handleVoiceSubmit}
          isSubmitting={isVoiceProcessing}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Voice Entry Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setActiveMode("voice")}
        disabled={isOcrProcessing}
        className="h-32 border-2 border-primary/10 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-all group flex flex-col gap-3 rounded-3xl"
      >
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Mic className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-primary">Voice Entry</span>
          <span className="text-[10px] text-primary/70 font-medium">
            Dictate details
          </span>
        </div>
      </Button>

      {/* OCR Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isOcrProcessing}
        className="h-32 border-2 border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group flex flex-col gap-3 rounded-3xl"
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <div className="flex flex-col items-center gap-2">
          {isOcrProcessing ? (
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ScanLine className="h-6 w-6 text-blue-600" />
            </div>
          )}
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-blue-700">
              {isOcrProcessing ? "Scanning..." : "Scan Receipt"}
            </span>
            {!isOcrProcessing && (
              <span className="text-[10px] text-blue-600/70 font-medium">
                Upload photo
              </span>
            )}
          </div>
        </div>
      </Button>
    </div>
  );
}
