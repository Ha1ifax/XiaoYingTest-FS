package com.momento.studio.user;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public final class UserAdminDtos {

    private UserAdminDtos() {
    }

    public record RoleUpdateRequest(
            @NotBlank(message = "请选择角色。")
            String roleKey
    ) {
    }

    public record AdminUserResponse(
            String id,
            String displayName,
            String initials,
            String role,
            String roleKey,
            String email,
            LocalDateTime createdAt,
            int taskCount
    ) {
    }
}
