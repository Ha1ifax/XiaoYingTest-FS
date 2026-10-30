package com.momento.studio.auth;

import com.momento.studio.user.AppUser;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "请填写你的名字。")
            @Size(min = 2, max = 24, message = "名字需要 2 到 24 个字符。")
            String displayName,

            @NotBlank(message = "请填写邮箱。")
            @Email(message = "请输入有效的邮箱地址。")
            @Size(max = 190, message = "邮箱地址过长。")
            String email,

            @NotBlank(message = "请设置密码。")
            @Size(min = 8, max = 64, message = "密码需要 8 到 64 个字符。")
            String password
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "请填写邮箱。")
            @Email(message = "请输入有效的邮箱地址。")
            String email,

            @NotBlank(message = "请填写密码。")
            String password
    ) {
    }

    public record UpdateProfileRequest(
            @NotBlank(message = "请填写你的名字。")
            @Size(min = 2, max = 24, message = "名字需要 2 到 24 个字符。")
            String displayName
    ) {
    }

    public record ChangePasswordRequest(
            @NotBlank(message = "请填写当前密码。")
            String currentPassword,

            @NotBlank(message = "请填写新密码。")
            @Size(min = 8, max = 64, message = "新密码需要 8 到 64 个字符。")
            String newPassword
    ) {
    }

    public record AuthUserResponse(
            String id,
            String displayName,
            String initials,
            String role,
            String roleKey,
            String email,
            LocalDateTime createdAt
    ) {
        public static AuthUserResponse from(AppUser user) {
            return new AuthUserResponse(
                    user.getId(),
                    user.getDisplayName(),
                    user.getInitials(),
                    user.getRole(),
                    user.getRoleKey().name(),
                    user.getEmail(),
                    user.getCreatedAt()
            );
        }
    }

    public record AuthResponse(AuthUserResponse user) {
        public static AuthResponse of(AppUser user) {
            return new AuthResponse(AuthUserResponse.from(user));
        }
    }
}
