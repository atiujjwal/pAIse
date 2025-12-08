"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { useExpenseWizardStore } from "../../expenses/store/wizard-store";
import { useToastStore } from "@/src/hooks/use-toast";
import { ApiResponse } from "@/src/types/api";
import { api } from "@/src/lib/api";
import { Button } from "@/src/components/ui/Button";

interface DraftExpense {
  amount: string;
  date: string;
  merchant: string;
  category: string;
}

export function ReceiptScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateDraft = useExpenseWizardStore((state) => state.updateDraft);
  const { addToast } = useToastStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      // Integration: POST /api/ai/scan-receipt [cite: 219]
      const { data } = await api.post<ApiResponse<DraftExpense>>(
        "/ai/scan-receipt",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const extracted = data.data!;

      updateDraft({
        amount: extracted.amount,
        date: extracted.date, // ISO String
        description: extracted.merchant, // Map merchant to description
        category: extracted.category || "General",
      });

      addToast("Receipt scanned! Please verify details.", "success");
    } catch (error) {
      addToast(
        "Failed to scan receipt. Please enter details manually.",
        "error"
      );
    } finally {
      setIsScanning(false);
      // Reset input to allow re-uploading same file if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      <Button
        variant="outline"
        className="w-full gap-2 border-dashed"
        onClick={() => fileInputRef.current?.click()}
        disabled={isScanning}
      >
        {isScanning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        {isScanning ? "Scanning..." : "Scan Receipt"}
      </Button>
    </div>
  );
}
