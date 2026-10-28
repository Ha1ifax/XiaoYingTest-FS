package com.momento.studio.task;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;

@Slf4j
@Component
public class TaskDispatcher {

    private final Executor taskWorkflowExecutor;
    private final TaskWorkflowRunner taskWorkflowRunner;
    private final TaskStateService taskStateService;

    public TaskDispatcher(@Qualifier("taskWorkflowExecutor") Executor taskWorkflowExecutor,
                          TaskWorkflowRunner taskWorkflowRunner,
                          TaskStateService taskStateService) {
        this.taskWorkflowExecutor = taskWorkflowExecutor;
        this.taskWorkflowRunner = taskWorkflowRunner;
        this.taskStateService = taskStateService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTaskSubmitted(TaskSubmittedEvent event) {
        try {
            taskWorkflowExecutor.execute(() -> taskWorkflowRunner.run(event.taskId()));
        } catch (RejectedExecutionException exception) {
            log.error("Task queue is full, rejecting {}", event.taskId(), exception);
            taskStateService.failQueuedTask(event.taskId(), "制作队列已满，请稍后再提交。");
        }
    }
}
