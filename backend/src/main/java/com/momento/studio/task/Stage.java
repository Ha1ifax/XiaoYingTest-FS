package com.momento.studio.task;

public enum Stage {
    ASSET_CHECK(1, "素材检查", "正在检查上传的图片是否完整可用"),
    GENERATE(2, "模拟生成", "正在根据素材生成画面"),
    FINALIZE(3, "结果整理", "正在把画面整理成可预览的结果");

    private final int order;
    private final String label;
    private final String runningDetail;

    Stage(int order, String label, String runningDetail) {
        this.order = order;
        this.label = label;
        this.runningDetail = runningDetail;
    }

    public int order() {
        return order;
    }

    public String label() {
        return label;
    }

    public String runningDetail() {
        return runningDetail;
    }

    public String pendingDetail() {
        return "等待「" + label + "」";
    }
}
