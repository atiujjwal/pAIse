import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store";
import { LoginInput, RegisterInput } from "@/src/lib/schemas";
import { ApiResponse, AuthResponse } from "@/src/types/api";
import { api } from "@/src/lib/api";

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      // API Integration: POST /api/auth/login
      const { data } = await api.post<ApiResponse<AuthResponse>>(
        "api/auth/login",
        credentials
      );

      
      return data.data!;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push("/dashboard");
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (userData: RegisterInput) => {
      // API Integration: POST /api/auth/register
      const { data } = await api.post<ApiResponse<AuthResponse>>(
        "api/auth/register",
        userData
      );
      return data.data!;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push("/dashboard"); // Direct to dashboard or onboarding
    },
  });
};
