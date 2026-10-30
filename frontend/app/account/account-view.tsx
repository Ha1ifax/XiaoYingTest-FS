"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthRequired } from "@/components/auth-required";
import { Modal } from "@/components/modal";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckIcon,
  CloseIcon,
  GridIcon,
  LayersIcon,
  LockIcon,
  LogOutIcon,
  ShieldIcon,
} from "@/components/icons";
import { useAuth } from "@/lib/auth";
import { canManageTemplates, canManageUsers } from "@/lib/authz";
import { getErrorMessage } from "@/lib/format";
import styles from "./account.module.css";

export function AccountView() {
  const router = useRouter();
  const { user, updateProfile, changePassword, logout } = useAuth();

  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!user) {
    return (
      <AuthRequired
        title="登录后，管理你的账号。"
        description="查看账号资料、更新显示名称或修改登录密码。你的作品记录会继续留在同一个账号下。"
        nextPath="/account"
      />
    );
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profileSaving) return;

    const name = displayName.trim();
    if (name.length < 2) {
      setProfileError("名字至少需要 2 个字符。");
      return;
    }
    if (name.length > 40) {
      setProfileError("名字最多 40 个字符。");
      return;
    }

    setProfileSaving(true);
    setProfileError(null);
    setProfileNotice(null);
    try {
      await updateProfile(name);
      setDisplayName(name);
      setProfileNotice("账号资料已更新。");
      setEditingProfile(false);
    } catch (cause) {
      setProfileError(getErrorMessage(cause));
    } finally {
      setProfileSaving(false);
    }
  }
  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordSaving) return;

    if (!currentPassword) {
      setPasswordError("请先填写当前密码。");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("新密码至少需要 8 个字符。");
      return;
    }
    if (newPassword.length > 64) {
      setPasswordError("新密码最多 64 个字符。");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("两次输入的新密码不一致。");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("新密码不能和当前密码相同。");
      return;
    }

    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordNotice(null);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice("密码已更新，其他设备上的登录会话已退出。");
    } catch (cause) {
      setPasswordError(getErrorMessage(cause));
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  function toggleProfileEdit() {
    if (editingProfile) {
      setDisplayName(user?.displayName ?? "");
      setProfileError(null);
      setEditingProfile(false);
      return;
    }
    setProfileError(null);
    setProfileNotice(null);
    setEditingProfile(true);
  }

  const joined = new Date(user.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={`shell ${styles.page}`}>
      <section className={styles.sheet} aria-labelledby="account-settings-title">
        <header className={styles.sheetHead}>
          <div>
            <span className={styles.eyebrow}>ACCOUNT / SETTINGS</span>
            <h1 id="account-settings-title">账户设置</h1>
            <p>管理公开资料、登录密码和这台设备上的会话。</p>
          </div>
          <Link
            href="/creations"
            className={styles.closeButton}
            aria-label="关闭账户设置，回到我的作品"
          >
            <CloseIcon />
          </Link>
        </header>

        <div className={styles.profilePanel}>
          <span className={styles.avatar} aria-hidden="true">
            {user.initials}
          </span>
          <div className={styles.identity}>
            <span className={styles.role}>{user.role}</span>
            <strong>{user.displayName}</strong>
            <span>{user.email}</span>
          </div>
          <button
            type="button"
            className={styles.editButton}
            onClick={toggleProfileEdit}
            aria-expanded={editingProfile}
            aria-controls="profile-edit-panel"
          >
            {editingProfile ? "收起编辑" : "编辑资料"}
          </button>
        </div>

        {profileNotice ? (
          <div className={styles.sheetNotice} role="status">
            <CheckIcon />
            {profileNotice}
          </div>
        ) : null}

        {editingProfile ? (
          <form
            id="profile-edit-panel"
            className={styles.inlineForm}
            onSubmit={handleProfileSubmit}
            noValidate
          >
            <div className={styles.inlineFormHead}>
              <div>
                <span className={styles.panelIndex}>PROFILE / 公开资料</span>
                <h2>换一个称呼</h2>
              </div>
              <span>会显示在页头与历史记录中</span>
            </div>

            {profileError ? (
              <div className={styles.formError} role="alert">
                <AlertIcon />
                <span>{profileError}</span>
              </div>
            ) : null}

            <div className={styles.profileField}>
              <label htmlFor="account-display-name">显示名称</label>
              <input
                id="account-display-name"
                name="displayName"
                type="text"
                autoComplete="name"
                maxLength={40}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
              <span>2–40 个字符，可以是中文或英文。</span>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={profileSaving || displayName.trim() === user.displayName}
              >
                {profileSaving ? "正在保存……" : "保存资料"}
              </button>
              <button type="button" className={styles.textButton} onClick={toggleProfileEdit}>
                取消
              </button>
            </div>
          </form>
        ) : null}

        <div className={styles.infoList}>
          <div className={styles.infoRow}>
            <div>
              <span className={styles.infoLabel}>邮箱</span>
              <strong>{user.email}</strong>
            </div>
            <span className={styles.rowMeta}>登录凭据 · 只读</span>
          </div>
          <div className={styles.infoRow}>
            <div>
              <span className={styles.infoLabel}>密码</span>
              <strong className={styles.passwordMask} aria-label="密码已隐藏">
                ••••••••••••
              </strong>
            </div>
            <button
              type="button"
              className={styles.rowAction}
              onClick={() => {
                setPasswordOpen((open) => !open);
                setPasswordError(null);
                setPasswordNotice(null);
              }}
              aria-expanded={passwordOpen}
              aria-controls="password-panel"
            >
              {passwordOpen ? "收起" : "修改"}
            </button>
          </div>
        </div>

        {passwordOpen ? (
          <form
            id="password-panel"
            className={styles.inlineForm}
            onSubmit={handlePasswordSubmit}
            noValidate
          >
            <div className={styles.inlineFormHead}>
              <div>
                <span className={styles.panelIndex}>SECURITY / 账号安全</span>
                <h2>修改登录密码</h2>
              </div>
              <span>改密后其他设备会自动退出</span>
            </div>

            {passwordError ? (
              <div className={styles.formError} role="alert">
                <AlertIcon />
                <span>{passwordError}</span>
              </div>
            ) : null}
            {passwordNotice ? (
              <div className={styles.formSuccess} role="status">
                <CheckIcon /> {passwordNotice}
              </div>
            ) : null}

            <div className={styles.passwordGrid}>
              <div className={styles.field}>
                <label htmlFor="account-current-password">当前密码</label>
                <input
                  id="account-current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="account-new-password">新密码</label>
                <input
                  id="account-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <span>8–64 个字符，建议混合字母和数字。</span>
              </div>
              <div className={styles.field}>
                <label htmlFor="account-confirm-password">再输一次</label>
                <input
                  id="account-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryButton} disabled={passwordSaving}>
                {passwordSaving ? "正在更新……" : "更新密码"}
              </button>
              <button type="button" className={styles.textButton} onClick={() => setPasswordOpen(false)}>
                取消
              </button>
            </div>
          </form>
        ) : null}

        <nav className={styles.menu} aria-label="账号快捷入口">
          <Link href="/creations" className={styles.menuRow}>
            <span className={styles.menuIcon} aria-hidden="true">
              <GridIcon />
            </span>
            <span className={styles.menuCopy}>
              <b>我的作品</b>
              <small>历史任务与已经整理好的成品</small>
            </span>
            <ArrowRightIcon />
          </Link>
          <button
            type="button"
            className={styles.menuRow}
            onClick={() => {
              setPasswordOpen(true);
              setPasswordError(null);
              setPasswordNotice(null);
              window.setTimeout(() => {
                document.getElementById("password-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 60);
            }}
          >
            <span className={styles.menuIcon} aria-hidden="true">
              <LockIcon />
            </span>
            <span className={styles.menuCopy}>
              <b>账号安全</b>
              <small>更新密码，退出其他设备上的会话</small>
            </span>
            <ArrowRightIcon />
          </button>
          <button type="button" className={styles.menuRow} onClick={() => setPrivacyOpen(true)}>
            <span className={styles.menuIcon} aria-hidden="true">
              <ShieldIcon />
            </span>
            <span className={styles.menuCopy}>
              <b>隐私与数据</b>
              <small>素材、任务和登录状态保存在哪里</small>
            </span>
            <ArrowRightIcon />
          </button>
          {canManageTemplates(user) ? (
            <Link href="/studio/templates" className={styles.menuRow}>
              <span className={styles.menuIcon} aria-hidden="true">
                <LayersIcon />
              </span>
              <span className={styles.menuCopy}>
                <b>模板管理</b>
                <small>新增模板、调整素材要求或下架</small>
              </span>
              <ArrowRightIcon />
            </Link>
          ) : null}
          {canManageUsers(user) ? (
            <Link href="/studio/users" className={styles.menuRow}>
              <span className={styles.menuIcon} aria-hidden="true">
                <ShieldIcon />
              </span>
              <span className={styles.menuCopy}>
                <b>成员与权限</b>
                <small>分配管理员、编辑和普通成员</small>
              </span>
              <ArrowRightIcon />
            </Link>
          ) : null}
        </nav>

        <div className={styles.sessionLine}>
          <i aria-hidden="true" />
          <span>
            当前会话已通过 HttpOnly Cookie 登录
            <b> · </b>
            加入于 {joined}
          </span>
        </div>

        <section className={styles.danger} aria-labelledby="logout-heading">
          <div>
            <span className={styles.eyebrow}>SESSION / 当前设备</span>
            <h2 id="logout-heading">退出登录</h2>
            <p>退出后需要重新登录才能继续制作。作品、素材和历史记录都会保留在账号里。</p>
          </div>
          <button type="button" className={styles.logoutButton} onClick={handleLogout} disabled={signingOut}>
            {signingOut ? "正在退出……" : "退出登录"}
            <LogOutIcon />
          </button>
        </section>
      </section>

      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} labelledBy="privacy-title">
        <div className={styles.privacy}>
          <span className={styles.eyebrow}>PRIVACY / 数据说明</span>
          <h2 id="privacy-title">你的素材，留在这套系统里。</h2>
          <p>
            Momento 是一个本地运行的演示项目。上传的图片保存在 Java 服务的数据目录，
            任务状态与账号凭据保存在 MySQL。浏览器只持有一个 HttpOnly 会话 Cookie，
            不会把密码或素材写进 localStorage。
          </p>
          <dl>
            <div>
              <dt>图片素材</dt>
              <dd>保存在后端本地上传目录，结果图保存在结果目录。</dd>
            </div>
            <div>
              <dt>账号资料</dt>
              <dd>邮箱、显示名称与 BCrypt 密码哈希存储在 MySQL。</dd>
            </div>
            <div>
              <dt>生成过程</dt>
              <dd>全部为本地模拟，不调用外部 AI 服务，也不会上传图片到第三方。</dd>
            </div>
          </dl>
          <button type="button" className={styles.primaryButton} onClick={() => setPrivacyOpen(false)}>
            知道了
          </button>
        </div>
      </Modal>
    </div>
  );
}
