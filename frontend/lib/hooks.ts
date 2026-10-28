"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, ApiError } from "./api";
import { taskPollingInterval, taskQueryKey } from "./task-state";

export function useTemplates(category: string | null) {
  return useQuery({
    queryKey: ["templates", category ?? "all"],
    queryFn: ({ signal }) => api.getTemplates(category, signal),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useTemplate(templateId: string) {
  return useQuery({
    queryKey: ["template", templateId],
    queryFn: ({ signal }) => api.getTemplate(templateId, signal),
    enabled: Boolean(templateId),
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 1;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["template-categories"],
    queryFn: ({ signal }) => api.getCategories(signal),
    staleTime: 60_000,
  });
}

export function useTasks(userId: string | undefined) {
  return useQuery({
    queryKey: taskQueryKey(userId),
    queryFn: ({ signal }) => api.getTasks(signal),
    enabled: Boolean(userId),
    refetchInterval: (query) => taskPollingInterval(query.state.data?.items),
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}

