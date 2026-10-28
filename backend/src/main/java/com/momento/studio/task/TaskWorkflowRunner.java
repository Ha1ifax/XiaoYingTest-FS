package com.momento.studio.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.momento.studio.asset.AssetMapper;
import com.momento.studio.asset.AssetStorageService;
import com.momento.studio.asset.UploadedAsset;
import com.momento.studio.simulation.SimulationConfig;
import com.momento.studio.simulation.SimulationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskWorkflowRunner {

    private final TaskMapper taskMapper;
    private final TaskStateService taskStateService;
    private final AssetMapper assetMapper;
    private final AssetStorageService assetStorageService;
    private final ResultComposer resultComposer;
    private final SimulationService simulationService;
    private final ObjectMapper objectMapper;

    public void run(String taskId) {
        if (!taskStateService.claim(taskId)) {
            log.info("Task {} was already claimed or finished", taskId);
            return;
        }
        CreationTask task = taskMapper.findById(taskId).orElse(null);
        if (task == null) {
            log.error("Claimed task {} disappeared", taskId);
            return;
        }
        SimulationConfig config = readSimulationConfig(task.getSimulationConfig());
        log.info("Task {} started (failureStage={}, delays={}/{}/{})",
                taskId, config.failureStage(), config.assetCheckDelayMs(),
                config.generateDelayMs(), config.finalizeDelayMs());

        try {
            List<UploadedAsset> assets = assetMapper.findByTaskId(taskId);
            executeStage(taskId, Stage.ASSET_CHECK, config,
                    () -> checkAssets(task, assets));
            executeStage(taskId, Stage.GENERATE, config,
                    () -> generateDraft(task, assets));

            AtomicReference<String> resultUrl = new AtomicReference<>();
            executeStage(taskId, Stage.FINALIZE, config, () -> {
                String url = resultComposer.compose(task, assets);
                resultUrl.set(url);
                return "结果已整理为 4:5 预览图";
            });

            if (resultUrl.get() == null) {
                throw new StageFailure(Stage.FINALIZE, "结果整理没有返回可预览的图片。");
            }
            taskStateService.completeTask(taskId, resultUrl.get());
            log.info("Task {} completed: {}", taskId, resultUrl.get());
        } catch (StageFailure failure) {
            log.warn("Task {} failed at {}: {}", taskId, failure.stage, failure.getMessage());
            recordFailure(taskId, failure.stage, failure.getMessage());
        } catch (Exception exception) {
            log.error("Task {} failed unexpectedly", taskId, exception);
            Stage stage = currentStage(taskId);
            recordFailure(taskId, stage, "制作过程出现意外，请稍后再试。");
        }
    }

    private String checkAssets(CreationTask task, List<UploadedAsset> assets) {
        if (assets.size() != task.getRequiredImageCount()) {
            throw new StageFailure(Stage.ASSET_CHECK,
                    "素材数量与模板要求不符：需要 " + task.getRequiredImageCount()
                            + " 张，实际收到 " + assets.size() + " 张。");
        }
        long totalBytes = 0;
        for (UploadedAsset asset : assets) {
            if (!assetStorageService.isReadable(asset)) {
                throw new StageFailure(Stage.ASSET_CHECK,
                        "素材检查未通过：图片「" + asset.getOriginalFileName() + "」不可读取。");
            }
            totalBytes += asset.getSizeBytes();
        }
        double totalMegabytes = totalBytes / (1024.0 * 1024.0);
        return String.format(Locale.ROOT, "已确认 %d 张图片可用（共 %.1f MB）",
                assets.size(), totalMegabytes);
    }

    private String generateDraft(CreationTask task, List<UploadedAsset> assets) {
        long seed = Math.abs((task.getId() + ":" + assets.size()).hashCode());
        String draft = Integer.toHexString((int) (seed % 0xFFFFFF)).toUpperCase(Locale.ROOT);
        return "模拟生成完成，画面草稿 #" + draft;
    }

    private void executeStage(String taskId, Stage stage, SimulationConfig config, StageAction action) {
        taskStateService.beginStage(taskId, stage);
        try {
            Thread.sleep(config.delayFor(stage));
            if (config.failsAt(stage)) {
                throw new StageFailure(stage, config.failureReason(stage));
            }
            String detail = action.run();
            taskStateService.completeStage(taskId, stage, detail);
        } catch (StageFailure failure) {
            throw failure;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new StageFailure(stage, "任务处理被服务器中断，请稍后重新提交。");
        } catch (Exception exception) {
            log.error("Stage {} failed for task {}", stage, taskId, exception);
            throw new StageFailure(stage, fallbackReason(stage));
        }
    }

    private void recordFailure(String taskId, Stage stage, String reason) {
        try {
            taskStateService.failStage(taskId, stage, reason);
            taskStateService.skipRemaining(taskId, stage);
            taskStateService.failTask(taskId, stage, reason);
        } catch (Exception exception) {
            log.error("Could not persist failure for task {}", taskId, exception);
        }
    }

    private Stage currentStage(String taskId) {
        return taskMapper.findById(taskId)
                .map(CreationTask::getCurrentStage)
                .orElse(Stage.ASSET_CHECK);
    }

    private SimulationConfig readSimulationConfig(String json) {
        if (json == null || json.isBlank()) {
            return simulationService.snapshot();
        }
        try {
            SimulationConfig config = objectMapper.readValue(json, SimulationConfig.class);
            return config == null ? simulationService.snapshot() : config;
        } catch (Exception exception) {
            log.warn("Invalid simulation config snapshot, using current defaults", exception);
            return simulationService.snapshot();
        }
    }

    private String fallbackReason(Stage stage) {
        return switch (stage) {
            case ASSET_CHECK -> "素材检查未能完成，请确认图片可以正常打开后重试。";
            case GENERATE -> "模拟生成未能完成，请稍后重新提交。";
            case FINALIZE -> "结果整理失败，上传的图片可能无法被处理。";
        };
    }

    @FunctionalInterface
    private interface StageAction {
        String run() throws Exception;
    }

    private static class StageFailure extends RuntimeException {
        private final Stage stage;

        private StageFailure(Stage stage, String message) {
            super(message);
            this.stage = stage;
        }
    }
}
