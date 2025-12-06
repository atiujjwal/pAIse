"use client";

import { useState } from "react";
import { UserPlus, Check, X, User as UserIcon } from "lucide-react";
import { useFriendActions, useFriendRequests, useFriends } from "@/src/features/friends/api/friend-queries";
import { UserSearch } from "@/src/features/users/components/UserSearch";
import { Button } from "@/src/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Skeleton } from "@/src/components/ui/Skeleton";


export default function FriendsPage() {
  const { data: friends, isLoading: loadingFriends } = useFriends();
  const { data: requests, isLoading: loadingRequests } = useFriendRequests();
  const { sendRequest, acceptRequest, rejectRequest } = useFriendActions();
  const [activeTab, setActiveTab] = useState("my-friends");

  const handleAddFriend = (user: any) => {
    sendRequest.mutate(user.email);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
        <div className="w-full md:w-72">
          {/* Reusing UserSearch for adding friends directly */}
          <UserSearch
            placeholder="Add friend by name/email..."
            onSelect={handleAddFriend}
            className="w-full"
          />
        </div>
      </div>

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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : friends?.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <UserIcon className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p>You haven't added any friends yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {friends?.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm"
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
                  {/* Future: Add Balance badge here */}
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
                  className="flex items-center justify-between rounded-lg border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {req.requester.name} sent you a request
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectRequest.mutate(req.id)}
                      disabled={rejectRequest.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => acceptRequest.mutate(req.id)}
                      disabled={acceptRequest.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" /> Accept
                    </Button>
                  </div>
                </div>
              ))
            )}
            {!loadingRequests && requests?.length === 0 && (
              <p className="text-muted-foreground">No pending requests.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
