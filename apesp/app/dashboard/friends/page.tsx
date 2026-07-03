"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useFriends,
  useFriendRequests,
  useFriendActions,
  useBlockedUsers,
  useUnblockUser,
  useBlockUser,
} from "@/src/features/friends/api/friend-queries";
import { AddFriendCard } from "@/src/features/friends/components/AddFriendCard";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
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
  Search,
  ArrowUpDown,
  Wallet,
  Plus,
  Loader2,
  Unlock,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/src/components/ui/Dropdown-menu";
import { Skeleton } from "@/src/components/ui/Skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
import { cn, formatCurrency } from "@/src/lib/utils";
import { SettlementModal } from "@/src/features/settlements/components/SettlementModal";
import { useDebounce } from "@/src/hooks/use-debounce";
import { useToastStore } from "@/src/hooks/use-toast";

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

interface BlockedUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export default function FriendsPage() {
  const { addToast } = useToastStore();
  // --- STATE FOR FILTERS ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [sortBy] = useState<"balance">("balance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [requestType, setRequestType] = useState<"incoming" | "outgoing">(
    "incoming"
  );
  const [showSettlement, setShowSettlement] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendListItem | null>(
    null
  );

  // --- QUERIES ---
  const { data: friendsData, isLoading: loadingFriends } = useFriends({
    search: debouncedSearch,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const friends = (friendsData as unknown as FriendListItem[]) || [];
  const { data: requests, isLoading: loadingRequests } =
    useFriendRequests(requestType);
  const { acceptRequest, rejectRequest, cancelRequest } = useFriendActions();

  // --- BLOCKING QUERIES ---
  const { data: blockedUsers, isLoading: loadingBlocked } = useBlockedUsers();
  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();

  const handleBlockRequest = (userId: string) => {
    blockUser(userId, {
      onSuccess: () => addToast("User blocked", "success"),
      onError: (e: any) =>
        addToast(e?.response?.data?.message || "Failed to block", "error"),
    });
  };

  const handleUnblock = (userId: string) => {
    unblockUser(userId, {
      onSuccess: () => addToast("User unblocked", "success"),
      onError: (e: any) => addToast("Failed to unblock", "error"),
    });
  };

  return (
    <div className="space-y-8 flex flex-col max-w-7xl mx-auto">
      {/* --- HEADER --- */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Friends
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your connections and balances.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            asChild
            size="lg"
            className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105"
          >
            {/* Pass context=friend to pre-select the Friend tab */}
            <Link href="/dashboard/expenses/new?context=friend">
              <Plus className="mr-2 h-5 w-5" /> Add Expense
            </Link>
          </Button>
        </div>
      </div>

      {/* --- STICKY FILTER BAR --- */}
      <div className="sticky top-4 z-20">
        <div className="bg-background/80 backdrop-blur-xl p-3 rounded-2xl border border-border shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:border-primary/20 flex flex-col gap-3 max-w-2xl">
          {/* Search Input */}
          <div className="relative w-full group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-full border border-border bg-background/50 backdrop-blur-sm text-sm outline-none focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Sort Controls Row */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-2 h-10 px-4 rounded-full border text-sm font-semibold transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/20",
                    "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    Sort by: {sortOrder === "desc" ? "Balance (High to Low)" : "Balance (Low to High)"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 ml-1 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[220px] p-1 rounded-xl">
                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                  Sort Order
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => setSortOrder("desc")}
                  className={cn(
                    "rounded-lg focus:bg-muted cursor-pointer py-2",
                    sortOrder === "desc" && "bg-primary/5 text-primary font-semibold"
                  )}
                >
                  <span className="flex-1">Balance: High to Low</span>
                  {sortOrder === "desc" && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortOrder("asc")}
                  className={cn(
                    "rounded-lg focus:bg-muted cursor-pointer py-2",
                    sortOrder === "asc" && "bg-primary/5 text-primary font-semibold"
                  )}
                >
                  <span className="flex-1">Balance: Low to High</span>
                  {sortOrder === "asc" && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Reset Button (only shown when search is active or sort order is modified) */}
            {(searchTerm || sortOrder !== "desc") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSortOrder("desc");
                }}
                className="h-10 px-3 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 whitespace-nowrap transition-all"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              <TabsTrigger
                value="blocked"
                className="rounded-xl h-full px-6 transition-all text-sm font-bold text-muted-foreground data-[state=active]:text-foreground"
              >
                Blocked
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
                    <Skeleton key={i} className="h-40 rounded-[2.5rem]" />
                  ))}
                </div>
              ) : friends.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-card">
                  <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {searchTerm ? "No friends found" : "No friends yet"}
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                    {searchTerm
                      ? `We couldn't find anyone matching "${searchTerm}"`
                      : "Add friends using their email or pAIse Tag on the right."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {friends.map((friend) => {
                    const isOwe = friend.status === "owe";
                    const isOwed = friend.status === "owed";
                    const isSettled = friend.status === "settled";

                    return (
                      <Link
                        key={friend.id}
                        href={`/dashboard/friends/${friend.id}`}
                        className="group relative flex flex-col justify-between rounded-[2.5rem] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1"
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
                      <Skeleton
                        key={i}
                        className="h-24 w-full rounded-[2.5rem]"
                      />
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
                                className="flex-1 sm:flex-none border-border text-muted-foreground hover:bg-muted h-10 rounded-xl"
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
                              {/* Block Button for Incoming Request */}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() =>
                                  handleBlockRequest(displayUser.id)
                                }
                                disabled={isBlocking}
                                className="h-10 w-10 rounded-xl text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                title="Block User"
                              >
                                <Ban className="h-4 w-4" />
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

            {/* --- TAB: BLOCKED --- */}
            <TabsContent
              value="blocked"
              className="mt-8 animate-in fade-in slide-in-from-bottom-2"
            >
              {loadingBlocked ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-[2rem]" />
                  ))}
                </div>
              ) : !blockedUsers || blockedUsers.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-card">
                  <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Ban className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    No blocked users
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                    You haven't blocked anyone yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {(blockedUsers as unknown as BlockedUser[]).map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-3xl border border-border bg-card shadow-sm gap-4"
                    >
                      <div className="flex items-center gap-4 w-full">
                        <Avatar className="h-12 w-12 grayscale opacity-80">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground text-base strike-through decoration-muted-foreground/50">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(user.id)}
                        disabled={isUnblocking}
                        className="w-full sm:w-auto border-border text-foreground hover:bg-muted h-10 rounded-xl"
                      >
                        {isUnblocking ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Unlock className="h-4 w-4 mr-2" />
                        )}
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar: Add Friend */}
        <div className="lg:col-span-1">
          <AddFriendCard />
        </div>
      </div>

      {/* Settle Modal */}
      {showSettlement && selectedFriend && (
        <SettlementModal
          isOpen={showSettlement}
          onClose={() => setShowSettlement(false)}
          currentUser={{ id: "me", name: "Me" }}
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
