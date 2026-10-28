package com.momento.studio.task;

import com.momento.studio.common.ItemsResponse;
import com.momento.studio.config.CurrentUser;
import com.momento.studio.user.AppUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final TaskQueryService taskQueryService;

    @PostMapping
    public ResponseEntity<TaskResponse> create(
            @CurrentUser AppUser user,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        TaskResponse response = taskService.create(user, request);
        return ResponseEntity.accepted().body(response);
    }

    @GetMapping
    public ItemsResponse<TaskResponse> list(@CurrentUser AppUser user) {
        List<TaskResponse> tasks = taskQueryService.listForUser(user.getId());
        return new ItemsResponse<>(tasks);
    }

    @GetMapping("/{taskId}")
    public TaskResponse detail(
            @CurrentUser AppUser user,
            @PathVariable String taskId
    ) {
        return taskQueryService.getForUser(user.getId(), taskId);
    }
}
