package com.momento.studio.simulation;

import com.momento.studio.task.Stage;

public record SimulationConfig(
        long assetCheckDelayMs,
        long generateDelayMs,
        long finalizeDelayMs,
        String failureStage,
        String failureMessage
) {

    public boolean failsAt(Stage stage) {
        return failureStage != null && failureStage.equals(stage.name());
    }

    public long delayFor(Stage stage) {
        return switch (stage) {
            case ASSET_CHECK -> assetCheckDelayMs;
            case GENERATE -> generateDelayMs;
            case FINALIZE -> finalizeDelayMs;
        };
    }

    public String failureReason(Stage stage) {
        if (failureMessage != null && !failureMessage.isBlank()) {
            return failureMessage.trim();
        }
        return "演示开关已让「" + stage.label() + "」阶段失败。";
    }
}
