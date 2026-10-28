package com.momento.studio.template;

import com.momento.studio.asset.AssetStorageService;
import com.momento.studio.common.ApiException;
import com.momento.studio.template.TemplateAdminDtos.ActiveRequest;
import com.momento.studio.template.TemplateAdminDtos.AdminCategoryResponse;
import com.momento.studio.template.TemplateAdminDtos.AdminTemplateResponse;
import com.momento.studio.template.TemplateAdminDtos.CategoryCreateRequest;
import com.momento.studio.template.TemplateAdminDtos.CoverResponse;
import com.momento.studio.template.TemplateAdminDtos.UpsertRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TemplateAdminService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private final TemplateMapper templateMapper;
    private final TemplateCategoryMapper templateCategoryMapper;
    private final TemplateService templateService;
    private final AssetStorageService assetStorageService;

    public List<AdminTemplateResponse> findAll() {
        return templateMapper.findAllAdmin().stream()
                .map(this::toAdminResponse)
                .toList();
    }

    public List<AdminCategoryResponse> findCategories() {
        return templateCategoryMapper.findAllWithCounts().stream()
                .map(this::toCategoryResponse)
                .toList();
    }

    @Transactional
    public AdminCategoryResponse createCategory(CategoryCreateRequest request) {
        String name = request.name().trim().replaceAll("\\s+", " ");
        if (name.isEmpty()) {
            throw ApiException.badRequest("请填写分类名称。");
        }
        if (templateCategoryMapper.findByName(name).isPresent()) {
            throw ApiException.conflict("这个分类已经存在了。");
        }
        TemplateCategory category = new TemplateCategory();
        category.setId("cat_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20));
        category.setName(name);
        category.setSortOrder(templateCategoryMapper.maxSortOrder() + 10);
        try {
            templateCategoryMapper.insert(category);
        } catch (DuplicateKeyException ex) {
            throw ApiException.conflict("这个分类已经存在了。");
        }
        return new AdminCategoryResponse(
                category.getId(),
                category.getName(),
                0,
                category.getSortOrder()
        );
    }

    @Transactional
    public void deleteCategory(String id) {
        TemplateCategory category = templateCategoryMapper.findById(id)
                .orElseThrow(() -> ApiException.notFound("没有找到这个分类。"));
        long templateCount = templateCategoryMapper.countTemplatesByName(category.getName());
        if (templateCount > 0) {
            throw ApiException.conflict(
                    "这个分类下还有 " + templateCount + " 个模板，暂时不能删除；可以先把模板移到其他分类。"
            );
        }
        templateCategoryMapper.delete(id);
    }

    @Transactional
    public AdminTemplateResponse create(UpsertRequest request) {
        CreativeTemplate template = new CreativeTemplate();
        template.setId("tpl_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20));
        apply(template, request);
        template.setActive(true);
        templateMapper.insert(template);
        return toAdminResponse(findAny(template.getId()));
    }

    @Transactional
    public AdminTemplateResponse update(String id, UpsertRequest request) {
        CreativeTemplate existing = findAny(id);
        apply(existing, request);
        templateMapper.update(existing);
        return toAdminResponse(findAny(id));
    }

    @Transactional
    public AdminTemplateResponse setActive(String id, ActiveRequest request) {
        CreativeTemplate existing = findAny(id);
        boolean active = Boolean.TRUE.equals(request.active());
        templateMapper.updateActive(id, active);
        existing.setActive(active);
        return toAdminResponse(existing);
    }

    @Transactional
    public void delete(String id) {
        findAny(id);
        long taskCount = templateMapper.countTaskRefs(id);
        long assetCount = templateMapper.countAssetRefs(id);
        if (taskCount > 0 || assetCount > 0) {
            throw ApiException.conflict(
                    "这个模板已经被 " + taskCount + " 个任务、"
                            + assetCount + " 张素材引用，不能永久删除；可以先下架。"
            );
        }
        templateMapper.delete(id);
    }

    public CoverResponse uploadCover(MultipartFile file) {
        AssetStorageService.CoverUpload upload = assetStorageService.storeTemplateCover(file);
        return new CoverResponse(upload.url(), upload.mimeType(), upload.width(), upload.height());
    }

    private CreativeTemplate findAny(String id) {
        return templateMapper.findAnyById(id)
                .orElseThrow(() -> ApiException.notFound("没有找到这个模板。"));
    }

    private void apply(CreativeTemplate template, UpsertRequest request) {
        String coverUrl = request.coverUrl().trim();
        if (!coverUrl.startsWith("/") || coverUrl.startsWith("//")
                || coverUrl.contains("\\") || coverUrl.contains("..")) {
            throw ApiException.badRequest("封面地址必须是本站可访问的本地路径。");
        }
        template.setTitle(request.title().trim());
        String categoryName = request.category().trim();
        TemplateCategory category = templateCategoryMapper.findByName(categoryName)
                .orElseThrow(() -> ApiException.badRequest("请选择已有分类，或先新增一个分类。"));
        template.setCategory(category.getName());
        template.setDescription(request.description().trim());
        template.setCoverUrl(coverUrl);
        template.setAccentColor(request.accentColor().toLowerCase(Locale.ROOT));
        template.setRequiredImageCount(request.requiredImageCount());
        template.setAcceptedMimeTypes(String.join(",", normalizeMimeTypes(request.acceptedMimeTypes())));
        template.setMaxFileSizeBytes(request.maxFileSizeBytes());
        template.setResultLabel(request.resultLabel().trim());
        template.setDetailNote(request.detailNote().trim());
        template.setSortOrder(request.sortOrder());
    }

    private List<String> normalizeMimeTypes(List<String> values) {
        if (values == null || values.isEmpty()) {
            throw ApiException.badRequest("请至少选择一种图片格式。");
        }
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String value : values) {
            if (!StringUtils.hasText(value)) continue;
            String lower = value.trim().toLowerCase(Locale.ROOT);
            if (!ALLOWED_MIME_TYPES.contains(lower)) {
                throw ApiException.badRequest("图片格式只能是 JPG、PNG、WebP 或 GIF。");
            }
            normalized.add(lower);
        }
        if (normalized.isEmpty()) {
            throw ApiException.badRequest("请至少选择一种图片格式。");
        }
        return new ArrayList<>(normalized);
    }

    private AdminTemplateResponse toAdminResponse(CreativeTemplate template) {
        TemplateResponse publicView = templateService.toResponse(template);
        return new AdminTemplateResponse(
                publicView.id(),
                publicView.title(),
                publicView.category(),
                publicView.description(),
                publicView.coverUrl(),
                publicView.accentColor(),
                publicView.requiredImageCount(),
                publicView.acceptedMimeTypes(),
                publicView.maxFileSizeBytes(),
                publicView.resultLabel(),
                publicView.detailNote(),
                template.getSortOrder(),
                template.isActive(),
                templateMapper.countTaskRefs(template.getId()),
                templateMapper.countAssetRefs(template.getId()),
                template.getCreatedAt(),
                template.getUpdatedAt()
        );
    }

    private AdminCategoryResponse toCategoryResponse(TemplateCategoryMapper.CategoryCountRow category) {
        return new AdminCategoryResponse(
                category.getId(),
                category.getName(),
                category.getTemplateCount(),
                category.getSortOrder()
        );
    }
}
