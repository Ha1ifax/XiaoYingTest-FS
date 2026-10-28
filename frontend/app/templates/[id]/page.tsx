"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
} from "react";
import { AlertIcon, ArrowRightIcon, CheckIcon, CloseIcon, LockIcon, RefreshIcon, SparklesIcon, UploadIcon } from "@/components/icons";
import { api, ApiError, fetchSampleImage, uploadAsset } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatBytes, getErrorMessage, isAbortError, mimeListLabel } from "@/lib/format";
import { useTemplate } from "@/lib/hooks";
import type { CreationTask, ItemsResponse, Template, UploadedAsset } from "@/lib/types";
import styles from "./page.module.css";

type SlotStatus = "empty" | "uploading" | "ready" | "error";

interface Slot {
  status: SlotStatus;
  asset: UploadedAsset | null;
  localPreview: string | null;
  progress: number;
  error: string | null;
  fileName: string | null;
  fileSize: number | null;
}

type Notice = { tone: "error" | "info"; message: string } | null;

const SAMPLE_ROWS = ["素材检查", "模拟生成", "结果整理"];

const SAMPLE_IMAGES = [
  { src: "/samples/sample-coast.jpg", thumb: "/samples/thumbs/sample-coast.jpg", fileName: "sample-coast.jpg", label: "海岸公路" },
  { src: "/samples/sample-cafe.jpg", thumb: "/samples/thumbs/sample-cafe.jpg", fileName: "sample-cafe.jpg", label: "咖啡时光" },
  { src: "/samples/sample-cat.jpg", thumb: "/samples/thumbs/sample-cat.jpg", fileName: "sample-cat.jpg", label: "窗边小猫" },
  { src: "/samples/sample-flower.jpg", thumb: "/samples/thumbs/sample-flower.jpg", fileName: "sample-flower.jpg", label: "静物花束" },
  { src: "/samples/sample-street.jpg", thumb: "/samples/thumbs/sample-street.jpg", fileName: "sample-street.jpg", label: "城市夜色" },
];

function createSlots(count: number): Slot[] {
  return Array.from({ length: count }, () => ({
    status: "empty",
    asset: null,
    localPreview: null,
    progress: 0,
    error: null,
    fileName: null,
    fileSize: null,
  }));
}

