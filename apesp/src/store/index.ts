import { create } from "zustand";
import { AnalyticsSummary, Expense, Group, User } from "../lib/types";
import { STORAGE_KEYS } from "../lib/constants";
import { sleep } from "../lib/utils";
import {
  loginApi,
  registerApi,
  logoutApi,
  getGroupsApi,
  createGroupApi,
  getExpensesApi,
  createExpenseApi,
  deleteExpenseApi,
  getDashboardSummaryApi,
  updateExpenseApi,
} from "../services/apiClient";

const getInitialUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

type AuthSlice = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
};

type GroupsSlice = {
  groups: Group[];
  fetchGroups: () => Promise<void>;
  addGroup: (g: Omit<Group, "id">) => Promise<string>;
};

type ExpensesSlice = {
  expenses: Expense[];
  fetchExpenses: (filters?: Record<string, any>) => Promise<void>;
  addExpense: (e: Omit<Expense, "id">) => Promise<string>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
};

type DashboardSlice = {
  summary: AnalyticsSummary | null;
  fetchSummary: () => Promise<void>;
};

export const useStore = create<
  AuthSlice & GroupsSlice & ExpensesSlice & DashboardSlice
>((set, get) => ({
  // Auth (backed by API)
  user: getInitialUser(),
  login: async (email, password) => {
    try {
      const data = await loginApi(email, password);
      const user: User = data?.user ?? data;
      set({ user });
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  },

  register: async (email, password, name) => {
    try {
      const data = await registerApi(email, password, name);
      const user: User = data?.user ?? data;
      set({ user });
    } catch (err) {
      console.error("Register failed:", err);
      throw err;
    }
  },

  logout: () => {
    logoutApi().catch((e) => console.warn("logout failed", e));
    set({ user: null });
  },

  // Groups (mock)
  groups: [],
  fetchGroups: async () => {
    try {
      const response = await getGroupsApi();
      // The API returns { success, message, data: { data: [...] } }
      set({ groups: response?.data?.data || [] });
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    }
  },

  addGroup: async (g) => {
    try {
      const created = await createGroupApi(g);
      set((state) => ({ groups: [...state.groups, created] }));
      return created.id;
    } catch (err) {
      console.error("Failed to create group:", err);
      throw err;
    }
  },

  // Expenses (mock)
  expenses: [],
  fetchExpenses: async (filters) => {
    try {
      const response = await getExpensesApi(filters);
      set({ expenses: response.data?.data || [] }); // Handle paginated response
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    }
  },

  addExpense: async (e) => {
    try {
      const response = await createExpenseApi(e);
      const created = response.data;
      set((state) => ({ expenses: [created, ...state.expenses] as Expense[] }));
      return created.id;
    } catch (err) {
      console.error("Failed to add expense:", err);
      throw err;
    }
  },

  updateExpense: async (id, data) => {
    try {
      const response = await updateExpenseApi(id, data);
      const updated = response.data;
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? updated : e)),
      }));
    } catch (err) {
      console.error("Failed to update expense:", err);
      throw err;
    }
  },

  deleteExpense: async (id) => {
    try {
      const prev = get().expenses;
      set({ expenses: prev.filter((x) => x.id !== id) });
      await deleteExpenseApi(id);
    } catch (err) {
      console.error("Failed to delete expense:", err);
      await get().fetchExpenses();
      throw err;
    }
  },

  // Dashboard (mock)
  summary: null,
  fetchSummary: async () => {
    try {
      const response = await getDashboardSummaryApi();
      set({ summary: response.data });
    } catch (err) {
      console.error("Failed to fetch dashboard summary:", err);
    }
  },
}));
