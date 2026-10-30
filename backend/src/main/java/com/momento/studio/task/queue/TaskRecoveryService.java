package com.momento.studio.task.queue;

import com.momento.studio.config.AppProperties;
import com.momento.studio.task.TaskMapper;
import com.momento.studio.task.TaskStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@RequiredArgsConstructor
public class TaskRecoveryService implements ApplicationRunner {

    private final TaskMapper taskMapper;
    private final TaskStateService taskStateService;
    private final TaskQueue taskQueue;
    private final TaskExecutionLock taskExecutionLock;
    private final AppProperties properties;

    @Override
    public void run(ApplicationArguments args) {
        taskQueue.ensureGroup();
        taskExecutionLock.clearOnStartup();
        taskStateService.recoverInterruptedTasks();
        dispatchQueued();
    }

    @Scheduled(
            fixedDelayString = "${app.queue.dispatch-interval-ms:10000}",
            initialDelayString = "${app.queue.dispatch-initial-delay-ms:30000}"
    )
    public void dispatchQueued() {
        int recovered = taskStateService.recoverStaleTasks();
        if (recovered > 0) {
            log.warn("Recovered {} stale task(s) for another attempt", recovered);
        }

        List<String> taskIds = taskMapper.findQueuedForDispatch(25);
        for (String taskId : taskIds) {
            if (taskMapper.markDispatched(taskId) != 1) {
                continue;
            }
            if (!taskQueue.publish(taskId)) {
                log.warn("Task {} stays QUEUED; dispatcher will retry", taskId);
            }
        }
    }
}
