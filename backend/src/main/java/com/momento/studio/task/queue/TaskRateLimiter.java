package com.momento.studio.task.queue;

import com.momento.studio.common.ApiException;
import com.momento.studio.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
@RequiredArgsConstructor
public class TaskRateLimiter {

    private static final DateTimeFormatter MINUTE = DateTimeFormatter.ofPattern("yyyyMMddHHmm")
            .withZone(ZoneOffset.UTC);

    private final StringRedisTemplate redis;
    private final AppProperties properties;

    public void check(String userId) {
        int limit = properties.getRateLimit().getTasksPerMinute();
        if (limit <= 0) {
            return;
        }
        String key = "momento:rate:task:" + userId + ":" + MINUTE.format(Instant.now());
        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redis.expire(key, Duration.ofMinutes(2));
            }
            if (count != null && count > limit) {
                throw ApiException.tooManyRequests("操作太频繁了，请稍后再提交制作任务。");
            }
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            // Redis is a guardrail, not a prerequisite for making a keepsake.
            log.warn("Redis rate limiter unavailable, allowing task submission: {}", exception.getMessage());
        }
    }
}
