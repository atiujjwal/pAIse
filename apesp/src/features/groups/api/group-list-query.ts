import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/api";

export interface GroupSummary {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_at: string;
  _count?: {
    members: number;
  };
}

export const useGroupsList = () => {
  return useQuery({
    queryKey: ["groups", "list"],
    queryFn: async () => {
      // Integration: GET /api/users/me/groups
      // Ensure your backend includes `_count: { members: true }` in the Prisma query
      const { data } = await api.get<ApiResponse<{ groups: GroupSummary[] }>>(
        "api/users/me/groups"
      );
      return data.data?.groups || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });
};
