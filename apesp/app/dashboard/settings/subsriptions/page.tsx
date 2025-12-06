"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Calendar, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToastStore } from "@/src/hooks/use-toast";
import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/api";
import { Button } from "@/src/components/ui/Button";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/Input";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { formatCurrency } from "@/src/lib/utils";

interface Subscription {
  id: string;
  name: string;
  amount: string;
  frequency: string;
  next_charge_date: string;
}

export default function SubscriptionsPage() {
  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const { register, handleSubmit, reset } = useForm();

  // [cite_start]; // Fetch Subscriptions [cite: 68, 462]
  const { data: subs, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ items: Subscription[] }>>(
        "api/subscriptions"
      );
      return data.data?.items || []; // Assuming backend wraps in items or returns array
    },
  });

  // [cite_start]; // Create Subscription [cite: 69, 465]
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("api/subscriptions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setIsAdding(false);
      reset();
      addToast("Subscription added", "success");
    },
  });

  // [cite_start]; // Delete Subscription [cite: 71, 471]
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`api/subscriptions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      addToast("Subscription removed", "success");
    },
  });

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Recurring Subscriptions
        </h1>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          variant={isAdding ? "secondary" : "default"}
        >
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> Add New
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <div className="rounded-lg border bg-muted/50 p-4 animate-in slide-in-from-top-2">
          <form
            onSubmit={handleSubmit((data) => createMutation.mutate(data))}
            className="grid gap-4 md:grid-cols-4 items-end"
          >
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                {...register("name", { required: true })}
                placeholder="Netflix"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                {...register("amount", { required: true })}
                type="number"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Next Charge</Label>
              <Input
                {...register("next_charge_date", { required: true })}
                type="date"
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              Save
            </Button>
          </form>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-4">
          {subs?.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between rounded-lg border p-4 bg-card"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{sub.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Next: {new Date(sub.next_charge_date).toLocaleDateString()}{" "}
                    ({sub.frequency})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono font-bold">
                  {formatCurrency(sub.amount, "INR")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(sub.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {subs?.length === 0 && !isAdding && (
            <p className="text-center text-muted-foreground">
              No active subscriptions found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
