import { User } from "@prisma/client";

/**
 * Formats a User object into the public-facing friend profile.
 * Maps 'avatar' (schema) to 'avatar' (API spec).
 */
export const formatPublicUser = (user: Partial<User>) => {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
  };
};

export const formatFriendUser = (user: Partial<User>) => {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    currency: user.currency,
    timezone: user.timezone, 
  };
};

/**
 * Formats a Friendship object into the standard API response,
 * including nested, formatted user objects.
 */
export const formatFriendshipResponse = (friendship: any) => {
  return {
    id: friendship.id,
    status: friendship.status,
    created_at: friendship.created_at,
    updated_at: friendship.updated_at,
    requester: formatPublicUser(friendship.requester),
    addressee: formatPublicUser(friendship.addressee),
  };
};

/**
 * Formats a GroupMember object for API responses.
 */
export const formatGroupMember = (member: any) => {
  if (!member) return null;
  return {
    role: member.role,
    joined_at: member.joined_at,
    user: formatPublicUser(member.user),
  };
};

/**
 * Format detailed expense for response
 */
export const formatDetailedExpense = (expense: any) => {
  return {
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    date: expense.date,
    category: expense.category,
    group_id: expense.group_id,
    created_by: formatPublicUser(expense.created_by),
    payers: expense.payers.map((p: any) => ({
      ...p,
      user: formatPublicUser(p.user),
    })),
    splits: expense.splits.map((s: any) => ({
      ...s,
      user: formatPublicUser(s.user),
    })),
  };
};
