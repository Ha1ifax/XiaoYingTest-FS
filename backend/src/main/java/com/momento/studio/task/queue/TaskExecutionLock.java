package com.momento.studio.task.queue;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TaskExecutionLock {

    private static final Duration LOCK_TTL = Duration.ofMinutes(5);
    private static final DefaultRedisScript<Long> RELEASE_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
            Long.class
    );

    private final StringRedisTemplate redis;

    /**
     * Redis is an optimization here, not the source of truth. If it is down,
     * the database claim still prevents two workers from running the task.
     */
    public String tryLock(String taskId) {
        String token = UUID.randomUUID().toString();
        try {
            Boolean acquired = redis.opsForValue().setIfAbsent(key(taskId), token, LOCK_TTL);
            return Boolean.TRUE.equals(acquired) ? token : null;
        } catch (Exception exception) {
            log.warn("Redis lock unavailable for task {}, continuing with database claim", taskId);
            return "no-redis";
        }
    }

    public void release(String taskId, String token) {
        if (token == null || "no-redis".equals(token)) {
            return;
        }
        try {
            redis.execute(RELEASE_SCRIPT, List.of(key(taskId)), token);
        } catch (Exception exception) {
            log.warn("Could not release Redis lock for task {}", taskId);
        }
    }

    /**
     * No worker from a previous process can still own a lock after startup.
     * Clearing before consumers start prevents a crashed run from blocking
     * the recovered task until the TTL expires.
     */
    public void clearOnStartup() {
        try {
            var keys = redis.keys("momento:lock:task:*");
            if (keys != null && !keys.isEmpty()) {
                redis.delete(keys);
                log.info("Cleared {} task lock(s) from the previous process", keys.size());
            }
        } catch (Exception exception) {
            log.warn("Could not clear stale Redis task locks: {}", exception.getMessage());
        }
    }

    private String key(String taskId) {
        return "momento:lock:task:" + taskId;
    }
}
