"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { Button } from "@/src/components/ui/Button";
import { Loader2, UserPlus, CheckCircle, XCircle, Home } from "lucide-react";
import { useToastStore } from "@/src/hooks/use-toast";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";

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
    enabled: !!code,
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

  if (!code) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-4">
        <div className="text-center p-10 bg-card rounded-[2.5rem] border border-border shadow-sm max-w-sm w-full">
          <div className="mx-auto h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Invalid Link
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            This invite link is invalid or missing.
          </p>
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => router.push("/dashboard")}
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full p-4">
      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">
            Finding user...
          </p>
        </div>
      ) : error ? (
        <div className="text-center space-y-6 p-10 bg-card rounded-[2.5rem] border border-destructive/20 bg-destructive/5 shadow-sm max-w-sm w-full animate-in zoom-in-95 duration-300">
          <div className="mx-auto h-20 w-20 bg-background rounded-full flex items-center justify-center shadow-sm border border-destructive/20">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Link Expired</h3>
            <p className="text-muted-foreground text-sm mt-2">
              We couldn't find the user associated with this link. It may have
              been reset.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-destructive/20 hover:bg-destructive/10 text-destructive hover:text-destructive"
            onClick={() => router.push("/dashboard")}
          >
            <Home className="mr-2 h-4 w-4" /> Go Home
          </Button>
        </div>
      ) : userProfile ? (
        <div className="w-full max-w-sm bg-card border border-border rounded-[2.5rem] p-10 shadow-xl shadow-primary/5 text-center space-y-8 animate-in zoom-in-95 duration-300">
          <div className="space-y-4">
            <div className="relative inline-block">
              <Avatar className="h-32 w-32 mx-auto border-4 border-background shadow-lg">
                <AvatarImage
                  src={userProfile.avatar}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
                  {userProfile.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 right-1 h-8 w-8 bg-background rounded-full flex items-center justify-center shadow-sm border border-border">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                {userProfile.name}
              </h2>
              <p className="text-muted-foreground text-sm mt-1 font-medium">
                wants to connect on pAIse
              </p>
            </div>
          </div>

          {isSuccess ? (
            <div className="flex flex-col items-center gap-3 text-secondary bg-secondary/10 p-6 rounded-2xl border border-secondary/20 animate-in fade-in slide-in-from-bottom-2">
              <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground shadow-md">
                <CheckCircle className="h-6 w-6" />
              </div>
              <span className="font-bold text-lg">Request Sent!</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="h-14 rounded-2xl border-border hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={() => sendRequest()}
                disabled={isSending}
                className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-5 w-5" />
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
