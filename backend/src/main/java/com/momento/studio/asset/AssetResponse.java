package com.momento.studio.asset;

import java.time.LocalDateTime;

public record AssetResponse(
        String id,
        String templateId,
        String originalFileName,
        String url,
        String mimeType,
        long sizeBytes,
        LocalDateTime createdAt
) {
    public static AssetResponse from(UploadedAsset asset) {
        return new AssetResponse(
                asset.getId(),
                asset.getTemplateId(),
                asset.getOriginalFileName(),
                asset.getPublicUrl(),
                asset.getMimeType(),
                asset.getSizeBytes(),
                asset.getCreatedAt()
        );
    }
}
