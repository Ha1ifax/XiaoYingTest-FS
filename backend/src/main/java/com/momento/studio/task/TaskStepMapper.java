package com.momento.studio.task;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface TaskStepMapper {

    @Insert("""
            INSERT INTO task_step
                (task_id, stage, stage_order, status, detail, started_at, finished_at)
            VALUES
                (#{taskId}, #{stage}, #{stageOrder}, #{status}, #{detail},
                 #{startedAt}, #{finishedAt})
            """)
    int insert(TaskStep step);

    @Select("""
            SELECT id, task_id, stage, stage_order, status, detail, started_at, finished_at
            FROM task_step
            WHERE task_id = #{taskId}
            ORDER BY stage_order
            """)
    List<TaskStep> findByTaskId(String taskId);

    @Update("""
            UPDATE task_step
            SET status = 'RUNNING', detail = #{detail}, started_at = NOW(), finished_at = NULL
            WHERE task_id = #{taskId} AND stage = #{stage} AND status = 'PENDING'
            """)
    int markRunning(@Param("taskId") String taskId,
                    @Param("stage") Stage stage,
                    @Param("detail") String detail);

    @Update("""
            UPDATE task_step
            SET status = 'SUCCEEDED', detail = #{detail}, finished_at = NOW()
            WHERE task_id = #{taskId} AND stage = #{stage} AND status = 'RUNNING'
            """)
    int markSucceeded(@Param("taskId") String taskId,
                      @Param("stage") Stage stage,
                      @Param("detail") String detail);

    @Update("""
            UPDATE task_step
            SET status = 'FAILED', detail = #{detail}, finished_at = NOW()
            WHERE task_id = #{taskId} AND stage = #{stage} AND status = 'RUNNING'
            """)
    int markFailed(@Param("taskId") String taskId,
                   @Param("stage") Stage stage,
                   @Param("detail") String detail);

    @Update("""
            UPDATE task_step
            SET status = 'SKIPPED', detail = '前一步失败，本步骤未执行', finished_at = NOW()
            WHERE task_id = #{taskId} AND stage_order > #{stageOrder} AND status = 'PENDING'
            """)
    int skipAfter(@Param("taskId") String taskId, @Param("stageOrder") int stageOrder);

    @Update("""
            UPDATE task_step
            SET status = 'FAILED', detail = #{detail}, finished_at = NOW()
            WHERE task_id = #{taskId} AND stage = #{stage} AND status IN ('PENDING', 'RUNNING')
            """)
    int markFailedAfterRetry(@Param("taskId") String taskId,
                             @Param("stage") Stage stage,
                             @Param("detail") String detail);

    @Update("""
            UPDATE task_step ts
            JOIN creation_task t ON t.id = ts.task_id
            SET ts.status = 'PENDING', ts.detail = '上次执行被服务中断，等待续跑',
                ts.started_at = NULL, ts.finished_at = NULL
            WHERE ts.status = 'RUNNING' AND t.status = 'QUEUED'
            """)
    int resetRunningSteps();

    @Update("""
            UPDATE task_step
            SET status = 'PENDING', detail = '等待自动重试', started_at = NULL, finished_at = NULL
            WHERE task_id = #{taskId} AND stage = #{stage} AND status = 'RUNNING'
            """)
    int resetStageForRetry(@Param("taskId") String taskId, @Param("stage") Stage stage);
}
