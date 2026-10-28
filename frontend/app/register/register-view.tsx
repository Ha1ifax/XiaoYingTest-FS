"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { AlertIcon, ArrowRightIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/format";
import styles from "@/components/auth-layout.module.css";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export function RegisterView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, register } = useAuth();
  const next = safeNext(searchParams.get("next"));
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  const loginHref = `/login?next=${encodeURIComponent(next)}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const errors: typeof fieldErrors = {};
    const name = displayName.trim();
    if (name.length < 2) errors.displayName = "名字至少需要 2 个字符。";
    else if (name.length > 40) errors.displayName = "名字最多 40 个字符。";
    if (!email.trim()) errors.email = "请填写邮箱地址。";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "这个邮箱格式看起来不太对。";
    if (password.length < 8) errors.password = "密码至少需要 8 个字符。";
    else if (password.length > 64) errors.password = "密码最多 64 个字符。";
    if (confirm !== password) errors.confirm = "两次输入的密码不一致。";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setError(null);
    try {
      await register(name, email, password);
      router.replace(next);
      router.refresh();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout mode="register">
      {user ? (
        <div className={styles.signedInCard}>
          <span className={styles.signedInAvatar}>{user.initials}</span>
          <span className={styles.formEyebrow}>ALREADY SIGNED IN / 已登录</span>
          <h2 className={styles.formTitle}>你已经在制作台里了</h2>
          <p className={styles.formSub}>当前账号是 {user.email}，可以直接开始挑模板。</p>
          <div className={styles.form}>
            <Link className={styles.submit} href="/#templates">
              去看模板
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      ) : (
        <>
          <span className={styles.formEyebrow}>CREATE ACCOUNT / 创建账号</span>
          <h2 className={styles.formTitle}>开一个 Momento 账号。</h2>
          <p className={styles.formSub}>用来保存你的制作历史、图片素材和已经整理好的成品。</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {error ? (
              <div className={styles.formError} role="alert">
                <AlertIcon />
                <span>{error}</span>
              </div>
            ) : null}

            <div className={styles.field}>
              <label htmlFor="register-name">怎么称呼你</label>
              <input
                id="register-name"
                type="text"
                name="displayName"
                autoComplete="name"
                placeholder="例如：林小满"
                maxLength={40}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                aria-invalid={Boolean(fieldErrors.displayName)}
                aria-describedby={fieldErrors.displayName ? "register-name-error" : undefined}
              />
              {fieldErrors.displayName ? (
                <span className={styles.fieldError} id="register-name-error">
                  {fieldErrors.displayName}
                </span>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="register-email">邮箱</label>
              <input
                id="register-email"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
              />
              {fieldErrors.email ? (
                <span className={styles.fieldError} id="register-email-error">
                  {fieldErrors.email}
                </span>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="register-password">密码</label>
              <input
                id="register-password"
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="至少 8 个字符"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "register-password-error" : "register-password-hint"}
              />
              {fieldErrors.password ? (
                <span className={styles.fieldError} id="register-password-error">
                  {fieldErrors.password}
                </span>
              ) : (
                <span className={styles.fieldHint} id="register-password-hint">
                  8–64 个字符，建议混合字母和数字。
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="register-confirm">再输一次密码</label>
              <input
                id="register-confirm"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="确认密码"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                aria-invalid={Boolean(fieldErrors.confirm)}
                aria-describedby={fieldErrors.confirm ? "register-confirm-error" : undefined}
              />
              {fieldErrors.confirm ? (
                <span className={styles.fieldError} id="register-confirm-error">
                  {fieldErrors.confirm}
                </span>
              ) : null}
            </div>

            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? "正在创建账号……" : "创建账号"}
              {!submitting ? <ArrowRightIcon /> : null}
            </button>

            <p className={styles.switchLine}>
              已经有账号？
              <Link href={loginHref}>直接登录</Link>
            </p>
            <p className={styles.formFoot}>
              注册即表示你同意在这个本地演示环境中保存账号、素材与制作记录。演示站不发送营销邮件。
            </p>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
