"use client";

import { useState, useRef } from "react";
import { Mic, ScanLine, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { useToastStore } from "@/src/hooks/use-toast";
import { api } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";
import { VoiceRecorder } from "./VoiceRecorder"; // Import the new component

interface SmartInputsProps {
  onDraftReceived: (draft: any) => void;
  contextData: { type: "group" | "friend"; id: string | null; name: string };
}

export function SmartInputs({
  onDraftReceived,
  contextData,
}: SmartInputsProps) {
  const { addToast } = useToastStore();

  // UI State
  const [activeMode, setActiveMode] = useState<"none" | "voice">("none");

  // Processing States
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Voice Logic (Delegated to Component) ---
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
        setActiveMode("none"); // Close recorder on success
      }
    } catch (error) {
      console.error(error);
      addToast("Could not understand the audio. Please try again.", "error");
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  // --- OCR Logic ---
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
      console.error(error);
      addToast("Scanning failed. Please try a clearer image.", "error");
    } finally {
      setIsOcrProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // If Voice Mode is active, show the Recorder UI
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

  // Default View: Two Big Buttons
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Voice Entry Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setActiveMode("voice")}
        disabled={isOcrProcessing} // Disable if OCR is running
        className="h-24 border-purple-100 bg-purple-50/30 hover:bg-purple-50 hover:border-purple-200 transition-all group flex flex-col gap-2 rounded-xl"
      >
        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Mic className="h-5 w-5 text-purple-600" />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-purple-900">
            Voice Entry
          </span>
          <span className="text-[10px] text-purple-600/80 font-medium">
            Dictate your expense
          </span>
        </div>
      </Button>

      {/* OCR Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isOcrProcessing}
        className="h-24 border-blue-100 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-200 transition-all group flex flex-col gap-2 rounded-xl"
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
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ScanLine className="h-5 w-5 text-blue-600" />
            </div>
          )}
          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold text-blue-900">
              {isOcrProcessing ? "Scanning..." : "Scan Receipt"}
            </span>
            {!isOcrProcessing && (
              <span className="text-[10px] text-blue-600/80 font-medium">
                Upload bill photo
              </span>
            )}
          </div>
        </div>
      </Button>
    </div>
  );
}
