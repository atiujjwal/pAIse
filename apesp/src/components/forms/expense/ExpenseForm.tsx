"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Users,
  User,
  Calendar,
  Tag,
  FileText,
  Wallet,
  PlusCircle,
  UserPlus,
} from "lucide-react";

import { api } from "@/src/lib/api";
import { useToastStore } from "@/src/hooks/use-toast";
import { useAuthStore } from "@/src/features/auth/store";
import { useGroupsList } from "@/src/features/groups/api/group-list-query";
import { useGroupMembers } from "@/src/features/groups/api/group-members-query";
import { useFriends } from "@/src/features/friends/api/friend-queries";

// Components
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/Select";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { CreateGroupDialog } from "@/src/features/groups/components/CreateGroupDialog";
import { cn } from "@/src/lib/utils";
import { CreateExpenseInput, createExpenseSchema } from "@/src/lib/schemas";
import { SmartInputs } from "./SmartInputs";
import { PayerSelector } from "./PayerSelector";
import { SplitDistribution } from "./SplitDistribution";


export default function ExpenseForm() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // --- Data Fetching ---
  const { data: groups, isLoading: loadingGroups } = useGroupsList();
  const { data: friends, isLoading: loadingFriends } = useFriends();

  // --- Form Setup ---
  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      split_type: "EQUAL",
      currency: "INR",
      category: "General",
      payers: [],
      splits: [],
      group_id: null,
      friend_id: null,
    },
  });

  const { register, setValue, control, handleSubmit, formState } = form;

  // --- Watch Values ---
  const selectedGroupId = useWatch({ control, name: "group_id" });
  const selectedFriendId = useWatch({ control, name: "friend_id" });
  const splitType = useWatch({ control, name: "split_type" });
  const amount = useWatch({ control, name: "amount" });

  const [activeTab, setActiveTab] = useState<"group" | "friend">("group");

  const isContextSelected =
    (activeTab === "group" && !!selectedGroupId) ||
    (activeTab === "friend" && !!selectedFriendId);

  useEffect(() => {
    if (activeTab === "group") setValue("friend_id", null);
    else setValue("group_id", null);
  }, [activeTab, setValue]);

  // --- Logic: Fetch & Memoize Members (FIX FOR LOOP) ---
  const { data: groupMembers } = useGroupMembers(selectedGroupId || null);

  console.log("97: ", groupMembers);
  

  const activeMembers = useMemo(() => {
    if (selectedGroupId) return groupMembers || [];
    if (selectedFriendId && friends && currentUser) {
      const friend = friends.find((f) => f.id === selectedFriendId);
      return friend ? [currentUser, friend] : [];
    }
    return [];
  }, [selectedGroupId, groupMembers, selectedFriendId, friends, currentUser]);

  // --- Stable Handlers ---
  const handlePayerChange = useCallback(
    (payers: any[]) => {
      setValue("payers", payers, { shouldValidate: true });
    },
    [setValue]
  );

  const handleSmartDraft = (draft: any) => {
    if (draft.amount) setValue("amount", String(draft.amount));
    if (draft.description) setValue("description", draft.description);
    if (draft.date) setValue("date", draft.date.split("T")[0]);
    if (draft.category) setValue("category", draft.category);
  };

  const mutation = useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      await api.post("api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      addToast("Expense created successfully", "success");
      router.push("/dashboard/expenses");
    },
    onError: (err: any) => addToast(err?.message || "Failed", "error"),
  });

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-8">
        <Label className="mb-3 block text-base font-semibold text-slate-700">
          Who is this expense with?
        </Label>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 rounded-xl">
            <TabsTrigger
              value="group"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Users className="w-4 h-4 mr-2" /> Group
            </TabsTrigger>
            <TabsTrigger
              value="friend"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <User className="w-4 h-4 mr-2" /> Friend
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-300">
          {activeTab === "group" ? (
            <div className="space-y-3">
              <Select
                onValueChange={(val) => setValue("group_id", val)}
                value={selectedGroupId || ""}
              >
                <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                  <SelectValue
                    placeholder={
                      loadingGroups ? "Loading..." : "Select a Group"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {groups?.length === 0 && !loadingGroups && (
                <div className="p-4 border border-dashed rounded-xl flex flex-col items-center justify-center text-center gap-2 bg-slate-50/50">
                  <p className="text-sm text-slate-500">No groups found.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateGroup(true)}
                  >
                    <PlusCircle className="w-4 h-4" /> Create New Group
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Select
                onValueChange={(val) => setValue("friend_id", val)}
                value={selectedFriendId || ""}
              >
                <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                  <SelectValue
                    placeholder={
                      loadingFriends ? "Loading..." : "Select a Friend"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {friends?.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {isContextSelected ? (
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div>
            <Label className="mb-3 block text-base font-semibold text-slate-700">
              Quick Entry (Optional)
            </Label>
            <SmartInputs
              onDraftReceived={handleSmartDraft}
              contextData={{
                type: activeTab,
                id: selectedGroupId || selectedFriendId || null,
                name: "",
              }}
            />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Description</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    {...register("description")}
                    placeholder="e.g. Flight tickets"
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
                {formState.errors.description && (
                  <p className="text-red-500 text-xs">
                    {formState.errors.description.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-400 font-bold">
                    ₹
                  </span>
                  <Input
                    {...register("amount")}
                    type="number"
                    placeholder="0.00"
                    className="pl-8 h-12 rounded-xl text-lg font-bold"
                  />
                </div>
                {formState.errors.amount && (
                  <p className="text-red-500 text-xs">
                    {formState.errors.amount.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  onValueChange={(v) => setValue("category", v)}
                  defaultValue="General"
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "General",
                      "Food",
                      "Travel",
                      "Entertainment",
                      "Utilities",
                    ].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    type="date"
                    {...register("date")}
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm",
              !amount && "opacity-50 pointer-events-none"
            )}
          >
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Who paid?</Label>
            </div>

            {/* FIXED: Passed memoized members and stable callback */}
            <PayerSelector
              members={activeMembers}
              totalAmount={amount}
              currentUser={currentUser}
              onChange={handlePayerChange}
            />
            {formState.errors.payers && (
              <p className="text-red-500 text-xs mt-2 font-medium bg-red-50 p-2 rounded-md">
                Error: Sum of payers must equal total amount.
              </p>
            )}
          </div>

          <div
            className={cn(
              "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm",
              !amount && "opacity-50 pointer-events-none"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <Label className="text-base font-semibold">Split Method</Label>
              </div>
              <Select
                onValueChange={(v: any) => setValue("split_type", v)}
                defaultValue="EQUAL"
              >
                <SelectTrigger className="h-9 w-32 rounded-lg bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EQUAL">Equal</SelectItem>
                  <SelectItem value="EXACT">Exact</SelectItem>
                  <SelectItem value="PERCENTAGE">%</SelectItem>
                  <SelectItem value="SHARE">Shares</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* FIXED: Passed memoized members */}
            <SplitDistribution
              splitType={splitType}
              amount={amount}
              members={activeMembers}
              setValue={setValue}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-12 rounded-xl"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formState.isSubmitting}
              className="flex-[2] h-12 rounded-xl shadow-lg shadow-primary/20"
            >
              {formState.isSubmitting ? "Creating..." : "Create Expense"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <div className="h-16 w-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">
            Start by selecting a context
          </h3>
          <p className="text-slate-500 max-w-xs mt-2">
            Choose a Group or Friend above to begin splitting expenses.
          </p>
        </div>
      )}

      {showCreateGroup && (
        <CreateGroupDialog onClose={() => setShowCreateGroup(false)} />
      )}
    </div>
  );
}
