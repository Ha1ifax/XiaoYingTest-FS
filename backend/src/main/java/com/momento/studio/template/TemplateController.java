package com.momento.studio.template;

import com.momento.studio.common.ItemsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    @GetMapping
    public ItemsResponse<TemplateResponse> list(
            @RequestParam(name = "category", required = false) String category
    ) {
        return new ItemsResponse<>(templateService.findAll(category));
    }

    @GetMapping("/categories")
    public ItemsResponse<TemplateService.CategoryResponse> categories() {
        return new ItemsResponse<>(templateService.findCategories());
    }

    @GetMapping("/{id}")
    public TemplateResponse detail(@PathVariable String id) {
        return templateService.getById(id);
    }
}
