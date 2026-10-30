package com.momento.studio.task;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class CreationTask {
    private String id;
    private String userId;
    private String templateId;
    private TaskStatus status;
    private Stage currentStage;
    private Stage failureStage;
    private String failureReason;
    private String resultUrl;
    private String simulationConfig;
    private int dispatchAttempts;
    private LocalDateTime lastDispatchedAt;
    private int retryCount;
    private String lastError;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private LocalDateTime updatedAt;

    private String templateTitle;
    private String templateCategory;
    private String coverUrl;
    private String accentColor;
    private String resultLabel;
    private int requiredImageCount;
    private int assetCount;
}
