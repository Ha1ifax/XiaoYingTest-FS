package com.momento.studio.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.momento.studio.asset.AssetMapper;
import com.momento.studio.asset.AssetStorageService;
import com.momento.studio.asset.UploadedAsset;
import com.momento.studio.config.AppProperties;
import com.momento.studio.simulation.SimulationConfig;
import com.momento.studio.simulation.SimulationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskWorkflowRunner {

    private final TaskMapper taskMapper;
    private final TaskStepMapper taskStepMapper;
    private final TaskStateService taskStateService;
    private final AssetMapper assetMapper;
    private final AssetStorageService assetStorageService;
    private final ResultComposer resultComposer;
    private final SimulationService simulationService;
    private final ObjectMapper objectMapper;
    private final AppProperties properties;

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
        log.info("Task {} started (retry={}, failureStage={}, delays={}/{}/{})",
                taskId, task.getRetryCount(), config.failureStage(), config.assetCheckDelayMs(),
                config.generateDelayMs(), config.finalizeDelayMs());

        Stage activeStage = null;
        String resultUrl = task.getResultUrl();
        try {
            List<UploadedAsset> assets = assetMapper.findByTaskId(taskId);
            Map<Stage, TaskStep> steps = taskStepMapper.findByTaskId(taskId).stream()
                    .collect(Collectors.toMap(TaskStep::getStage, Function.identity()));

            for (Stage stage : Stage.values()) {
                TaskStep step = steps.get(stage);
                if (step != null && step.getStatus() == StepStatus.SUCCEEDED) {
                    log.info("Task {} resumes after succeeded stage {}", taskId, stage);
                    continue;
                }
                activeStage = stage;
                if (stage == Stage.FINALIZE) {
                    resultUrl = executeFinalize(taskId, config, () -> resultComposer.compose(task, assets));
                } else if (stage == Stage.ASSET_CHECK) {
                    executeStage(taskId, stage, config, () -> checkAssets(task, assets));
                } else {
                    executeStage(taskId, stage, config, () -> generateDraft(task, assets));
                }
            }

            if (resultUrl == null) {
                resultUrl = taskMapper.findById(taskId)
                        .map(CreationTask::getResultUrl)
                        .orElse(null);
            }
            if (resultUrl == null) {
                throw new IllegalStateException("All stages completed without a result URL");
            }
            taskStateService.completeTask(taskId, resultUrl);
            log.info("Task {} completed: {}", taskId, resultUrl);
        } catch (StageFailure failure) {
            log.warn("Task {} failed permanently at {}: {}", taskId, failure.stage, failure.getMessage());
            recordFailure(taskId, failure.stage, failure.getMessage());
        } catch (Exception exception) {
            Stage stage = activeStage != null ? activeStage : firstIncompleteStage(taskId);
            log.error("Task {} failed unexpectedly at {}", taskId, stage, exception);
            handleInfrastructureFailure(taskId, stage, exception);
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

    /**
     * Runs one checkpoint. Succeeded stages are skipped by the caller, so a
     * process restart resumes at the first incomplete stage.
     */
    private String executeStage(String taskId, Stage stage, SimulationConfig config, StageAction action) {
        taskStateService.beginStage(taskId, stage);
        try {
            Thread.sleep(config.delayFor(stage));
            if (config.failsAt(stage)) {
                throw new StageFailure(stage, config.failureReason(stage));
            }
            String detail = action.run();
            taskStateService.completeStage(taskId, stage, detail);
            return detail;
        } catch (StageFailure failure) {
            throw failure;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new InfrastructureFailure(stage, "任务处理被服务器中断。", exception);
        } catch (Exception exception) {
            throw new InfrastructureFailure(stage, fallbackReason(stage), exception);
        }
    }

    private String executeFinalize(String taskId, SimulationConfig config, StageAction action) {
        taskStateService.beginStage(taskId, Stage.FINALIZE);
        try {
            Thread.sleep(config.delayFor(Stage.FINALIZE));
            if (config.failsAt(Stage.FINALIZE)) {
                throw new StageFailure(Stage.FINALIZE, config.failureReason(Stage.FINALIZE));
            }
            String resultUrl = action.run();
            taskStateService.recordResult(taskId, resultUrl);
            taskStateService.completeStage(taskId, Stage.FINALIZE, "结果已整理为 4:5 预览图");
            return resultUrl;
        } catch (StageFailure failure) {
            throw failure;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new InfrastructureFailure(Stage.FINALIZE, "任务处理被服务器中断。", exception);
        } catch (Exception exception) {
            throw new InfrastructureFailure(Stage.FINALIZE, fallbackReason(Stage.FINALIZE), exception);
        }
    }

    private void handleInfrastructureFailure(String taskId, Stage stage, Exception exception) {
        String reason = "制作过程出现临时问题，系统会尝试自动恢复。";
        try {
            int retryCount = taskStateService.releaseForRetry(taskId, stage, reason);
            if (retryCount < properties.getQueue().getMaxRetries()) {
                log.warn("Task {} released for retry {} after {}: {}",
                        taskId, retryCount, stage, exception.getMessage());
                return;
            }
            taskStateService.failAfterRetries(
                    taskId,
                    stage,
                    "自动重试 " + retryCount + " 次后仍未完成，请稍后再试。"
            );
        } catch (Exception stateError) {
            log.error("Could not release task {} for retry", taskId, stateError);
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

    private Stage firstIncompleteStage(String taskId) {
        return taskStepMapper.findByTaskId(taskId).stream()
                .filter(step -> step.getStatus() != StepStatus.SUCCEEDED)
                .map(TaskStep::getStage)
                .findFirst()
                .orElse(Stage.FINALIZE);
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

    private static class InfrastructureFailure extends RuntimeException {
        private final Stage stage;

        private InfrastructureFailure(Stage stage, String message, Throwable cause) {
            super(message, cause);
            this.stage = stage;
        }
    }
}
