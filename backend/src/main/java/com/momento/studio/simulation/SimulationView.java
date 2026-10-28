package com.momento.studio.simulation;

public record SimulationView(
        long assetCheckDelayMs,
        long generateDelayMs,
        long finalizeDelayMs,
        String failureStage,
        String failureMessage
) {
}
