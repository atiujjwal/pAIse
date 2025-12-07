"use client";

import { useState } from "react";
import {
  useFriends,
  useFriendRequests,
  useFriendActions,
} from "@/src/features/friends/api/friend-queries";
import { UserSearch } from "@/src/features/users/components/UserSearch"; // Ensure path is correct
import { Button } from "@/src/components/ui/Button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { UserPlus, Check, X, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { User } from "@/src/types/api";

export default function FriendsPage() {
  const { data: friends, isLoading: loadingFriends } = useFriends();
  const { data: requests, isLoading: loadingRequests } = useFriendRequests();
  const { sendRequest, acceptRequest, rejectRequest } = useFriendActions();
  const [activeTab, setActiveTab] = useState("my-friends");

  const handleAddFriend = (user: User) => {
    // Correctly call the mutation with the User ID
    sendRequest.mutate(user.id);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        {/* Left Column: Friends Lists */}
        <div className="lg:col-span-2">
          <Tabs
            defaultValue="my-friends"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList>
              <TabsTrigger value="my-friends">
                My Friends ({friends?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="requests">
                Requests
                {requests && requests.length > 0 && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {requests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-friends" className="mt-6">
              {loadingFriends ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : friends?.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground border rounded-xl border-dashed">
                  <UserIcon className="mx-auto mb-4 h-12 w-12 opacity-20" />
                  <p>You haven't added any friends yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {friends?.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                        {friend.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{friend.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {friend.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
              <div className="space-y-4">
                {loadingRequests ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  requests?.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                          <UserPlus className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            <span className="font-bold">
                              {req.requester.name}
                            </span>{" "}
                            sent a request
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => rejectRequest.mutate(req.id)}
                          disabled={rejectRequest.isPending}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => acceptRequest.mutate(req.id)}
                          disabled={acceptRequest.isPending}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Check className="h-4 w-4 mr-1" /> Accept
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                {!loadingRequests && requests?.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground border rounded-xl border-dashed">
                    <p>No pending requests.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Search & Add */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card p-4 sticky top-6">
            <h3 className="font-semibold mb-4">Add New Friends</h3>
            {/* This renders the list seen in your screenshot */}
            <UserSearch
              placeholder="Search by name..."
              onSelect={handleAddFriend}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
