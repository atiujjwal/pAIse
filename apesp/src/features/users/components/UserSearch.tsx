"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, UserPlus } from "lucide-react";
import { User } from "@/src/lib/types";
import { ApiResponse } from "@/src/lib/response";
import { api } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";
import { Input } from "@/src/components/ui/Input";
import { useDebounce } from "@/src/hooks/use-debounce";

interface UserSearchProps {
  onSelect: (user: User) => void;
  selectedIds?: string[];
  placeholder?: string;
  className?: string;
}

export function UserSearch({
  onSelect,
  selectedIds = [],
  placeholder,
  className,
}: UserSearchProps) {
  const [query, setQuery] = React.useState("");
  // Debounce API calls to prevent flooding [cite: 456]
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["users", "search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const res = await api.get<ApiResponse<{ users: User[] }>>(
        "/users/search",
        {
          params: { query: debouncedQuery },
        }
      );
      return res.data.data?.users || [];
    },
    enabled: debouncedQuery.length > 2,
    staleTime: 1000 * 60 * 5, // Cache search results briefly [cite: 878]
  });

  return (
    <div className={cn("relative", className)}>
      <Input
        placeholder={placeholder || "Search by name or email..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full"
      />

      {/* Results Dropdown */}
      {(isLoading || (data && data.length > 0)) && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {isLoading && (
            <div className="p-2 text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {data?.map((user) => {
            const isSelected = selectedIds.includes(user.id);
            return (
              <div
                key={user.id}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                  isSelected && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !isSelected && onSelect(user)}
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-full w-full rounded-full"
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
                {isSelected ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
