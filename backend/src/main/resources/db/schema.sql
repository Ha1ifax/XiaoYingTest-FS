SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS app_user (
    id VARCHAR(32) PRIMARY KEY,
    display_name VARCHAR(64) NOT NULL,
    initials VARCHAR(8) NOT NULL,
    role VARCHAR(64) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    email VARCHAR(190) NULL,
    password_hash VARCHAR(100) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_user_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_session (
    token_hash CHAR(64) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    created_at DATETIME(3) NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    last_seen_at DATETIME(3) NOT NULL,
    INDEX idx_session_user (user_id, expires_at),
    INDEX idx_session_expiry (expires_at),
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES app_user (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS template_category (
    id VARCHAR(48) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_template_category_name (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS creative_template (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description VARCHAR(500) NOT NULL,
    cover_url VARCHAR(255) NOT NULL,
    accent_color VARCHAR(16) NOT NULL,
    required_image_count INT NOT NULL,
    accepted_mime_types VARCHAR(255) NOT NULL,
    max_file_size_bytes BIGINT NOT NULL,
    result_label VARCHAR(80) NOT NULL,
    detail_note VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS uploaded_asset (
    id VARCHAR(48) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    template_id VARCHAR(64) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(64) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(500) NOT NULL,
    created_at DATETIME(3) NOT NULL,
    INDEX idx_asset_user (user_id, created_at),
    CONSTRAINT fk_asset_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_asset_template FOREIGN KEY (template_id) REFERENCES creative_template (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS creation_task (
    id VARCHAR(48) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    template_id VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL,
    current_stage VARCHAR(30) NULL,
    failure_stage VARCHAR(30) NULL,
    failure_reason VARCHAR(500) NULL,
    result_url VARCHAR(500) NULL,
    simulation_config TEXT NOT NULL,
    created_at DATETIME(3) NOT NULL,
    started_at DATETIME(3) NULL,
    finished_at DATETIME(3) NULL,
    updated_at DATETIME(3) NOT NULL,
    INDEX idx_task_user_created (user_id, created_at),
    INDEX idx_task_status (status),
    CONSTRAINT fk_task_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_task_template FOREIGN KEY (template_id) REFERENCES creative_template (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS task_asset (
    task_id VARCHAR(48) NOT NULL,
    asset_id VARCHAR(48) NOT NULL,
    sort_order INT NOT NULL,
    PRIMARY KEY (task_id, asset_id),
    UNIQUE KEY uk_task_asset_order (task_id, sort_order),
    CONSTRAINT fk_task_asset_task FOREIGN KEY (task_id) REFERENCES creation_task (id) ON DELETE CASCADE,
    CONSTRAINT fk_task_asset_asset FOREIGN KEY (asset_id) REFERENCES uploaded_asset (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS task_step (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(48) NOT NULL,
    stage VARCHAR(30) NOT NULL,
    stage_order INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    detail VARCHAR(500) NULL,
    started_at DATETIME(3) NULL,
    finished_at DATETIME(3) NULL,
    UNIQUE KEY uk_task_stage (task_id, stage),
    CONSTRAINT fk_step_task FOREIGN KEY (task_id) REFERENCES creation_task (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
