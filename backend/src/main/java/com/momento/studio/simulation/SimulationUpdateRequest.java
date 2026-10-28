package com.momento.studio.simulation;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record SimulationUpdateRequest(
        @Min(value = 0, message = "素材检查耗时不能小于 0。")
        @Max(value = 120000, message = "素材检查耗时不能超过 120 秒。")
        long assetCheckDelayMs,

        @Min(value = 0, message = "模拟生成耗时不能小于 0。")
        @Max(value = 120000, message = "模拟生成耗时不能超过 120 秒。")
        long generateDelayMs,

        @Min(value = 0, message = "结果整理耗时不能小于 0。")
        @Max(value = 120000, message = "结果整理耗时不能超过 120 秒。")
        long finalizeDelayMs,

        @Size(max = 32, message = "失败阶段参数过长。")
        String failureStage,

        @Size(max = 300, message = "失败原因不能超过 300 个字符。")
        String failureMessage
) {
}
