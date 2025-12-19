"use client";

import { useState, useRef } from "react";
import { Mic, ScanLine, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { useToastStore } from "@/src/hooks/use-toast";
import { api } from "@/src/lib/api";
import { VoiceRecorder } from "./VoiceRecorder";
import { ExpenseMember } from "./ExpenseForm";
import { User } from "@/src/types/api";

interface SmartInputsProps {
  onDraftReceived: (draft: any) => void;
  currentUser: User | null;
  activeMembers: ExpenseMember[];
  activeGroupId: string | null;
  activeFriendId: string | null;
  mode: "group" | "friend";
}

export function SmartInputs({
  onDraftReceived,
  currentUser,
  activeMembers,
  activeGroupId,
  activeFriendId,
  mode,
}: SmartInputsProps) {
  const { addToast } = useToastStore();
  const [activeMode, setActiveMode] = useState<"none" | "voice">("none");
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVoiceSubmit = async (audioBlob: Blob) => {
    if (!currentUser) {
      addToast("You must be logged in.", "error");
      return;
    }

    setIsVoiceProcessing(true);

    const contextPayload = {
      mode: mode.toUpperCase(),
      current_user: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
      participants: activeMembers.map((m) => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
      })),
      group_id: activeGroupId,
      friend_id: activeFriendId,
    };

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("context", JSON.stringify(contextPayload));

    try {
      const response = await api.post("/ai/voice-expense", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Access the inner 'data' object from the API response
      const payload = response.data;
      if (payload && payload.success && payload.data) {
        onDraftReceived(payload.data);
        setActiveMode("none");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error(error);
      const msg =
        error?.response?.data?.message || "Could not understand the audio.";
      addToast(msg, "error");
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
      const response = await api.post("/ai/scan-receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const payload = response.data;
      if (payload && payload.success && payload.data) {
        onDraftReceived(payload.data);
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
      <VoiceRecorder
        onCancel={() => setActiveMode("none")}
        onSubmit={handleVoiceSubmit}
        isSubmitting={isVoiceProcessing}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-8 animate-in fade-in slide-in-from-top-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => setActiveMode("voice")}
        disabled={isOcrProcessing}
        className="h-32 border-2 border-primary/10 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-all group flex flex-col gap-3 rounded-3xl"
      >
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
          <Mic className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-primary">Voice Entry</span>
          <span className="text-[10px] text-primary/70 font-medium">
            Dictate details
          </span>
        </div>
      </Button>

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
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
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
