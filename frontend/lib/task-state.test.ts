import { describe, expect, it } from "vitest";
import {
  deriveTaskFeedState,
  taskPollingInterval,
  taskQueryKey,
} from "./task-state";

const task = (status: "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED") => ({
  status,
});

describe("taskQueryKey", () => {
  it("keeps every user's task cache separate", () => {
    expect(taskQueryKey("u_lin")).not.toEqual(taskQueryKey("u_chen"));
    expect(taskQueryKey(undefined)).toEqual(["tasks", undefined]);
  });
});

describe("taskPollingInterval", () => {
  it("polls while any task is queued or processing", () => {
    expect(taskPollingInterval([task("QUEUED"), task("SUCCEEDED")])).toBe(1200);
    expect(taskPollingInterval([task("PROCESSING")])).toBe(1200);
  });

  it("stops polling when every task is terminal and when there is no data", () => {
    expect(taskPollingInterval([task("SUCCEEDED"), task("FAILED")])).toBe(false);
    expect(taskPollingInterval([])).toBe(false);
    expect(taskPollingInterval(undefined)).toBe(false);
  });
});

describe("deriveTaskFeedState", () => {
  it("keeps cached tasks visible when a later query fails", () => {
    expect(
      deriveTaskFeedState({ hasData: true, isPending: false, isError: true, count: 3 }),
    ).toBe("stale");
  });

  it("reports an unavailable feed when the first query fails", () => {
    expect(
      deriveTaskFeedState({ hasData: false, isPending: false, isError: true, count: 0 }),
    ).toBe("unavailable");
  });

  it("shows an empty state only after data has arrived", () => {
    expect(
      deriveTaskFeedState({ hasData: true, isPending: false, isError: false, count: 0 }),
    ).toBe("empty");
    expect(
      deriveTaskFeedState({ hasData: false, isPending: true, isError: false, count: 0 }),
    ).toBe("loading");
  });

  it("keeps a failed task as ordinary data, not a feed error", () => {
    const failedTask = task("FAILED");
    expect(
      deriveTaskFeedState({ hasData: true, isPending: false, isError: false, count: 1 }),
    ).toBe("ready");
    expect(failedTask.status).toBe("FAILED");
  });
});
