package com.momento.studio.task;

public enum StepStatus {
    PENDING("等待中"),
    RUNNING("进行中"),
    SUCCEEDED("已完成"),
    FAILED("失败"),
    SKIPPED("已跳过");

    private final String label;

    StepStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
