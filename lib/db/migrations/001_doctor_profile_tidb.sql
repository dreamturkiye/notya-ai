-- NOTYA AI — Doctor profile & Turkish medical addressing (TiDB/MySQL)
-- Migration: 001_doctor_profile_tidb

ALTER TABLE users ADD COLUMN first_name VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN last_name VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN title VARCHAR(32) NULL;
ALTER TABLE users ADD COLUMN hospital VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN gender VARCHAR(16) NULL;
ALTER TABLE users ADD COLUMN addressing_preference VARCHAR(32) DEFAULT 'named_hocam';
ALTER TABLE users ADD COLUMN onboarding_completed TINYINT(1) DEFAULT 0;
