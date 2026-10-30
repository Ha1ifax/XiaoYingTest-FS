package com.momento.studio.user;

import com.momento.studio.common.ItemsResponse;
import com.momento.studio.config.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserAdminService userAdminService;

    @GetMapping
    public ItemsResponse<UserAdminDtos.AdminUserResponse> list(@CurrentUser AppUser user) {
        UserPermissions.requireAdmin(user);
        return new ItemsResponse<>(userAdminService.findAll());
    }

    @PatchMapping("/{id}/role")
    public UserAdminDtos.AdminUserResponse updateRole(
            @CurrentUser AppUser user,
            @PathVariable String id,
            @Valid @RequestBody UserAdminDtos.RoleUpdateRequest request
    ) {
        UserPermissions.requireAdmin(user);
        return userAdminService.updateRole(user, id, request.roleKey());
    }
}
