export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const shortDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function parseDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = parseDate(value);
  return date ? dateTimeFormatter.format(date) : "—";
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = parseDate(value);
  return date ? shortDateFormatter.format(date) : "—";
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = parseDate(value);
  return date ? timeFormatter.format(date) : "";
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const megabytes = bytes / (1024 * 1024);
  return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1)} MB`;
}

export function mimeLabel(mime: string): string {
  const labels: Record<string, string> = {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/webp": "WEBP",
    "image/gif": "GIF",
  };
  return labels[mime] ?? mime.replace("image/", "").toUpperCase();
}

export function mimeListLabel(mimes: string[]): string {
  return mimes.map(mimeLabel).join(" / ");
}

export function shortTaskId(id: string): string {
  const compact = id.replace(/^task_/, "");
  return compact.slice(-6).toUpperCase();
}

export function taskTone(status: string): "waiting" | "working" | "success" | "failure" {
  if (status === "SUCCEEDED") return "success";
  if (status === "FAILED") return "failure";
  if (status === "PROCESSING") return "working";
  return "waiting";
}

export function isTaskActive(status: string): boolean {
  return status === "QUEUED" || status === "PROCESSING";
}

export function getErrorMessage(error: unknown, fallback = "请求没有完成，请稍后重试。"): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
