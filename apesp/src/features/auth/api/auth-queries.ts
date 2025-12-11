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
    // Updated to accept an object with type support
    mutationFn: async ({
      email,
      type,
    }: {
      email: string;
      type: "login" | "forgot_password";
    }) => {
      const { data } = await api.get<ApiResponse<{ message: string }>>(
        `/auth/otp?email=${email}&type=${type}`
      );
      return data;
    },
    onSuccess: () => {
      addToast("OTP sent to your email", "success");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to send OTP";
      addToast(message, "error");
    },
  });
};

// Hook to handle the final password change step
export const useChangePassword = () => {
  const { addToast } = useToastStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const { data } = await api.post<ApiResponse<void>>(
        "/auth/password",
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
