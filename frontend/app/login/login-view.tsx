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

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuth();
  const next = safeNext(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const registerHref = `/register?next=${encodeURIComponent(next)}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = "请填写邮箱地址。";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "这个邮箱格式看起来不太对。";
    if (!password) errors.password = "请填写登录密码。";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.replace(next);
      router.refresh();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(kind: "lin" | "chen") {
    setEmail(kind === "lin" ? "lin@momento.studio" : "chen@momento.studio");
    setPassword("momento123");
    setFieldErrors({});
    setError(null);
  }

  return (
    <AuthLayout mode="login">
      {user ? (
        <div className={styles.signedInCard}>
          <span className={styles.signedInAvatar}>{user.initials}</span>
          <span className={styles.formEyebrow}>ALREADY SIGNED IN / 已登录</span>
          <h2 className={styles.formTitle}>你好，{user.displayName}</h2>
          <p className={styles.formSub}>当前账号已经登录，可以直接回到制作台或查看历史作品。</p>
          <div className={styles.form}>
            <Link className={styles.submit} href="/creations">
              进入我的作品
              <ArrowRightIcon />
            </Link>
            <p className={styles.formFoot}>
              想换一个账号？先到 <Link href="/account">账号设置</Link> 退出登录。
            </p>
          </div>
        </div>
      ) : (
        <>
          <span className={styles.formEyebrow}>WELCOME BACK / 欢迎回来</span>
          <h2 className={styles.formTitle}>登录 Momento.</h2>
          <p className={styles.formSub}>继续未完成的制作，或者取走已经整理好的成品。</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {error ? (
              <div className={styles.formError} role="alert">
                <AlertIcon />
                <span>{error}</span>
              </div>
            ) : null}

            <div className={styles.field}>
              <label htmlFor="login-email">邮箱</label>
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
              />
              {fieldErrors.email ? (
                <span className={styles.fieldError} id="login-email-error">
                  {fieldErrors.email}
                </span>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="login-password">密码</label>
              <input
                id="login-password"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="输入登录密码"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
              />
              {fieldErrors.password ? (
                <span className={styles.fieldError} id="login-password-error">
                  {fieldErrors.password}
                </span>
              ) : null}
            </div>

            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? "正在登录……" : "登录"}
              {!submitting ? <ArrowRightIcon /> : null}
            </button>

            <div className={styles.demoBox}>
              <span className={styles.demoLabel}>DEMO ACCOUNTS / 演示账号（密码 momento123）</span>
              <div className={styles.demoButtons}>
                <button type="button" onClick={() => fillDemo("lin")}>
                  林小满 · 工作室主理人
                </button>
                <button type="button" onClick={() => fillDemo("chen")}>
                  陈一舟 · 摄影师
                </button>
              </div>
            </div>

            <p className={styles.switchLine}>
              还没有账号？
              <Link href={registerHref}>创建一个</Link>
            </p>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
