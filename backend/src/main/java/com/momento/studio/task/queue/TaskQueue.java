package com.momento.studio.task.queue;

import com.momento.studio.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class TaskQueue {

    private final StringRedisTemplate redis;
    private final AppProperties properties;

    public void ensureGroup() {
        String stream = properties.getQueue().getStreamKey();
        String group = properties.getQueue().getConsumerGroup();
        try {
            redis.opsForStream().createGroup(stream, ReadOffset.latest(), group);
            log.info("Created Redis task consumer group {}", group);
        } catch (Exception exception) {
            try {
                boolean exists = redis.opsForStream().groups(stream).stream()
                        .anyMatch(info -> group.equals(info.groupName()));
                if (exists) {
                    log.info("Redis task consumer group {} already exists", group);
                    return;
                }
            } catch (Exception ignored) {
                // Fall through to the warning below; the dispatcher will retry later.
            }
            log.warn("Could not create Redis task consumer group: {}", exception.getMessage());
        }
    }

    /**
     * Adds a persistent stream entry. A failed publish is safe: the database
     * dispatcher will publish every QUEUED task again on its next pass.
     */
    public boolean publish(String taskId) {
        try {
            RecordId recordId = redis.opsForStream().add(
                    StreamRecords.newRecord()
                            .in(properties.getQueue().getStreamKey())
                            .ofMap(Map.of("taskId", taskId))
            );
            log.info("Published task {} to Redis Stream ({})", taskId, recordId);
            return recordId != null;
        } catch (Exception exception) {
            log.error("Could not publish task {} to Redis Stream", taskId, exception);
            return false;
        }
    }

    public void acknowledge(MapRecord<String, Object, Object> record) {
        try {
            redis.opsForStream().acknowledge(properties.getQueue().getConsumerGroup(), record);
        } catch (Exception exception) {
            log.warn("Could not acknowledge task stream record {}: {}", record.getId(), exception.getMessage());
        }
    }
}
