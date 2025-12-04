"use client";
import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import useExpenses from "../../../../src/hooks/useExpenses";
import useAuth from "../../../../src/hooks/useAuth";
import { useStore } from "../../../../src/store";
import Card, { CardHeader, CardTitle } from "../../../../src/components/ui/Card";
import Input from "../../../../src/components/ui/Input";
import { formatAmount } from "../../../../src/lib/utils";
import Button from "../../../../src/components/ui/Button";

const schema = z.object({
  description: z.string().min(2, "Enter a description"),
  date: z.string().min(1, "Enter date"),
  category: z.string().min(1, "Select category"),
  amount: z.coerce.number().positive("Amount must be > 0"),
  split: z.enum(["equal", "exact", "percentage", "custom"]),
  currency: z.string().default("INR"),
});
type FormData = z.infer<typeof schema>;

export default function NewExpensePage() {
  const router = useRouter();
  const { addExpense } = useExpenses();
  const { user } = useAuth();
  const groups = useStore((s) => s.groups);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      split: "equal",
      category: "DINING",
      currency: "INR",
    },
  });

  const amount = watch("amount") || 0;

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      await addExpense({
        groupId: groups?.[0]?.id ?? null,
        paidBy: user?.id ?? undefined,
        attachments: [],
        comments: [],
        reactions: [],
        ...data,
      });
      toast.success("Expense added!");
      router.push("/dashboard/expenses");
    } catch {
      toast.error("Failed to add expense");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-mono-900">Add Expense</h1>
        <p className="text-mono-600 mt-1">
          Describe the purchase and splitting method
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6"
        >
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register("date")}
          />
          <div>
            <label className="block text-sm font-medium text-mono-700 mb-1.5">
              Category
            </label>
            <select
              {...register("category")}
              className="w-full h-10 px-3 rounded-lg border border-mono-300 bg-white text-mono-900 focus:outline-none focus:ring-2 focus:ring-mono-200"
            >
              {[
                "DINING",
                "GROCERIES",
                "TRAVEL",
                "SHOPPING",
                "UTILITIES",
                "OTHER",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.category.message}
              </p>
            )}
          </div>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register("amount")}
          />
          <div>
            <label className="block text-sm font-medium text-mono-700 mb-1.5">
              Split Type
            </label>
            <select
              {...register("split")}
              className="w-full h-10 px-3 rounded-lg border border-mono-300 bg-white text-mono-900 focus:outline-none focus:ring-2 focus:ring-mono-200"
            >
              <option value="equal">Equal</option>
              <option value="exact">Exact</option>
              <option value="percentage">Percentage</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <Input
            label="Description"
            placeholder="e.g., Coffee at Starbucks"
            {...register("description")}
            error={errors.description?.message}
          />
          <div className="md:col-span-2">
            <p className="text-sm text-mono-600">
              You will pay {formatAmount(amount || 0)}
            </p>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" isLoading={isLoading}>
              Save Expense
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
