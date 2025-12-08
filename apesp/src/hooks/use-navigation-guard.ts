import { create } from "zustand";

interface NavigationGuardState {
  isDirty: boolean;
  setIsDirty: (value: boolean) => void;
}

export const useNavigationGuard = create<NavigationGuardState>((set) => ({
  isDirty: false,
  setIsDirty: (value) => set({ isDirty: value }),
}));
