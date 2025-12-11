import { useMutation } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { useAuthStore } from "@/src/features/auth/store";
import { RegisterInput } from "@/src/lib/schemas";
import { AuthResponse, ApiResponse } from "@/src/types/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useToastStore } from "@/src/hooks/use-toast";

type LoginPayload = {
  email: string;
  password?: string;
  otp?: string;
};

type ChangePasswordPayload = {
  email: string;
  otp: string;
  newPassword: string;
};

type VerifyOtpPayload = {
  email: string;
  otp: string;
  type: "register" | "login" | "forgot_password";
};

// --- QUERIES ---

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToastStore();

  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  return useMutation({
    mutationFn: async (credentials: LoginPayload) => {
      const { data } = await api.post<ApiResponse<AuthResponse>>(
        "/auth/login",
        credentials
      );
      return data.data!;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      addToast("Welcome back!", "success");
      router.push(redirectUrl);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Invalid credentials";
      addToast(message, "error");
    },
  });
};

export const useSendOtp = () => {
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async ({
      email,
      type,
    }: {
      email: string;
      type: "register" | "login" | "forgot_password";
    }) => {
      const { data } = await api.get<ApiResponse<{ message: string }>>(
        `/auth/otp?email=${email}&type=${type}`
      );
      return data;
    },
    onSuccess: () => {
      addToast("Verification code sent to your email", "success");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to send OTP";
      addToast(message, "error");
    },
  });
};

// NEW: Hook to verify OTP
export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: async (payload: VerifyOtpPayload) => {
      const { data } = await api.post<ApiResponse<void>>("/auth/otp", payload);
      return data;
    },
  });
};

export const useChangePassword = () => {
  const { addToast } = useToastStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const { data } = await api.post<ApiResponse<void>>(
        "/auth/password/change",
        payload
      );
      return data;
    },
    onSuccess: () => {
      addToast("Password changed successfully", "success");
      router.push("/auth/login");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to change password";
      addToast(message, "error");
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (userData: RegisterInput) => {
      const { data } = await api.post<ApiResponse<AuthResponse>>(
        "/auth/register",
        userData
      );
      return data.data!;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      addToast("Account created successfully", "success");
      router.push("/dashboard");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Registration failed";
      addToast(message, "error");
    },
  });
};

export const useLogout = () => {
  const { logout: clearStore, refreshToken } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    },
    onSettled: () => {
      clearStore();
      router.replace("/auth/login");
    },
  });
};
