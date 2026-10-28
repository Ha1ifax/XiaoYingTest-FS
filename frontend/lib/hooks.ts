"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, ApiError } from "./api";
import type { CreationTask } from "./types";

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
    queryKey: ["tasks", userId],
    queryFn: ({ signal }) => api.getTasks(signal),
    enabled: Boolean(userId),
    refetchInterval: (query) => {
      const tasks = query.state.data?.items as CreationTask[] | undefined;
      return tasks?.some((task) => task.status === "QUEUED" || task.status === "PROCESSING")
        ? 1_200
        : false;
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}
