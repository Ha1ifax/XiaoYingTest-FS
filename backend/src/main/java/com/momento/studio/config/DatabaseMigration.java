package com.momento.studio.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * schema.sql 只负责创建新表；已有数据库需要把后加的字段补上。
 * 这是一个轻量的演示迁移，生产环境应使用 Flyway / Liquibase。
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class DatabaseMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        addColumnIfMissing(
                "app_user",
                "email",
                "ALTER TABLE app_user ADD COLUMN email VARCHAR(190) NULL AFTER role"
        );
        addColumnIfMissing(
                "app_user",
                "password_hash",
                "ALTER TABLE app_user ADD COLUMN password_hash VARCHAR(100) NULL AFTER email"
        );
        addColumnIfMissing(
                "app_user",
                "updated_at",
                "ALTER TABLE app_user ADD COLUMN updated_at DATETIME(3) NOT NULL "
                        + "DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) AFTER created_at"
        );
        addColumnIfMissing(
                "app_user",
                "role_key",
                "ALTER TABLE app_user ADD COLUMN role_key VARCHAR(16) NOT NULL DEFAULT 'MEMBER' AFTER role"
        );
        if (hasColumn("app_user", "is_admin")) {
            int promoted = jdbcTemplate.update("""
                    UPDATE app_user SET role_key = 'ADMIN'
                    WHERE is_admin = TRUE AND role_key = 'MEMBER'
                    """);
            if (promoted > 0) {
                log.info("Migrated {} legacy admin account(s) to role_key=ADMIN", promoted);
            }
        }
        addColumnIfMissing(
                "creative_template",
                "is_active",
                "ALTER TABLE creative_template ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER sort_order"
        );
        addColumnIfMissing(
                "creative_template",
                "updated_at",
                "ALTER TABLE creative_template ADD COLUMN updated_at DATETIME(3) NOT NULL "
                        + "DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) AFTER created_at"
        );
        addColumnIfMissing(
                "creation_task",
                "dispatch_attempts",
                "ALTER TABLE creation_task ADD COLUMN dispatch_attempts INT NOT NULL DEFAULT 0 AFTER simulation_config"
        );
        addColumnIfMissing(
                "creation_task",
                "last_dispatched_at",
                "ALTER TABLE creation_task ADD COLUMN last_dispatched_at DATETIME(3) NULL AFTER dispatch_attempts"
        );
        addColumnIfMissing(
                "creation_task",
                "retry_count",
                "ALTER TABLE creation_task ADD COLUMN retry_count INT NOT NULL DEFAULT 0 AFTER last_dispatched_at"
        );
        addColumnIfMissing(
                "creation_task",
                "last_error",
                "ALTER TABLE creation_task ADD COLUMN last_error VARCHAR(500) NULL AFTER retry_count"
        );
        addEmailIndexIfMissing();
        ensureTemplateCategories();
        log.info("Account and template schema are ready.");
    }

    private void ensureTemplateCategories() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS template_category (
                    id VARCHAR(48) PRIMARY KEY,
                    name VARCHAR(64) NOT NULL,
                    sort_order INT NOT NULL DEFAULT 0,
                    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                    UNIQUE KEY uk_template_category_name (name)
                ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
                """);
        int inserted = jdbcTemplate.update("""
                INSERT IGNORE INTO template_category (id, name, sort_order)
                SELECT CONCAT('cat_', SUBSTRING(SHA2(category, 256), 1, 20)),
                       category,
                       MIN(sort_order)
                FROM creative_template
                GROUP BY category
                """);
        if (inserted > 0) {
            log.info("Backfilled {} template categories from existing templates", inserted);
        }
    }

    private void addColumnIfMissing(String table, String column, String ddl) {
        if (!hasColumn(table, column)) {
            jdbcTemplate.execute(ddl);
            log.info("Added {}.{}", table, column);
        }
    }

    private boolean hasColumn(String table, String column) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class,
                table,
                column
        );
        return count != null && count > 0;
    }

    private void addEmailIndexIfMissing() {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.STATISTICS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_user' AND INDEX_NAME = 'uk_user_email'",
                Integer.class
        );
        if (count != null && count == 0) {
            jdbcTemplate.execute("ALTER TABLE app_user ADD UNIQUE KEY uk_user_email (email)");
            log.info("Added unique index app_user.uk_user_email");
        }
    }
}
