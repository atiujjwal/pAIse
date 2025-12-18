import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { ApiResponse, User } from "@/src/types/api";

export interface GroupMember {
  user: User;
  role: "ADMIN" | "MEMBER";
}

export interface ExpenseParticipant {
  id: string;
  name: string;
  avatar: string;
  role: "ADMIN" | "MEMBER";
}

export const useGroupMembers = (groupId: string | null | undefined) => {
  const result = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data } = await api.get<
        ApiResponse<GroupMember[]>
      >(`/groups/${groupId}/members`);
      const members = data.data! || [];
      return members.map<ExpenseParticipant>((m) => ({
        id: m.user.id,
        name: m.user.name,
        avatar: m.user?.avatar!,
        role: m.role,
      }));
    },
    enabled: !!groupId && groupId !== "personal",
    staleTime: 1000 * 60 * 5,
  });

  return result;
};
