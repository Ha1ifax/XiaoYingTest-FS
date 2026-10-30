package com.momento.studio.task;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.Optional;

@Mapper
public interface TaskMapper {

    String SELECT_COLUMNS = """
            t.id, t.user_id, t.template_id, t.status, t.current_stage, t.failure_stage,
            t.failure_reason, t.result_url, t.simulation_config, t.dispatch_attempts,
            t.last_dispatched_at, t.retry_count, t.last_error, t.created_at, t.started_at,
            t.finished_at, t.updated_at,
            ct.title AS template_title, ct.category AS template_category,
            ct.cover_url, ct.accent_color, ct.result_label, ct.required_image_count,
            (SELECT COUNT(*) FROM task_asset ta WHERE ta.task_id = t.id) AS asset_count
            """;

    @Insert("""
            INSERT INTO creation_task
                (id, user_id, template_id, status, current_stage, failure_stage, failure_reason,
                 result_url, simulation_config, created_at, updated_at)
            VALUES
                (#{id}, #{userId}, #{templateId}, #{status}, #{currentStage}, #{failureStage},
                 #{failureReason}, #{resultUrl}, #{simulationConfig}, #{createdAt}, #{updatedAt})
            """)
    int insert(CreationTask task);

    @Select("SELECT " + SELECT_COLUMNS + """
            FROM creation_task t
            JOIN creative_template ct ON ct.id = t.template_id
            WHERE t.id = #{id} AND t.user_id = #{userId}
            """)
    Optional<CreationTask> findByIdAndUser(@Param("id") String id, @Param("userId") String userId);

    @Select("SELECT " + SELECT_COLUMNS + """
            FROM creation_task t
            JOIN creative_template ct ON ct.id = t.template_id
            WHERE t.user_id = #{userId}
            ORDER BY t.created_at DESC, t.id DESC
            """)
    List<CreationTask> findAllByUser(String userId);

    @Select("SELECT " + SELECT_COLUMNS + """
            FROM creation_task t
            JOIN creative_template ct ON ct.id = t.template_id
            WHERE t.id = #{id}
            """)
    Optional<CreationTask> findById(String id);

    @Update("""
            UPDATE creation_task
            SET status = 'PROCESSING', started_at = COALESCE(started_at, NOW(3)),
                last_dispatched_at = NULL, last_error = NULL, updated_at = NOW(3)
            WHERE id = #{id} AND status = 'QUEUED'
            """)
    int claim(String id);

    @Update("""
            UPDATE creation_task
            SET current_stage = #{stage}, updated_at = NOW()
            WHERE id = #{id} AND status = 'PROCESSING'
            """)
    int updateCurrentStage(@Param("id") String id, @Param("stage") Stage stage);

    @Update("""
            UPDATE creation_task
            SET status = 'SUCCEEDED', current_stage = 'FINALIZE', result_url = #{resultUrl},
                finished_at = NOW(), updated_at = NOW()
            WHERE id = #{id} AND status = 'PROCESSING'
            """)
    int markSucceeded(@Param("id") String id, @Param("resultUrl") String resultUrl);

    @Update("""
            UPDATE creation_task
            SET status = 'FAILED', failure_stage = #{failureStage}, failure_reason = #{reason},
                finished_at = NOW(), updated_at = NOW()
            WHERE id = #{id} AND status = 'PROCESSING'
            """)
    int markFailed(@Param("id") String id,
                   @Param("failureStage") Stage failureStage,
                   @Param("reason") String reason);

    @Update("""
            UPDATE creation_task
            SET status = 'FAILED', failure_reason = #{reason}, finished_at = NOW(3), updated_at = NOW(3)
            WHERE id = #{id} AND status = 'QUEUED'
            """)
    int markQueueFailed(@Param("id") String id, @Param("reason") String reason);

    @Select("""
            SELECT id FROM creation_task
            WHERE status = 'QUEUED'
              AND (last_dispatched_at IS NULL OR last_dispatched_at < DATE_SUB(NOW(3), INTERVAL 15 SECOND))
              AND dispatch_attempts < 100
            ORDER BY created_at
            LIMIT #{limit}
            """)
    List<String> findQueuedForDispatch(@Param("limit") int limit);

    @Update("""
            UPDATE creation_task
            SET dispatch_attempts = dispatch_attempts + 1, last_dispatched_at = NOW(3), updated_at = NOW(3)
            WHERE id = #{id} AND status = 'QUEUED'
            """)
    int markDispatched(String id);

    @Update("""
            UPDATE creation_task
            SET status = 'QUEUED', current_stage = NULL, started_at = NULL,
                last_dispatched_at = NULL, updated_at = NOW(3)
            WHERE status = 'PROCESSING'
            """)
    int resetProcessingTasks();

    @Update("""
            UPDATE creation_task
            SET status = 'QUEUED', current_stage = NULL, started_at = NULL,
                last_dispatched_at = NULL, updated_at = NOW(3)
            WHERE status = 'PROCESSING'
              AND updated_at < DATE_SUB(NOW(3), INTERVAL 10 MINUTE)
            """)
    int resetStaleProcessingTasks();

    @Update("""
            UPDATE creation_task
            SET status = 'QUEUED', current_stage = NULL, started_at = NULL,
                last_dispatched_at = NULL, retry_count = retry_count + 1,
                last_error = #{reason}, updated_at = NOW(3)
            WHERE id = #{id} AND status = 'PROCESSING'
            """)
    int releaseForRetry(@Param("id") String id, @Param("reason") String reason);

    @Select("SELECT retry_count FROM creation_task WHERE id = #{id}")
    Integer findRetryCount(String id);

    @Select("SELECT COUNT(*) FROM creation_task WHERE user_id = #{userId}")
    int countByUser(String userId);

    @Update("""
            UPDATE creation_task
            SET status = 'FAILED', failure_stage = #{stage}, failure_reason = #{reason},
                finished_at = NOW(3), updated_at = NOW(3)
            WHERE id = #{id} AND status IN ('QUEUED', 'PROCESSING')
            """)
    int markFailedAfterRetry(@Param("id") String id,
                             @Param("stage") Stage stage,
                             @Param("reason") String reason);

    @Update("""
            UPDATE creation_task
            SET result_url = #{resultUrl}, updated_at = NOW(3)
            WHERE id = #{id} AND status = 'PROCESSING'
            """)
    int recordResult(@Param("id") String id, @Param("resultUrl") String resultUrl);
}
