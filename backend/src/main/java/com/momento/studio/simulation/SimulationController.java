package com.momento.studio.simulation;

import com.momento.studio.common.ApiException;
import com.momento.studio.config.AppProperties;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dev/simulation")
@RequiredArgsConstructor
public class SimulationController {

    private final SimulationService simulationService;
    private final AppProperties appProperties;

    @GetMapping
    public SimulationView get() {
        requireEnabled();
        return simulationService.current();
    }

    @PutMapping
    public SimulationView update(@Valid @RequestBody SimulationUpdateRequest request) {
        requireEnabled();
        return simulationService.update(request);
    }

    private void requireEnabled() {
        if (!appProperties.getDevApi().isEnabled()) {
            throw ApiException.notFound("演示控制接口已关闭。");
        }
    }
}
