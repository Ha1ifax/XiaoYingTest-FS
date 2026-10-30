"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AuthRequired } from "@/components/auth-required";
import { Modal } from "@/components/modal";
import {
  AlertIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ImageIcon,
  LayersIcon,
  PlusIcon,
  RefreshIcon,
  UploadIcon,
} from "@/components/icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { canManageTemplates } from "@/lib/authz";
import { formatBytes, formatDateTime, getErrorMessage, mimeListLabel } from "@/lib/format";
import type { AdminTemplate, TemplateInput } from "@/lib/types";
import styles from "./template-admin.module.css";

const MIME_OPTIONS = [
  { value: "image/jpeg", label: "JPG" },
  { value: "image/png", label: "PNG" },
  { value: "image/webp", label: "WEBP" },
  { value: "image/gif", label: "GIF" },
];

const DEFAULT_MIMES = ["image/jpeg", "image/png"];

interface FormState {
  title: string;
  category: string;
  description: string;
  coverUrl: string;
  accentColor: string;
  requiredImageCount: string;
  acceptedMimeTypes: string[];
  maxSizeMb: string;
  resultLabel: string;
  detailNote: string;
  sortOrder: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  category: "创意图片",
  description: "",
  coverUrl: "",
  accentColor: "#b14f33",
  requiredImageCount: "2",
  acceptedMimeTypes: DEFAULT_MIMES,
  maxSizeMb: "5",
  resultLabel: "A MOMENT, KEPT.",
  detailNote: "",
  sortOrder: "1",
};

function formForTemplate(template: AdminTemplate): FormState {
  return {
    title: template.title,
    category: template.category,
    description: template.description,
    coverUrl: template.coverUrl,
    accentColor: template.accentColor,
    requiredImageCount: String(template.requiredImageCount),
    acceptedMimeTypes: template.acceptedMimeTypes,
    maxSizeMb: String(Number((template.maxFileSizeBytes / (1024 * 1024)).toFixed(2))),
    resultLabel: template.resultLabel,
    detailNote: template.detailNote,
    sortOrder: String(template.sortOrder),
  };
}

