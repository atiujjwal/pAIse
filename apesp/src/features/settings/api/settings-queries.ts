import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { useAuthStore } from "@/src/features/auth/store";
import { useToastStore } from "@/src/hooks/use-toast";
import { User } from "@/src/types/api";

// Matches your backend Zod schema
interface UpdateProfilePayload {
  name?: string;
  avatar?: string | null;
  currency?: string;
  timezone?: string;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const updateUserStore = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const { data } = await api.patch<{ data: User }>("/users/me", payload);
      return data.data;
    },
    onSuccess: (user) => {
      updateUserStore(user);
      queryClient.setQueryData(["user", "me"], { data: { user } });
      addToast("Profile updated successfully", "success");
    },
    onError: (err: any) => {
      addToast(err?.message || "Failed to update profile", "error");
    },
  });
};
