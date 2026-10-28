package com.momento.studio.asset;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class UploadedAsset {
    private String id;
    private String userId;
    private String templateId;
    private String originalFileName;
    private String storagePath;
    private String publicUrl;
    private String mimeType;
    private long sizeBytes;
    private LocalDateTime createdAt;
}
