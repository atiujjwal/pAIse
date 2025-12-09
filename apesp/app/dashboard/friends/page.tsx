"use client";

import { useState } from "react";
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
import { UserPlus, Check, X, User as UserIcon, Users, Loader2 } from "lucide-react";
import { Skeleton } from "@/src/components/ui/Skeleton";

export default function FriendsPage() {
  const { data: friends, isLoading: loadingFriends } = useFriends();
  const { data: requests, isLoading: loadingRequests } = useFriendRequests();
  const { acceptRequest, rejectRequest } = useFriendActions();
  const [activeTab, setActiveTab] = useState("my-friends");

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
        {/* Left Column: Friends Lists & Requests */}
        <div className="lg:col-span-2">
          <Tabs
            defaultValue="my-friends"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto h-12">
              <TabsTrigger
                value="my-friends"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm h-10 px-6 transition-all"
              >
                My Friends ({friends?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm h-10 px-6 transition-all"
              >
                Requests
                {requests && requests.length > 0 && (
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
                    Add friends using the panel on the right to start splitting
                    expenses.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {friends?.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-primary/20 hover:shadow-md transition-all group"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-purple-100 text-lg font-bold text-primary">
                        {friend.avatar_url ? (
                          <img
                            src={friend.avatar_url}
                            alt={friend.name}
                            className="h-full w-full rounded-full object-cover"
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
                  ))}
                </div>
              )}
            </TabsContent>

            {/* --- TAB: REQUESTS --- */}
            <TabsContent value="requests" className="mt-6">
              <div className="space-y-4">
                {loadingRequests ? (
                  <Skeleton className="h-20 w-full rounded-xl" />
                ) : (
                  requests?.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/30 p-5 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200">
                          <UserPlus className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-900">
                            <span className="font-bold">
                              {req.requester.name}
                            </span>{" "}
                            sent you a friend request.
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(req.created_at).toLocaleDateString(
                              undefined,
                              { dateStyle: "medium" }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => rejectRequest.mutate(req.id)}
                          disabled={rejectRequest.isPending}
                          className="hover:bg-white hover:text-red-600 hover:shadow-sm"
                        >
                          {rejectRequest.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => acceptRequest.mutate(req.id)}
                          disabled={acceptRequest.isPending}
                          className="bg-primary hover:bg-primary/90 shadow-sm"
                        >
                          {acceptRequest.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1.5" /> Accept
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}

                {!loadingRequests && requests?.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <p className="text-slate-500">No pending requests.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: New Add Friend Card */}
        <div className="lg:col-span-1">
          <AddFriendCard />
        </div>
      </div>
    </div>
  );
}
