import Link from "next/link";
import { ArrowRightIcon, LockIcon } from "./icons";
import styles from "./auth-required.module.css";

export function AuthRequired({
  title,
  description,
  nextPath,
}: {
  title: string;
  description: string;
  nextPath: string;
}) {
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const registerHref = `/register?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className={`shell ${styles.wrap}`}>
      <section className={styles.card} aria-labelledby="auth-required-title">
        <span className={styles.icon} aria-hidden="true">
          <LockIcon />
        </span>
        <p className="eyebrow">MEMBERS ONLY / 会员专属</p>
        <h1 id="auth-required-title">{title}</h1>
        <p className={styles.copy}>{description}</p>
        <ul className={styles.points}>
          <li>制作进度保存在账号里，关闭页面也会继续。</li>
          <li>刷新或换一台设备，仍能取回历史任务与成品。</li>
          <li>你的素材和作品只属于当前登录身份。</li>
        </ul>
        <div className={styles.actions}>
          <Link href={loginHref} className={styles.primary}>
            登录
            <ArrowRightIcon />
          </Link>
          <Link href={registerHref} className={styles.secondary}>
            创建账号
          </Link>
        </div>
        <p className={styles.note}>
          还没有账号也可以先逛逛模板库。
          <Link href="/#templates">去看看模板</Link>
        </p>
      </section>
    </div>
  );
}