function SlotsSkeleton() {
  return (
    <div className={styles.loadingWrap} aria-busy="true" aria-label="模板加载中">
      <div className={styles.loadingCover} />
      <div className={styles.loadingCopy}>
        <span className={styles.loadingLine} />
        <span className={styles.loadingTitle} />
        <span className={styles.loadingLine} />
        <span className={styles.loadingLineShort} />
        <div className={styles.loadingActions}>
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export default function TemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const templateId = params?.id ?? "";
  const templateQuery = useTemplate(templateId);
  const template = templateQuery.data;
  const nextPath = pathname || `/templates/${templateId}`;
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const registerHref = `/register?next=${encodeURIComponent(nextPath)}`;

  const [slots, setSlots] = useState<Slot[]>([]);
  const slotsRef = useRef<Slot[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState<string | null>(null);
  const initializedTemplateRef = useRef<string | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const controllersRef = useRef<Map<number, AbortController>>(new Map());
  const previewsRef = useRef<Set<string>>(new Set());
  const tokensRef = useRef<number[]>([]);
  const pickerIndexRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!template || initializedTemplateRef.current === template.id) return;
    initializedTemplateRef.current = template.id;
    const initial = createSlots(template.requiredImageCount);
    slotsRef.current = initial;
    tokensRef.current = Array.from({ length: template.requiredImageCount }, () => 0);
    setSlots(initial);
  }, [template]);

  useEffect(() => {
    if (!template) return;
    document.title = `${template.title} · MOMENTO`;
    return () => {
      document.title = "MOMENTO 片刻制所";
    };
  }, [template]);

  useEffect(() => {
    return () => {
      controllersRef.current.forEach((controller) => controller.abort());
      controllersRef.current.clear();
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  const readyCount = slots.filter((slot) => slot.status === "ready" && slot.asset).length;
  const uploading = slots.some((slot) => slot.status === "uploading");
  const allReady = Boolean(template) && readyCount === (template?.requiredImageCount ?? 0) && !uploading;
  const canSubmit = allReady && !submitting;
  const missing = template ? Math.max(0, template.requiredImageCount - readyCount) : 0;
  const sampleTarget = slots.findIndex((slot) => slot.status === "empty" || slot.status === "error");
  const canUseSamples = Boolean(template && user) && !submitting && !uploading && !sampleLoading && sampleTarget >= 0;

  function patchSlot(index: number, patch: Partial<Slot>) {
    setSlots((previous) => {
      const next = previous.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...patch } : slot));
      slotsRef.current = next;
      return next;
    });
  }

  function releasePreview(url: string | null) {
    if (!url) return;
    URL.revokeObjectURL(url);
    previewsRef.current.delete(url);
  }

  function validateFile(templateValue: Template, file: File): string | null {
    if (!file.size) return "这个文件是空的，请换一张图片。";
    if (file.size > templateValue.maxFileSizeBytes) {
      return `图片超过 ${formatBytes(templateValue.maxFileSizeBytes)} 的大小限制。`;
    }
    if (file.type && !templateValue.acceptedMimeTypes.includes(file.type)) {
      return `这个模板只接受 ${mimeListLabel(templateValue.acceptedMimeTypes)} 格式。`;
    }
    if (!file.type && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
      return `无法识别这个文件，请选择 ${mimeListLabel(templateValue.acceptedMimeTypes)} 图片。`;
    }
    return null;
  }

  async function startUpload(index: number, file: File) {
    if (!template || !user || submittingRef.current) return;
    const current = slotsRef.current[index];
    const validation = validateFile(template, file);

    if (validation) {
      setNotice({ tone: "error", message: validation });
      if (!current?.asset) {
        patchSlot(index, {
          status: "error",
          error: validation,
          fileName: file.name,
          fileSize: file.size,
          progress: 0,
        });
      }
      return;
    }

    controllersRef.current.get(index)?.abort();
    releasePreview(current?.localPreview ?? null);

    const token = (tokensRef.current[index] ?? 0) + 1;
    tokensRef.current[index] = token;
    const controller = new AbortController();
    controllersRef.current.set(index, controller);
    const preview = URL.createObjectURL(file);
    previewsRef.current.add(preview);
    const previousAsset = current?.asset ?? null;

    setNotice(null);
    setSubmitError(null);
    patchSlot(index, {
      status: "uploading",
      asset: previousAsset,
      localPreview: preview,
      progress: 0,
      error: null,
      fileName: file.name,
      fileSize: file.size,
    });

    try {
      const asset = await uploadAsset({
        templateId: template.id,
        file,
        signal: controller.signal,
        onProgress: ({ loaded, total }) => {
          if (tokensRef.current[index] !== token) return;
          patchSlot(index, { progress: total ? Math.min(1, loaded / total) : 0 });
        },
      });
      if (tokensRef.current[index] !== token) return;

      releasePreview(preview);
      patchSlot(index, {
        status: "ready",
        asset,
        localPreview: null,
        progress: 1,
        error: null,
        fileName: asset.originalFileName,
        fileSize: asset.sizeBytes,
      });
      setNotice({ tone: "info", message: `第 ${index + 1} 张图片已就绪。` });

      if (previousAsset && previousAsset.id !== asset.id) {
        api.deleteAsset(previousAsset.id).catch(() => {
          /* 旧素材清理失败不阻塞替换，后台可后续清理。 */
        });
      }
    } catch (error) {
      if (tokensRef.current[index] !== token) return;
      releasePreview(preview);
      const message = isAbortError(error) ? "上传已取消。" : getErrorMessage(error);
      if (previousAsset) {
        patchSlot(index, {
          status: "ready",
          localPreview: null,
          progress: 1,
          error: null,
          fileName: previousAsset.originalFileName,
          fileSize: previousAsset.sizeBytes,
        });
      } else {
        patchSlot(index, { status: "error", localPreview: null, progress: 0, error: message });
      }
      if (!isAbortError(error)) {
        setNotice({ tone: "error", message: `第 ${index + 1} 张图片没有上传成功：${message}` });
      }
    } finally {
      if (controllersRef.current.get(index) === controller) {
        controllersRef.current.delete(index);
      }
    }
  }

  function openPicker(index: number) {
    if (submitting || !template) return;
    pickerIndexRef.current = index;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  function onFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const index = pickerIndexRef.current;
    event.target.value = "";
    if (!file || index === null) return;
    void startUpload(index, file);
  }

  async function fillWithSample(sample: (typeof SAMPLE_IMAGES)[number]) {
    if (!canUseSamples || sampleTarget < 0) return;
    setNotice(null);
    setSampleLoading(sample.src);
    try {
      const file = await fetchSampleImage(sample.src, sample.fileName);
      await startUpload(sampleTarget, file);
    } catch (error) {
      if (!isAbortError(error)) {
        setNotice({ tone: "error", message: `示例照片没有取回：${getErrorMessage(error)}` });
      }
    } finally {
      setSampleLoading(null);
    }
  }

  function cancelUpload(index: number) {
    controllersRef.current.get(index)?.abort();
    controllersRef.current.delete(index);
    tokensRef.current[index] = (tokensRef.current[index] ?? 0) + 1;
    const current = slotsRef.current[index];
    releasePreview(current?.localPreview ?? null);
    if (current?.asset) {
      patchSlot(index, {
        status: "ready",
        localPreview: null,
        progress: 1,
        error: null,
        fileName: current.asset.originalFileName,
        fileSize: current.asset.sizeBytes,
      });
    } else {
      patchSlot(index, {
        status: "empty",
        localPreview: null,
        progress: 0,
        error: null,
        fileName: null,
        fileSize: null,
      });
    }
  }

  function removeSlot(index: number) {
    if (!template || !user || submittingRef.current) return;
    controllersRef.current.get(index)?.abort();
    controllersRef.current.delete(index);
    tokensRef.current[index] = (tokensRef.current[index] ?? 0) + 1;
    const current = slotsRef.current[index];
    releasePreview(current?.localPreview ?? null);
    patchSlot(index, {
      status: "empty",
      asset: null,
      localPreview: null,
      progress: 0,
      error: null,
      fileName: null,
      fileSize: null,
    });
    if (current?.asset) {
      api.deleteAsset(current.asset.id).catch(() => {
        setNotice({ tone: "info", message: "图片已从制作台移除，后台文件稍后会清理。" });
      });
    }
  }

  function onDrop(event: DragEvent<HTMLElement>, index: number) {
    event.preventDefault();
    setDragging(null);
    if (submitting) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void startUpload(index, file);
  }

  async function submitTask() {
    if (!template || !user || !allReady || submittingRef.current) return;
    const assetIds = slots
      .map((slot) => slot.asset?.id)
      .filter((assetId): assetId is string => Boolean(assetId));
    if (assetIds.length !== template.requiredImageCount) {
      setSubmitError("素材状态发生了变化，请确认图片后再提交。");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const task = await api.createTask(template.id, assetIds);
      queryClient.setQueryData<ItemsResponse<CreationTask>>(["tasks", user.id], (previous) => {
        const remaining = previous?.items.filter((item) => item.id !== task.id) ?? [];
        return { items: [task, ...remaining] };
      });
      void queryClient.invalidateQueries({ queryKey: ["tasks", user.id] });
      router.push(`/creations?new=${encodeURIComponent(task.id)}`);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (templateQuery.isLoading) {
    return (
      <div className={`shell ${styles.page}`}>
        <SlotsSkeleton />
      </div>
    );
  }

  if (templateQuery.isError) {
    const notFound = templateQuery.error instanceof ApiError && templateQuery.error.status === 404;
    return (
      <div className={`shell ${styles.page}`}>
        <div className={styles.errorPage}>
          <span className={styles.errorIcon}>
            {notFound ? <SparklesIcon /> : <AlertIcon />}
          </span>
          <p className="eyebrow">{notFound ? "TEMPLATE NOT FOUND" : "THE STUDIO IS OFFLINE"}</p>
          <h1>{notFound ? "这张模板不在这里" : "制作台暂时没有连上"}</h1>
          <p>
            {notFound
              ? "它可能已经下架，或者链接少了一个字符。回模板库看看别的片刻。"
              : `${getErrorMessage(templateQuery.error)} 请确认后端服务已启动，然后重新加载。`}
          </p>
          <div className={styles.errorActions}>
            <Link href="/" className="btn btnPrimary">
              回到模板库
            </Link>
            {!notFound ? (
              <button type="button" className="btn btnSecondary" onClick={() => templateQuery.refetch()}>
                <RefreshIcon />
                再试一次
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (!template) return null;

  return (
    <div className={`shell ${styles.page}`}>
      <nav className={styles.crumbs} aria-label="面包屑">
        <Link href="/" className={styles.backLink}>
          <span aria-hidden="true">←</span>
          模板库
        </Link>
        <span className={styles.crumbDivider} aria-hidden="true">/</span>
        <span>{template.category}</span>
        <span className={styles.crumbDivider} aria-hidden="true">/</span>
        <span className={styles.crumbCurrent}>{template.title}</span>
      </nav>

      <header className={styles.intro}>
        <div className={styles.introCopy}>
          <p className="eyebrow">MOMENTO TEMPLATE / {template.category}</p>
          <h1>{template.title}</h1>
          <p className={styles.description}>{template.description}</p>
          <p className={styles.detailNote}>{template.detailNote}</p>

          <dl className={styles.specs}>
            <div>
              <dt>需要素材</dt>
              <dd>{template.requiredImageCount} 张</dd>
            </div>
            <div>
              <dt>接受格式</dt>
              <dd>{mimeListLabel(template.acceptedMimeTypes)}</dd>
            </div>
            <div>
              <dt>单张上限</dt>
              <dd>{formatBytes(template.maxFileSizeBytes)}</dd>
            </div>
            <div>
              <dt>最终成品</dt>
              <dd>{template.resultLabel}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.coverColumn} style={{ "--template-accent": template.accentColor } as CSSProperties}>
          <div className={styles.coverFrame}>
            <img src={template.coverUrl} alt={`${template.title}模板示例封面`} />
            <div className={styles.coverCaption}>
              <span>{template.category}</span>
              <span aria-hidden="true">M / 01</span>
            </div>
          </div>
          <span className={styles.coverAccent} aria-hidden="true" />
          <span className={styles.coverNote}>示例封面 · 你的成片会长得不一样</span>
        </div>
      </header>

      <div className={styles.studio}>
        <section className={styles.uploadPanel} aria-labelledby="upload-heading">
          <div className={styles.uploadHead}>
            <div>
              <p className="eyebrow">YOUR MATERIALS</p>
              <h2 id="upload-heading">放进照片</h2>
            </div>
            <span className={styles.counter} aria-label={`${readyCount} 张素材已就绪，共需要 ${template.requiredImageCount} 张`}>
              <b>{readyCount}</b> / {template.requiredImageCount} 就位
            </span>
          </div>

          <p className={styles.uploadHint}>
            {template.requiredImageCount > 1
              ? `上传 ${template.requiredImageCount} 张照片，第 1 张会作为成片主图。`
              : "上传 1 张照片，它会成为这张作品的主角。"}
            单张不超过 {formatBytes(template.maxFileSizeBytes)}，支持 {mimeListLabel(template.acceptedMimeTypes)}。
          </p>

          {!user ? (
            <div className={styles.uploadGate}>
              <span className={styles.uploadGateIcon} aria-hidden="true">
                <LockIcon />
              </span>
              <div className={styles.uploadGateCopy}>
                <span className={styles.uploadGateEyebrow}>MEMBERS ONLY / 会员制作台</span>
                <h3>登录后，把照片放进制作台</h3>
                <p>模板和示例可以匿名浏览；上传、预览和提交制作需要一个账号。</p>
              </div>
              <div className={styles.uploadGateActions}>
                <Link href={loginHref} className={styles.uploadGatePrimary}>
                  登录后制作
                  <ArrowRightIcon />
                </Link>
                <Link href={registerHref} className={styles.uploadGateSecondary}>
                  还没有账号？创建一个
                </Link>
              </div>
            </div>
          ) : (
            <>
          {!allReady ? (
            <div className={styles.sampleTray} aria-label="示例素材">
              <div className={styles.sampleIntro}>
                <span>没有现成照片？</span>
                <b>用一张示例开始</b>
              </div>
              <div className={styles.sampleList}>
                {SAMPLE_IMAGES.map((sample) => (
                  <button
                    key={sample.src}
                    type="button"
                    className={styles.sampleButton}
                    disabled={!canUseSamples}
                    aria-busy={sampleLoading === sample.src}
                    aria-label={`用示例照片「${sample.label}」填入第 ${sampleTarget + 1} 个空位`}
                    title={`示例照片：${sample.label}`}
                    onClick={() => void fillWithSample(sample)}
                  >
                    <img src={sample.thumb} alt="" width={160} height={200} loading="lazy" />
                    <span aria-hidden="true">+</span>
                  </button>
                ))}
              </div>
              <span className={styles.sampleNote} aria-live="polite">
                {sampleLoading ? "正在取回示例照片……" : "会填入下一个空位"}
              </span>
            </div>
          ) : null}

          <div
            className={`${styles.slots} ${template.requiredImageCount === 1 ? styles.slotsSingle : ""} ${template.requiredImageCount === 2 ? styles.slotsTwo : ""}`}
            style={{ "--slot-columns": Math.min(template.requiredImageCount, 3) } as CSSProperties}
            aria-live="polite"
          >
            {slots.map((slot, index) => (
              <UploadSlot
                key={index}
                slot={slot}
                index={index}
                disabled={submitting}
                dragging={dragging === index}
                onPick={() => openPicker(index)}
                onCancel={() => cancelUpload(index)}
                onRemove={() => removeSlot(index)}
                onDrop={(event) => onDrop(event, index)}
                onDragState={(active) => setDragging(active ? index : null)}
                acceptedLabel={mimeListLabel(template.acceptedMimeTypes)}
              />
            ))}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className={styles.fileInput}
            accept={template.acceptedMimeTypes.join(",")}
            onChange={onFilePicked}
            tabIndex={-1}
            aria-hidden="true"
          />

          {notice ? (
            <div
              className={`${styles.uploadNotice} ${notice.tone === "error" ? styles.noticeError : styles.noticeInfo}`}
              role={notice.tone === "error" ? "alert" : "status"}
            >
              {notice.tone === "error" ? <AlertIcon /> : <CheckIcon />}
              <span>{notice.message}</span>
              <button type="button" onClick={() => setNotice(null)} aria-label="关闭提示">
                <CloseIcon />
              </button>
            </div>
          ) : null}

          <div className={styles.slotFooter}>
            <span>
              <span className={styles.readyDot} aria-hidden="true" />
              素材仅保存在本机后端，不会发送到外部服务
            </span>
            <span aria-hidden="true">{mimeListLabel(template.acceptedMimeTypes)}</span>
          </div>
            </>
          )}
        </section>

        <aside className={styles.orderPanel} aria-label="制作单">
          <div className={styles.orderTop}>
            <span className={styles.orderLabel}>YOUR ORDER</span>
            <span className={`${styles.orderState} ${allReady ? styles.orderStateReady : ""}`}>
              {user ? (allReady ? "可以提交" : "准备素材") : "登录后制作"}
            </span>
          </div>

          <div className={styles.miniTemplate}>
            <img src={template.coverUrl} alt="" />
            <div>
              <span>{template.category}</span>
              <strong>{template.title}</strong>
              <small>{template.requiredImageCount} 张素材 · {template.resultLabel}</small>
            </div>
          </div>

          <div className={styles.orderRule} />

          <ul className={styles.checklist}>
            <li className={readyCount === template.requiredImageCount ? styles.checkDone : ""}>
              <span className={styles.checkIcon}>
                {readyCount === template.requiredImageCount ? <CheckIcon /> : <span>{readyCount}</span>}
              </span>
              <div>
                <b>素材齐备</b>
                <small>已就绪 {readyCount} / {template.requiredImageCount} 张</small>
              </div>
            </li>
            <li className={uploading ? "" : styles.checkDone}>
              <span className={styles.checkIcon}>{uploading ? <span>···</span> : <CheckIcon />}</span>
              <div>
                <b>{uploading ? "正在上传素材" : "素材检查"}</b>
                <small>{uploading ? "请等待上传完成，暂不能提交" : "格式与大小已在本机校验"}</small>
              </div>
            </li>
          </ul>

          <div className={styles.processCard}>
            <span className={styles.processCardLabel}>提交后的后台流程</span>
            <ol>
              {SAMPLE_ROWS.map((step, index) => (
                <li key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {step}
                  {index < SAMPLE_ROWS.length - 1 ? <i aria-hidden="true">→</i> : null}
                </li>
              ))}
            </ol>
          </div>

          {submitError ? (
            <div className={styles.submitError} role="alert">
              <AlertIcon />
              <div>
                <strong>任务没有提交成功</strong>
                <p>{submitError}</p>
              </div>
            </div>
          ) : null}

          {!user ? (
            <Link href={loginHref} className={`${styles.submitButton} ${styles.submitLink}`}>
              登录后提交制作
              <ArrowRightIcon />
            </Link>
          ) : (
            <button
              type="button"
              className={styles.submitButton}
              disabled={!canSubmit}
              aria-busy={submitting}
              onClick={() => void submitTask()}
            >
              {submitting ? (
                <>
                  <span className={styles.buttonSpinner} aria-hidden="true" />
                  正在受理任务……
                </>
              ) : !allReady ? (
                <>
                  {uploading ? "等待图片上传完成" : missing > 0 ? `还差 ${missing} 张图片` : "准备素材"}
                  <span className={styles.submitCount}>{readyCount}/{template.requiredImageCount}</span>
                </>
              ) : (
                <>
                  提交制作
                  <ArrowRightIcon />
                </>
              )}
            </button>
          )}

          <p className={styles.submitNote}>
            {user
              ? "提交后任务在后台继续。可以关闭页面，稍后回到“我的作品”取走结果。"
              : "登录后即可上传照片、提交任务，并在“我的作品”里取走成品。"}
          </p>

          <div className={styles.orderFoot}>
            <span className={styles.simDot} aria-hidden="true" />
            本地模拟生成 · 不调用真实 AI
          </div>
        </aside>
      </div>
    </div>
  );
}

function UploadSlot({
  slot,
  index,
  disabled,
  dragging,
  onPick,
  onCancel,
  onRemove,
  onDrop,
  onDragState,
  acceptedLabel,
}: {
  slot: Slot;
  index: number;
  disabled: boolean;
  dragging: boolean;
  onPick: () => void;
  onCancel: () => void;
  onRemove: () => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragState: (active: boolean) => void;
  acceptedLabel: string;
}) {
  const number = String(index + 1).padStart(2, "0");
  const percent = Math.round(slot.progress * 100);

  if (slot.status === "empty") {
    return (
      <button
        type="button"
        className={`${styles.slot} ${styles.slotEmpty} ${dragging ? styles.slotDragging : ""}`}
        onClick={onPick}
        onDragOver={(event) => {
          event.preventDefault();
          onDragState(true);
        }}
        onDragLeave={() => onDragState(false)}
        onDrop={onDrop}
        disabled={disabled}
        aria-label={`为第 ${index + 1} 张图片选择文件`}
      >
        <span className={styles.slotNumber}>{number}</span>
        <span className={styles.emptyIcon}>
          <UploadIcon />
        </span>
        <strong>选择或拖入图片</strong>
        <span className={styles.emptyHint}>第 {index + 1} 张{index === 0 ? " · 主图" : ""}</span>
        <span className={styles.emptyFormats}>{acceptedLabel}</span>
      </button>
    );
  }

  if (slot.status === "uploading") {
    return (
      <div className={`${styles.slot} ${styles.slotFilled}`} aria-busy="true">
        {slot.localPreview ? (
          <img src={slot.localPreview} alt={`第 ${index + 1} 张图片上传预览`} />
        ) : null}
        <span className={styles.slotNumber}>{number}</span>
        <div className={styles.uploadOverlay}>
          <span className={styles.uploadSpinner} aria-hidden="true" />
          <strong>正在上传 {percent}%</strong>
          <span>{slot.fileName}</span>
          <button type="button" className={styles.cancelUpload} onClick={onCancel} disabled={disabled}>
            <CloseIcon />
            取消
          </button>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  }

  if (slot.status === "error" || !slot.asset) {
    return (
      <div className={`${styles.slot} ${styles.slotError}`} role="alert">
        <span className={styles.slotNumber}>{number}</span>
        <span className={styles.errorSlotIcon}>
          <AlertIcon />
        </span>
        <strong>这张没有传上去</strong>
        <p>{slot.error}</p>
        <button type="button" className={styles.retryButton} onClick={onPick} disabled={disabled}>
          <RefreshIcon />
          重新选择
        </button>
      </div>
    );
  }

  return (
    <figure className={`${styles.slot} ${styles.slotFilled} ${styles.slotReady}`}>
      <img src={slot.asset.url} alt={`第 ${index + 1} 张素材：${slot.asset.originalFileName}`} />
      <span className={styles.slotNumber}>{number}</span>
      <span className={styles.readyBadge}>
        <CheckIcon />
        已就绪
      </span>
      <figcaption className={styles.slotCaption}>
        <span className={styles.slotFile} title={slot.asset.originalFileName}>
          {slot.asset.originalFileName}
        </span>
        <span className={styles.slotSize}>{formatBytes(slot.asset.sizeBytes)}</span>
        <div className={styles.slotActions}>
          <button type="button" onClick={onPick} disabled={disabled} aria-label={`替换第 ${index + 1} 张图片`}>
            替换
          </button>
          <button type="button" onClick={onRemove} disabled={disabled} aria-label={`移除第 ${index + 1} 张图片`}>
            移除
          </button>
        </div>
      </figcaption>
    </figure>
  );
}
