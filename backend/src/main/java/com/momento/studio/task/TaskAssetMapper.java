package com.momento.studio.task;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface TaskAssetMapper {

    @Insert("""
            INSERT INTO task_asset (task_id, asset_id, sort_order)
            VALUES (#{taskId}, #{assetId}, #{sortOrder})
            """)
    int insert(@Param("taskId") String taskId,
               @Param("assetId") String assetId,
               @Param("sortOrder") int sortOrder);
}
