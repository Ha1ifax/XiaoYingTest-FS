import type { Metadata } from "next";
import { TemplateAdminView } from "./template-admin-view";

export const metadata: Metadata = {
  title: "模板库管理",
  description: "新增、编辑和整理 MOMENTO 的模板库。",
  robots: { index: false, follow: false },
};

export default function TemplateAdminPage() {
  return <TemplateAdminView />;
}
