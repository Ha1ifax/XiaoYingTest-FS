import type { Metadata } from "next";
import { AccountView } from "./account-view";

export const metadata: Metadata = {
  title: "账号设置",
  description: "管理 Momento 账号的显示名称、登录密码与当前会话。",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountView />;
}
