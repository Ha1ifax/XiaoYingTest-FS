package com.momento.studio.template;

import java.util.List;

public record TemplateResponse(
        String id,
        String title,
        String category,
        String description,
        String coverUrl,
        String accentColor,
        int requiredImageCount,
        List<String> acceptedMimeTypes,
        long maxFileSizeBytes,
        String resultLabel,
        String detailNote
) {
}
