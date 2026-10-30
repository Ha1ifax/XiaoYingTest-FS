package com.momento.studio.task.queue;

import com.momento.studio.config.AppProperties;
import com.momento.studio.task.TaskWorkflowRunner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 100)
@RequiredArgsConstructor
public class TaskQueueWorker implements ApplicationRunner, DisposableBean {

    private final StringRedisTemplate redis;
    private final TaskQueue queue;
    private final TaskExecutionLock executionLock;
    private final TaskWorkflowRunner runner;
    private final AppProperties properties;

    private final AtomicBoolean running = new AtomicBoolean(true);
    private ExecutorService executor;

    @Override
    public void run(ApplicationArguments args) {
        int consumers = Math.max(1, properties.getQueue().getConsumers());
        AtomicInteger index = new AtomicInteger();
        ThreadFactory threadFactory = runnable -> {
            Thread thread = new Thread(runnable, "redis-task-worker-" + index.incrementAndGet());
            thread.setDaemon(true);
            return thread;
        };
        executor = Executors.newFixedThreadPool(consumers, threadFactory);
        for (int i = 0; i < consumers; i++) {
            String consumerName = properties.getQueue().getConsumerPrefix() + "-" + i;
            executor.submit(() -> consume(consumerName));
        }
        log.info("Started {} Redis Stream task consumer(s)", consumers);
    }

    private void consume(String consumerName) {
        String stream = properties.getQueue().getStreamKey();
        String group = properties.getQueue().getConsumerGroup();
        Consumer consumer = Consumer.from(group, consumerName);
        drainPending(consumer, stream, group);

        while (running.get() && !Thread.currentThread().isInterrupted()) {
            try {
                List<MapRecord<String, Object, Object>> records = redis.opsForStream().read(
                        consumer,
                        StreamReadOptions.empty()
                                .count(1)
                                .block(Duration.ofMillis(properties.getQueue().getPollBlockMs())),
                        StreamOffset.create(stream, ReadOffset.lastConsumed())
                );
                if (records != null) {
                    records.forEach(this::process);
                }
            } catch (Exception exception) {
                if (running.get()) {
                    log.warn("Redis Stream consumer {} paused: {}", consumerName, exception.getMessage());
                    sleep(2_000);
                }
            }
        }
    }

    private void drainPending(Consumer consumer, String stream, String group) {
        try {
            while (running.get()) {
                List<MapRecord<String, Object, Object>> pending = redis.opsForStream().read(
                        consumer,
                        StreamReadOptions.empty().count(20),
                        StreamOffset.create(stream, ReadOffset.from("0-0"))
                );
                if (pending == null || pending.isEmpty()) {
                    return;
                }
                pending.forEach(this::process);
                if (pending.size() < 20) {
                    return;
                }
            }
        } catch (Exception exception) {
            log.warn("Could not drain pending Redis Stream messages for {}: {}", consumer, exception.getMessage());
        }
    }

    private void process(MapRecord<String, Object, Object> record) {
        try {
            Object taskValue = record.getValue().get("taskId");
            String taskId = taskValue == null ? null : String.valueOf(taskValue);
            if (taskId == null || taskId.isBlank()) {
                log.warn("Discarding malformed task stream record {}", record.getId());
                return;
            }
            String lock = executionLock.tryLock(taskId);
            if (lock == null) {
                log.info("Task {} is already being processed by another worker", taskId);
                return;
            }
            try {
                runner.run(taskId);
            } finally {
                executionLock.release(taskId, lock);
            }
        } catch (Exception exception) {
            log.error("Task stream record {} failed", record.getId(), exception);
        } finally {
            queue.acknowledge(record);
        }
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }

    @Override
    public void destroy() {
        running.set(false);
        if (executor != null) {
            executor.shutdownNow();
            try {
                executor.awaitTermination(5, TimeUnit.SECONDS);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
