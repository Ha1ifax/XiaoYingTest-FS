package com.momento.studio.asset;

import com.momento.studio.common.ApiException;
import com.momento.studio.config.AppProperties;
import com.momento.studio.template.CreativeTemplate;
import com.momento.studio.template.TemplateService;
import com.momento.studio.user.AppUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssetStorageService {

    private static final Set<String> SUPPORTED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private final AppProperties properties;
    private final AssetMapper assetMapper;
    private final TemplateService templateService;

    public AssetResponse store(AppUser user, String templateId, MultipartFile file) {
        CreativeTemplate template = templateService.requireTemplate(templateId);
        ValidatedImage validated = validate(file, template);

        String assetId = "asset_" + UUID.randomUUID().toString().replace("-", "");
        Path uploadRoot = Paths.get(properties.getStorage().getUploadDir()).toAbsolutePath().normalize();
        Path userDirectory = uploadRoot.resolve(safeDirectory(user.getId())).normalize();
        String storedFileName = assetId + "." + validated.extension();
        Path target = userDirectory.resolve(storedFileName).normalize();
        if (!target.startsWith(uploadRoot)) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "STORAGE_ERROR", "无法保存图片，请稍后再试。");
        }

        try {
            Files.createDirectories(userDirectory);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "STORAGE_ERROR", "图片保存失败，请稍后再试。");
        }

        UploadedAsset asset = new UploadedAsset();
        asset.setId(assetId);
        asset.setUserId(user.getId());
        asset.setTemplateId(template.getId());
        asset.setOriginalFileName(displayName(file.getOriginalFilename()));
        asset.setStoragePath(target.toString());
        asset.setPublicUrl("/uploads/" + safeDirectory(user.getId()) + "/" + storedFileName);
        asset.setMimeType(validated.mimeType());
        asset.setSizeBytes(file.getSize());
        asset.setCreatedAt(LocalDateTime.now());

        try {
            assetMapper.insert(asset);
        } catch (RuntimeException exception) {
            try {
                Files.deleteIfExists(target);
            } catch (IOException ignored) {
                // The orphaned file is harmless; surface the original database failure.
            }
            throw exception;
        }
        return AssetResponse.from(asset);
    }

    public UploadedAsset requireOwned(AppUser user, String assetId) {
        return assetMapper.findByIdAndUser(assetId, user.getId())
                .orElseThrow(() -> ApiException.notFound("没有找到这张图片，请重新上传。"));
    }

    public void delete(AppUser user, String assetId) {
        UploadedAsset asset = requireOwned(user, assetId);
        if (assetMapper.countTaskReferences(assetId) > 0) {
            throw ApiException.conflict("这张图片已用于制作任务，暂时不能移除。");
        }
        assetMapper.deleteByIdAndUser(assetId, user.getId());
        try {
            Files.deleteIfExists(Paths.get(asset.getStoragePath()));
        } catch (IOException ignored) {
            // The database row is gone; a leftover local file does not affect the user flow.
        }
    }

    public boolean isReadable(UploadedAsset asset) {
        return StringUtils.hasText(asset.getStoragePath())
                && Files.isReadable(Paths.get(asset.getStoragePath()));
    }

    public Path resultDirectory() {
        Path path = Paths.get(properties.getStorage().getResultDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(path);
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot create result directory: " + path, exception);
        }
        return path;
    }

    /**
     * 模板封面是编辑器的资源，不挂到某个用户或素材记录下。
     * 文件仍然落在本地 uploads 目录，并通过已有的 /uploads/** 静态映射访问。
     */
    public CoverUpload storeTemplateCover(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("请选择一张封面图片。");
        }
        if (file.getSize() > 8L * 1024 * 1024) {
            throw ApiException.payloadTooLarge("封面图片不能超过 8 MB。");
        }

        byte[] header = new byte[12];
        try (InputStream inputStream = file.getInputStream()) {
            int offset = 0;
            while (offset < header.length) {
                int read = inputStream.read(header, offset, header.length - offset);
                if (read < 0) break;
                offset += read;
            }
        } catch (IOException exception) {
            throw ApiException.badRequest("无法读取这张封面，请换一张再试。");
        }

        ImageFormat format = detectFormat(header);
        if (format == null) {
            throw ApiException.badRequest("封面仅支持 JPG、PNG、WebP 或 GIF 图片。");
        }

        int width;
        int height;
        try (InputStream inputStream = file.getInputStream()) {
            BufferedImage image = ImageIO.read(inputStream);
            if (image == null || image.getWidth() < 120 || image.getHeight() < 120) {
                throw ApiException.badRequest("封面尺寸太小，请上传至少 120 × 120 的图片。");
            }
            width = image.getWidth();
            height = image.getHeight();
        } catch (IOException exception) {
            throw ApiException.badRequest("封面内容无法识别，请换一张再试。");
        }

        Path uploadRoot = Paths.get(properties.getStorage().getUploadDir()).toAbsolutePath().normalize();
        Path covers = uploadRoot.resolve("covers").normalize();
        String fileName = "cover_" + UUID.randomUUID().toString().replace("-", "") + "." + format.extension();
        Path target = covers.resolve(fileName).normalize();
        if (!target.startsWith(uploadRoot)) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "STORAGE_ERROR", "无法保存封面，请稍后再试。");
        }

        try {
            Files.createDirectories(covers);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "STORAGE_ERROR", "封面保存失败，请稍后再试。");
        }

        return new CoverUpload("/uploads/covers/" + fileName, format.mimeType(), width, height);
    }

    public record CoverUpload(String url, String mimeType, int width, int height) {
    }

    private ValidatedImage validate(MultipartFile file, CreativeTemplate template) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("请选择一张图片后再上传。");
        }
        if (file.getSize() > template.getMaxFileSizeBytes()) {
            throw ApiException.payloadTooLarge(
                    "图片不能超过 " + readableMegabytes(template.getMaxFileSizeBytes()) + "。");
        }

        byte[] header = new byte[12];
        try (InputStream inputStream = file.getInputStream()) {
            int offset = 0;
            while (offset < header.length) {
                int read = inputStream.read(header, offset, header.length - offset);
                if (read < 0) {
                    break;
                }
                offset += read;
            }
        } catch (IOException exception) {
            throw ApiException.badRequest("无法读取这张图片，请换一张再试。");
        }

        ImageFormat format = detectFormat(header);
        if (format == null) {
            throw ApiException.badRequest("仅支持 JPG、PNG、WebP 或 GIF 图片。");
        }
        List<String> accepted = Arrays.stream(template.getAcceptedMimeTypes().split(","))
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .filter(StringUtils::hasText)
                .toList();
        if (!accepted.contains(format.mimeType())) {
            throw ApiException.badRequest("这个模板只接受 " + friendlyTypes(accepted) + " 图片。");
        }
        if (!SUPPORTED_MIME_TYPES.contains(format.mimeType())) {
            throw ApiException.badRequest("这张图片的格式暂不支持。");
        }

        try (InputStream inputStream = file.getInputStream()) {
            BufferedImage image = ImageIO.read(inputStream);
            if (image == null || image.getWidth() < 20 || image.getHeight() < 20) {
                throw ApiException.badRequest("图片内容无法识别，请换一张清晰的图片。");
            }
        } catch (IOException exception) {
            throw ApiException.badRequest("图片内容无法识别，请换一张再试。");
        }

        return new ValidatedImage(format.mimeType(), format.extension());
    }

    private ImageFormat detectFormat(byte[] header) {
        if (header.length >= 3
                && (header[0] & 0xff) == 0xff
                && (header[1] & 0xff) == 0xd8
                && (header[2] & 0xff) == 0xff) {
            return new ImageFormat("image/jpeg", "jpg");
        }
        if (header.length >= 8
                && (header[0] & 0xff) == 0x89
                && header[1] == 'P'
                && header[2] == 'N'
                && header[3] == 'G') {
            return new ImageFormat("image/png", "png");
        }
        if (header.length >= 12
                && header[0] == 'R'
                && header[1] == 'I'
                && header[2] == 'F'
                && header[3] == 'F'
                && header[8] == 'W'
                && header[9] == 'E'
                && header[10] == 'B'
                && header[11] == 'P') {
            return new ImageFormat("image/webp", "webp");
        }
        if (header.length >= 6
                && header[0] == 'G'
                && header[1] == 'I'
                && header[2] == 'F') {
            return new ImageFormat("image/gif", "gif");
        }
        return null;
    }

    private String displayName(String originalFileName) {
        if (!StringUtils.hasText(originalFileName)) {
            return "上传的图片";
        }
        String normalized = originalFileName.replace('\\', '/');
        String name = normalized.substring(normalized.lastIndexOf('/') + 1).trim();
        if (name.isEmpty()) {
            return "上传的图片";
        }
        return name.length() > 160 ? name.substring(name.length() - 160) : name;
    }

    private String safeDirectory(String userId) {
        return userId.replaceAll("[^a-zA-Z0-9_-]", "_");
    }

    private String readableMegabytes(long bytes) {
        double megabytes = bytes / (1024.0 * 1024.0);
        if (megabytes >= 1) {
            return (megabytes == Math.floor(megabytes) ? String.valueOf((long) megabytes) : String.format(Locale.ROOT, "%.1f", megabytes)) + " MB";
        }
        return Math.max(1, bytes / 1024) + " KB";
    }

    private String friendlyTypes(List<String> mimeTypes) {
        return mimeTypes.stream()
                .map(type -> switch (type) {
                    case "image/jpeg" -> "JPG";
                    case "image/png" -> "PNG";
                    case "image/webp" -> "WebP";
                    case "image/gif" -> "GIF";
                    default -> type;
                })
                .distinct()
                .reduce((left, right) -> left + "、" + right)
                .orElse("图片");
    }

    private record ImageFormat(String mimeType, String extension) {
    }

    private record ValidatedImage(String mimeType, String extension) {
    }
}
