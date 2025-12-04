import { API_ENDPOINTS } from "../lib/constants";
import { authorizedFetch, getAuthUser, setAuthToken, setAuthUser, clearAuthToken, clearAuthUser } from "../lib/client";

// Auth
function toClientPath(endpoint: string) {
  // Prefer an origin-relative path when running in browser to avoid misconfigured
  // NEXT_PUBLIC_API_URL (which may point to the app root and return HTML pages)
  if (typeof window === "undefined") return endpoint;
  try {
    const parsed = new URL(endpoint);
    return parsed.pathname + parsed.search;
  } catch {
    return endpoint;
  }
}

export async function loginApi(email: string, password: string) {
    console.log("18: ", API_ENDPOINTS.LOGIN);
    
  const url = toClientPath(API_ENDPOINTS.LOGIN);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const contentType = res.headers.get("content-type") || "";
  
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    // non-json reply (e.g., HTML error page) — surface a clear message
    const txt = await res.text().catch(() => "<non-json-response>");
    throw new Error(`Login failed: ${res.status} - ${txt.slice(0, 200)}`);
  }

  const body = await res.json();

  if (!res.ok) {
    const errMsg = body?.error || body?.message || JSON.stringify(body);
    throw new Error(`Login failed: ${res.status} ${errMsg}`);
  }

  // server uses shape { success: true, data: {...} }
  const data = body?.data ?? body;

  // flexible token handling inside data
  const token = data?.accessToken || data?.token || data?.authToken;
  if (token) setAuthToken(token);
  if (data?.user) setAuthUser(data.user);

  return data;
}

export async function registerApi(email: string, password: string, name: string) {
  const url = toClientPath(API_ENDPOINTS.REGISTER);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    const txt = await res.text().catch(() => "<non-json-response>");
    throw new Error(`Register failed: ${res.status} - ${txt.slice(0, 200)}`);
  }

  const body = await res.json();
  if (!res.ok) {
    const errMsg = body?.error || body?.message || JSON.stringify(body);
    throw new Error(`Register failed: ${res.status} ${errMsg}`);
  }

  const data = body?.data ?? body;
  const token = data?.accessToken || data?.token || data?.authToken;
  if (token) setAuthToken(token);
  if (data?.user) setAuthUser(data.user);

  return data;
}

export async function logoutApi() {
  try {
    await authorizedFetch(API_ENDPOINTS.LOGOUT, { method: "POST" });
  } finally {
    clearAuthToken();
    clearAuthUser();
  }
}

export async function meApi() {
  // return cached user if available for offline/resume
  const cached = getAuthUser();
  if (cached) return cached;

  const data = await authorizedFetch(API_ENDPOINTS.ME, { method: "GET" }).catch((e) => {
    // if not authorized or fails, ensure local storage is clean
    clearAuthToken();
    clearAuthUser();
    throw e;
  });

  if (data?.user) setAuthUser(data.user);
  return data?.user ?? data;
}

// Groups
export async function getGroupsApi() {
  return await authorizedFetch(API_ENDPOINTS.GROUPS);
}

export async function createGroupApi(group: Partial<any>) {
  return await authorizedFetch(API_ENDPOINTS.GROUPS, { method: "POST", body: JSON.stringify(group) });
}

// Expenses
export async function getExpensesApi(filters?: Record<string, any>) {
  const url = new URL(API_ENDPOINTS.EXPENSES, window.location.origin);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const result = await authorizedFetch(url.toString());
  console.log("124: ", result);
  return result;
}

export async function createExpenseApi(expenseData: any) {
  return await authorizedFetch(API_ENDPOINTS.EXPENSES, { method: "POST", body: JSON.stringify(expenseData) });
}

export async function deleteExpenseApi(expenseId: string) {
  return await authorizedFetch(API_ENDPOINTS.EXPENSE_DETAILS(expenseId), { method: "DELETE" });
}

// Analytics
export async function getDashboardSummaryApi() {
  return await authorizedFetch(API_ENDPOINTS.DASHBOARD_SUMMARY);
}
