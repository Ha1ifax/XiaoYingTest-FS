export type TaskStatus = "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";
export type StageKey = "ASSET_CHECK" | "GENERATE" | "FINALIZE";
export type StepStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";

export interface ItemsResponse<T> {
  items: T[];
}

export interface AuthUser {
  id: string;
  displayName: string;
  initials: string;
  role: string;
  admin: boolean;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser | null;
}

export interface Template {
  id: string;
  title: string;
  category: string;
  description: string;
  coverUrl: string;
  accentColor: string;
  requiredImageCount: number;
  acceptedMimeTypes: string[];
  maxFileSizeBytes: number;
  resultLabel: string;
  detailNote: string;
}

export interface AdminTemplate extends Template {
  sortOrder: number;
  active: boolean;
  taskCount: number;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  count: number;
  sortOrder: number;
}

export interface TemplateInput {
  title: string;
  category: string;
  description: string;
  coverUrl: string;
  accentColor: string;
  requiredImageCount: number;
  acceptedMimeTypes: string[];
  maxFileSizeBytes: number;
  resultLabel: string;
  detailNote: string;
  sortOrder: number;
}

export interface CoverUpload {
  url: string;
  mimeType: string;
  width: number;
  height: number;
}

export interface Category {
  name: string;
  count: number;
}

export interface UploadedAsset {
  id: string;
  templateId: string;
  originalFileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface TaskStage {
  stage: StageKey;
  label: string;
  status: StepStatus;
  statusLabel: string;
  detail: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface TaskTemplateSummary {
  id: string;
  title: string;
  category: string;
  coverUrl: string;
  accentColor: string;
  resultLabel: string;
  requiredImageCount: number;
}

export interface CreationTask {
  id: string;
  status: TaskStatus;
  statusLabel: string;
  currentStage: StageKey | null;
  currentStageLabel: string | null;
  failureStage: StageKey | null;
  failureStageLabel: string | null;
  failureReason: string | null;
  resultUrl: string | null;
  template: TaskTemplateSummary;
  assetCount: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
  stages: TaskStage[];
}

export interface SimulationConfig {
  assetCheckDelayMs: number;
  generateDelayMs: number;
  finalizeDelayMs: number;
  failureStage: string;
  failureMessage: string;
}

export interface ApiErrorBody {
  code?: string;
  message?: string;
  timestamp?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
}
