package com.momento.studio.user;

import com.momento.studio.common.ApiException;
import com.momento.studio.task.TaskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserMapper userMapper;
    private final TaskMapper taskMapper;

    public List<UserAdminDtos.AdminUserResponse> findAll() {
        return userMapper.findAll().stream()
                .map(user -> new UserAdminDtos.AdminUserResponse(
                        user.getId(),
                        user.getDisplayName(),
                        user.getInitials(),
                        user.getRole(),
                        user.getRoleKey().name(),
                        user.getEmail(),
                        user.getCreatedAt(),
                        taskMapper.countByUser(user.getId())
                ))
                .toList();
    }

    @Transactional
    public UserAdminDtos.AdminUserResponse updateRole(AppUser current, String userId, String rawRoleKey) {
        UserRole role;
        try {
            role = UserRole.valueOf(rawRoleKey.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw ApiException.badRequest("角色只能是 MEMBER、EDITOR 或 ADMIN。");
        }
        if (current.getId().equals(userId)) {
            throw ApiException.badRequest("不能修改自己的角色，避免把自己锁在管理页之外。");
        }
        AppUser target = userMapper.findById(userId)
                .orElseThrow(() -> ApiException.notFound("没有找到这个成员。"));
        if (target.getRoleKey() == UserRole.ADMIN && role != UserRole.ADMIN && userMapper.countAdmins() <= 1) {
            throw ApiException.conflict("至少需要保留一名管理员。");
        }
        userMapper.updateRole(userId, role, LocalDateTime.now());
        AppUser updated = userMapper.findById(userId)
                .orElseThrow(() -> ApiException.notFound("没有找到这个成员。"));
        return new UserAdminDtos.AdminUserResponse(
                updated.getId(),
                updated.getDisplayName(),
                updated.getInitials(),
                updated.getRole(),
                updated.getRoleKey().name(),
                updated.getEmail(),
                updated.getCreatedAt(),
                taskMapper.countByUser(updated.getId())
        );
    }
}
