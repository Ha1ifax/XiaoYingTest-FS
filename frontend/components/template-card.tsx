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
  const cardCoverUrl = template.coverUrl.replace(
    /^\/demo\/([^/]+)$/,
    "/demo/cards/$1",
  );

  return (
    <Link
      href={`/templates/${encodeURIComponent(template.id)}`}
      className={styles.card}
      title={template.title}
      aria-label={`查看模板：${template.title}，${template.category}，需要 ${template.requiredImageCount} 张图片`}
    >
      <div className={styles.media}>
        <img
          src={cardCoverUrl}
          alt={`${template.title}模板封面`}
          className={styles.cover}
          sizes="(max-width: 640px) 46vw, (max-width: 900px) 31vw, 23vw"
          loading={eager ? "eager" : "lazy"}
        />
      </div>
      <div className={styles.topline}>
        <span className={styles.category}>{template.category}</span>
        <span className={styles.count}>
          <ImageIcon />
          {template.requiredImageCount} 张
        </span>
      </div>
      <div className={styles.caption}>
        <h2 className={styles.title}>{template.title}</h2>
        <span className={styles.arrow} aria-hidden="true">
          <ArrowUpRightIcon />
        </span>
      </div>
    </Link>
  );
}
