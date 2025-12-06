import { User } from "@/src/lib/types";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";


interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null; // Stored in LS as per blueprint Section 3.2
  isAuthenticated: boolean;

  // Actions
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
      name: "auth-storage", // key in localStorage
      storage: createJSONStorage(() => localStorage),
      // Only persist refresh token and user. Access token is ephemeral but
      // for simplicity in this architecture we persist all to recover session on refresh.
      // Ideally access token is memory-only, but Next.js SSR hydration makes that tricky without cookies.
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
