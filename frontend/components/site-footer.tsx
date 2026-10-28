"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/format";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  const pathname = usePathname();

  return (
    <footer className={cx(styles.footer, pathname === "/" && styles.homeFooter)}>
      <div className={`shell ${styles.inner}`}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <strong>
              Momento<span>.</span>
            </strong>
            <p>片刻制所，把照片做成值得收藏的片刻。</p>
          </div>
          <nav className={styles.links} aria-label="页脚导航">
            <Link href="/">模板库</Link>
            <Link href="/creations">我的作品</Link>
            <span className={styles.credit}>JAVA / SPRING BOOT / MYSQL — NEXT.JS</span>
          </nav>
        </div>
        <div className={styles.meta}>
          <span className={styles.disclaimer}>
            <i aria-hidden="true" />
            本地模拟生成 · 不调用外部 AI 服务
          </span>
          <span className={styles.copyright}>© 2026 MOMENTO STUDIO — MADE SLOWLY</span>
          <Link href="/" className={styles.back}>
            回到模板库 ↑
          </Link>
        </div>
      </div>
    </footer>
  );
}
