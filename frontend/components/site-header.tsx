"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { cx } from "@/lib/format";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  LayersIcon,
  LogOutIcon,
  UserIcon,
} from "./icons";
import styles from "./site-header.module.css";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  const nextPath = pathname || "/";
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const timer = window.setTimeout(() => firstItemRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [menuOpen]);

  const navItems = [
    { href: "/", label: "模板库", short: "模板", active: pathname === "/" || pathname.startsWith("/templates/") },
    { href: "/creations", label: "我的作品", short: "作品", active: pathname.startsWith("/creations") },
  ];

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      setMenuOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className={styles.header}>
      <div className={cx("shell", styles.inner)}>
        <Link href="/" className={styles.brand} aria-label="MOMENTO 片刻制所首页">
          <span className={styles.brandType}>
            <strong>
              Momento<span className={styles.brandDot}>.</span>
            </strong>
            <span>片刻制所 / CREATIVE STUDIO</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="主导航">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(styles.navLink, item.active && styles.navLinkActive)}
              aria-current={item.active ? "page" : undefined}
            >
              <span className={styles.navFull}>{item.label}</span>
              <span className={styles.navShort}>{item.short}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link className={styles.headerCta} href="/#templates" aria-label="开始制作，前往模板库">
            <span>开始制作</span>
            <ArrowRightIcon />
          </Link>
          <div className={styles.userArea} ref={menuRef}>
            {!ready ? (
              <span className={styles.userSkeleton} aria-hidden="true" />
            ) : user ? (
              <>
                <button
                  ref={triggerRef}
                  type="button"
                  className={styles.userTrigger}
                  aria-label={`账号菜单：${user.displayName}`}
                  aria-expanded={menuOpen}
                  aria-controls="account-menu"
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <span className={styles.avatar} aria-hidden="true">
                    {user.initials}
                  </span>
                  <span className={styles.userText}>
                    <span className={styles.userName}>{user.displayName}</span>
                    <span className={styles.userRole}>{user.role}</span>
                  </span>
                  <ChevronDownIcon className={cx(styles.chevron, menuOpen && styles.chevronOpen)} />
                </button>

                {menuOpen ? (
                  <div id="account-menu" className={styles.menu} role="menu" aria-label="账号菜单">
                    <div className={styles.menuHead}>
                      <span className={styles.menuEyebrow}>ACCOUNT / 我的账号</span>
                      <strong>{user.displayName}</strong>
                      <p>{user.email}</p>
                    </div>
                    <div className={styles.userList}>
                      <Link
                        ref={firstItemRef}
                        href="/creations"
                        role="menuitem"
                        className={styles.menuItem}
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className={styles.menuItemIcon}>
                          <UserIcon />
                        </span>
                        <span>
                          <strong>我的作品</strong>
                          <small>历史任务与成品</small>
                        </span>
                      </Link>
                      {user.admin ? (
                        <Link
                          href="/studio/templates"
                          role="menuitem"
                          className={styles.menuItem}
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className={styles.menuItemIcon}>
                            <LayersIcon />
                          </span>
                          <span>
                            <strong>模板管理</strong>
                            <small>新增、编辑与上下架</small>
                          </span>
                        </Link>
                      ) : null}
                      <Link
                        href="/account"
                        role="menuitem"
                        className={styles.menuItem}
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className={styles.menuItemIcon}>
                          <UserIcon />
                        </span>
                        <span>
                          <strong>账号设置</strong>
                          <small>资料与登录密码</small>
                        </span>
                      </Link>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className={styles.signOut}
                      disabled={signingOut}
                      onClick={() => void handleLogout()}
                    >
                      <LogOutIcon />
                      {signingOut ? "正在退出……" : "退出登录"}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <Link href={loginHref} className={styles.loginLink}>
                <UserIcon />
                <span>登录</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
