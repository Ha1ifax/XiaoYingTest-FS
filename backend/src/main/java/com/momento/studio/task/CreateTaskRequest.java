package com.momento.studio.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CreateTaskRequest(
        @NotBlank(message = "请选择一个模板。") String templateId,
        @NotEmpty(message = "请先上传制作所需的图片。") List<String> assetIds
) {
}
