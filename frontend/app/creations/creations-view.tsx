"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ClockIcon,
  ExpandIcon,
  ImageIcon,
  RefreshIcon,
  SlidersIcon,
  WifiOffIcon,
} from "@/components/icons";
import { Modal } from "@/components/modal";
import { AuthRequired } from "@/components/auth-required";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  cx,
  formatDateTime,
  formatTime,
  getErrorMessage,
  isTaskActive,
  shortTaskId,
  taskTone,
} from "@/lib/format";
import { useTasks } from "@/lib/hooks";
import { deriveTaskFeedState } from "@/lib/task-state";
import type { CreationTask, SimulationConfig, StageKey, TaskStage } from "@/lib/types";
import styles from "./creations-view.module.css";

type FilterKey = "all" | "active" | "succeeded" | "failed";

const FILTERS: ReadonlyArray<{ key: FilterKey; label: string }> = [
  { key: "all", label: "全部" },
  { key: "active", label: "进行中" },
  { key: "succeeded", label: "已完成" },
  { key: "failed", label: "失败" },
];

const STAGE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "NONE", label: "不注入失败，正常完成" },
  { value: "ASSET_CHECK", label: "素材检查" },
  { value: "GENERATE", label: "模拟生成" },
  { value: "FINALIZE", label: "结果整理" },
];

const STAGE_LABELS: Record<StageKey, string> = {
  ASSET_CHECK: "素材检查",
  GENERATE: "模拟生成",
  FINALIZE: "结果整理",
};

const EMPTY_SIMULATION: SimulationConfig = {
  assetCheckDelayMs: 1800,
  generateDelayMs: 4200,
  finalizeDelayMs: 1500,
  failureStage: "",
  failureMessage: "",
};

interface SimulationForm {
  assetCheck: string;
  generate: string;
  finalize: string;
  failureStage: string;
  failureMessage: string;
}

type Notice = { tone: "success" | "error"; message: string } | null;

function countForFilter(tasks: CreationTask[], filter: FilterKey): number {
  if (filter === "all") return tasks.length;
  if (filter === "active") return tasks.filter((task) => isTaskActive(task.status)).length;
  if (filter === "succeeded") return tasks.filter((task) => task.status === "SUCCEEDED").length;
  return tasks.filter((task) => task.status === "FAILED").length;
}

function matchesFilter(task: CreationTask, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "active") return isTaskActive(task.status);
  if (filter === "succeeded") return task.status === "SUCCEEDED";
  return task.status === "FAILED";
}

function describeTask(task: CreationTask): string {
  if (task.status === "QUEUED") {
    return "任务已进入制作队列。你可以先去做别的，后台会按顺序接单。";
  }
  if (task.status === "PROCESSING") {
    return task.currentStageLabel
      ? `后台正在执行「${task.currentStageLabel}」，这一步结束后会继续下一阶段。`
      : "后台正在处理这组素材，你可以离开页面，稍后回来查看。";
  }
  if (task.status === "SUCCEEDED") {
    return `成品已经整理完成，${task.assetCount} 张素材被收进了这张作品。`;
  }
  return `制作在「${task.failureStageLabel ?? "处理阶段"}」停止，后续步骤没有继续执行。`;
}

function delayLabel(milliseconds: number | undefined): string {
  if (milliseconds === undefined) return "—";
  const seconds = milliseconds / 1000;
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
}

function countLabel(value: number | undefined): string {
  return typeof value === "number" ? String(value).padStart(2, "0") : "—";
}

function StatusPill({ task }: { task: CreationTask }) {
  return (
    <span className={styles.statusPill} data-tone={taskTone(task.status)}>
      <span className={styles.statusDot} aria-hidden="true" />
      {task.statusLabel}
    </span>
  );
}

function StageTrack({ stages }: { stages: TaskStage[] }) {
  return (
    <ol className={styles.stageTrack} aria-label="制作阶段">
      {stages.map((stage, index) => (
        <li
          key={stage.stage}
          className={styles.stageItem}
          data-status={stage.status}
          aria-label={`${stage.label}：${stage.statusLabel}`}
          aria-current={stage.status === "RUNNING" ? "step" : undefined}
        >
          <span className={styles.stageNode} aria-hidden="true">
            {stage.status === "SUCCEEDED" ? (
              <CheckIcon width={11} height={11} />
            ) : stage.status === "FAILED" ? (
              "!"
            ) : stage.status === "SKIPPED" ? (
              "–"
            ) : (
              index + 1
            )}
          </span>
          <span className={styles.stageLabel}>{stage.label}</span>
        </li>
      ))}
    </ol>
  );
}

