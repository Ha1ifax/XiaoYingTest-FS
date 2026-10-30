"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthRequired } from "@/components/auth-required";
import { AlertIcon, ArrowRightIcon, CheckIcon, LayersIcon, UserIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { canManageUsers } from "@/lib/authz";
import { formatDateTime, getErrorMessage } from "@/lib/format";
import type { AdminUser, UserRole } from "@/lib/types";
import styles from "./user-admin.module.css";

const ROLE_OPTIONS: { value: UserRole; label: string; copy: string }[] = [
  { value: "MEMBER", label: "成员", copy: "制作自己的作品" },
  { value: "EDITOR", label: "编辑", copy: "管理模板与分类" },
  { value: "ADMIN", label: "管理员", copy: "管理成员与全部内容" },
];

function UserRow({ user, currentUserId }: { user: AdminUser; currentUserId: string }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<UserRole>(user.roleKey);
  const [notice, setNotice] = useState<string | null>(null);
  const isSelf = user.id === currentUserId;
  const mutation = useMutation({
    mutationFn: () => api.updateAdminUserRole(user.id, selected),
    onSuccess: async () => {
      setNotice("角色已更新。");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => setNotice(getErrorMessage(error, "角色没有更新成功。")),
  });

  return (
    <li className={styles.row}>
      <span className={styles.avatar} aria-hidden="true">
        {user.initials}
      </span>
      <div className={styles.identity}>
        <div className={styles.nameLine}>
          <strong>{user.displayName}</strong>
          {isSelf ? <span className={styles.selfBadge}>当前账号</span> : null}
        </div>
        <span>{user.email}</span>
        <small>
          {user.taskCount} 个任务 · 加入于 {formatDateTime(user.createdAt)}
        </small>
      </div>
      <div className={styles.roleCell}>
        <label>
          <span className="srOnly">调整 {user.displayName} 的角色</span>
          <select
            value={selected}
            disabled={isSelf || mutation.isPending}
            onChange={(event) => {
              setSelected(event.target.value as UserRole);
              setNotice(null);
            }}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label} · {role.copy}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={styles.apply}
          disabled={isSelf || mutation.isPending || selected === user.roleKey}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "保存中…" : "应用"}
        </button>
        {isSelf ? <small className={styles.selfNote}>不能修改自己的角色</small> : null}
        {notice ? (
          <small className={styles.notice} role="status">
            {notice}
          </small>
        ) : null}
      </div>
    </li>
  );
}

export function UserAdminView() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["admin-users"],
    queryFn: ({ signal }) => api.getAdminUsers(signal),
    enabled: Boolean(user) && canManageUsers(user),
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (!user) {
    return (
      <AuthRequired
        title="登录后，管理成员与权限。"
        description="成员和角色只对管理员开放。登录管理员账号后，可以分配成员、编辑与管理员权限。"
        nextPath="/studio/users"
      />
    );
  }
  if (!canManageUsers(user)) {
    return (
      <div className={`shell ${styles.deniedWrap}`}>
        <section className={styles.denied}>
          <span className={styles.deniedIcon} aria-hidden="true">
            <LayersIcon />
          </span>
          <p className="eyebrow">STUDIO / RESTRICTED</p>
          <h1>这里只对管理员开放。</h1>
          <p>编辑可以管理模板库，但成员角色只有管理员可以调整。</p>
          <div className={styles.deniedActions}>
            <Link href="/studio/templates">去模板管理</Link>
            <Link href="/account">账号设置</Link>
          </div>
        </section>
      </div>
    );
  }

  const users = query.data?.items ?? [];
  const adminCount = users.filter((item) => item.roleKey === "ADMIN").length;
  const editorCount = users.filter((item) => item.roleKey === "EDITOR").length;

  return (
    <div className={styles.page}>
      <div className="shell">
        <header className={styles.pageHead}>
          <div>
            <p className={styles.eyebrow}>
              <UserIcon />
              STUDIO / PEOPLE & ACCESS
            </p>
            <h1>成员与权限。</h1>
            <p className={styles.intro}>
              给工作室成员分配不同权限：成员制作自己的作品，编辑维护模板库，管理员还可以调整成员角色。
            </p>
          </div>
          <div className={styles.headActions}>
            <Link href="/studio/templates" className={styles.previewLink}>
              模板管理 <ArrowRightIcon />
            </Link>
            <Link href="/creations" className={styles.previewLink}>
              返回作品 <ArrowRightIcon />
            </Link>
          </div>
        </header>

        <dl className={styles.stats}>
          <div>
            <dt>全部成员</dt>
            <dd>{String(users.length).padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>管理员</dt>
            <dd>{String(adminCount).padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>编辑</dt>
            <dd>{String(editorCount).padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>权限说明</dt>
            <dd className={styles.statText}>最小够用</dd>
          </div>
        </dl>

        {query.isError && !query.data ? (
          <div className={styles.state}>
            <span className={styles.stateIcon}>
              <AlertIcon />
            </span>
            <h2>成员列表没有加载出来</h2>
            <p>{getErrorMessage(query.error)}</p>
            <button type="button" onClick={() => query.refetch()}>
              重新加载
            </button>
          </div>
        ) : query.isLoading ? (
          <div className={styles.list} aria-busy="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className={styles.skeleton} key={index} />
            ))}
          </div>
        ) : (
          <ul className={styles.list}>
            {users.map((item) => (
              <UserRow key={item.id} user={item} currentUserId={user.id} />
            ))}
          </ul>
        )}

        <div className={styles.footnote}>
          <CheckIcon />
          <span>
            至少保留一名管理员。新注册账号默认是成员；演示账号默认是管理员。Halifax 的任务与素材不会因为角色调整而删除。
          </span>
        </div>
      </div>
    </div>
  );
}
