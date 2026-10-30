package com.momento.studio.template;

import com.momento.studio.common.ApiException;
import com.momento.studio.common.ItemsResponse;
import com.momento.studio.user.UserPermissions;
import com.momento.studio.config.CurrentUser;
import com.momento.studio.template.TemplateAdminDtos.ActiveRequest;
import com.momento.studio.template.TemplateAdminDtos.AdminCategoryResponse;
import com.momento.studio.template.TemplateAdminDtos.AdminTemplateResponse;
import com.momento.studio.template.TemplateAdminDtos.CategoryCreateRequest;
import com.momento.studio.template.TemplateAdminDtos.CoverResponse;
import com.momento.studio.template.TemplateAdminDtos.UpsertRequest;
import com.momento.studio.user.AppUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/templates")
@RequiredArgsConstructor
public class TemplateAdminController {

    private final TemplateAdminService templateAdminService;

    @GetMapping
    public ItemsResponse<AdminTemplateResponse> list(@CurrentUser AppUser user) {
        UserPermissions.requireTemplateManager(user);
        return new ItemsResponse<>(templateAdminService.findAll());
    }

    @PostMapping
    public ResponseEntity<AdminTemplateResponse> create(
            @CurrentUser AppUser user,
            @Valid @RequestBody UpsertRequest request
    ) {
        UserPermissions.requireTemplateManager(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(templateAdminService.create(request));
    }

    @PutMapping("/{id}")
    public AdminTemplateResponse update(
            @CurrentUser AppUser user,
            @PathVariable String id,
            @Valid @RequestBody UpsertRequest request
    ) {
        UserPermissions.requireTemplateManager(user);
        return templateAdminService.update(id, request);
    }

    @PatchMapping("/{id}/active")
    public AdminTemplateResponse setActive(
            @CurrentUser AppUser user,
            @PathVariable String id,
            @Valid @RequestBody ActiveRequest request
    ) {
        UserPermissions.requireTemplateManager(user);
        return templateAdminService.setActive(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@CurrentUser AppUser user, @PathVariable String id) {
        UserPermissions.requireTemplateManager(user);
        templateAdminService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    public ItemsResponse<AdminCategoryResponse> categories(@CurrentUser AppUser user) {
        UserPermissions.requireTemplateManager(user);
        return new ItemsResponse<>(templateAdminService.findCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<AdminCategoryResponse> createCategory(
            @CurrentUser AppUser user,
            @Valid @RequestBody CategoryCreateRequest request
    ) {
        UserPermissions.requireTemplateManager(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(templateAdminService.createCategory(request));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@CurrentUser AppUser user, @PathVariable String id) {
        UserPermissions.requireTemplateManager(user);
        templateAdminService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/covers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CoverResponse> uploadCover(
            @CurrentUser AppUser user,
            @RequestPart("file") MultipartFile file
    ) {
        UserPermissions.requireTemplateManager(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(templateAdminService.uploadCover(file));
    }

}
