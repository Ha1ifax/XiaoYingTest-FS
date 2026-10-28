package com.momento.studio.asset;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

@Mapper
public interface AssetMapper {

    @Insert("""
            INSERT INTO uploaded_asset
                (id, user_id, template_id, original_file_name, storage_path, public_url,
                 mime_type, size_bytes, created_at)
            VALUES
                (#{id}, #{userId}, #{templateId}, #{originalFileName}, #{storagePath}, #{publicUrl},
                 #{mimeType}, #{sizeBytes}, #{createdAt})
            """)
    int insert(UploadedAsset asset);

    @Select("""
            SELECT id, user_id, template_id, original_file_name, storage_path, public_url,
                   mime_type, size_bytes, created_at
            FROM uploaded_asset
            WHERE id = #{id} AND user_id = #{userId}
            """)
    Optional<UploadedAsset> findByIdAndUser(@Param("id") String id, @Param("userId") String userId);

    @Select("""
            <script>
            SELECT id, user_id, template_id, original_file_name, storage_path, public_url,
                   mime_type, size_bytes, created_at
            FROM uploaded_asset
            WHERE user_id = #{userId}
              AND id IN
              <foreach collection="ids" item="id" open="(" separator="," close=")">
                #{id}
              </foreach>
            </script>
            """)
    List<UploadedAsset> findByIdsAndUser(@Param("ids") List<String> ids, @Param("userId") String userId);

    @Select("""
            SELECT a.id, a.user_id, a.template_id, a.original_file_name, a.storage_path,
                   a.public_url, a.mime_type, a.size_bytes, a.created_at
            FROM uploaded_asset a
            JOIN task_asset ta ON ta.asset_id = a.id
            WHERE ta.task_id = #{taskId}
            ORDER BY ta.sort_order
            """)
    List<UploadedAsset> findByTaskId(String taskId);

    @Delete("DELETE FROM uploaded_asset WHERE id = #{id} AND user_id = #{userId}")
    int deleteByIdAndUser(@Param("id") String id, @Param("userId") String userId);

    @Select("SELECT COUNT(*) FROM task_asset WHERE asset_id = #{assetId}")
    int countTaskReferences(String assetId);
}
