/**
 * Application constants
 */

export const APP_NAME = "pAIse";
export const APP_DESCRIPTION = "Smart Expense Tracking Made Simple";
export const APP_VERSION = "1.0.0";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  ME: `${API_BASE_URL}/api/users/me`,
  
  // Groups
  GROUPS: `${API_BASE_URL}/api/users/me/groups`,
  GROUP_DETAILS: (id: string) => `${API_BASE_URL}/api/groups/${id}`,
  GROUP_EXPENSES: (id: string) => `${API_BASE_URL}/api/groups/${id}/expenses`,
  
  // Expenses
  EXPENSES: `${API_BASE_URL}/api/expenses`, // GET list, POST create
  EXPENSE_DETAILS: (id: string) => `${API_BASE_URL}/api/expenses/${id}`, // GET, PATCH, DELETE
  
  // Dashboard & Analytics
  DASHBOARD_SUMMARY: `${API_BASE_URL}/api/dashboard/summary`,
  ANALYTICS_SUMMARY: `${API_BASE_URL}/api/analytics/summary`,
  
  // AI
  AI_RECEIPT: `${API_BASE_URL}/api/ai/scan-receipt`, // 
  AI_VOICE: `${API_BASE_URL}/api/ai/voice-expense`,   // 
};

/**
 * Expense Categories
 */
export const EXPENSE_CATEGORIES = [
  {
    id: "FOOD_AND_DINING",
    label: "Food & Dining",
    icon: "🍽️",
    color: "#ef4444",
  },
  {
    id: "HOUSING_AND_UTILITIES",
    label: "Housing & Utilities",
    icon: "🏠",
    color: "#3b82f6",
  },
  {
    id: "TRANSPORTATION",
    label: "Transportation",
    icon: "🚗",
    color: "#f59e0b",
  },
  {
    id: "TRAVEL_AND_ACCOMMODATION",
    label: "Travel & Accommodation",
    icon: "✈️",
    color: "#8b5cf6",
  },
  {
    id: "SHOPPING_AND_PERSONAL",
    label: "Shopping & Personal",
    icon: "🛍️",
    color: "#ec4899",
  },
  {
    id: "ENTERTAINMENT_AND_SOCIAL",
    label: "Entertainment & Social",
    icon: "🎉",
    color: "#f97316",
  },
  {
    id: "HEALTH_AND_WELLNESS",
    label: "Health & Wellness",
    icon: "💊",
    color: "#06b6d4",
  },
  {
    id: "EDUCATION_AND_WORK",
    label: "Education & Work",
    icon: "🎓",
    color: "#6366f1",
  },
  {
    id: "FAMILY",
    label: "Family",
    icon: "👨‍👩‍👧‍👦",
    color: "#10b981",
  },
  {
    id: "BILLS_AND_SUBSCRIPTIONS",
    label: "Bills & Subscriptions",
    icon: "🧾",
    color: "#84cc16",
  },
  {
    id: "OTHER",
    label: "Other",
    icon: "📌",
    color: "#6b7280",
  },
] as const;

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash" },
  { id: "CREDIT_CARD", label: "Credit Card" },
  { id: "DEBIT_CARD", label: "Debit Card" },
  { id: "UPI", label: "UPI" },
  { id: "NET_BANKING", label: "Net Banking" },
  { id: "WALLET", label: "Digital Wallet" },
] as const;

/**
 * Expense Statuses
 */
export const EXPENSE_STATUSES = [
  { id: "PENDING", label: "Pending" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
] as const;

/**
 * Recurring Frequencies
 */
export const RECURRING_FREQUENCIES = [
  { id: "DAILY", label: "Daily" },
  { id: "WEEKLY", label: "Weekly" },
  { id: "BIWEEKLY", label: "Bi-weekly" },
  { id: "MONTHLY", label: "Monthly" },
  { id: "QUARTERLY", label: "Quarterly" },
  { id: "YEARLY", label: "Yearly" },
] as const;

/**
 * Currencies
 */
export const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
] as const;

/**
 * Timezones
 */
export const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "America/New_York", label: "US Eastern (EST/EDT)" },
  { value: "America/Los_Angeles", label: "US Pacific (PST/PDT)" },
  { value: "Europe/London", label: "UK (GMT/BST)" },
  { value: "Europe/Berlin", label: "Europe (CET/CEST)" },
] as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  MERCHANT_MIN_LENGTH: 2,
  MERCHANT_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 3,
  DESCRIPTION_MAX_LENGTH: 500,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999.99,
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  AUTH_USER: "auth_user",
  THEME: "theme",
  SIDEBAR_COLLAPSED: "sidebar_collapsed",
  RECENT_EXPENSES: "recent_expenses",
} as const;

/**
 * Pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Chart Colors (for visualizations)
 */
export const CHART_COLORS = [
  "#6366f1", // primary
  "#8b5cf6", // secondary
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
] as const;

/**
 * Animation Durations (in ms)
 */
export const ANIMATION = {
  FAST: 150,
  BASE: 200,
  SLOW: 300,
} as const;

/**
 * Routes (protected vs public)
 */
export const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/register"] as const;

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/dashboard/expenses",
  "/dashboard/budgets",
  "/dashboard/subscriptions",
  "/dashboard/analytics",
  "/dashboard/settings",
] as const;
