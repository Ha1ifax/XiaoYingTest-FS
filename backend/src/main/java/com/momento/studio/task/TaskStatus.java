package com.momento.studio.task;

public enum TaskStatus {
    QUEUED("等待处理"),
    PROCESSING("处理中"),
    SUCCEEDED("制作完成"),
    FAILED("制作失败");

    private final String label;

    TaskStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    public boolean isTerminal() {
        return this == SUCCEEDED || this == FAILED;
    }
}
