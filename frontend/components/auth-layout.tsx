import type { ReactNode } from "react";
import styles from "./auth-layout.module.css";

const COPY = {
  login: {
    eyebrow: "MEMBER ACCESS / 会员入口",
    title: (
      <>
        把做过的片刻，
        <br />
        留在<em>同一个地方。</em>
      </>
    ),
    copy: "登录后继续未完成的制作，查看刚刚整理好的成品，也可以从一张新照片重新开始。",
    quote: "“每一件作品，都有迹可循。”",
    meta: "MOMENTO / ACCOUNT",
  },
  register: {
    eyebrow: "JOIN THE STUDIO / 开一个账号",
    title: (
      <>
        给照片一个
        <br />
        <em>被认真收藏</em>的地方。
      </>
    ),
    copy: "一个账号，保存你的素材、制作进度和全部成品。模板可以先慢慢逛，准备好了再开始。",
    quote: "“把零散的照片，整理成值得留住的片刻。”",
    meta: "MOMENTO / NEW MEMBER",
  },
} as const;

export function AuthLayout({ mode, children }: { mode: "login" | "register"; children: ReactNode }) {
  const copy = COPY[mode];

  return (
    <div className={`shell ${styles.page}`}>
      <aside className={styles.aside} aria-label="Momento 账号介绍">
        <div className={styles.asideTop}>
          <span className={styles.asideMark}>
            Momento<span>.</span>
          </span>
          <span className={styles.asideMeta}>{copy.meta}</span>
        </div>

        <span className={styles.asideEyebrow}>{copy.eyebrow}</span>
        <h1 className={styles.asideTitle}>{copy.title}</h1>
        <p className={styles.asideCopy}>{copy.copy}</p>

        <div className={styles.asideArt} aria-hidden="true">
          <div className={styles.asideArtPrimary}>
            <img src="/demo/postcard-cover.jpg" alt="" />
          </div>
          <div className={styles.asideArtSecondary}>
            <img src="/demo/coffee-cover.jpg" alt="" />
          </div>
          <span className={styles.asideStamp}>片刻</span>
        </div>

        <blockquote className={styles.asideQuote}>
          {copy.quote}
          <span>MADE SLOWLY / KEPT INTENTIONALLY</span>
        </blockquote>
      </aside>

      <section className={styles.panel}>{children}</section>
    </div>
  );
}
