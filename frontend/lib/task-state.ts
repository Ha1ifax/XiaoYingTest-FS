import type { CreationTask } from "./types";

export function taskQueryKey(userId: string | undefined) {
  return ["tasks", userId] as const;
}

export function taskPollingInterval(tasks: Pick<CreationTask, "status">[] | undefined) {
  return tasks?.some((task) => task.status === "QUEUED" || task.status === "PROCESSING")
    ? 1_200
    : false;
}

export type TaskFeedState = "loading" | "unavailable" | "stale" | "empty" | "ready";

/**
 * The history screen keeps three concerns separate:
 * - a failed query is an API problem, not a failed task;
 * - cached tasks remain visible when a later poll fails;
 * - a failed task is still ordinary data inside the ready state.
 */
export function deriveTaskFeedState(input: {
  hasData: boolean;
  isPending: boolean;
  isError: boolean;
  count: number;
}): TaskFeedState {
  if (input.isError) {
    return input.hasData ? "stale" : "unavailable";
  }
  if (input.isPending && !input.hasData) {
    return "loading";
  }
  if (input.hasData && input.count === 0) {
    return "empty";
  }
  return "ready";
}
