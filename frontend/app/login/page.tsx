import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "./login-view";

export const metadata: Metadata = {
  title: "登录",
  description: "登录 Momento 片刻制所，继续制作并取回你的作品。",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="shell" aria-hidden="true" />}>
      <LoginView />
    </Suspense>
  );
}
