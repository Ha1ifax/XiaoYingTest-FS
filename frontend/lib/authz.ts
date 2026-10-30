import type { AuthUser } from "./types";

export function canManageTemplates(user: AuthUser | null | undefined) {
  return user?.roleKey === "ADMIN" || user?.roleKey === "EDITOR";
}

export function canManageUsers(user: AuthUser | null | undefined) {
  return user?.roleKey === "ADMIN";
}

export function roleLabel(roleKey: string | null | undefined) {
  switch (roleKey) {
    case "ADMIN":
      return "管理员";
    case "EDITOR":
      return "编辑";
    default:
      return "成员";
  }
}
