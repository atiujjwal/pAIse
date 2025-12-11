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
} from "lucide-react";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { cn } from "@/src/lib/utils";

export default function FriendsPage() {
  const [requestType, setRequestType] = useState<"incoming" | "outgoing">(
    "incoming"
  );

  const { data: friends, isLoading: loadingFriends } = useFriends();
  const { data: requests, isLoading: loadingRequests } =
    useFriendRequests(requestType);

  const { acceptRequest, rejectRequest, cancelRequest } = useFriendActions();

  return (
    <div className="space-y-6 h-full flex flex-col pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Friends
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your connections and requests.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        <div className="lg:col-span-2">
          <Tabs defaultValue="my-friends" className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto h-12">
              <TabsTrigger
                value="my-friends"
                className="rounded-lg h-10 px-6 transition-all"
              >
                My Friends ({friends?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="rounded-lg h-10 px-6 transition-all"
              >
                Requests
                {/* Badge: Only show count for incoming requests */}
                {requestType === "incoming" &&
                  requests &&
                  requests.length > 0 && (
                    <span className="ml-2 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                      {requests.length}
                    </span>
                  )}
              </TabsTrigger>
            </TabsList>

            {/* --- TAB: MY FRIENDS --- */}
            <TabsContent value="my-friends" className="mt-6">
              {loadingFriends ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl"
                    >
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : friends?.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Users className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    No friends yet
                  </h3>
                  <p className="text-slate-500 max-w-sm mx-auto mt-1">
                    Add friends using the panel on the right.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {friends?.map((friend) => (
                    <Link
                      key={friend.id}
                      href={`/dashboard/friends/${friend.id}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-purple-100 text-lg font-bold text-primary border-2 border-white shadow-sm overflow-hidden">
                          {friend.avatar ? (
                            <img
                              src={friend.avatar}
                              alt={friend.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            friend.name[0]
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                            {friend.name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {friend.email}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* --- TAB: REQUESTS --- */}
            <TabsContent value="requests" className="mt-6 space-y-6">
              {/* Sub-Tabs Toggle */}
              <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
                <button
                  onClick={() => setRequestType("incoming")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    requestType === "incoming"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Received
                </button>
                <button
                  onClick={() => setRequestType("outgoing")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    requestType === "outgoing"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Sent
                </button>
              </div>

              <div className="space-y-4">
                {loadingRequests ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : requests?.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <p className="text-slate-500">No {requestType} requests.</p>
                  </div>
                ) : (
                  requests?.map((req) => {
                    // Logic: If outgoing, display 'addressee'. If incoming, display 'requester'.
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
                          "flex items-center justify-between rounded-2xl border p-5 shadow-sm",
                          requestType === "incoming"
                            ? "border-blue-100 bg-blue-50/30"
                            : "border-slate-200 bg-slate-50/50"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          {/* UPDATED: Avatar with Status Badge */}
                          <div className="relative">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-white shadow-sm overflow-hidden text-lg font-bold text-slate-600 bg-slate-100">
                              {displayUser?.avatar ? (
                                <img
                                  src={displayUser.avatar}
                                  alt={userName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                userName[0]
                              )}
                            </div>

                            {/* Status Icon Overlay */}
                            <div
                              className={cn(
                                "absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm",
                                requestType === "incoming"
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-slate-200 text-slate-600"
                              )}
                            >
                              {requestType === "incoming" ? (
                                <ArrowDownLeft className="h-3 w-3" />
                              ) : (
                                <ArrowUpRight className="h-3 w-3" />
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-slate-900">
                              {requestType === "incoming" ? (
                                <>
                                  <span className="font-bold">{userName}</span>{" "}
                                  sent you a request.
                                </>
                              ) : (
                                <>
                                  You sent a request to{" "}
                                  <span className="font-bold">{userName}</span>.
                                </>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 font-mono">
                              {userEmail}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {requestType === "incoming" ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => rejectRequest.mutate(req.id)}
                                disabled={rejectRequest.isPending}
                                className="hover:text-red-600 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => acceptRequest.mutate(req.id)}
                                disabled={acceptRequest.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
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
                              className="text-slate-600 border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
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

        <div className="lg:col-span-1">
          <AddFriendCard />
        </div>
      </div>
    </div>
  );
}
