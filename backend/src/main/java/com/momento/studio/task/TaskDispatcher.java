package com.momento.studio.task;

import com.momento.studio.task.queue.TaskQueue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class TaskDispatcher {

    private final TaskQueue taskQueue;

    /**
     * The event is only a fast path. If publishing fails, the task remains
     * QUEUED and TaskRecoveryService will publish it again.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTaskSubmitted(TaskSubmittedEvent event) {
        if (!taskQueue.publish(event.taskId())) {
            log.warn("Task {} was accepted but not queued yet; dispatcher will retry", event.taskId());
        }
    }
}
