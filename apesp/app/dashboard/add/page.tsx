"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { Button } from "@/src/components/ui/Button";
import { Loader2, UserPlus, CheckCircle } from "lucide-react";
import { useToastStore } from "@/src/hooks/use-toast";

export default function AddFriendPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const { addToast } = useToastStore();

  // 1. Lookup the User based on code
  const {
    data: userProfile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-lookup", code],
    queryFn: async () => {
      const res = await api.get(`/users/lookup?code=${code}`);
      return res.data.data;
    },
    enabled: !!code, // Only run if code exists
    retry: false,
  });

  // 2. Mutation to Send Request
  const {
    mutate: sendRequest,
    isPending: isSending,
    isSuccess,
  } = useMutation({
    mutationFn: async () => {
      await api.post("/friends/requests", { invite_code: code });
    },
    onSuccess: () => {
      addToast("Friend request sent!", "success");
      setTimeout(() => router.push("/dashboard/friends"), 1500);
    },
    onError: (err: any) => {
      addToast(
        err?.response?.data?.message || "Failed to send request",
        "error"
      );
    },
  });

  if (!code) return <div className="p-8 text-center">Invalid link.</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto p-6">
      {isLoading ? (
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      ) : error ? (
        <div className="text-center space-y-4">
          <p className="text-red-500 font-medium">
            User not found or code expired.
          </p>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go Home
          </Button>
        </div>
      ) : userProfile ? (
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="mx-auto h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400">
            {userProfile.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              userProfile.name[0]
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {userProfile.name}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              wants to connect on pAIse
            </p>
          </div>

          {isSuccess ? (
            <div className="flex flex-col items-center gap-2 text-green-600 bg-green-50 p-4 rounded-xl">
              <CheckCircle className="h-6 w-6" />
              <span className="font-medium">Request Sent!</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
              <Button onClick={() => sendRequest()} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Add Friend
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
