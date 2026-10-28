package com.momento.studio.simulation;

import com.momento.studio.common.ApiException;
import com.momento.studio.config.AppProperties;
import com.momento.studio.task.Stage;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class SimulationService {

    private final AtomicReference<SimulationView> current;

    public SimulationService(AppProperties properties) {
        AppProperties.Simulation defaults = properties.getSimulation();
        this.current = new AtomicReference<>(new SimulationView(
                defaults.getAssetCheckDelayMs(),
                defaults.getGenerateDelayMs(),
                defaults.getFinalizeDelayMs(),
                normalizeStage(defaults.getFailureStage()),
                defaults.getFailureMessage() == null ? "" : defaults.getFailureMessage().trim()
        ));
    }

    public SimulationView current() {
        return current.get();
    }

    public SimulationView update(SimulationUpdateRequest request) {
        String failureStage = normalizeStage(request.failureStage());
        String failureMessage = request.failureMessage() == null ? "" : request.failureMessage().trim();
        SimulationView updated = new SimulationView(
                request.assetCheckDelayMs(),
                request.generateDelayMs(),
                request.finalizeDelayMs(),
                failureStage,
                failureMessage
        );
        current.set(updated);
        return updated;
    }

    public SimulationConfig snapshot() {
        SimulationView view = current.get();
        return new SimulationConfig(
                view.assetCheckDelayMs(),
                view.generateDelayMs(),
                view.finalizeDelayMs(),
                view.failureStage(),
                view.failureMessage()
        );
    }

    private String normalizeStage(String value) {
        if (!StringUtils.hasText(value) || "NONE".equalsIgnoreCase(value.trim())) {
            return "";
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        try {
            Stage.valueOf(normalized);
        } catch (IllegalArgumentException exception) {
            throw ApiException.badRequest("失败阶段只能是 ASSET_CHECK、GENERATE 或 FINALIZE。");
        }
        return normalized;
    }
}
