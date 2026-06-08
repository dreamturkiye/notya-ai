-- ============================================================
-- Migration 001: Doctor Profile (Hocam) — TiDB / MySQL
-- ============================================================

ALTER TABLE users ADD COLUMN first_name VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN last_name VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN title ENUM('Dr.', 'Uzm. Dr.', 'Doç. Dr.', 'Prof. Dr.') NULL;
ALTER TABLE users ADD COLUMN hospital VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN gender ENUM('male', 'female') NULL;
ALTER TABLE users ADD COLUMN addressing_preference ENUM('hocam', 'named_hocam', 'first_name_only') DEFAULT 'named_hocam';
ALTER TABLE users ADD COLUMN onboarding_completed TINYINT(1) DEFAULT 0;

-- Backfill from existing full_name where possible
UPDATE users
SET
  first_name = COALESCE(first_name, SUBSTRING_INDEX(full_name, ' ', 1)),
  last_name = COALESCE(last_name, NULLIF(TRIM(SUBSTRING(full_name, LOCATE(' ', full_name) + 1)), '')),
  hospital = COALESCE(hospital, clinic_name)
WHERE full_name IS NOT NULL AND first_name IS NULL;
