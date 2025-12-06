import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/api";

interface GroupSummary {
  id: string;
  name: string;
}

export const useGroupsList = () => {
  return useQuery({
    queryKey: ["groups", "list"],
    queryFn: async () => {
      // Integration: GET /api/users/me/groups (or /groups depending on your backend route)
      // Matches the JSON in your screenshot: { success: true, data: { groups: [...] } }
      const { data } = await api.get<ApiResponse<{ groups: GroupSummary[] }>>(
        "api/users/me/groups"
      );
      return data.data?.groups || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });
};
