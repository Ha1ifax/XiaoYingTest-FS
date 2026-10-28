package com.momento.studio.common;

import java.util.List;

public record ItemsResponse<T>(List<T> items) {
    public ItemsResponse {
        items = List.copyOf(items);
    }
}
