"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { AlertIcon, RefreshIcon } from "./icons";
import styles from "./site-shell.module.css";

export function SiteShell({ children }: { children: ReactNode }) {
  const { user, ready, loading, errorMessage, retry } = useAuth();

  return (
    <div className={styles.frame}>
      <a href="#main-content" className="skipLink">
        跳到主要内容
      </a>
      <SiteHeader />
      {ready ? (
        <main id="main-content" key={user?.id ?? "guest"} className={styles.main}>
          {children}
        </main>
      ) : (
        <main id="main-content" className={styles.main}>
          <div className={styles.gate}>
            <div className={styles.gateInner}>
              {loading ? (
                <>
                  <span className={styles.loader} aria-hidden="true" />
                  <p className={styles.gateEyebrow}>OPENING THE STUDIO</p>
                  <h1>正在打开创作台</h1>
                  <p className={styles.gateCopy}>读取账号状态与作品记录……</p>
                </>
              ) : (
                <>
                  <span className={styles.alertIcon} aria-hidden="true">
                    <AlertIcon />
                  </span>
                  <p className={styles.gateEyebrow}>CONNECTION NEEDED</p>
                  <h1>账号服务暂时没有连上</h1>
                  <p className={styles.gateCopy}>{errorMessage ?? "请确认 Java 制作服务已经启动，然后再试一次。"}</p>
                  <button type="button" className="btn btnPrimary" onClick={retry}>
                    <RefreshIcon />
                    重新连接
                  </button>
                  <p className={styles.gateHint}>
                    演示环境需要同时运行 <code>localhost:8080</code> 的 Java 服务。
                  </p>
                </>
              )}
            </div>
          </div>
        </main>
      )}
      <SiteFooter />
    </div>
  );
}
