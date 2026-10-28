package com.momento.studio.template;

import com.momento.studio.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TemplateService {

    private final TemplateMapper templateMapper;
    private final TemplateCategoryMapper templateCategoryMapper;

    public List<TemplateResponse> findAll(String category) {
        List<CreativeTemplate> templates = StringUtils.hasText(category)
                ? templateMapper.findAllActiveByCategory(category.trim())
                : templateMapper.findAllActive();
        return templates.stream()
                .map(this::toResponse)
                .toList();
    }

    public List<CategoryResponse> findCategories() {
        return templateCategoryMapper.findPublicWithCounts().stream()
                .map(row -> new CategoryResponse(row.getName(), row.getTemplateCount()))
                .toList();
    }

    public TemplateResponse getById(String id) {
        return toResponse(requireTemplate(id));
    }

    public CreativeTemplate requireTemplate(String id) {
        return templateMapper.findActiveById(id)
                .orElseThrow(() -> ApiException.notFound("没有找到这个模板。"));
    }

    public TemplateResponse toResponse(CreativeTemplate template) {
        List<String> mimeTypes = Arrays.stream(template.getAcceptedMimeTypes().split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
        return new TemplateResponse(
                template.getId(),
                template.getTitle(),
                template.getCategory(),
                template.getDescription(),
                template.getCoverUrl(),
                template.getAccentColor(),
                template.getRequiredImageCount(),
                mimeTypes,
                template.getMaxFileSizeBytes(),
                template.getResultLabel(),
                template.getDetailNote()
        );
    }

    public record CategoryResponse(String name, long count) {
    }
}
