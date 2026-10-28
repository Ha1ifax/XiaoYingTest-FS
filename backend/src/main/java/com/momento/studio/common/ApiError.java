package com.momento.studio.common;

import java.time.Instant;

public record ApiError(String code, String message, Instant timestamp) {
}
