import Link from "next/link";
import type { Template } from "@/lib/types";
import { ArrowUpRightIcon, ImageIcon } from "./icons";
import styles from "./template-card.module.css";

export function TemplateCard({
  template,
  eager = false,
}: {
  template: Template;
  eager?: boolean;
}) {
  return (
    <Link
      href={`/templates/${encodeURIComponent(template.id)}`}
      className={styles.card}
      title={template.title}
      aria-label={`查看模板：${template.title}，${template.category}，需要 ${template.requiredImageCount} 张图片`}
    >
      <img
        src={template.coverUrl}
        alt={`${template.title}模板封面`}
        className={styles.cover}
        sizes="(max-width: 640px) 46vw, (max-width: 900px) 31vw, 23vw"
        loading={eager ? "eager" : "lazy"}
      />
      <span className={styles.shade} aria-hidden="true" />
      <div className={styles.topline}>
        <span className={styles.category}>{template.category}</span>
        <span className={styles.count}>
          <ImageIcon />
          {template.requiredImageCount} 张
        </span>
      </div>
      <div className={styles.caption}>
        <h2 className="srOnly">{template.title}</h2>
        <span className={styles.arrow} aria-hidden="true">
          <ArrowUpRightIcon />
        </span>
      </div>
    </Link>
  );
}
