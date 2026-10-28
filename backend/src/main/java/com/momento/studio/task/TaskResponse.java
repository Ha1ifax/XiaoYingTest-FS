package com.momento.studio.task;

import java.time.LocalDateTime;
import java.util.List;

public record TaskResponse(
        String id,
        TaskStatus status,
        String statusLabel,
        Stage currentStage,
        String currentStageLabel,
        Stage failureStage,
        String failureStageLabel,
        String failureReason,
        String resultUrl,
        TemplateSummary template,
        int assetCount,
        LocalDateTime createdAt,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        LocalDateTime updatedAt,
        List<StageResponse> stages
) {

    public record TemplateSummary(
            String id,
            String title,
            String category,
            String coverUrl,
            String accentColor,
            String resultLabel,
            int requiredImageCount
    ) {
    }

    public record StageResponse(
            Stage stage,
            String label,
            StepStatus status,
            String statusLabel,
            String detail,
            LocalDateTime startedAt,
            LocalDateTime finishedAt
    ) {
    }
}
