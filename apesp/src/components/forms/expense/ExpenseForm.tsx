"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  User,
  Wallet,
  Tag,
  Calendar,
  FileText,
  Lock,
  Sparkles,
  PlusCircle,
  UserPlus,
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
  SelectSeparator,
} from "@/src/components/ui/Select";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { CreateExpenseInput, createExpenseSchema } from "@/src/lib/schemas";
import { SmartInputs } from "./SmartInputs";
import { PayerSelector } from "./PayerSelector";
import { SplitDistribution } from "./SplitDistribution";
import { useNavigationGuard } from "@/src/hooks/use-navigation-guard";
import { useExpenseWizardStore } from "@/src/features/expenses/store/wizard-store";
import { User as ApiUser } from "@/src/types/api";

interface ExpenseFormProps {
  mode?: "create" | "edit";
  expenseId?: string;
  initialData?: Partial<CreateExpenseInput>;
  preloadedMembers?: ApiUser[];
}

export interface ExpenseMember {
  id: string;
  name: string;
  avatar?: string | null;
}

export default function ExpenseForm({
  mode = "create",
  expenseId,
  initialData,
  preloadedMembers = [],
}: ExpenseFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToastStore();
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const wizardStore = useExpenseWizardStore();

  const preSelectedGroupId = searchParams.get("groupId");
  const preSelectedFriendId = searchParams.get("friendId");
  const contextParam = searchParams.get("context");

  const [draftMembers, setDraftMembers] = useState<ExpenseMember[]>([]);

  // Pending Data Queue
  const [pendingDraftData, setPendingDraftData] = useState<{
    payers: any[];
    splits: any[];
  } | null>(null);

  const { data: groups, isLoading: loadingGroups } = useGroupsList();
  const { data: friends, isLoading: loadingFriends } = useFriends();

  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: useMemo(() => {
      if (mode === "edit" && initialData) {
        return {
          ...initialData,
          payers: initialData.payers || [],
          splits: initialData.splits || [],
        };
      }
      return {
        amount: wizardStore.amount || "",
        description: wizardStore.description || "",
        date: wizardStore.date || new Date().toISOString().split("T")[0],
        split_type: wizardStore.split_type || "EQUAL",
        currency: "INR",
        category: wizardStore.category || "General",
        payers: wizardStore.payers || [],
        splits: wizardStore.splits || [],
        group_id: wizardStore.group_id || preSelectedGroupId || undefined,
        friend_id: wizardStore.friend_id || preSelectedFriendId || undefined,
      };
    }, [
      mode,
      initialData,
      wizardStore,
      preSelectedGroupId,
      preSelectedFriendId,
    ]),
  });

  const { register, setValue, control, handleSubmit, formState } = form;
  const { isDirty } = formState;
  const setIsDirty = useNavigationGuard((state) => state.setIsDirty);

  // Sync Form <-> Store (Create Mode Only)
  useEffect(() => {
    if (mode === "create") {
      if (wizardStore.amount) setValue("amount", wizardStore.amount);
      if (wizardStore.description)
        setValue("description", wizardStore.description);
      if (wizardStore.group_id) setValue("group_id", wizardStore.group_id);
      if (wizardStore.friend_id) setValue("friend_id", wizardStore.friend_id);
    }
  }, [wizardStore, setValue, mode]);

  useEffect(() => {
    setIsDirty(isDirty);
    return () => setIsDirty(false);
  }, [isDirty, setIsDirty]);

  const selectedGroupId = useWatch({ control, name: "group_id" });
  const selectedFriendId = useWatch({ control, name: "friend_id" });
  const splitType = useWatch({ control, name: "split_type" });
  const amount = useWatch({ control, name: "amount" });
  const payers = useWatch({ control, name: "payers" });
  const splits = useWatch({ control, name: "splits" });

  const [activeTab, setActiveTab] = useState<"group" | "friend">(
    preSelectedFriendId || contextParam === "friend" ? "friend" : "group"
  );

  useEffect(() => {
    if (selectedGroupId) setActiveTab("group");
    else if (selectedFriendId) setActiveTab("friend");
  }, [selectedGroupId, selectedFriendId]);

  const isContextSelected =
    (activeTab === "group" && !!selectedGroupId) ||
    (activeTab === "friend" && !!selectedFriendId);

  const { data: groupMembers } = useGroupMembers(selectedGroupId || null);

  const activeMembers = useMemo<ExpenseMember[]>(() => {
    // Draft Members 
    if (draftMembers.length > 0) return draftMembers;

    // Preloaded
    if (preloadedMembers.length > 0) {
      return preloadedMembers.map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
      }));
    }

    // Group
    if (selectedGroupId && groupMembers) {
      return groupMembers.map((m) => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
      }));
    }

    // Friend
    if (selectedFriendId && friends && currentUser) {
      const friend = friends.find((f) => f.id === selectedFriendId);
      return friend
        ? [
            {
              id: currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar,
            },
            {
              id: friend.id,
              name: friend.name,
              avatar: friend.avatar,
            },
          ]
        : [];
    }

    return [];
  }, [
    draftMembers,
    preloadedMembers,
    selectedGroupId,
    groupMembers,
    selectedFriendId,
    friends,
    currentUser,
  ]);

  useEffect(() => {
    if (pendingDraftData && activeMembers.length > 0) {
      setValue("payers", pendingDraftData.payers, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("splits", pendingDraftData.splits, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setPendingDraftData(null);
      addToast("Expense details populated successfully!", "success");
    }
  }, [activeMembers, pendingDraftData, setValue, addToast]);

  const handleDraftReceived = useCallback(
    (draft: any) => {
      // console.log("AI Draft Processing:", draft);
      if (!draft) return;

      const tempMap = new Map();
      const extractUser = (u: any) => {
        if (u && u.id) {
          tempMap.set(u.id, {
            id: u.id,
            name: u.name || "Unknown",
            avatar: u.avatar,
          });
        }
      };

      if (draft.created_by) extractUser(draft.created_by);
      if (draft.friend) extractUser(draft.friend);
      if (Array.isArray(draft.payers)) {
        draft.payers.forEach((p: any) => p.user && extractUser(p.user));
      }
      if (Array.isArray(draft.splits)) {
        draft.splits.forEach((s: any) => s.user && extractUser(s.user));
      }
      if (currentUser) extractUser(currentUser);

      const hydratedMembers = Array.from(tempMap.values());
      if (hydratedMembers.length > 0) {
        setDraftMembers(hydratedMembers);
      }

      if (draft.group_id) {
        setActiveTab("group");
        setValue("group_id", draft.group_id, {
          shouldValidate: true,
          shouldDirty: true,
        });
      } else if (draft.friend && draft.friend.id) {
        setActiveTab("friend");
        setValue("friend_id", draft.friend.id, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      const draftAmount = parseFloat(draft.amount || "0");
      if (draft.amount)
        setValue("amount", String(draftAmount), {
          shouldValidate: true,
          shouldDirty: true,
        });
      if (draft.description)
        setValue("description", draft.description, {
          shouldValidate: true,
          shouldDirty: true,
        });
      if (draft.category)
        setValue("category", draft.category, {
          shouldValidate: true,
          shouldDirty: true,
        });
      if (draft.date)
        setValue("date", draft.date.split("T")[0], {
          shouldValidate: true,
          shouldDirty: true,
        });
      if (draft.split_type)
        setValue("split_type", draft.split_type, {
          shouldValidate: true,
          shouldDirty: true,
        });

      // SET PAYERS & SPLITS
      // Allow a render cycle for members to be available
      setTimeout(() => {
        // PAYERS: Map correctly to { user_id, amount }
        if (draft.payers && Array.isArray(draft.payers)) {
          const mappedPayers = draft.payers.map((p: any) => ({
            user_id: p.user_id,
            amount: String(parseFloat(p.amount || "0")),
          }));
          setValue("payers", mappedPayers, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }

        if (draft.splits && Array.isArray(draft.splits)) {
          const mappedSplits = draft.splits.map((s: any) => {
            const baseSplit = { user_id: s.user_id };
            if (s.amount_owed) {
              return { ...baseSplit, amount_owed: String(s.amount_owed) };
            } else if (
              s.percent_owed !== null &&
              s.percent_owed !== undefined
            ) {
              return { ...baseSplit, percent_owed: s.percent_owed };
            } else if (s.shares_owed !== null && s.shares_owed !== undefined) {
              return { ...baseSplit, shares_owed: s.shares_owed };
            }
            return baseSplit;
          });
          setValue("splits", mappedSplits, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
        addToast("Expense details populated successfully!", "success");
      }, 100);
    },
    [setValue, addToast, currentUser]
  );

  const handlePayerChange = useCallback(
    (newPayers: any[]) => {
      setValue("payers", newPayers, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [setValue]
  );

  const mutation = useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      if (mode === "edit" && expenseId) {
        await api.put(`/expenses/${expenseId}`, data);
      } else {
        await api.post("/expenses", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (expenseId) {
        queryClient.invalidateQueries({ queryKey: ["expense", expenseId] });
      }
      addToast(
        mode === "edit" ? "Expense updated!" : "Expense created!",
        "success"
      );
      if (mode === "edit") {
        router.back();
      } else {
        router.push("/dashboard/expenses");
      }
    },
    onError: (err: any) =>
      addToast(
        err?.response?.data?.message || err?.message || "Operation failed",
        "error"
      ),
  });

  const onFormError = (errors: any) => {
    console.log("❌ FULL FORM ERRORS:", errors);
    const firstErrorKey = Object.keys(errors)[0];
    const errorMessage = errors[firstErrorKey]?.message;
    if (errorMessage === "Required") {
      addToast(`Missing field: ${firstErrorKey}`, "error");
    } else if (errorMessage) {
      addToast(`Error in ${firstErrorKey}: ${errorMessage}`, "error");
    } else {
      addToast("Validation failed. Please check the form.", "error");
    }
  };

  return (
    <div className="bg-card rounded-[2.5rem] border border-border shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 space-y-6">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-bold text-foreground">
            Who are you splitting with?
          </Label>
          {mode === "edit" && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-full text-xs font-medium text-muted-foreground">
              <Lock className="h-3 w-3" /> Locked while editing
            </div>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => mode === "create" && setActiveTab(v as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-muted rounded-2xl">
            <TabsTrigger
              value="group"
              disabled={mode === "edit"}
              className="rounded-xl h-full font-bold"
            >
              <Users className="w-4 h-4 mr-2" /> Group
            </TabsTrigger>
            <TabsTrigger
              value="friend"
              disabled={mode === "edit"}
              className="rounded-xl h-full font-bold"
            >
              <User className="w-4 h-4 mr-2" /> Friend
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="animate-in fade-in">
          {activeTab === "group" ? (
            <Select
              onValueChange={(val) => {
                if (val === "CREATE_NEW_GROUP") {
                  router.push("/dashboard/groups/new");
                } else {
                  setValue("group_id", val);
                }
              }}
              value={selectedGroupId || ""}
              disabled={mode === "edit"}
            >
              <SelectTrigger className="h-14 rounded-2xl bg-background border-border text-base">
                <SelectValue
                  placeholder={loadingGroups ? "Loading..." : "Select Group"}
                />
              </SelectTrigger>
              <SelectContent>
                {groups?.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
                {/* --- ADD NEW GROUP ACTION --- */}
                <div className="border-t border-border mt-1 pt-1">
                  <SelectItem
                    value="CREATE_NEW_GROUP"
                    className="text-primary font-semibold focus:bg-primary/10 focus:text-primary cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Create new group
                    </div>
                  </SelectItem>
                </div>
              </SelectContent>
            </Select>
          ) : (
            <Select
              onValueChange={(val) => {
                if (val === "ADD_NEW_FRIEND") {
                  router.push("/dashboard/friends?action=add"); // Assuming your friends page handles this
                } else {
                  setValue("friend_id", val);
                }
              }}
              value={selectedFriendId || ""}
              disabled={mode === "edit"}
            >
              <SelectTrigger className="h-14 rounded-2xl bg-background border-border text-base">
                <SelectValue
                  placeholder={loadingFriends ? "Loading..." : "Select Friend"}
                />
              </SelectTrigger>
              <SelectContent>
                {friends?.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
                {/* --- ADD NEW FRIEND ACTION --- */}
                <div className="border-t border-border mt-1 pt-1">
                  <SelectItem
                    value="ADD_NEW_FRIEND"
                    className="text-primary font-semibold focus:bg-primary/10 focus:text-primary cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Add new friend
                    </div>
                  </SelectItem>
                </div>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isContextSelected && (
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data), onFormError)}
          className="space-y-10"
        >
          {mode === "create" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <Label className="block text-base font-bold text-foreground">
                  Smart Entry
                </Label>
              </div>

              <SmartInputs
                onDraftReceived={handleDraftReceived}
                currentUser={currentUser}
                activeMembers={activeMembers}
                activeGroupId={selectedGroupId || null}
                activeFriendId={selectedFriendId || null}
                mode={activeTab}
              />
            </div>
          )}

          <div className="p-6 rounded-3xl bg-muted/20 border border-border space-y-6">
            <div className="space-y-2">
              <Label>Description</Label>
              <div className="relative">
                <FileText className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  {...register("description")}
                  placeholder="e.g. Dinner at Paradise"
                  className="pl-12 h-12 rounded-xl text-base bg-background"
                />
              </div>
              {formState.errors.description && (
                <p className="text-destructive text-xs">
                  {formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-lg font-bold text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    {...register("amount")}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-10 h-12 rounded-xl text-lg font-bold bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  onValueChange={(v) => setValue("category", v)}
                  value={form.watch("category")}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Food & Dining",
                      "Housing & Utilities",
                      "Transportation",
                      "Travel & Accommodation",
                      "Shopping & Personal",
                      "Entertainment & Social",
                      "Health & Wellness",
                      "Education & Work",
                      "Family",
                      "Bills & Subscriptions",
                      "Other",
                    ].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="date"
                  {...register("date")}
                  className="pl-12 h-12 rounded-xl bg-background"
                />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                  <Wallet className="h-5 w-5" />
                </div>
                <Label className="text-lg font-bold">Who paid?</Label>
              </div>
              <PayerSelector
                members={activeMembers}
                totalAmount={amount}
                currentUser={currentUser}
                onChange={handlePayerChange}
                value={payers}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                    <Tag className="h-5 w-5" />
                  </div>
                  <Label className="text-lg font-bold">Split Method</Label>
                </div>
                <Select
                  onValueChange={(v: any) => setValue("split_type", v)}
                  value={splitType}
                >
                  <SelectTrigger className="h-10 w-40 rounded-xl bg-muted/50 border-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EQUAL">Equal</SelectItem>
                    <SelectItem value="EXACT">Exact</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="SHARE">Shares</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <SplitDistribution
                splitType={splitType}
                amount={amount}
                members={activeMembers}
                setValue={setValue}
                value={splits}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border">
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
              disabled={mutation.isPending}
              className="flex-[2] h-12 rounded-xl shadow-lg shadow-primary/20"
            >
              {mutation.isPending
                ? "Saving..."
                : mode === "edit"
                ? "Update Expense"
                : "Create Expense"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
