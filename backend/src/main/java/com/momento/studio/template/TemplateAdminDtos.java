package com.momento.studio.template;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class TemplateAdminDtos {

    private TemplateAdminDtos() {
    }

    public record UpsertRequest(
            @NotBlank(message = "请填写模板标题。")
            @Size(max = 80, message = "模板标题不能超过 80 个字符。")
            String title,

            @NotBlank(message = "请填写模板分类。")
            @Size(max = 40, message = "分类名称不能超过 40 个字符。")
            String category,

            @NotBlank(message = "请填写模板描述。")
            @Size(max = 500, message = "模板描述不能超过 500 个字符。")
            String description,

            @NotBlank(message = "请上传封面或填写封面地址。")
            @Size(max = 255, message = "封面地址过长。")
            String coverUrl,

            @NotBlank(message = "请选择强调色。")
            @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "强调色需要使用 #RRGGBB 格式。")
            String accentColor,

            @Min(value = 1, message = "至少需要 1 张图片。")
            @Max(value = 6, message = "最多支持 6 张图片。")
            int requiredImageCount,

            @NotEmpty(message = "请至少选择一种图片格式。")
            List<String> acceptedMimeTypes,

            @Min(value = 1024, message = "文件大小上限至少为 1 KB。")
            @Max(value = 20 * 1024 * 1024, message = "文件大小上限不能超过 20 MB。")
            long maxFileSizeBytes,

            @NotBlank(message = "请填写成品标签。")
            @Size(max = 80, message = "成品标签不能超过 80 个字符。")
            String resultLabel,

            @NotBlank(message = "请填写版式说明。")
            @Size(max = 300, message = "版式说明不能超过 300 个字符。")
            String detailNote,

            @Min(value = 0, message = "排序不能为负数。")
            @Max(value = 9999, message = "排序不能超过 9999。")
            int sortOrder
    ) {
    }

    public record ActiveRequest(@NotNull(message = "请指定上下架状态。") Boolean active) {
    }

    public record CategoryCreateRequest(
            @NotBlank(message = "请填写分类名称。")
            @Size(max = 40, message = "分类名称不能超过 40 个字符。")
            String name
    ) {
    }

    public record AdminCategoryResponse(
            String id,
            String name,
            long count,
            int sortOrder
    ) {
    }

    public record AdminTemplateResponse(
            String id,
            String title,
            String category,
            String description,
            String coverUrl,
            String accentColor,
            int requiredImageCount,
            List<String> acceptedMimeTypes,
            long maxFileSizeBytes,
            String resultLabel,
            String detailNote,
            int sortOrder,
            boolean active,
            long taskCount,
            long assetCount,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record CoverResponse(String url, String mimeType, int width, int height) {
    }
}
