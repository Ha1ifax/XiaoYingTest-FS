package com.momento.studio.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final AppProperties properties;
    private final CurrentUserArgumentResolver currentUserArgumentResolver;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUserArgumentResolver);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = prepareDirectory(properties.getStorage().getUploadDir());
        Path resultDir = prepareDirectory(properties.getStorage().getResultDir());

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(toDirectoryUri(uploadDir))
                .setCachePeriod(3600);
        registry.addResourceHandler("/results/**")
                .addResourceLocations(toDirectoryUri(resultDir))
                .setCachePeriod(3600);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = properties.getCors().getAllowedOrigins().toArray(String[]::new);
        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type")
                .allowCredentials(true)
                .maxAge(3600);
    }

    private Path prepareDirectory(String rawPath) {
        Path path = Paths.get(rawPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(path);
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot create storage directory: " + path, exception);
        }
        return path;
    }

    private String toDirectoryUri(Path directory) {
        String uri = directory.toUri().toString();
        return uri.endsWith("/") ? uri : uri + "/";
    }
}
