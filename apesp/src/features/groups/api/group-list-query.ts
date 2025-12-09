import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/api";

export interface GroupSummary {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_at: string;
  member_count: number;
}

export const useGroupsList = (search?: string) => {
  return useQuery({
    queryKey: ["groups", "list", search],
    queryFn: async () => {
      const params = search ? { search } : {};
      const { data } = await api.get<ApiResponse<{ groups: GroupSummary[] }>>(
        "/users/me/groups",
        { params }
      );
      return data.data?.groups || [];
    },
    placeholderData: (prev) => prev,
  });
};
