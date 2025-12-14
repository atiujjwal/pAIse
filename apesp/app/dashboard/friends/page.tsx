"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useFriends,
  useFriendRequests,
  useFriendActions,
} from "@/src/features/friends/api/friend-queries";
import { AddFriendCard } from "@/src/features/friends/components/AddFriendCard";
import { Button } from "@/src/components/ui/Button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  UserPlus,
  Check,
  X,
  Users,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Ban,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Skeleton } from "@/src/components/ui/Skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
import { cn, formatCurrency } from "@/src/lib/utils";
import { SettlementModal } from "@/src/features/settlements/components/SettlementModal";

// Define the interface based on your API response
interface FriendListItem {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  net_balance: string;
  status: "settled" | "owe" | "owed";
  currency: string;
}

export default function FriendsPage() {
  const [requestType, setRequestType] = useState<"incoming" | "outgoing">(
    "incoming"
  );
  const [selectedFriend, setSelectedFriend] = useState<FriendListItem | null>(
    null
  );
  const [showSettlement, setShowSettlement] = useState(false);

  // Cast response to the new interface
  const { data: friendsData, isLoading: loadingFriends } = useFriends();
  const friends = friendsData as unknown as FriendListItem[];

  const { data: requests, isLoading: loadingRequests } =
    useFriendRequests(requestType);
  const { acceptRequest, rejectRequest, cancelRequest } = useFriendActions();

  return (
    <div className="space-y-8 h-full flex flex-col pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Friends
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your connections and balances.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="my-friends" className="w-full">
            <TabsList className="bg-muted p-1.5 rounded-2xl w-full sm:w-auto h-14">
              <TabsTrigger
                value="my-friends"
                className="rounded-xl h-full px-6 transition-all text-sm font-bold"
              >
                My Friends ({friends?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="rounded-xl h-full px-6 transition-all text-sm font-bold"
              >
                Requests
                {requestType === "incoming" &&
                  requests &&
                  requests.length > 0 && (
                    <span className="ml-2 rounded-full bg-primary/20 text-primary px-2 py-0.5 text-xs">
                      {requests.length}
                    </span>
                  )}
              </TabsTrigger>
            </TabsList>

            {/* --- TAB: MY FRIENDS --- */}
            <TabsContent
              value="my-friends"
              className="mt-8 animate-in fade-in slide-in-from-bottom-2"
            >
              {loadingFriends ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 rounded-3xl" />
                  ))}
                </div>
              ) : friends?.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-card">
                  <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    No friends yet
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                    Add friends using their email or pAIse Tag on the right.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {friends?.map((friend) => {
                    const isOwe = friend.status === "owe";
                    const isOwed = friend.status === "owed";
                    const isSettled = friend.status === "settled";

                    return (
                      <Link
                        key={friend.id}
                        href={`/dashboard/friends/${friend.id}`}
                        className="group relative flex flex-col justify-between rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1"
                      >
                        {/* Top: Info */}
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14 border-2 border-background shadow-md">
                            <AvatarImage
                              src={friend.avatar || undefined}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                              {friend.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                              {friend.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {friend.email}
                            </p>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <ChevronRight className="h-4 w-4 text-foreground" />
                          </div>
                        </div>

                        {/* Bottom: Balance Status */}
                        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                              Net Balance
                            </span>
                            <div
                              className={cn(
                                "flex items-center gap-1.5 mt-0.5 font-bold",
                                isOwe
                                  ? "text-destructive"
                                  : isOwed
                                  ? "text-secondary"
                                  : "text-muted-foreground"
                              )}
                            >
                              {isOwe && <TrendingDown className="h-4 w-4" />}
                              {isOwed && <TrendingUp className="h-4 w-4" />}
                              {isSettled && (
                                <CheckCircle2 className="h-4 w-4" />
                              )}

                              <span className="font-mono text-lg">
                                {isSettled
                                  ? "Settled"
                                  : formatCurrency(
                                      friend.net_balance,
                                      friend.currency
                                    )}
                              </span>
                            </div>
                          </div>

                          {/* Visual Tag */}
                          {!isSettled && (
                            <div
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wide shadow-sm",
                                isOwe
                                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                                  : "bg-secondary/10 text-secondary border border-secondary/20"
                              )}
                            >
                              {isOwe ? "You Owe" : "Owes You"}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* --- TAB: REQUESTS --- */}
            <TabsContent value="requests" className="mt-8 space-y-6">
              {/* Sub-Tabs Toggle */}
              <div className="flex p-1 bg-muted rounded-xl w-fit">
                <button
                  onClick={() => setRequestType("incoming")}
                  className={cn(
                    "px-5 py-2 text-sm font-bold rounded-lg transition-all",
                    requestType === "incoming"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Received
                </button>
                <button
                  onClick={() => setRequestType("outgoing")}
                  className={cn(
                    "px-5 py-2 text-sm font-bold rounded-lg transition-all",
                    requestType === "outgoing"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Sent
                </button>
              </div>

              <div className="space-y-4">
                {loadingRequests ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-3xl" />
                    ))}
                  </div>
                ) : requests?.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-card">
                    <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground font-medium">
                      No {requestType} requests pending.
                    </p>
                  </div>
                ) : (
                  requests?.map((req) => {
                    const displayUser =
                      requestType === "outgoing"
                        ? req.addressee
                        : req.requester;
                    const userName = displayUser?.name || "Unknown";
                    const userEmail = displayUser?.email || "";

                    return (
                      <div
                        key={req.id}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border p-6 shadow-sm transition-all",
                          requestType === "incoming"
                            ? "border-primary/20 bg-primary/5"
                            : "border-border bg-card"
                        )}
                      >
                        <div className="flex items-center gap-5">
                          <div className="relative">
                            <Avatar className="h-14 w-14 border-2 border-background shadow-md">
                              <AvatarImage
                                src={displayUser?.avatar || undefined}
                              />
                              <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                                {userName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={cn(
                                "absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center border-2 border-background shadow-sm",
                                requestType === "incoming"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {requestType === "incoming" ? (
                                <ArrowDownLeft className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-base text-foreground">
                              {requestType === "incoming" ? (
                                <>
                                  <span className="font-bold">{userName}</span>{" "}
                                  <span className="text-muted-foreground">
                                    sent a request.
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-muted-foreground">
                                    Sent to
                                  </span>{" "}
                                  <span className="font-bold">{userName}</span>
                                </>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                              {userEmail}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                          {requestType === "incoming" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rejectRequest.mutate(req.id)}
                                disabled={rejectRequest.isPending}
                                className="flex-1 sm:flex-none border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive h-10 rounded-xl"
                              >
                                <X className="h-4 w-4 mr-1" /> Decline
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => acceptRequest.mutate(req.id)}
                                disabled={acceptRequest.isPending}
                                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-xl shadow-md"
                              >
                                <Check className="h-4 w-4 mr-1" /> Accept
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelRequest.mutate(req.id)}
                              disabled={cancelRequest.isPending}
                              className="flex-1 sm:flex-none border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 h-10 rounded-xl"
                            >
                              <Ban className="h-3.5 w-3.5 mr-1.5" /> Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar: Add Friend */}
        <div className="lg:col-span-1">
          <AddFriendCard />
        </div>
      </div>

      {/* Settle Modal (If needed from query param or derived state later) */}
      {showSettlement && selectedFriend && (
        <SettlementModal
          isOpen={showSettlement}
          onClose={() => setShowSettlement(false)}
          currentUser={{ id: "me", name: "Me" }} // In real app, get from store
          counterparty={{
            id: selectedFriend.id,
            name: selectedFriend.name,
            avatar: selectedFriend.avatar,
          }}
        />
      )}
    </div>
  );
}
