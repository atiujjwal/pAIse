"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  User,
  Calendar,
  Tag,
  FileText,
  Wallet,
  PlusCircle,
  UserPlus,
  ArrowLeft,
} from "lucide-react";

import { api } from "@/src/lib/api";
import { useToastStore } from "@/src/hooks/use-toast";
import { useAuthStore } from "@/src/features/auth/store";
import { useGroupsList } from "@/src/features/groups/api/group-list-query";
import { useGroupMembers } from "@/src/features/groups/api/group-members-query";
import { useFriends } from "@/src/features/friends/api/friend-queries";

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
import { useNavigationGuard } from "@/src/hooks/use-navigation-guard";

export default function ExpenseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToastStore();
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // --- Read Query Params (Pre-fill) ---
  const preSelectedGroupId = searchParams.get("groupId");

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
      group_id: preSelectedGroupId || null,
      friend_id: null,
    },
  });

  const { register, setValue, control, handleSubmit, formState } = form;
  const { isDirty } = formState;
  const setIsDirty = useNavigationGuard((state) => state.setIsDirty);

  useEffect(() => {
    setIsDirty(isDirty);
    return () => setIsDirty(false);
  }, [isDirty, setIsDirty]);

  // --- Watch Values ---
  const selectedGroupId = useWatch({ control, name: "group_id" });
  const selectedFriendId = useWatch({ control, name: "friend_id" });
  const splitType = useWatch({ control, name: "split_type" });
  const amount = useWatch({ control, name: "amount" });

  // --- State: Context Switching ---
  const [activeTab, setActiveTab] = useState<"group" | "friend">("group");

  const isContextSelected =
    (activeTab === "group" && !!selectedGroupId) ||
    (activeTab === "friend" && !!selectedFriendId);

  useEffect(() => {
    if (activeTab === "group") {
      if (!selectedGroupId && selectedFriendId) setValue("friend_id", null);
    } else {
      if (!selectedFriendId && selectedGroupId) setValue("group_id", null);
    }
  }, [activeTab, setValue, selectedGroupId, selectedFriendId]);

  // --- Logic: Fetch & Memoize Members ---
  const { data: groupMembers } = useGroupMembers(selectedGroupId || null);

  const activeMembers = useMemo(() => {
    if (selectedGroupId && groupMembers) return groupMembers;
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
    const rawAmount = draft.total_amount || draft.amount;
    if (rawAmount) {
      const cleanAmount = String(rawAmount).replace(/[^0-9.]/g, "");
      setValue("amount", cleanAmount);
    }

    if (draft.merchant) setValue("description", `Payment to ${draft.merchant}`);
    else if (draft.description) setValue("description", draft.description);

    if (draft.date) {
      try {
        setValue("date", new Date(draft.date).toISOString().split("T")[0]);
      } catch (e) {
        /* empty */
      }
    }

    const detectedCategory = draft.category_suggestion || draft.category;
    if (detectedCategory) {
      const validCategories = [
        "General",
        "Food",
        "Travel",
        "Entertainment",
        "Utilities",
      ];
      const formattedCat =
        detectedCategory.charAt(0).toUpperCase() +
        detectedCategory.slice(1).toLowerCase();
      setValue(
        "category",
        validCategories.includes(formattedCat) ? formattedCat : "General"
      );
    }

    if (draft.split_type) setValue("split_type", draft.split_type);

    if (draft.payers?.length > 0) {
      const validPayers = draft.payers.filter((p: any) =>
        activeMembers.some((m) => m.id === p.user_id)
      );
      if (validPayers.length > 0)
        setValue("payers", validPayers, { shouldValidate: true });
    }

    if (draft.splits?.length > 0) {
      const validSplits = draft.splits.filter((s: any) =>
        activeMembers.some((m) => m.id === s.user_id)
      );
      if (validSplits.length > 0)
        setValue("splits", validSplits, { shouldValidate: true });
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      await api.post("/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (selectedGroupId) {
        queryClient.invalidateQueries({
          queryKey: ["groups", selectedGroupId],
        });
        queryClient.invalidateQueries({
          queryKey: ["balances", selectedGroupId],
        });
      }
      addToast("Expense created successfully", "success");
      if (preSelectedGroupId) {
        router.push(`/dashboard/groups/${preSelectedGroupId}`);
      } else {
        router.push("/dashboard/expenses");
      }
    },
    onError: (err: any) =>
      addToast(err?.message || "Failed to create expense", "error"),
  });

  return (
    <div className="max-w-2xl mx-auto pb-20 pt-6 px-4 sm:px-0">
      {/* SECTION 1: CONTEXT */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-bold text-foreground">
            Who are you splitting with?
          </Label>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-muted rounded-2xl">
            <TabsTrigger
              value="group"
              className="rounded-xl h-full data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Users className="w-4 h-4 mr-2" /> Group
            </TabsTrigger>
            <TabsTrigger
              value="friend"
              className="rounded-xl h-full data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <User className="w-4 h-4 mr-2" /> Friend
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="animate-in slide-in-from-top-2 fade-in duration-300">
          {activeTab === "group" ? (
            <div className="space-y-3">
              <Select
                onValueChange={(val) => setValue("group_id", val)}
                value={selectedGroupId || ""}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-card border-border shadow-sm text-base focus:ring-primary/20">
                  <SelectValue
                    placeholder={
                      loadingGroups ? "Loading groups..." : "Select a Group"
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
                <div className="p-6 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center gap-3 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    No groups found.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateGroup(true)}
                    className="rounded-xl border-dashed border-border"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> Create New Group
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
                <SelectTrigger className="h-14 rounded-2xl bg-card border-border shadow-sm text-base focus:ring-primary/20">
                  <SelectValue
                    placeholder={
                      loadingFriends ? "Loading friends..." : "Select a Friend"
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

              {friends?.length === 0 && !loadingFriends && (
                <div className="p-6 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center gap-3 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    No friends found.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/friends")}
                    className="rounded-xl border-dashed border-border"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- FORM BODY --- */}
      {isContextSelected ? (
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* Smart Inputs */}
          <div>
            <Label className="mb-3 block text-base font-semibold text-foreground">
              Smart Entry (Optional)
            </Label>
            <SmartInputs
              onDraftReceived={handleSmartDraft}
              contextData={{
                type: activeTab,
                id: selectedGroupId || selectedFriendId || null,
                name: selectedGroupId
                  ? groups?.find((g) => g.id === selectedGroupId)?.name || ""
                  : friends?.find((f) => f.id === selectedFriendId)?.name || "",
              }}
            />
          </div>

          {/* Manual Details Card */}
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Description</Label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    {...register("description")}
                    placeholder="e.g. Flight tickets"
                    className="pl-11 h-12 rounded-xl text-base"
                  />
                </div>
                {formState.errors.description && (
                  <p className="text-destructive text-xs font-medium">
                    {formState.errors.description.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-muted-foreground font-bold">
                    ₹
                  </span>
                  <Input
                    {...register("amount")}
                    type="number"
                    placeholder="0.00"
                    className="pl-9 h-12 rounded-xl text-lg font-bold"
                  />
                </div>
                {formState.errors.amount && (
                  <p className="text-destructive text-xs font-medium">
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
                  value={form.watch("category")}
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
                  <Calendar className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    {...register("date")}
                    className="pl-11 h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payers Card */}
          <div
            className={cn(
              "rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm transition-all duration-300",
              !amount && "opacity-60 pointer-events-none grayscale-[0.5]"
            )}
          >
            <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <Label className="text-lg font-bold">Who paid?</Label>
            </div>
            <PayerSelector
              members={activeMembers}
              totalAmount={amount}
              currentUser={currentUser}
              onChange={handlePayerChange}
            />
            {formState.errors.payers && (
              <p className="text-destructive text-sm mt-3 font-medium bg-destructive/10 p-3 rounded-xl">
                Error: The sum of payers must equal the total amount.
              </p>
            )}
          </div>

          {/* Split Logic Card */}
          <div
            className={cn(
              "rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm transition-all duration-300",
              !amount && "opacity-60 pointer-events-none grayscale-[0.5]"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-full">
                  <Tag className="h-5 w-5 text-secondary" />
                </div>
                <Label className="text-lg font-bold">How to split?</Label>
              </div>
              <Select
                onValueChange={(v: any) => setValue("split_type", v)}
                defaultValue="EQUAL"
              >
                <SelectTrigger className="h-10 w-full sm:w-40 rounded-xl bg-muted/50 border-transparent hover:bg-muted focus:ring-secondary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EQUAL">Equal</SelectItem>
                  <SelectItem value="EXACT">Exact Amount</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="SHARE">Shares</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <SplitDistribution
              splitType={splitType}
              amount={amount}
              members={activeMembers}
              setValue={setValue}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-14 rounded-2xl text-base text-muted-foreground hover:bg-muted"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formState.isSubmitting}
              className="flex-[2] h-14 rounded-2xl text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
            >
              {formState.isSubmitting ? "Creating..." : "Create Expense"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border rounded-3xl bg-muted/20">
          <div className="h-20 w-20 bg-card rounded-full shadow-sm border border-border flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Start by selecting a context
          </h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            Choose a Group or Friend at the top to begin tracking your expenses.
          </p>
        </div>
      )}

      {showCreateGroup && (
        <CreateGroupDialog
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
        />
      )}
    </div>
  );
}
