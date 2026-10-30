package com.momento.studio.task;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.momento.studio.asset.AssetMapper;
import com.momento.studio.asset.AssetStorageService;
import com.momento.studio.asset.UploadedAsset;
import com.momento.studio.common.ApiException;
import com.momento.studio.simulation.SimulationConfig;
import com.momento.studio.simulation.SimulationService;
import com.momento.studio.template.CreativeTemplate;
import com.momento.studio.template.TemplateService;
import com.momento.studio.task.queue.TaskRateLimiter;
import com.momento.studio.user.AppUser;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskMapper taskMapper;
    private final TaskStepMapper taskStepMapper;
    private final TaskAssetMapper taskAssetMapper;
    private final TaskQueryService taskQueryService;
    private final AssetMapper assetMapper;
    private final AssetStorageService assetStorageService;
    private final TemplateService templateService;
    private final SimulationService simulationService;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final TaskRateLimiter taskRateLimiter;

    @Transactional
    public TaskResponse create(AppUser user, CreateTaskRequest request) {
        taskRateLimiter.check(user.getId());
        CreativeTemplate template = templateService.requireTemplate(request.templateId());

        List<String> requestedIds = request.assetIds() == null ? List.of() : request.assetIds().stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .toList();
        if (requestedIds.size() != (request.assetIds() == null ? 0 : request.assetIds().size())
                || new HashSet<>(requestedIds).size() != requestedIds.size()) {
            throw ApiException.badRequest("图片清单包含重复或空白项，请重新选择图片。");
        }
        if (requestedIds.size() != template.getRequiredImageCount()) {
            throw ApiException.badRequest(
                    "「" + template.getTitle() + "」需要 " + template.getRequiredImageCount()
                            + " 张图片，当前有 " + requestedIds.size() + " 张。");
        }

        List<UploadedAsset> assets = assetMapper.findByIdsAndUser(requestedIds, user.getId());
        Map<String, UploadedAsset> assetById = assets.stream()
                .collect(Collectors.toMap(UploadedAsset::getId, Function.identity()));
        List<UploadedAsset> orderedAssets = new ArrayList<>();
        for (String assetId : new LinkedHashSet<>(requestedIds)) {
            UploadedAsset asset = assetById.get(assetId);
            if (asset == null) {
                throw ApiException.badRequest("有图片已失效，请重新上传后再提交。");
            }
            if (!template.getId().equals(asset.getTemplateId())) {
                throw ApiException.badRequest("有图片不属于当前模板，请重新上传。");
            }
            if (!assetStorageService.isReadable(asset)) {
                throw ApiException.badRequest("有图片文件不可用，请重新上传后再提交。");
            }
            orderedAssets.add(asset);
        }

        LocalDateTime now = LocalDateTime.now();
        String taskId = "task_" + UUID.randomUUID().toString().replace("-", "");
        SimulationConfig simulation = simulationService.snapshot();

        CreationTask task = new CreationTask();
        task.setId(taskId);
        task.setUserId(user.getId());
        task.setTemplateId(template.getId());
        task.setStatus(TaskStatus.QUEUED);
        task.setSimulationConfig(writeSimulationConfig(simulation));
        task.setCreatedAt(now);
        task.setUpdatedAt(now);
        taskMapper.insert(task);

        for (int index = 0; index < orderedAssets.size(); index++) {
            taskAssetMapper.insert(taskId, orderedAssets.get(index).getId(), index);
        }

        for (Stage stage : Stage.values()) {
            TaskStep step = new TaskStep();
            step.setTaskId(taskId);
            step.setStage(stage);
            step.setStageOrder(stage.order());
            step.setStatus(StepStatus.PENDING);
            step.setDetail(stage.pendingDetail());
            taskStepMapper.insert(step);
        }

        eventPublisher.publishEvent(new TaskSubmittedEvent(taskId));
        return taskQueryService.getForUser(user.getId(), taskId);
    }

    private String writeSimulationConfig(SimulationConfig config) {
        try {
            return objectMapper.writeValueAsString(config);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Cannot serialize simulation configuration", exception);
        }
    }
}
