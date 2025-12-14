"use client";

import { useState } from "react";
import { Mic, Square } from "lucide-react";
import { useExpenseWizardStore } from "../../expenses/store/wizard-store";
import { useToastStore } from "@/src/hooks/use-toast";
import { api } from "@/src/lib/api";
import { Button } from "@/src/components/ui/Button";

export function VoiceExpenseInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const updateDraft = useExpenseWizardStore((state) => state.updateDraft);
  const { addToast } = useToastStore();
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        await processAudio(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      addToast("Microphone access denied", "error");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
    mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const { data } = await api.post("/ai/voice-expense", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      updateDraft({
        amount: data.data.amount,
        description: data.data.description,
        category: data.data.category,
        date: data.data.date,
      });
      addToast("Expense details extracted from voice!", "success");
    } catch (error) {
      addToast("Failed to process voice command", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      variant={isRecording ? "destructive" : "secondary"}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      className="w-full gap-2"
    >
      {isProcessing ? (
        "Processing..."
      ) : isRecording ? (
        <>
          <Square className="h-4 w-4 fill-current" /> Stop Recording
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" /> Voice Entry
        </>
      )}
    </Button>
  );
}
