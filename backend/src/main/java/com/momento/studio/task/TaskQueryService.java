package com.momento.studio.task;

import com.momento.studio.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskQueryService {

    private final TaskMapper taskMapper;
    private final TaskStepMapper taskStepMapper;

    public List<TaskResponse> listForUser(String userId) {
        return taskMapper.findAllByUser(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public TaskResponse getForUser(String userId, String taskId) {
        CreationTask task = taskMapper.findByIdAndUser(taskId, userId)
                .orElseThrow(() -> ApiException.notFound("没有找到这个制作任务。"));
        return toResponse(task);
    }

    public TaskResponse toResponse(CreationTask task) {
        List<TaskResponse.StageResponse> stages = taskStepMapper.findByTaskId(task.getId()).stream()
                .map(step -> new TaskResponse.StageResponse(
                        step.getStage(),
                        step.getStage().label(),
                        step.getStatus(),
                        step.getStatus().label(),
                        step.getDetail(),
                        step.getStartedAt(),
                        step.getFinishedAt()
                ))
                .toList();

        return new TaskResponse(
                task.getId(),
                task.getStatus(),
                task.getStatus().label(),
                task.getCurrentStage(),
                task.getCurrentStage() == null ? null : task.getCurrentStage().label(),
                task.getFailureStage(),
                task.getFailureStage() == null ? null : task.getFailureStage().label(),
                task.getFailureReason(),
                task.getResultUrl(),
                new TaskResponse.TemplateSummary(
                        task.getTemplateId(),
                        task.getTemplateTitle(),
                        task.getTemplateCategory(),
                        task.getCoverUrl(),
                        task.getAccentColor(),
                        task.getResultLabel(),
                        task.getRequiredImageCount()
                ),
                task.getAssetCount(),
                task.getCreatedAt(),
                task.getStartedAt(),
                task.getFinishedAt(),
                task.getUpdatedAt(),
                stages
        );
    }
}
