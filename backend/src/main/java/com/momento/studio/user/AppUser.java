package com.momento.studio.user;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class AppUser {
    private String id;
    private String displayName;
    private String initials;
    private String role;
    private UserRole roleKey = UserRole.MEMBER;
    private String email;
    private String passwordHash;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
