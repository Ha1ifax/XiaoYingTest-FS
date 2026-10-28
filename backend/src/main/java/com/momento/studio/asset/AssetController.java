package com.momento.studio.asset;

import com.momento.studio.config.CurrentUser;
import com.momento.studio.user.AppUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class AssetController {

    private final AssetStorageService assetStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AssetResponse> upload(
            @CurrentUser AppUser user,
            @RequestParam("templateId") String templateId,
            @RequestParam("file") MultipartFile file
    ) {
        AssetResponse response = assetStorageService.store(user, templateId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{assetId}")
    public ResponseEntity<Void> delete(
            @CurrentUser AppUser user,
            @PathVariable String assetId
    ) {
        assetStorageService.delete(user, assetId);
        return ResponseEntity.noContent().build();
    }
}
