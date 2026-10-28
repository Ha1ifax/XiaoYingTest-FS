import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterView } from "./register-view";

export const metadata: Metadata = {
  title: "创建账号",
  description: "创建一个 Momento 账号，保存素材、制作进度和成品。",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="shell" aria-hidden="true" />}>
      <RegisterView />
    </Suspense>
  );
}
