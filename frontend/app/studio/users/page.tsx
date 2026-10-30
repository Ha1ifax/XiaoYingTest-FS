import type { Metadata } from "next";
import { UserAdminView } from "./user-admin-view";

export const metadata: Metadata = {
  title: "成员与权限",
  robots: { index: false, follow: false },
};

export default function StudioUsersPage() {
  return <UserAdminView />;
}
