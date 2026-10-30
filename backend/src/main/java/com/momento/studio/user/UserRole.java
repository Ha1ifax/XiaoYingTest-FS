package com.momento.studio.user;

public enum UserRole {
    MEMBER,
    EDITOR,
    ADMIN;

    public boolean canManageTemplates() {
        return this == EDITOR || this == ADMIN;
    }

    public boolean canManageUsers() {
        return this == ADMIN;
    }
}
