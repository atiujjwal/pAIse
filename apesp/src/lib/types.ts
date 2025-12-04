export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currency: string;
};

export type Group = {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  members: Array<Pick<User, "id" | "name" | "avatarUrl">>;
  currency: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  receipt_url: string | null;
  split_type: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARE";
  group: {
    id: string;
    name: string;
  } | null;
  created_by: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  payers: Array<{
    user: { id: string; name: string; avatar_url: string | null };
    amount: number;
  }>;
};

export type Balance = {
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
};

export type Settlement = {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  method: "UPI" | "PayPal" | "Venmo" | "Crypto" | "Bank";
  createdAt: string;
  status: "pending" | "completed" | "failed";
  receiptUrl?: string;
};

export type AnalyticsSummary = {
  success: boolean;
  message: string;

  total_balance: number;

  monthly_metrics: {
    total_spent: number;
    budget_limit: number;
    remaining: number;
    budget_used_percent: number;
  };

  spending_by_category: Array<{
    category: string;
    amount: number;
    percentage: number;
    color?: string; // optional since backend doesn’t provide it yet
  }>;

  upcoming_subscriptions: Array<{
    id: string;
    name: string;
    amount: number;
    next_billing_date: string;
  }>;

  recent_expenses: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    group: string | null;
    created_by: string;
  }>;
};
