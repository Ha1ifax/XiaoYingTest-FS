"use client";

import Link from "next/link";
import { useState } from "react";
import { TemplateCard } from "@/components/template-card";
import {
  ArrowUpRightIcon,
  ImageIcon,
  RefreshIcon,
  SparklesIcon,
} from "@/components/icons";
import { useCategories, useTemplates } from "@/lib/hooks";
import { getErrorMessage } from "@/lib/format";
import styles from "./page.module.css";

const PROCESS_STEPS = [
  { number: "01", title: "上传素材", copy: "按模板要求选择照片，逐张预览与校验。" },
  { number: "02", title: "后台制作", copy: "素材检查、模拟生成、结果整理依次执行。" },
  { number: "03", title: "回来取走", copy: "可以继续逛，完成后在作品记录里取走。" },
];

export default function HomePage() {
  const [category, setCategory] = useState<string | null>(null);

  const categoriesQuery = useCategories();
  const allTemplatesQuery = useTemplates(null);
  const templatesQuery = useTemplates(category);

  const allTemplates = allTemplatesQuery.data?.items ?? [];
  const templates = templatesQuery.data?.items ?? [];
  const categories = categoriesQuery.data?.items ?? [];
  const activeLabel = category ?? "全部";
  const isRefreshing = templatesQuery.isFetching && !templatesQuery.isLoading;
  const isInitialLoading = templatesQuery.isLoading || categoriesQuery.isLoading;

  return (
    <div className={styles.page}>
      <section className={styles.library} id="templates">
        <div className={`shell ${styles.inner}`}>
          <div className={styles.topline}>
            <span className={styles.kicker}>
              <i aria-hidden="true" />
              MOMENTO STUDIO <span>/</span> TEMPLATE LIBRARY
            </span>
            <span className={styles.edition}>EST. 2026 — LOCAL EDITION</span>
          </div>

          <div className={styles.intro}>
            <div className={styles.introCopy}>
              <h1>
                挑一个<span>片刻</span>。
              </h1>
              <p>
                选一款模板，放进你的照片。素材检查、模拟生成、结果整理都在
                Java 后台完成，你可以继续逛。
              </p>
            </div>

            <dl className={styles.stats} aria-label="模板库数据">
              <div>
                <dt>款模板</dt>
                <dd>{allTemplates.length ? String(allTemplates.length).padStart(2, "0") : "—"}</dd>
              </div>
              <div>
                <dt>个分类</dt>
                <dd>{categories.length ? String(categories.length).padStart(2, "0") : "—"}</dd>
              </div>
              <div>
                <dt>步制作</dt>
                <dd>03</dd>
              </div>
            </dl>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.filters} role="group" aria-label="按分类筛选模板">
              <button
                type="button"
                className={styles.filter}
                aria-pressed={category === null}
                onClick={() => setCategory(null)}
              >
                全部
                <span>{allTemplates.length || "·"}</span>
              </button>
              {categories.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className={styles.filter}
                  aria-pressed={category === item.name}
                  onClick={() => setCategory(item.name)}
                >
                  {item.name}
                  <span>{item.count}</span>
                </button>
              ))}
            </div>

            <div className={styles.resultStatus} aria-live="polite">
              {isInitialLoading ? (
                <span>正在取回模板……</span>
              ) : (
                <>
                  {isRefreshing ? <i className={styles.pulse} aria-hidden="true" /> : null}
                  <span>
                    {templatesQuery.isError ? "读取失败" : `${templates.length} 款`} <b>/</b> {activeLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          {categoriesQuery.isError ? (
            <div className={styles.notice} role="status">
              <span>分类暂时没有加载出来，可以直接浏览全部模板。</span>
              <button type="button" onClick={() => categoriesQuery.refetch()}>
                <RefreshIcon />
                重试分类
              </button>
            </div>
          ) : null}

          {templatesQuery.isError && templatesQuery.data ? (
            <div className={styles.notice} role="status">
              <span>刚才的刷新没有成功，先为你保留上一次的模板。</span>
              <button type="button" onClick={() => templatesQuery.refetch()}>
                <RefreshIcon />
                再试一次
              </button>
            </div>
          ) : null}

          {templatesQuery.isLoading ? (
            <div className={styles.grid} aria-busy="true" aria-label="模板加载中">
              {Array.from({ length: 7 }).map((_, index) => (
                <div className={styles.skeleton} key={index} aria-hidden="true" />
              ))}
            </div>
          ) : templatesQuery.isError && !templatesQuery.data ? (
            <div className={styles.state}>
              <span className={styles.stateIcon}>
                <ImageIcon />
              </span>
              <p className={styles.stateKicker}>THE LIBRARY IS OUT OF REACH</p>
              <h2>模板库暂时没有连上</h2>
              <p>{getErrorMessage(templatesQuery.error)} 请确认后台服务正在运行，然后重新加载。</p>
              <button type="button" className={styles.retry} onClick={() => templatesQuery.refetch()}>
                <RefreshIcon />
                重新加载模板
              </button>
            </div>
          ) : templates.length === 0 ? (
            <div className={styles.state}>
              <span className={styles.stateIcon}>
                <SparklesIcon />
              </span>
              <p className={styles.stateKicker}>NOTHING IN THIS DRAWER</p>
              <h2>这个分类还没有模板</h2>
              <p>换一个分类看看，或者回到全部模板。</p>
              <button type="button" className={styles.retry} onClick={() => setCategory(null)}>
                查看全部模板
              </button>
            </div>
          ) : (
            <div className={`${styles.grid} ${templatesQuery.isPlaceholderData ? styles.gridMuted : ""}`}>
              {templates.map((template, index) => (
                <TemplateCard key={template.id} template={template} eager={index < 4} />
              ))}
            </div>
          )}

          <div className={styles.libraryFoot}>
            <span>
              <i aria-hidden="true" />
              模板与封面的内容由本地 Java 接口提供
            </span>
            <span>
              END OF SELECTION — {String(templates.length).padStart(2, "0")} ITEMS
            </span>
          </div>
        </div>
      </section>

      <section className={styles.process} aria-label="制作流程">
        <div className={`shell ${styles.processInner}`}>
          <div className={styles.processIntro}>
            <p className={styles.processKicker}>HOW IT WORKS</p>
            <strong>你挑照片，剩下的交给后台。</strong>
          </div>

          <ol className={styles.processList}>
            {PROCESS_STEPS.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <div>
                  <b>{step.title}</b>
                  <p>{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>

          <Link className={styles.processLink} href="/creations">
            我的作品
            <ArrowUpRightIcon />
          </Link>
        </div>
      </section>
    </div>
  );
}
