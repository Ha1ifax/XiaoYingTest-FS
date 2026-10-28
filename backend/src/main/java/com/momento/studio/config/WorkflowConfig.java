package com.momento.studio.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
public class WorkflowConfig {

    @Bean(name = "taskWorkflowExecutor")
    public Executor taskWorkflowExecutor(AppProperties properties) {
        AppProperties.Workflow workflow = properties.getWorkflow();
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(workflow.getCorePoolSize());
        executor.setMaxPoolSize(workflow.getMaxPoolSize());
        executor.setQueueCapacity(workflow.getQueueCapacity());
        executor.setThreadNamePrefix("momento-task-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(15);
        executor.initialize();
        return executor;
    }
}
