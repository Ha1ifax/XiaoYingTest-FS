package com.momento.studio.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.momento.studio.asset.AssetMapper;
import com.momento.studio.asset.AssetStorageService;
import com.momento.studio.asset.UploadedAsset;
import com.momento.studio.simulation.SimulationConfig;
import com.momento.studio.simulation.SimulationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TaskWorkflowRunnerTest {

    private TaskMapper taskMapper;
    private TaskStateService taskStateService;
    private AssetMapper assetMapper;
    private AssetStorageService assetStorageService;
    private ResultComposer resultComposer;
    private SimulationService simulationService;
    private TaskWorkflowRunner runner;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        taskMapper = mock(TaskMapper.class);
        taskStateService = mock(TaskStateService.class);
        assetMapper = mock(AssetMapper.class);
        assetStorageService = mock(AssetStorageService.class);
        resultComposer = mock(ResultComposer.class);
        simulationService = mock(SimulationService.class);
        objectMapper = new ObjectMapper();
        runner = new TaskWorkflowRunner(
                taskMapper,
                taskStateService,
                assetMapper,
                assetStorageService,
                resultComposer,
                simulationService,
                objectMapper
        );
    }

    @Test
    void runsStagesInOrderAndPersistsResult() throws Exception {
        CreationTask task = task(1);
        UploadedAsset asset = asset("asset_1");
        when(taskStateService.claim(task.getId())).thenReturn(true);
        when(taskMapper.findById(task.getId())).thenReturn(Optional.of(task));
        when(assetMapper.findByTaskId(task.getId())).thenReturn(List.of(asset));
        when(assetStorageService.isReadable(asset)).thenReturn(true);
        when(resultComposer.compose(task, List.of(asset))).thenReturn("/results/result_task_1.png");

        runner.run(task.getId());

        InOrder order = inOrder(taskStateService, taskMapper, assetMapper, resultComposer);
        order.verify(taskStateService).claim(task.getId());
        order.verify(taskMapper).findById(task.getId());
        order.verify(assetMapper).findByTaskId(task.getId());
        order.verify(taskStateService).beginStage(task.getId(), Stage.ASSET_CHECK);
        order.verify(taskStateService).completeStage(eq(task.getId()), eq(Stage.ASSET_CHECK), any());
        order.verify(taskStateService).beginStage(task.getId(), Stage.GENERATE);
        order.verify(taskStateService).completeStage(eq(task.getId()), eq(Stage.GENERATE), any());
        order.verify(taskStateService).beginStage(task.getId(), Stage.FINALIZE);
        order.verify(resultComposer).compose(task, List.of(asset));
        order.verify(taskStateService).completeStage(eq(task.getId()), eq(Stage.FINALIZE), any());
        order.verify(taskStateService).completeTask(task.getId(), "/results/result_task_1.png");
        verify(taskStateService, never()).failTask(any(), any(), any());
    }

    @Test
    void failureAtGenerateStopsLaterStagesAndRecordsReason() throws Exception {
        CreationTask task = task(1);
        task.setSimulationConfig(objectMapper.writeValueAsString(
                new SimulationConfig(0, 0, 0, Stage.GENERATE.name(), "演示注入：模拟生成失败。")
        ));
        when(taskStateService.claim(task.getId())).thenReturn(true);
        when(taskMapper.findById(task.getId())).thenReturn(Optional.of(task));
        when(assetMapper.findByTaskId(task.getId())).thenReturn(List.of(asset("asset_1")));
        when(assetStorageService.isReadable(any())).thenReturn(true);

        runner.run(task.getId());

        InOrder order = inOrder(taskStateService);
        order.verify(taskStateService).beginStage(task.getId(), Stage.ASSET_CHECK);
        order.verify(taskStateService).completeStage(eq(task.getId()), eq(Stage.ASSET_CHECK), any());
        order.verify(taskStateService).beginStage(task.getId(), Stage.GENERATE);
        order.verify(taskStateService).failStage(task.getId(), Stage.GENERATE, "演示注入：模拟生成失败。");
        order.verify(taskStateService).skipRemaining(task.getId(), Stage.GENERATE);
        order.verify(taskStateService).failTask(task.getId(), Stage.GENERATE, "演示注入：模拟生成失败。");
        verify(taskStateService, never()).beginStage(task.getId(), Stage.FINALIZE);
        verify(resultComposer, never()).compose(any(), any());
    }

    @Test
    void assetCountMismatchStopsBeforeGeneration() throws Exception {
        CreationTask task = task(2);
        UploadedAsset asset = asset("asset_1");
        when(taskStateService.claim(task.getId())).thenReturn(true);
        when(taskMapper.findById(task.getId())).thenReturn(Optional.of(task));
        when(assetMapper.findByTaskId(task.getId())).thenReturn(List.of(asset));
        when(assetStorageService.isReadable(asset)).thenReturn(true);

        runner.run(task.getId());

        verify(taskStateService).failStage(
                eq(task.getId()),
                eq(Stage.ASSET_CHECK),
                org.mockito.ArgumentMatchers.contains("需要 2 张")
        );
        verify(taskStateService).skipRemaining(task.getId(), Stage.ASSET_CHECK);
        verify(taskStateService).failTask(
                eq(task.getId()),
                eq(Stage.ASSET_CHECK),
                org.mockito.ArgumentMatchers.contains("需要 2 张")
        );
        verify(taskStateService, never()).beginStage(task.getId(), Stage.GENERATE);
        verify(resultComposer, never()).compose(any(), any());
    }

    @Test
    void doesNotRunWhenTaskCannotBeClaimed() {
        when(taskStateService.claim("task_1")).thenReturn(false);

        runner.run("task_1");

        verify(taskMapper, never()).findById(any());
        verify(taskStateService, never()).completeTask(any(), any());
    }

    private CreationTask task(int requiredImages) throws Exception {
        CreationTask task = new CreationTask();
        task.setId("task_1");
        task.setUserId("u_lin");
        task.setTemplateId("demo-postcard");
        task.setRequiredImageCount(requiredImages);
        task.setSimulationConfig(objectMapper.writeValueAsString(
                new SimulationConfig(0, 0, 0, null, null)
        ));
        return task;
    }

    private UploadedAsset asset(String id) {
        UploadedAsset asset = new UploadedAsset();
        asset.setId(id);
        asset.setOriginalFileName(id + ".jpg");
        asset.setSizeBytes(1_048_576);
        return asset;
    }
}
