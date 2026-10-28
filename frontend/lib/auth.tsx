"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { getErrorMessage } from "./format";
import type { AuthResponse, AuthUser } from "./types";

const AUTH_KEY = ["auth", "me"] as const;

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  loading: boolean;
  errorMessage: string | null;
  retry: () => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (displayName: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string) => Promise<AuthUser>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: AUTH_KEY,
    queryFn: ({ signal }) => api.getMe(signal),
    staleTime: 30_000,
    retry: 1,
  });

  const user = query.data?.user ?? null;
  const ready = query.isSuccess;
  const loading = query.isPending;
  const errorMessage = query.isError && !query.data ? getErrorMessage(query.error) : null;

  const clearTaskCache = useCallback(async () => {
    await queryClient.cancelQueries({ queryKey: ["tasks"] });
    queryClient.removeQueries({ queryKey: ["tasks"] });
  }, [queryClient]);

  const adoptSession = useCallback(
    (response: AuthResponse) => {
      queryClient.setQueryData(AUTH_KEY, response);
      return response.user;
    },
    [queryClient],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.login(email.trim(), password);
      await clearTaskCache();
      const nextUser = adoptSession(response);
      if (!nextUser) throw new Error("登录响应缺少账号信息。");
      return nextUser;
    },
    [adoptSession, clearTaskCache],
  );

  const register = useCallback(
    async (displayName: string, email: string, password: string) => {
      const response = await api.register(displayName.trim(), email.trim(), password);
      await clearTaskCache();
      const nextUser = adoptSession(response);
      if (!nextUser) throw new Error("注册响应缺少账号信息。");
      return nextUser;
    },
    [adoptSession, clearTaskCache],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      await clearTaskCache();
      queryClient.setQueryData<AuthResponse>(AUTH_KEY, { user: null });
    }
  }, [clearTaskCache, queryClient]);

  const updateProfile = useCallback(
    async (displayName: string) => {
      const response = await api.updateProfile(displayName.trim());
      const nextUser = adoptSession(response);
      if (!nextUser) throw new Error("账号资料响应缺少用户信息。");
      return nextUser;
    },
    [adoptSession],
  );

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.changePassword(currentPassword, newPassword);
  }, []);

  const retry = useCallback(() => {
    void query.refetch();
  }, [query]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      loading,
      errorMessage,
      retry,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, ready, loading, errorMessage, retry, login, register, logout, updateProfile, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
