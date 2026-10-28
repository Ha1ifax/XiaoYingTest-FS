package com.momento.studio.template;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

@Mapper
public interface TemplateCategoryMapper {

    String COLUMNS = "id, name, sort_order, created_at";

    @Select("""
            SELECT c.id, c.name, c.sort_order,
                   (SELECT COUNT(*) FROM creative_template t WHERE t.category = c.name) AS template_count
            FROM template_category c
            ORDER BY c.sort_order, c.name
            """)
    List<CategoryCountRow> findAllWithCounts();

    @Select("""
            SELECT c.id, c.name, c.sort_order,
                   COUNT(t.id) AS template_count
            FROM template_category c
            LEFT JOIN creative_template t
                   ON t.category = c.name AND t.is_active = TRUE
            GROUP BY c.id, c.name, c.sort_order
            HAVING COUNT(t.id) > 0
            ORDER BY c.sort_order, c.name
            """)
    List<CategoryCountRow> findPublicWithCounts();

    @Select("SELECT " + COLUMNS + " FROM template_category WHERE id = #{id}")
    Optional<TemplateCategory> findById(@Param("id") String id);

    @Select("SELECT " + COLUMNS + " FROM template_category WHERE name = #{name}")
    Optional<TemplateCategory> findByName(@Param("name") String name);

    @Select("SELECT COALESCE(MAX(sort_order), 0) FROM template_category")
    int maxSortOrder();

    @Insert("""
            INSERT INTO template_category (id, name, sort_order)
            VALUES (#{id}, #{name}, #{sortOrder})
            """)
    int insert(TemplateCategory category);

    @Delete("DELETE FROM template_category WHERE id = #{id}")
    int delete(@Param("id") String id);

    @Select("SELECT COUNT(*) FROM creative_template WHERE category = #{name}")
    long countTemplatesByName(@Param("name") String name);

    class CategoryCountRow {
        private String id;
        private String name;
        private int sortOrder;
        private long templateCount;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getSortOrder() {
            return sortOrder;
        }

        public void setSortOrder(int sortOrder) {
            this.sortOrder = sortOrder;
        }

        public long getTemplateCount() {
            return templateCount;
        }

        public void setTemplateCount(long templateCount) {
            this.templateCount = templateCount;
        }
    }
}
