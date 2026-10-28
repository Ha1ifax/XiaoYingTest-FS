package com.momento.studio.task;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class TaskStep {
    private Long id;
    private String taskId;
    private Stage stage;
    private int stageOrder;
    private StepStatus status;
    private String detail;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
}