function TaskCard({
  task,
  isNew,
  onPreview,
}: {
  task: CreationTask;
  isNew: boolean;
  onPreview: (task: CreationTask) => void;
}) {
  const tone = taskTone(task.status);
  const currentStage = task.stages.find((stage) => stage.status === "RUNNING");
  const canPreview = task.status === "SUCCEEDED" && Boolean(task.resultUrl);
  const stageBadge =
    task.status === "QUEUED"
      ? "等待后台"
      : task.status === "PROCESSING"
        ? `当前 · ${task.currentStageLabel ?? "处理中"}`
        : task.status === "FAILED"
          ? `停于 · ${task.failureStageLabel ?? "处理阶段"}`
          : "成品已归档";
  const titleId = `task-title-${task.id}`;

  return (
    <article
      id={`task-${task.id}`}
      className={styles.taskCard}
      data-tone={tone}
      data-new={isNew ? "true" : undefined}
      tabIndex={-1}
      aria-labelledby={titleId}
    >
      <header className={styles.taskTop}>
        <div className={styles.taskIdentity}>
          <span className={styles.taskNumber} title={task.id}>
            NO. {shortTaskId(task.id)}
          </span>
          <span className={styles.metaDivider} aria-hidden="true" />
          <time dateTime={task.createdAt}>受理于 {formatDateTime(task.createdAt)}</time>
          {task.retryCount > 0 ? (
            <span
              className={styles.retryTag}
              title={task.lastError ?? "基础设施异常已自动恢复"}
            >
              自动重试 {task.retryCount}
            </span>
          ) : null}
          {isNew ? <span className={styles.newTag}>刚刚提交</span> : null}
        </div>
        <StatusPill task={task} />
      </header>

      <div className={styles.taskBody}>
        <div className={styles.taskVisual}>
          {canPreview ? (
            <button
              type="button"
              className={styles.previewButton}
              onClick={() => onPreview(task)}
              aria-label={`查看「${task.template.title}」的制作成品`}
            >
              <img
                className={styles.visualImage}
                src={task.resultUrl ?? ""}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <span className={styles.visualAction}>
                <ExpandIcon width={15} height={15} />
                查看成品
              </span>
            </button>
          ) : (
            <div className={styles.coverStage}>
              <img
                className={styles.visualImage}
                src={task.template.coverUrl}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <span className={styles.coverShade} aria-hidden="true" />
              <span className={styles.visualBadge} data-tone={tone}>
                {tone === "working" || tone === "waiting" ? (
                  <span className={styles.liveDot} aria-hidden="true" />
                ) : null}
                {stageBadge}
              </span>
            </div>
          )}
        </div>

        <div className={styles.taskSummary}>
          <p className={styles.taskKicker}>
            {task.template.category}
            <span aria-hidden="true">/</span>
            {task.assetCount} 张素材
          </p>
          <h3 id={titleId} className={styles.taskTitle}>
            {task.template.title}
          </h3>
          <p className={styles.taskCopy}>{describeTask(task)}</p>
        </div>

        <div className={styles.taskDetail}>
          <StageTrack stages={task.stages} />

          {currentStage ? (
            <p className={styles.runningLine} role="status">
              <span className={styles.liveDot} aria-hidden="true" />
              {currentStage.detail}
            </p>
          ) : null}

          {task.retryCount > 0 && (task.status === "QUEUED" || task.status === "PROCESSING") ? (
            <p className={styles.retryLine} role="status">
              <RefreshIcon width={15} height={15} />
              自动恢复中 · 已重试 {task.retryCount} 次，队列会继续接手。
            </p>
          ) : null}

          {task.status === "FAILED" ? (
            <div className={styles.failureBox} role="note">
              <AlertIcon width={19} height={19} />
              <div>
                <strong>停在「{task.failureStageLabel ?? "处理阶段"}」</strong>
                <p>{task.failureReason ?? "这一步没有通过，任务已经停止，没有继续执行后续步骤。"}</p>
                {task.retryCount > 0 ? (
                  <p className={styles.retryNote}>自动重试 {task.retryCount} 次后仍未完成。</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className={styles.taskFoot}>
            <div className={styles.timeLine}>
              <ClockIcon width={14} height={14} />
              {task.startedAt ? <span>开始 {formatTime(task.startedAt)}</span> : <span>等待接单</span>}
              {task.finishedAt ? <span>完成 {formatDateTime(task.finishedAt)}</span> : null}
            </div>
            <div className={styles.taskActions}>
              {canPreview ? (
                <button
                  type="button"
                  className={cx("btn", "btnPrimary", styles.smallButton)}
                  onClick={() => onPreview(task)}
                >
                  打开成品
                  <ExpandIcon width={15} height={15} />
                </button>
              ) : null}
              <Link
                className={cx("btn", "btnQuiet", styles.smallButton)}
                href={`/templates/${task.template.id}`}
              >
                同款模板
                <ArrowUpRightIcon width={15} height={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function HistorySkeleton() {
  return (
    <div className={styles.taskList} aria-busy="true" aria-label="正在读取作品记录">
      {[0, 1, 2].map((item) => (
        <div className={styles.skeletonCard} key={item}>
          <div className={styles.skeletonTop}>
            <span />
            <span />
          </div>
          <div className={styles.skeletonBody}>
            <span className={styles.skeletonVisual} />
            <div>
              <span className={styles.skeletonLineShort} />
              <span className={styles.skeletonHeading} />
              <span className={styles.skeletonLine} />
              <span className={styles.skeletonLine} />
              <span className={styles.skeletonSteps} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryError({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className={styles.errorState} role="alert">
      <span className={styles.errorIcon}>
        <WifiOffIcon width={25} height={25} />
      </span>
      <p className="eyebrow">CONNECTION PAUSED</p>
      <h2>暂时读不到作品记录。</h2>
      <p>{message}</p>
      <p className={styles.errorHint}>
        这只是一次查询异常，后台任务不会因此被标记为失败。恢复连接后可以继续读取。
      </p>
      <button type="button" className="btn btnPrimary" onClick={onRetry} disabled={retrying}>
        {retrying ? <span className="spinner" aria-hidden="true" /> : <RefreshIcon width={16} height={16} />}
        {retrying ? "正在重连" : "重新读取记录"}
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyCopy}>
        <p className="eyebrow">THE ARCHIVE IS OPEN</p>
        <h2>还没有属于你的片刻。</h2>
        <p>挑一个模板，放进照片。第一件作品会在这里留下任务记录、处理阶段和最终成品。</p>
        <Link className="btn btnPrimary" href="/#templates">
          去挑一个模板
          <ArrowRightIcon width={16} height={16} />
        </Link>
      </div>
      <div className={styles.emptyLedger} aria-hidden="true">
        <span>NO RECORDS</span>
        <span>EST. 2026</span>
        <strong>00</strong>
        <small>MOMENTO / PERSONAL ARCHIVE</small>
      </div>
    </div>
  );
}

function ResultDialog({
  task,
  open,
  onClose,
}: {
  task: CreationTask | null;
  open: boolean;
  onClose: () => void;
}) {
  const [brokenImage, setBrokenImage] = useState(false);

  useEffect(() => {
    setBrokenImage(false);
  }, [task?.resultUrl]);

  return (
    <Modal open={open && Boolean(task)} onClose={onClose} labelledBy="result-dialog-title" size="wide">
      {task ? (
        <div className={styles.resultModal}>
          <figure className={styles.resultStage}>
            {brokenImage ? (
              <div className={styles.imageFallback}>
                <ImageIcon width={30} height={30} />
                <p>结果图片暂时无法加载</p>
                <span>任务状态与记录仍然保存在后台。</span>
              </div>
            ) : (
              <img
                className={styles.resultImage}
                src={task.resultUrl ?? ""}
                alt={`「${task.template.title}」的模拟制作成品`}
                onError={() => setBrokenImage(true)}
              />
            )}
          </figure>
          <div className={styles.resultInfo}>
            <p className="eyebrow">FINISHED PIECE</p>
            <h2 id="result-dialog-title">{task.template.title}</h2>
            <p className={styles.resultCategory}>
              {task.template.category} / {task.template.resultLabel}
            </p>
            <dl className={styles.resultMeta}>
              <div>
                <dt>任务编号</dt>
                <dd>{shortTaskId(task.id)}</dd>
              </div>
              <div>
                <dt>完成时间</dt>
                <dd>{formatDateTime(task.finishedAt)}</dd>
              </div>
              <div>
                <dt>素材</dt>
                <dd>{task.assetCount} 张</dd>
              </div>
              <div>
                <dt>画幅</dt>
                <dd>4:5 / PNG</dd>
              </div>
            </dl>
            <p className={styles.resultNote}>
              这张图由 Java 后台在「结果整理」阶段合成，保存在服务端。记录和成品都可以在刷新页面后重新读取。
            </p>
            <div className={styles.resultActions}>
              <button type="button" className="btn btnPrimary" onClick={onClose}>
                返回记录
              </button>
              <Link className="btn btnSecondary" href={`/templates/${task.template.id}`}>
                看看同款模板
                <ArrowUpRightIcon width={15} height={15} />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function formFromConfig(config: SimulationConfig): SimulationForm {
  return {
    assetCheck: String(config.assetCheckDelayMs / 1000),
    generate: String(config.generateDelayMs / 1000),
    finalize: String(config.finalizeDelayMs / 1000),
    failureStage: config.failureStage || "NONE",
    failureMessage: config.failureMessage || "",
  };
}

const DEFAULT_FORM: SimulationForm = {
  assetCheck: "1.8",
  generate: "4.2",
  finalize: "1.5",
  failureStage: "NONE",
  failureMessage: "",
};

function SimulationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const simulationQuery = useQuery({
    queryKey: ["simulation"],
    queryFn: ({ signal }) => api.getSimulation(signal),
    enabled: open,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [form, setForm] = useState<SimulationForm>(DEFAULT_FORM);
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNotice(null);
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && simulationQuery.data) setForm(formFromConfig(simulationQuery.data));
  }, [open, simulationQuery.data]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setNotice(null);

    const inputs = [form.assetCheck, form.generate, form.finalize];
    const parsed = inputs.map((value) => Number(value));
    if (
      inputs.some((value) => value.trim() === "") ||
      parsed.some((value) => !Number.isFinite(value) || value < 0 || value > 120)
    ) {
      setNotice({ tone: "error", message: "各阶段等待时间需要填写 0 到 120 秒之间的数字。" });
      return;
    }

    if (form.failureStage !== "NONE" && form.failureMessage.trim().length > 300) {
      setNotice({ tone: "error", message: "失败原因不能超过 300 个字。" });
      return;
    }

    const payload: SimulationConfig = {
      assetCheckDelayMs: Math.round(parsed[0] * 1000),
      generateDelayMs: Math.round(parsed[1] * 1000),
      finalizeDelayMs: Math.round(parsed[2] * 1000),
      failureStage: form.failureStage === "NONE" ? "" : form.failureStage,
      failureMessage: form.failureStage === "NONE" ? "" : form.failureMessage.trim(),
    };

    setSaving(true);
    try {
      const updated = await api.updateSimulation(payload);
      queryClient.setQueryData(["simulation"], updated);
      setForm(formFromConfig(updated));
      setNotice({
        tone: "success",
        message:
          payload.failureStage === ""
            ? "模拟参数已保存，之后提交的任务会正常完成。"
            : `模拟参数已保存，之后提交的任务会在「${STAGE_LABELS[payload.failureStage as StageKey] ?? payload.failureStage}」阶段失败。`,
      });
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error, "模拟参数没有保存成功。") });
    } finally {
      setSaving(false);
    }
  }

  const applyDefaults = () => {
    setForm(DEFAULT_FORM);
    setNotice(null);
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="simulation-dialog-title">
      <div className={styles.simDialog}>
        <p className="eyebrow">DEMO CONTROLS / JAVA BACKEND</p>
        <h2 id="simulation-dialog-title">调整模拟生成节奏</h2>
        <p className={styles.simIntro} id="simulation-description">
          这些参数保存在 Java 服务端。提交任务时，后台会保存一份配置快照，因此只影响保存之后新提交的任务，已经受理的任务不会改变。
        </p>

        {simulationQuery.isPending ? (
          <div className={styles.simLoading} aria-busy="true">
            <span className="spinner" aria-hidden="true" />
            正在读取服务端配置…
          </div>
        ) : simulationQuery.isError ? (
          <div className={styles.simError} role="alert">
            <AlertIcon width={20} height={20} />
            <div>
              <strong>无法读取模拟配置</strong>
              <p>
                演示接口可能已被关闭。开发环境默认可用，也可以通过 <code>APP_DEV_API_ENABLED</code>{" "}
                控制。
              </p>
            </div>
            <button
              type="button"
              className="btn btnSecondary"
              onClick={() => void simulationQuery.refetch()}
            >
              重试
            </button>
          </div>
        ) : (
          <form className={styles.simForm} onSubmit={handleSubmit}>
            <div className={styles.delayGrid}>
              <label className={styles.field}>
                <span>素材检查等待</span>
                <span className={styles.inputShell}>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    step="0.1"
                    inputMode="decimal"
                    value={form.assetCheck}
                    onChange={(event) => setForm({ ...form, assetCheck: event.target.value })}
                  />
                  <span aria-hidden="true">秒</span>
                </span>
                <small>核对图片数量与可读性</small>
              </label>
              <label className={styles.field}>
                <span>模拟生成等待</span>
                <span className={styles.inputShell}>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    step="0.1"
                    inputMode="decimal"
                    value={form.generate}
                    onChange={(event) => setForm({ ...form, generate: event.target.value })}
                  />
                  <span aria-hidden="true">秒</span>
                </span>
                <small>模拟画面生成过程</small>
              </label>
              <label className={styles.field}>
                <span>结果整理等待</span>
                <span className={styles.inputShell}>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    step="0.1"
                    inputMode="decimal"
                    value={form.finalize}
                    onChange={(event) => setForm({ ...form, finalize: event.target.value })}
                  />
                  <span aria-hidden="true">秒</span>
                </span>
                <small>拼合预览图并归档</small>
              </label>
            </div>

            <label className={styles.field}>
              <span>失败注入阶段</span>
              <select
                className={styles.select}
                value={form.failureStage}
                onChange={(event) => setForm({ ...form, failureStage: event.target.value })}
              >
                {STAGE_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small>失败后停止后续步骤，并在记录里保存失败阶段与原因。</small>
            </label>

            <label className={styles.field}>
              <span>失败原因</span>
              <textarea
                className={styles.textarea}
                rows={3}
                maxLength={300}
                placeholder={
                  form.failureStage === "NONE"
                    ? "当前未注入失败，这里可以留空。"
                    : "例如：模拟生成服务返回了不可用的画面，请稍后再试。"
                }
                value={form.failureMessage}
                onChange={(event) => setForm({ ...form, failureMessage: event.target.value })}
              />
              <small>{form.failureMessage.length} / 300 字，留空时后台会使用默认原因。</small>
            </label>

            <div className={styles.simHint}>
              <SlidersIcon width={18} height={18} />
              <p>想观察多个任务排队，可以把三个等待时间都调大，然后连续提交两三个任务。</p>
            </div>

            {notice ? (
              <p className={styles.formNotice} data-tone={notice.tone} role="status">
                {notice.message}
              </p>
            ) : null}

            <div className={styles.simActions}>
              <button type="button" className={styles.textButton} onClick={applyDefaults} disabled={saving}>
                填入默认节奏
              </button>
              <div>
                <button type="button" className="btn btnQuiet" onClick={onClose} disabled={saving}>
                  取消
                </button>
                <button type="submit" className="btn btnPrimary" disabled={saving}>
                  {saving ? <span className="spinner" aria-hidden="true" /> : null}
                  {saving ? "正在保存" : "保存设置"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

export default function CreationsView() {
  const { user } = useAuth();
  const taskQuery = useTasks(user?.id);
  const simulationQuery = useQuery({
    queryKey: ["simulation"],
    queryFn: ({ signal }) => api.getSimulation(signal),
    enabled: Boolean(user),
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [previewTask, setPreviewTask] = useState<CreationTask | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const newParam = searchParams.get("new");

  useEffect(() => {
    if (!newParam) return;
    setSubmittedId(newParam);
    setBannerDismissed(false);
    router.replace("/creations", { scroll: false });
  }, [newParam, router]);

  const tasks = useMemo(() => taskQuery.data?.items ?? [], [taskQuery.data]);
  const feedState = deriveTaskFeedState({
    hasData: Boolean(taskQuery.data),
    isPending: taskQuery.isPending,
    isError: taskQuery.isError,
    count: tasks.length,
  });
  const activeCount = tasks.filter((task) => isTaskActive(task.status)).length;
  const succeededCount = tasks.filter((task) => task.status === "SUCCEEDED").length;
  const failedCount = tasks.filter((task) => task.status === "FAILED").length;
  const visibleTasks = tasks.filter((task) => matchesFilter(task, filter));
  const submittedTask = submittedId ? tasks.find((task) => task.id === submittedId) : undefined;
  const showSubmittedBanner = Boolean(submittedId) && !bannerDismissed;
  const simulation = simulationQuery.data ?? EMPTY_SIMULATION;
  const failureStageLabel = simulation.failureStage
    ? (STAGE_LABELS[simulation.failureStage as StageKey] ?? simulation.failureStage)
    : null;
  const lastSynced = taskQuery.dataUpdatedAt
    ? new Date(taskQuery.dataUpdatedAt).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : null;

  if (!user) {
    return (
      <AuthRequired
        title="登录后，查看你的片刻。"
        description="历史任务、后台阶段和已经整理好的成品都保存在账号里。登录后继续跟踪，或从一张新照片开始。"
        nextPath="/creations"
      />
    );
  }

  async function refreshTasks() {
    setManualRefreshing(true);
    try {
      await taskQuery.refetch();
    } finally {
      setManualRefreshing(false);
    }
  }

  function openPreview(task: CreationTask) {
    setPreviewTask(task);
    setPreviewOpen(true);
  }

  function revealSubmittedTask() {
    if (!submittedId) return;
    setFilter("all");
    window.setTimeout(() => {
      const element = document.getElementById(`task-${submittedId}`);
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus({ preventScroll: true });
    }, 0);
  }

  return (
    <div className={styles.page}>
      <div className={styles.heroGlow} aria-hidden="true" />

      <div className="shell">
        <section className={styles.hero} aria-labelledby="creations-title">
          <div className={styles.heroCopy}>
            <div className={styles.heroKicker}>
              <p className="eyebrow">PERSONAL ARCHIVE / 2026</p>
              {user ? (
                <span className={styles.identityChip}>
                  <span>{user.initials}</span>
                  {user.displayName}
                </span>
              ) : null}
            </div>
            <h1 id="creations-title" className={styles.heroTitle}>
              我的<span>片刻</span>。
            </h1>
            <p className={styles.heroLead}>
              你交出去的每一组照片、后台走过的每一个阶段，以及最后被整理好的成品，都留在这一页里。
            </p>
            <div className={styles.heroActions}>
              <Link className="btn btnPrimary" href="/#templates">
                再做一件
                <ArrowRightIcon width={16} height={16} />
              </Link>
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => setSimulationOpen(true)}
              >
                <SlidersIcon width={16} height={16} />
                演示控制
              </button>
            </div>
            <p className={styles.heroFinePrint}>
              任务由 Java 后台异步处理，关闭页面不会中断；刷新后会从服务端恢复记录。
            </p>
          </div>

          <div className={styles.ledgerCard}>
            <div className={styles.ledgerHead}>
              <span>STUDIO LEDGER</span>
              <span>NO. 2026—A</span>
            </div>
            <dl className={styles.ledger}>
              <div>
                <dt>全部记录</dt>
                <dd>{countLabel(taskQuery.data ? tasks.length : undefined)}</dd>
              </div>
              <div data-tone="working">
                <dt>后台处理中</dt>
                <dd>{countLabel(taskQuery.data ? activeCount : undefined)}</dd>
              </div>
              <div data-tone="success">
                <dt>已完成</dt>
                <dd>{countLabel(taskQuery.data ? succeededCount : undefined)}</dd>
              </div>
              <div data-tone="failure">
                <dt>需查看失败</dt>
                <dd>{countLabel(taskQuery.data ? failedCount : undefined)}</dd>
              </div>
            </dl>
            <div className={styles.ledgerFoot}>
              <span className={styles.ledgerMark}>M</span>
              <p>每一件作品，都有迹可循。</p>
            </div>
          </div>
        </section>

        <section className={styles.records} aria-labelledby="records-title">
          <div className={styles.sectionHead}>
            <div>
              <p className="eyebrow">THE RECORDS</p>
              <h2 id="records-title">制作与收藏</h2>
            </div>
            <div className={styles.syncNote} aria-live="polite">
              <span className={styles.syncDot} data-active={activeCount > 0 ? "true" : undefined} />
              {activeCount > 0
                ? `正在跟踪 ${activeCount} 个未完成任务，每 1.2 秒同步一次`
                : taskQuery.data
                  ? "没有待处理任务，自动轮询已停止"
                  : "正在连接制作服务"}
              {lastSynced ? <span className={styles.lastSync}>最近 {lastSynced}</span> : null}
            </div>
          </div>

          {showSubmittedBanner ? (
            <div
              className={styles.submittedBanner}
              data-tone={submittedTask?.status === "FAILED" ? "failure" : "success"}
              role="status"
            >
              <span className={styles.submittedIcon}>
                {submittedTask?.status === "FAILED" ? (
                  <AlertIcon width={19} height={19} />
                ) : (
                  <CheckIcon width={19} height={19} />
                )}
              </span>
              <div>
                <strong>
                  {submittedTask?.status === "SUCCEEDED"
                    ? "任务已受理，而且已经完成"
                    : submittedTask?.status === "FAILED"
                      ? `任务已受理，但制作停在「${submittedTask.failureStageLabel ?? "处理阶段"}」`
                      : "任务已受理，后台会继续制作"}
                </strong>
                <p>
                  {submittedTask
                    ? `「${submittedTask.template.title}」当前状态：${submittedTask.statusLabel}。${
                        submittedTask.status === "FAILED"
                          ? "失败原因已经记录在这一页，可以稍后查看。"
                          : "你可以继续浏览其他模板，不需要留在这里等。"
                      }`
                    : "正在读取这次任务的最新状态。你可以继续浏览其他模板，不需要留在这里等。"}
                </p>
              </div>
              <button type="button" className={styles.bannerLink} onClick={revealSubmittedTask}>
                定位到任务
                <ArrowRightIcon width={15} height={15} />
              </button>
              <button
                type="button"
                className={styles.bannerClose}
                onClick={() => setBannerDismissed(true)}
                aria-label="关闭任务受理提示"
              >
                ×
              </button>
            </div>
          ) : null}

          {feedState === "stale" ? (
            <div className={styles.inlineError} role="status">
              <WifiOffIcon width={20} height={20} />
              <div>
                <strong>状态同步暂时中断，记录仍在这里</strong>
                <p>
                  后台任务不会因为这次查询失败被标记为失败。你看到的是上一次成功读取的状态，恢复后可以继续同步。
                </p>
              </div>
              <button type="button" onClick={refreshTasks} disabled={manualRefreshing}>
                {manualRefreshing ? "恢复中…" : "恢复查询"}
              </button>
            </div>
          ) : null}

          <div className={styles.toolbar}>
            <div className={styles.filters} role="group" aria-label="筛选作品记录">
              {FILTERS.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={styles.filterButton}
                  aria-pressed={filter === item.key}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                  <span>{countForFilter(tasks, item.key)}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={refreshTasks}
              disabled={manualRefreshing}
              aria-label="刷新作品记录"
            >
              <RefreshIcon width={15} height={15} className={manualRefreshing ? styles.spinning : undefined} />
              {manualRefreshing ? "刷新中" : "刷新记录"}
            </button>
          </div>

          <div className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              {feedState === "loading" ? <HistorySkeleton /> : null}

              {feedState === "unavailable" ? (
                <HistoryError
                  message={getErrorMessage(taskQuery.error, "读取作品记录时发生了未知错误。")}
                  onRetry={refreshTasks}
                  retrying={manualRefreshing}
                />
              ) : null}

              {feedState === "empty" ? <EmptyState /> : null}

              {taskQuery.data && tasks.length > 0 && visibleTasks.length === 0 ? (
                <div className={styles.filterEmpty}>
                  <p className="eyebrow">NO MATCHING RECORDS</p>
                  <h3>这个筛选下还没有记录。</h3>
                  <p>换一个状态看看，或者把筛选恢复为全部。</p>
                  <button type="button" className="btn btnSecondary" onClick={() => setFilter("all")}>
                    查看全部记录
                  </button>
                </div>
              ) : null}

              {visibleTasks.length > 0 ? (
                <div className={styles.taskList}>
                  {visibleTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isNew={task.id === submittedId}
                      onPreview={openPreview}
                    />
                  ))}
                </div>
              ) : null}

              <p className="srOnly" aria-live="polite">
                {taskQuery.isPending
                  ? "正在读取作品记录。"
                  : activeCount > 0
                    ? `还有 ${activeCount} 个任务正在后台处理。`
                    : taskQuery.data
                      ? "所有任务都已结束，自动刷新已经停止。"
                      : ""}
              </p>
            </div>

            <aside className={styles.sidebar} aria-label="作品记录概览">
              <section className={styles.sideCard}>
                <p className={styles.sideLabel}>当前登录账号</p>
                {user ? (
                  <div className={styles.identityRow}>
                    <span className={styles.identityAvatar}>{user.initials}</span>
                    <div>
                      <strong>{user.displayName}</strong>
                      <p>{user.role}</p>
                    </div>
                  </div>
                ) : null}
                <p className={styles.sideHint}>
                  记录与当前登录账号绑定。退出或换一个账号后，这里只会显示该账号提交的任务。
                </p>
              </section>

              <section className={styles.sideCard}>
                <div className={styles.sideTitleRow}>
                  <p className={styles.sideLabel}>后台同步</p>
                  <span className={styles.syncDot} data-active={activeCount > 0 ? "true" : undefined} />
                </div>
                <p className={styles.sideStrong}>
                  {activeCount > 0 ? `${activeCount} 个任务仍在处理` : "当前没有进行中的任务"}
                </p>
                <p className={styles.sideHint}>
                  {activeCount > 0
                    ? "只对未结束的任务每 1.2 秒轮询一次。某个任务结束后，就不会再请求它的新状态。"
                    : "没有待处理任务时，页面不会继续轮询。刷新或提交新任务后会重新开始同步。"}
                </p>
                <button
                  type="button"
                  className={styles.sideAction}
                  onClick={refreshTasks}
                  disabled={manualRefreshing}
                >
                  <RefreshIcon
                    width={14}
                    height={14}
                    className={manualRefreshing ? styles.spinning : undefined}
                  />
                  {manualRefreshing ? "正在读取" : "立即刷新"}
                </button>
              </section>

              <section className={styles.sideCard}>
                <div className={styles.sideTitleRow}>
                  <p className={styles.sideLabel}>模拟生成</p>
                  <span className={styles.devTag}>DEMO</span>
                </div>
                {simulationQuery.isPending ? (
                  <p className={styles.sideHint}>正在读取服务端模拟节奏…</p>
                ) : simulationQuery.isError ? (
                  <p className={styles.sideHint}>模拟控制接口暂时不可用，后台制作不受影响。</p>
                ) : (
                  <>
                    <dl className={styles.simList}>
                      <div>
                        <dt>素材检查</dt>
                        <dd>{delayLabel(simulation.assetCheckDelayMs)}</dd>
                      </div>
                      <div>
                        <dt>模拟生成</dt>
                        <dd>{delayLabel(simulation.generateDelayMs)}</dd>
                      </div>
                      <div>
                        <dt>结果整理</dt>
                        <dd>{delayLabel(simulation.finalizeDelayMs)}</dd>
                      </div>
                    </dl>
                    {failureStageLabel ? (
                      <p className={styles.failureTag}>
                        <AlertIcon width={14} height={14} />
                        下一个任务将在「{failureStageLabel}」失败
                      </p>
                    ) : (
                      <p className={styles.sideHint}>当前未注入失败，后台会按顺序完成三个阶段。</p>
                    )}
                  </>
                )}
                <button type="button" className={styles.sideAction} onClick={() => setSimulationOpen(true)}>
                  <SlidersIcon width={14} height={14} />
                  调整模拟参数
                </button>
              </section>

              <p className={styles.sideFoot}>
                任务状态与历史记录保存在 MySQL。重新加载页面时，前端会再次向 Java 服务读取它们。
              </p>
            </aside>
          </div>
        </section>
      </div>

      <ResultDialog task={previewTask} open={previewOpen} onClose={() => setPreviewOpen(false)} />
      <SimulationDialog open={simulationOpen} onClose={() => setSimulationOpen(false)} />
    </div>
  );
}
