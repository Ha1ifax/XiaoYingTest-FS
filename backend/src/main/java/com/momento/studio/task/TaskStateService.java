package com.momento.studio.task;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskStateService {

    private final TaskMapper taskMapper;
    private final TaskStepMapper taskStepMapper;

    @Transactional
    public boolean claim(String taskId) {
        return taskMapper.claim(taskId) == 1;
    }

    @Transactional
    public void beginStage(String taskId, Stage stage) {
        if (taskMapper.updateCurrentStage(taskId, stage) != 1) {
            throw new IllegalStateException("Task is not processing: " + taskId);
        }
        if (taskStepMapper.markRunning(taskId, stage, stage.runningDetail()) != 1) {
            throw new IllegalStateException("Step is not pending: " + taskId + "/" + stage);
        }
    }

    @Transactional
    public void completeStage(String taskId, Stage stage, String detail) {
        if (taskStepMapper.markSucceeded(taskId, stage, detail) != 1) {
            throw new IllegalStateException("Step is not running: " + taskId + "/" + stage);
        }
    }

    @Transactional
    public void failStage(String taskId, Stage stage, String reason) {
        taskStepMapper.markFailed(taskId, stage, reason);
    }

    @Transactional
    public void skipRemaining(String taskId, Stage failedStage) {
        taskStepMapper.skipAfter(taskId, failedStage.order());
    }

    @Transactional
    public void completeTask(String taskId, String resultUrl) {
        if (taskMapper.markSucceeded(taskId, resultUrl) != 1) {
            throw new IllegalStateException("Task could not be completed: " + taskId);
        }
    }

    @Transactional
    public void failTask(String taskId, Stage stage, String reason) {
        if (taskMapper.markFailed(taskId, stage, trimReason(reason)) != 1) {
            log.warn("Task {} was already terminal when failure was recorded", taskId);
        }
    }

    @Transactional
    public void failQueuedTask(String taskId, String reason) {
        if (taskMapper.markQueueFailed(taskId, trimReason(reason)) == 1) {
            taskStepMapper.skipAfter(taskId, 0);
        }
    }

    private String trimReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return "制作任务未能完成，请稍后再试。";
        }
        String normalized = reason.trim();
        return normalized.length() > 480 ? normalized.substring(0, 480) : normalized;
    }
}