export function TemplateAdminView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const adminQuery = useQuery({
    queryKey: ["admin-templates"],
    queryFn: ({ signal }) => api.getAdminTemplates(signal),
    enabled: Boolean(user) && canManageTemplates(user),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const categoryQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: ({ signal }) => api.getAdminCategories(signal),
    enabled: Boolean(user) && canManageTemplates(user),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTemplate | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "archived">("all");
  const [search, setSearch] = useState("");
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const items = adminQuery.data?.items ?? [];
  const categoryOptions = categoryQuery.data?.items ?? [];
  const categoryNames = Array.from(new Set(items.map((item) => item.category)));
  const activeCount = items.filter((item) => item.active).length;
  const archivedCount = items.length - activeCount;
  const referencedCount = items.reduce((sum, item) => sum + item.taskCount, 0);

  const filtered = items.filter((item) => {
    if (filter === "active" && !item.active) return false;
    if (filter === "archived" && item.active) return false;
    const keyword = search.trim().toLocaleLowerCase();
    if (!keyword) return true;
    return (
      item.title.toLocaleLowerCase().includes(keyword) ||
      item.category.toLocaleLowerCase().includes(keyword) ||
      item.id.toLocaleLowerCase().includes(keyword)
    );
  });

  if (!user) {
    return (
      <AuthRequired
        title="登录后，管理模板库。"
        description="模板管理只对工作室管理员开放，登录后可以新增模板、调整参数和上下架。"
        nextPath="/studio/templates"
      />
    );
  }

  if (!canManageTemplates(user)) {
    return (
      <div className={`shell ${styles.deniedWrap}`}>
        <section className={styles.denied}>
          <span className={styles.deniedIcon} aria-hidden="true">
            <LayersIcon />
          </span>
          <p className="eyebrow">STUDIO / RESTRICTED</p>
          <h1>这里只对管理员开放。</h1>
          <p>当前账号没有管理模板库的权限。你仍然可以浏览、上传素材和制作自己的作品。</p>
          <div className={styles.deniedActions}>
            <Link href="/">回到模板库</Link>
            <Link href="/account">账号设置</Link>
          </div>
        </section>
      </div>
    );
  }

  function invalidateLibrary() {
    queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    queryClient.invalidateQueries({ queryKey: ["templates"] });
    queryClient.invalidateQueries({ queryKey: ["template"] });
    queryClient.invalidateQueries({ queryKey: ["template-categories"] });
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    const nextOrder = items.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      sortOrder: String(nextOrder),
      category: categoryOptions[0]?.name ?? categoryNames[0] ?? EMPTY_FORM.category,
    });
    setFormError(null);
    setNewCategoryOpen(false);
    setNewCategoryName("");
    setCategoryError(null);
    setFormOpen(true);
  }

  function openEdit(template: AdminTemplate) {
    setEditing(template);
    setForm(formForTemplate(template));
    setFormError(null);
    setNewCategoryOpen(false);
    setNewCategoryName("");
    setCategoryError(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving || coverUploading) return;
    setFormOpen(false);
    setFormError(null);
    setNewCategoryOpen(false);
    setNewCategoryName("");
    setCategoryError(null);
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError("请填写分类名称。");
      return;
    }
    if (name.length > 40) {
      setCategoryError("分类名称不能超过 40 个字符。");
      return;
    }
    if (categorySaving) return;

    setCategorySaving(true);
    setCategoryError(null);
    try {
      const created = await api.createAdminCategory(name);
      await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["template-categories"] });
      setField("category", created.name);
      setNewCategoryOpen(false);
      setNewCategoryName("");
    } catch (error) {
      setCategoryError(getErrorMessage(error, "分类没有添加成功，请稍后再试。"));
    } finally {
      setCategorySaving(false);
    }
  }

  async function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("封面只支持 JPG、PNG 或 WebP 图片。");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setFormError("封面不能超过 8 MB。");
      return;
    }

    setCoverUploading(true);
    setFormError(null);
    try {
      const upload = await api.uploadTemplateCover(file);
      setField("coverUrl", upload.url);
    } catch (error) {
      setFormError(getErrorMessage(error, "封面没有上传成功，请重试。"));
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || coverUploading) return;

    if (!form.coverUrl) {
      setFormError("请先上传一张封面。");
      return;
    }
    if (form.acceptedMimeTypes.length === 0) {
      setFormError("请至少选择一种图片格式。");
      return;
    }
    if (!form.title.trim() || !form.category.trim() || !form.description.trim()) {
      setFormError("请填写标题、分类和描述。");
      return;
    }
    if (!form.resultLabel.trim() || !form.detailNote.trim()) {
      setFormError("请填写成品标签和版式说明。");
      return;
    }

    const maxFileSizeBytes = Math.round(Number(form.maxSizeMb) * 1024 * 1024);
    if (!Number.isFinite(maxFileSizeBytes) || maxFileSizeBytes < 1024 || maxFileSizeBytes > 20 * 1024 * 1024) {
      setFormError("单图大小需要在 1 KB 到 20 MB 之间。");
      return;
    }

    const requiredImageCount = Number(form.requiredImageCount);
    if (!Number.isInteger(requiredImageCount) || requiredImageCount < 1 || requiredImageCount > 6) {
      setFormError("图片数量需要在 1 到 6 张之间。");
      return;
    }

    const sortOrder = Number(form.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
      setFormError("排序需要使用 0 到 9999 之间的整数。");
      return;
    }

    const payload: TemplateInput = {
      title: form.title.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      coverUrl: form.coverUrl,
      accentColor: form.accentColor,
      requiredImageCount,
      acceptedMimeTypes: form.acceptedMimeTypes,
      maxFileSizeBytes,
      resultLabel: form.resultLabel.trim(),
      detailNote: form.detailNote.trim(),
      sortOrder,
    };

    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.updateAdminTemplate(editing.id, payload);
        setNotice(`「${payload.title}」已保存。`);
      } else {
        await api.createAdminTemplate(payload);
        setNotice(`「${payload.title}」已加入模板库。`);
      }
      invalidateLibrary();
      setFormOpen(false);
    } catch (error) {
      setFormError(getErrorMessage(error, "模板没有保存成功，请稍后再试。"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(template: AdminTemplate) {
    setActionId(template.id);
    setActionError(null);
    try {
      await api.setAdminTemplateActive(template.id, !template.active);
      setNotice(template.active ? `「${template.title}」已下架。` : `「${template.title}」已上架。`);
      invalidateLibrary();
    } catch (error) {
      setActionError(getErrorMessage(error, "上下架操作没有完成。"));
    } finally {
      setActionId(null);
    }
  }

  function askDelete(template: AdminTemplate) {
    setDeleteTarget(template);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteAdminTemplate(deleteTarget.id);
      setNotice(`「${deleteTarget.title}」已永久删除。`);
      setDeleteTarget(null);
      invalidateLibrary();
    } catch (error) {
      setDeleteError(getErrorMessage(error, "模板没有删除成功。"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className="shell">
        <header className={styles.pageHead}>
          <div>
            <p className={styles.eyebrow}>
              <LayersIcon />
              STUDIO / TEMPLATE CONTROL
            </p>
            <h1>模板库管理。</h1>
            <p className={styles.intro}>
              新增模板、调整素材要求，或把暂时不用的模板下架。已经产生的历史作品不会受影响。
            </p>
          </div>
          <div className={styles.headActions}>
            <Link href="/" className={styles.previewLink}>
              查看模板库
              <ArrowUpRightIcon />
            </Link>
            <button type="button" className={styles.primaryButton} onClick={openCreate}>
              <PlusIcon />
              新增模板
            </button>
          </div>
        </header>

        <dl className={styles.stats}>
          <div>
            <dt>全部模板</dt>
            <dd>{String(items.length).padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>正在上架</dt>
            <dd>{String(activeCount).padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>已下架</dt>
            <dd>{String(archivedCount).padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>关联任务</dt>
            <dd>{String(referencedCount).padStart(2, "0")}</dd>
          </div>
        </dl>

        {notice ? (
          <div className={styles.notice} role="status">
            <CheckIcon />
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="关闭提示">
              ×
            </button>
          </div>
        ) : null}

        {actionError ? (
          <div className={styles.errorNotice} role="alert">
            <AlertIcon />
            <span>{actionError}</span>
          </div>
        ) : null}

        <div className={styles.toolbar}>
          <div className={styles.filters} role="group" aria-label="按状态筛选模板">
            {(
              [
                ["all", "全部", items.length],
                ["active", "上架中", activeCount],
                ["archived", "已下架", archivedCount],
              ] as const
            ).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
                <span>{count}</span>
              </button>
            ))}
          </div>
          <label className={styles.search}>
            <span className="srOnly">搜索模板</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索标题、分类或 ID"
            />
          </label>
        </div>

        {adminQuery.isLoading ? (
          <div className={styles.list} aria-busy="true" aria-label="正在加载模板">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className={styles.skeleton} key={index} />
            ))}
          </div>
        ) : adminQuery.isError && !adminQuery.data ? (
          <div className={styles.state}>
            <span className={styles.stateIcon}>
              <AlertIcon />
            </span>
            <h2>模板列表没有加载出来</h2>
            <p>{getErrorMessage(adminQuery.error)}</p>
            <button type="button" onClick={() => adminQuery.refetch()}>
              <RefreshIcon />
              重新加载
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.state}>
            <span className={styles.stateIcon}>
              <ImageIcon />
            </span>
            <h2>这里暂时没有模板</h2>
            <p>{search ? "换一个关键词试试，或清空搜索。" : "新增一个模板，让模板库重新开始。"}</p>
            {search ? (
              <button type="button" onClick={() => setSearch("")}>
                清空搜索
              </button>
            ) : (
              <button type="button" onClick={openCreate}>
                <PlusIcon />
                新增模板
              </button>
            )}
          </div>
        ) : (
          <ul className={styles.list}>
            {filtered.map((template) => {
              const canDelete = template.taskCount === 0 && template.assetCount === 0;
              return (
                <li className={styles.row} key={template.id} data-archived={!template.active}>
                  <div className={styles.cover}>
                    {/* Covers are user-managed local images, so a plain img keeps the admin page independent of remote hosts. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={template.coverUrl} alt={`${template.title} 封面`} />
                    <span>{String(template.requiredImageCount).padStart(2, "0")} 图</span>
                  </div>

                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>
                      <h2>{template.title}</h2>
                      <span className={template.active ? styles.activeBadge : styles.archivedBadge}>
                        {template.active ? "上架中" : "已下架"}
                      </span>
                    </div>
                    <p>{template.description}</p>
                    <div className={styles.meta}>
                      <span>{template.category}</span>
                      <span>{mimeListLabel(template.acceptedMimeTypes)}</span>
                      <span>≤ {formatBytes(template.maxFileSizeBytes)}</span>
                      <span>{template.id}</span>
                    </div>
                  </div>

                  <div className={styles.refs}>
                    <span>
                      <b>{template.taskCount}</b>
                      个任务
                    </span>
                    <span>
                      <b>{template.assetCount}</b>
                      张素材
                    </span>
                    <small>更新于 {formatDateTime(template.updatedAt)}</small>
                  </div>

                  <div className={styles.rowActions}>
                    <button type="button" onClick={() => openEdit(template)}>
                      编辑
                    </button>
                    <button
                      type="button"
                      className={styles.subtleButton}
                      disabled={actionId === template.id}
                      onClick={() => void toggleActive(template)}
                    >
                      {actionId === template.id ? "处理中…" : template.active ? "下架" : "上架"}
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      disabled={!canDelete || deleting}
                      title={canDelete ? "永久删除这个模板" : "已有任务或素材引用，只能下架"}
                      onClick={() => askDelete(template)}
                    >
                      删除
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className={styles.footnote}>
          下架后模板会从公开列表消失，但历史任务仍能读取它。只有没有任何任务和素材引用的模板才能永久删除。
        </p>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        labelledBy="template-form-title"
        size="wide"
      >
        <form className={styles.formPanel} onSubmit={(event) => void handleSave(event)}>
          <header className={styles.formHead}>
            <p className={styles.formEyebrow}>{editing ? "EDIT TEMPLATE" : "NEW TEMPLATE"}</p>
            <h2 id="template-form-title">{editing ? "编辑模板。" : "新增模板。"}</h2>
            <p>
              {editing
                ? "修改会立即影响公开列表；已经创建的任务不会被改写。"
                : "模板发布后会出现在模板库，所有登录用户都可以用它制作。"}
            </p>
          </header>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>模板标题</span>
              <input
                required
                maxLength={80}
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="例如：旅行明信片"
              />
            </label>
            <div className={styles.field}>
              <span id="template-category-label">分类</span>
              <div className={styles.categoryRow}>
                <select
                  required
                  aria-labelledby="template-category-label"
                  value={form.category}
                  onChange={(event) => setField("category", event.target.value)}
                  disabled={categoryQuery.isLoading}
                >
                  {form.category && !categoryOptions.some((item) => item.name === form.category) ? (
                    <option value={form.category}>{form.category}</option>
                  ) : null}
                  {categoryOptions.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.categoryToggle}
                  onClick={() => {
                    setNewCategoryOpen((open) => !open);
                    setCategoryError(null);
                  }}
                  aria-expanded={newCategoryOpen}
                  aria-controls="new-category-panel"
                >
                  <PlusIcon />
                  新建分类
                </button>
              </div>

              {newCategoryOpen ? (
                <div className={styles.newCategory} id="new-category-panel">
                  <input
                    autoFocus
                    value={newCategoryName}
                    maxLength={40}
                    onChange={(event) => {
                      setNewCategoryName(event.target.value);
                      setCategoryError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleCreateCategory();
                      }
                    }}
                    placeholder="新分类名称，例如：婚礼纪实"
                    aria-label="新分类名称"
                  />
                  <button
                    type="button"
                    className={styles.categorySave}
                    onClick={() => void handleCreateCategory()}
                    disabled={categorySaving || !newCategoryName.trim()}
                  >
                    {categorySaving ? "添加中…" : "添加"}
                  </button>
                  <button
                    type="button"
                    className={styles.categoryCancel}
                    onClick={() => {
                      setNewCategoryOpen(false);
                      setNewCategoryName("");
                      setCategoryError(null);
                    }}
                    disabled={categorySaving}
                  >
                    取消
                  </button>
                </div>
              ) : null}

              {categoryError ? (
                <span className={styles.fieldError} role="alert">
                  {categoryError}
                </span>
              ) : null}
            </div>
            <label className={`${styles.field} ${styles.wideField}`}>
              <span>模板描述</span>
              <textarea
                required
                maxLength={500}
                rows={2}
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                placeholder="用一句话说明这个模板会做什么。"
              />
            </label>
          </div>

          <section className={styles.coverEditor} aria-label="模板封面">
            <div className={styles.coverPreview}>
              {form.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.coverUrl} alt="模板封面预览" />
              ) : (
                <span>
                  <ImageIcon />
                </span>
              )}
            </div>
            <div className={styles.coverControls}>
              <p className={styles.sectionLabel}>COVER / 封面</p>
              <strong>{form.coverUrl ? "封面已就位" : "上传一张 4:5 封面"}</strong>
              <p>JPG、PNG 或 WebP，≤ 8 MB，至少 120 × 120 px。建议使用 1200 × 1500 px。</p>
              <div className={styles.coverActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={coverUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon />
                  {coverUploading ? "上传中…" : form.coverUrl ? "更换封面" : "选择封面"}
                </button>
                {form.coverUrl ? <code>{form.coverUrl}</code> : null}
              </div>
              <input
                ref={fileInputRef}
                className="srOnly"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => void handleCoverChange(event)}
              />
            </div>
          </section>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>需要的照片数</span>
              <select
                value={form.requiredImageCount}
                onChange={(event) => setField("requiredImageCount", event.target.value)}
              >
                {[1, 2, 3, 4, 5, 6].map((count) => (
                  <option key={count} value={count}>
                    {count} 张
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>单图大小上限（MB）</span>
              <input
                required
                type="number"
                min={0.1}
                max={20}
                step={0.1}
                value={form.maxSizeMb}
                onChange={(event) => setField("maxSizeMb", event.target.value)}
              />
            </label>

            <fieldset className={`${styles.field} ${styles.wideField}`}>
              <legend>支持的图片格式</legend>
              <div className={styles.mimeOptions}>
                {MIME_OPTIONS.map((option) => {
                  const checked = form.acceptedMimeTypes.includes(option.value);
                  return (
                    <label key={option.value} className={checked ? styles.mimeChecked : undefined}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setField(
                            "acceptedMimeTypes",
                            event.target.checked
                              ? [...form.acceptedMimeTypes, option.value]
                              : form.acceptedMimeTypes.filter((value) => value !== option.value)
                          );
                        }}
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label className={styles.field}>
              <span>强调色</span>
              <div className={styles.colorField}>
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(event) => setField("accentColor", event.target.value)}
                  aria-label="选择强调色"
                />
                <input
                  required
                  pattern="^#[0-9a-fA-F]{6}$"
                  value={form.accentColor}
                  onChange={(event) => setField("accentColor", event.target.value)}
                  aria-label="强调色十六进制值"
                />
              </div>
            </label>
            <label className={styles.field}>
              <span>成品标签</span>
              <input
                required
                maxLength={80}
                value={form.resultLabel}
                onChange={(event) => setField("resultLabel", event.target.value)}
                placeholder="例如：TRAVEL NOTES"
              />
            </label>
            <label className={`${styles.field} ${styles.wideField}`}>
              <span>版式说明</span>
              <textarea
                required
                maxLength={300}
                rows={2}
                value={form.detailNote}
                onChange={(event) => setField("detailNote", event.target.value)}
                placeholder="描述成品里会出现的版式、文字或提示。"
              />
            </label>
            <label className={styles.field}>
              <span>排序</span>
              <input
                required
                type="number"
                min={0}
                max={9999}
                step={1}
                value={form.sortOrder}
                onChange={(event) => setField("sortOrder", event.target.value)}
              />
            </label>
          </div>

          {formError ? (
            <div className={styles.formError} role="alert">
              <AlertIcon />
              {formError}
            </div>
          ) : null}

          <footer className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={closeForm}
              disabled={saving || coverUploading}
            >
              取消
            </button>
            <button type="submit" className={styles.primaryButton} disabled={saving || coverUploading}>
              {saving ? "正在保存…" : editing ? "保存修改" : "发布模板"}
            </button>
          </footer>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        labelledBy="template-delete-title"
      >
        <div className={styles.confirmPanel}>
          <span className={styles.confirmIcon}>
            <AlertIcon />
          </span>
          <p className={styles.formEyebrow}>PERMANENT DELETE</p>
          <h2 id="template-delete-title">永久删除这个模板？</h2>
          <p>
            「{deleteTarget?.title}」没有任何任务或素材引用，可以安全删除。删除后无法恢复，封面文件也不会再出现在模板库。
          </p>
          {deleteError ? (
            <div className={styles.formError} role="alert">
              {deleteError}
            </div>
          ) : null}
          <div className={styles.confirmActions}>
            <button type="button" className={styles.cancelButton} onClick={() => setDeleteTarget(null)} disabled={deleting}>
              先留着
            </button>
            <button type="button" className={styles.deleteConfirm} onClick={() => void confirmDelete()} disabled={deleting}>
              {deleting ? "正在删除…" : "永久删除"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
