CREATE TABLE IF NOT EXISTS am_leads (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 created_at BIGINT UNSIGNED NOT NULL,
 expires_at BIGINT UNSIGNED NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'Novo',
 ciphertext MEDIUMTEXT NOT NULL,
 iv VARCHAR(32) NOT NULL,
 tag VARCHAR(32) NOT NULL,
 ip_hash CHAR(64) NOT NULL,
 consent_version VARCHAR(64) NOT NULL,
 INDEX am_received (created_at,id),
 INDEX am_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
