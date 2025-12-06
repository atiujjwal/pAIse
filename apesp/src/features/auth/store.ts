import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/src/types/api"; // Adjust path if needed

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateAccessToken: (token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      updateAccessToken: (accessToken) => set({ accessToken }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      // FIXED: Added 'accessToken' and 'isAuthenticated' to the persistence list
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        accessToken: state.accessToken, // Vital for surviving refresh
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
