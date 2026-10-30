package com.momento.studio.user;

import com.momento.studio.common.ApiException;

public final class UserPermissions {

    private UserPermissions() {
    }

    public static void requireTemplateManager(AppUser user) {
        if (user.getRoleKey() == null || !user.getRoleKey().canManageTemplates()) {
            throw ApiException.forbidden("只有管理员或编辑可以管理模板库。");
        }
    }

    public static void requireAdmin(AppUser user) {
        if (user.getRoleKey() == null || !user.getRoleKey().canManageUsers()) {
            throw ApiException.forbidden("只有管理员可以管理成员与权限。");
        }
    }
}
