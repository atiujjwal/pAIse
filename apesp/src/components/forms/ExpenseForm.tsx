"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExpenseSchema, CreateExpenseInput } from "@/src/lib/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/src/hooks/use-toast";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import { useGroupsList } from "@/src/features/groups/api/group-list-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";

export default function ExpenseForm() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  // 1. Fetch Groups Data
  const { data: groups, isLoading: loadingGroups } = useGroupsList();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      split_type: "EQUAL",
      currency: "INR",
      group_id: null, // Default to Personal
    },
  });

  // Watch group_id to update UI state if needed
  const selectedGroupId = watch("group_id");

  const mutation = useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      // Ensure group_id is null if "Personal" is selected (string "null" handling)
      const payload = {
        ...data,
        group_id: data.group_id === "personal" ? null : data.group_id,
        // For MVP, if no payers defined, assume current user paid full amount
        // This logic handles the basic form submission
        payers: [{ user_id: "me", amount: data.amount }],
        splits: [], // Backend or Wizard logic calculates splits
      };
      await api.post("/expenses", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      addToast("Expense created successfully", "success");
      router.push("/dashboard/expenses");
    },
    onError: (error: any) => {
      addToast(error?.message || "Failed to create expense", "error");
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-6 rounded-xl border bg-card p-6 shadow-sm"
    >
      {/* Description & Amount Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            {...register("description")}
            placeholder="e.g. Dinner at Taj"
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Amount (INR)</Label>
          <Input
            {...register("amount")}
            type="number"
            step="0.01"
            placeholder="0.00"
            disabled={isSubmitting}
          />
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          )}
        </div>
      </div>

      {/* Category & Date Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            onValueChange={(val) => setValue("category", val)}
            defaultValue="General"
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Food">Food & Drink</SelectItem>
              <SelectItem value="Travel">Travel</SelectItem>
              <SelectItem value="Entertainment">Entertainment</SelectItem>
              <SelectItem value="Utilities">Utilities</SelectItem>
              <SelectItem value="General">General</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-xs text-destructive">
              {errors.category.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Date</Label>
          <Input {...register("date")} type="date" disabled={isSubmitting} />
        </div>
      </div>

      {/* Split Type & Group Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Split Type</Label>
          <Select
            onValueChange={(val: any) => setValue("split_type", val)}
            defaultValue="EQUAL"
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Split" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EQUAL">Equal Split (=)</SelectItem>
              <SelectItem value="EXACT">Exact Amounts</SelectItem>
              <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
              <SelectItem value="SHARE">Shares</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Group (Optional)</Label>

          {/* GROUP SELECTION DROPDOWN */}
          <Select
            onValueChange={(val) =>
              setValue("group_id", val === "personal" ? null : val)
            }
            defaultValue="personal"
            disabled={loadingGroups}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              {/* Default Option */}
              <SelectItem value="personal">Personal (No Group)</SelectItem>

              {/* Dynamic Options from API */}
              {groups?.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-[10px] text-muted-foreground">
            *Select a group to split with members.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Saving..." : "Create Expense"}
        </Button>
      </div>
    </form>
  );
}
