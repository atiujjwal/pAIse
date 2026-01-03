"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
import { formatCurrency, cn } from "@/src/lib/utils";
import { useRemindFriend } from "@/src/features/friends/api/friend-queries";

interface BalancesListProps {
  balances: any; // You can replace 'any' with your specific Balance type if available
  groupName: string;
  onSettleClick: (target: {
    id: string;
    name: string;
    amount: string;
    avatar?: string | null;
  }) => void;
}

export function BalancesList({
  balances,
  onSettleClick,
  groupName,
}: BalancesListProps) {
  const router = useRouter();
  const { mutate: remindFriend, isPending: isReminding } = useRemindFriend();
  const [remindedSet, setRemindedSet] = useState<Set<string>>(new Set());

  if (!balances) return null;

  const handleRemind = (userId: string, amount: string) => {
    if (remindedSet.has(userId)) return;
    const formattedAmount = formatCurrency(amount, balances.currency);

    remindFriend(
      {
        friendId: userId,
        amount: formattedAmount,
        message: `Reminder: You owe ${formattedAmount} in group "${groupName}".`,
      },
      { onSuccess: () => setRemindedSet((prev) => new Set(prev).add(userId)) }
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* YOU OWE */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-destructive uppercase tracking-wider flex items-center gap-2 px-2">
          <div className="w-2 h-2 rounded-full bg-destructive"></div> You Owe
        </h3>
        {balances.you_owe.length === 0 ? (
          <div className="p-8 rounded-[2rem] border border-dashed border-border bg-card text-center">
            <p className="text-muted-foreground text-sm font-medium">
              You don't owe anyone.
            </p>
          </div>
        ) : (
          balances.you_owe.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-2xl border border-destructive/20 bg-destructive/5 shadow-sm hover:shadow-md transition-all group"
            >
              <div
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => router.push(`/dashboard/friends/${item.id}`)}
              >
                <Avatar className="h-10 w-10 border border-background shadow-sm">
                  <AvatarImage src={item.avatar} />
                  <AvatarFallback className="bg-destructive/10 text-destructive font-bold">
                    {item.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    {item.name}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-bold text-destructive font-mono text-lg">
                  {formatCurrency(item.amount, balances.currency)}
                </span>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg shadow-sm"
                  onClick={() =>
                    onSettleClick({
                      id: item.id,
                      name: item.name,
                      amount: item.amount,
                      avatar: item.avatar,
                    })
                  }
                >
                  <Wallet className="h-3 w-3 mr-1" /> Settle
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* OWED TO YOU */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2 px-2">
          <div className="w-2 h-2 rounded-full bg-secondary"></div> Owed to You
        </h3>
        {balances.you_are_owed.length === 0 ? (
          <div className="p-8 rounded-[2rem] border border-dashed border-border bg-card text-center">
            <p className="text-muted-foreground text-sm font-medium">
              No one owes you.
            </p>
          </div>
        ) : (
          balances.you_are_owed.map((item: any) => {
            const isReminded = remindedSet.has(item.id);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-secondary/20 bg-secondary/5 shadow-sm hover:shadow-md transition-all group"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => router.push(`/dashboard/friends/${item.id}`)}
                >
                  <Avatar className="h-10 w-10 border border-background shadow-sm">
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback className="bg-secondary/10 text-secondary font-bold">
                      {item.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.name}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-bold text-secondary font-mono text-lg">
                    {formatCurrency(item.amount, balances.currency)}
                  </span>
                  <Button
                    size="sm"
                    disabled={isReminding || isReminded}
                    className={cn(
                      "h-8 text-xs rounded-lg shadow-sm transition-all",
                      isReminded
                        ? "bg-muted text-muted-foreground hover:bg-muted cursor-default"
                        : "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    )}
                    onClick={() => handleRemind(item.id, item.amount)}
                  >
                    {isReminded ? "Reminded" : "Remind"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
