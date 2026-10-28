package com.momento.studio.template;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.Optional;

@Mapper
public interface TemplateMapper {

    String COLUMNS = "id, title, category, description, cover_url, accent_color, "
            + "required_image_count, accepted_mime_types, max_file_size_bytes, "
            + "result_label, detail_note, sort_order, is_active AS active, created_at, updated_at";

    @Select("SELECT " + COLUMNS + " FROM creative_template "
            + "WHERE is_active = TRUE ORDER BY sort_order, id")
    List<CreativeTemplate> findAllActive();

    @Select("SELECT " + COLUMNS + " FROM creative_template "
            + "WHERE is_active = TRUE AND category = #{category} ORDER BY sort_order, id")
    List<CreativeTemplate> findAllActiveByCategory(@Param("category") String category);

    @Select("SELECT " + COLUMNS + " FROM creative_template "
            + "WHERE id = #{id} AND is_active = TRUE")
    Optional<CreativeTemplate> findActiveById(@Param("id") String id);

    @Select("SELECT " + COLUMNS + " FROM creative_template WHERE id = #{id}")
    Optional<CreativeTemplate> findAnyById(@Param("id") String id);

    @Select("SELECT " + COLUMNS + " FROM creative_template ORDER BY sort_order, id")
    List<CreativeTemplate> findAllAdmin();

    @Insert("""
            INSERT INTO creative_template
                (id, title, category, description, cover_url, accent_color, required_image_count,
                 accepted_mime_types, max_file_size_bytes, result_label, detail_note, sort_order, is_active)
            VALUES
                (#{id}, #{title}, #{category}, #{description}, #{coverUrl}, #{accentColor},
                 #{requiredImageCount}, #{acceptedMimeTypes}, #{maxFileSizeBytes}, #{resultLabel},
                 #{detailNote}, #{sortOrder}, #{active})
            """)
    @Options(useGeneratedKeys = false)
    int insert(CreativeTemplate template);

    @Update("""
            UPDATE creative_template SET
                title = #{title},
                category = #{category},
                description = #{description},
                cover_url = #{coverUrl},
                accent_color = #{accentColor},
                required_image_count = #{requiredImageCount},
                accepted_mime_types = #{acceptedMimeTypes},
                max_file_size_bytes = #{maxFileSizeBytes},
                result_label = #{resultLabel},
                detail_note = #{detailNote},
                sort_order = #{sortOrder},
                updated_at = CURRENT_TIMESTAMP(3)
            WHERE id = #{id}
            """)
    int update(CreativeTemplate template);

    @Update("""
            UPDATE creative_template SET is_active = #{active}, updated_at = CURRENT_TIMESTAMP(3)
            WHERE id = #{id}
            """)
    int updateActive(@Param("id") String id, @Param("active") boolean active);

    @Delete("DELETE FROM creative_template WHERE id = #{id}")
    int delete(@Param("id") String id);

    @Select("SELECT COUNT(*) FROM creation_task WHERE template_id = #{id}")
    long countTaskRefs(@Param("id") String id);

    @Select("SELECT COUNT(*) FROM uploaded_asset WHERE template_id = #{id}")
    long countAssetRefs(@Param("id") String id);
}
