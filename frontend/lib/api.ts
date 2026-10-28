import type {
  AdminCategory,
  AdminTemplate,
  ApiErrorBody,
  AuthResponse,
  Category,
  CoverUpload,
  CreationTask,
  ItemsResponse,
  SimulationConfig,
  Template,
  TemplateInput,
  UploadedAsset,
  UploadProgress,
} from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 0, code = "REQUEST_FAILED") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const NETWORK_MESSAGE = "暂时无法连接制作服务，请检查后端是否已启动。";

type RequestOptions = Omit<RequestInit, "body"> & { body?: BodyInit | null };

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function errorFromResponse(status: number, body: unknown): ApiError {
  if (body && typeof body === "object") {
    const candidate = body as ApiErrorBody;
    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return new ApiError(candidate.message, status, candidate.code ?? "REQUEST_FAILED");
    }
  }
  if (status === 401) return new ApiError("请先登录后再继续。", status, "UNAUTHORIZED");
  if (status === 404) return new ApiError("请求的内容不存在。", status, "NOT_FOUND");
  if (status === 413) return new ApiError("图片体积超出服务器允许的范围。", status, "PAYLOAD_TOO_LARGE");
  if (status >= 500) return new ApiError("制作服务暂时不可用，请稍后重试。", status, "SERVER_ERROR");
  return new ApiError("请求未完成，请稍后重试。", status, "REQUEST_FAILED");
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { headers: inputHeaders, ...init } = options;
  const headers = new Headers(inputHeaders);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(NETWORK_MESSAGE, 0, "NETWORK_ERROR");
  }

  const body = await readBody(response);
  if (!response.ok) throw errorFromResponse(response.status, body);
  return body as T;
}

export const api = {
  getMe(signal?: AbortSignal): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/me", { signal });
  },

  login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(displayName: string, email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ displayName, email, password }),
    });
  },

  logout(): Promise<void> {
    return request<void>("/api/auth/logout", { method: "POST" });
  },

  updateProfile(displayName: string): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify({ displayName }),
    });
  },

  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return request<void>("/api/auth/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  getTemplates(category: string | null, signal?: AbortSignal): Promise<ItemsResponse<Template>> {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    return request<ItemsResponse<Template>>(`/api/templates${query}`, { signal });
  },

  getTemplate(templateId: string, signal?: AbortSignal): Promise<Template> {
    return request<Template>(`/api/templates/${encodeURIComponent(templateId)}`, { signal });
  },

  getCategories(signal?: AbortSignal): Promise<ItemsResponse<Category>> {
    return request<ItemsResponse<Category>>("/api/templates/categories", { signal });
  },

  getAdminTemplates(signal?: AbortSignal): Promise<ItemsResponse<AdminTemplate>> {
    return request<ItemsResponse<AdminTemplate>>("/api/admin/templates", { signal });
  },

  getAdminCategories(signal?: AbortSignal): Promise<ItemsResponse<AdminCategory>> {
    return request<ItemsResponse<AdminCategory>>("/api/admin/templates/categories", { signal });
  },

  createAdminCategory(name: string): Promise<AdminCategory> {
    return request<AdminCategory>("/api/admin/templates/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  deleteAdminCategory(id: string): Promise<void> {
    return request<void>(`/api/admin/templates/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  createAdminTemplate(input: TemplateInput): Promise<AdminTemplate> {
    return request<AdminTemplate>("/api/admin/templates", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateAdminTemplate(id: string, input: TemplateInput): Promise<AdminTemplate> {
    return request<AdminTemplate>(`/api/admin/templates/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  setAdminTemplateActive(id: string, active: boolean): Promise<AdminTemplate> {
    return request<AdminTemplate>(`/api/admin/templates/${encodeURIComponent(id)}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    });
  },

  deleteAdminTemplate(id: string): Promise<void> {
    return request<void>(`/api/admin/templates/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  uploadTemplateCover(file: File, signal?: AbortSignal): Promise<CoverUpload> {
    const form = new FormData();
    form.append("file", file);
    return request<CoverUpload>("/api/admin/templates/covers", {
      method: "POST",
      body: form,
      signal,
    });
  },

  getTasks(signal?: AbortSignal): Promise<ItemsResponse<CreationTask>> {
    return request<ItemsResponse<CreationTask>>("/api/tasks", { signal });
  },

  createTask(templateId: string, assetIds: string[]): Promise<CreationTask> {
    return request<CreationTask>("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ templateId, assetIds }),
    });
  },

  deleteAsset(assetId: string): Promise<void> {
    return request<void>(`/api/uploads/${encodeURIComponent(assetId)}`, {
      method: "DELETE",
    });
  },

  getSimulation(signal?: AbortSignal): Promise<SimulationConfig> {
    return request<SimulationConfig>("/api/dev/simulation", { signal });
  },

  updateSimulation(config: SimulationConfig): Promise<SimulationConfig> {
    return request<SimulationConfig>("/api/dev/simulation", {
      method: "PUT",
      body: JSON.stringify(config),
    });
  },
};

function parseXhrBody(xhr: XMLHttpRequest): unknown {
  if (!xhr.responseText) return null;
  try {
    return JSON.parse(xhr.responseText) as unknown;
  } catch {
    return xhr.responseText;
  }
}

export function uploadAsset(args: {
  templateId: string;
  file: File;
  signal?: AbortSignal;
  onProgress?: (progress: UploadProgress) => void;
}): Promise<UploadedAsset> {
  const { templateId, file, signal, onProgress } = args;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Upload aborted", "AbortError"));
      return;
    }

    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("templateId", templateId);
    form.append("file", file);

    const cleanup = () => signal?.removeEventListener("abort", abort);
    const abort = () => xhr.abort();

    xhr.open("POST", "/api/uploads");
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.({ loaded: event.loaded, total: event.total });
    };
    xhr.onload = () => {
      cleanup();
      const body = parseXhrBody(xhr);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as UploadedAsset);
        return;
      }
      reject(errorFromResponse(xhr.status, body));
    };
    xhr.onerror = () => {
      cleanup();
      reject(new ApiError("图片没有上传成功，请检查网络后重试。", 0, "NETWORK_ERROR"));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new DOMException("Upload aborted", "AbortError"));
    };
    xhr.ontimeout = () => {
      cleanup();
      reject(new ApiError("图片上传超时，请重试。", 0, "TIMEOUT"));
    };

    signal?.addEventListener("abort", abort, { once: true });
    xhr.send(form);
  });
}

export async function fetchSampleImage(url: string, filename: string): Promise<File> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "force-cache" });
  } catch {
    throw new ApiError("样例图片加载失败，请检查前端静态资源。", 0, "NETWORK_ERROR");
  }
  if (!response.ok) throw new ApiError("样例图片加载失败。", response.status, "SAMPLE_FAILED");
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) {
    throw new ApiError("样例文件不是有效图片。", 0, "SAMPLE_FAILED");
  }
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}
