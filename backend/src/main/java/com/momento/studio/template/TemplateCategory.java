package com.momento.studio.template;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TemplateCategory {
    private String id;
    private String name;
    private int sortOrder;
    private LocalDateTime createdAt;
}
