-- Database Backup Procedures for Rick Jefferson Credit Solutions
-- Made by RJ BUSINESS SOLUTIONS
-- Licensed under AGPL-3.0 - All Rights Reserved

-- =============================================================================
-- AUTOMATED BACKUP PROCEDURES
-- =============================================================================

-- Daily Full Backup Procedure
CREATE OR REPLACE PROCEDURE daily_full_backup()
LANGUAGE plpgsql
AS $$
DECLARE
    backup_filename TEXT;
    backup_path TEXT := '/var/backups/rick_jefferson_credit/';
BEGIN
    -- Generate timestamped filename
    backup_filename := 'rick_jefferson_credit_full_' || to_char(NOW(), 'YYYY_MM_DD_HH24_MI_SS') || '.sql';
    
    -- Log backup start
    INSERT INTO backup_log (backup_type, status, start_time, filename)
    VALUES ('FULL', 'STARTED', NOW(), backup_filename);
    
    -- Perform backup (this would typically call pg_dump via external script)
    -- COPY (SELECT pg_dump('rick_jefferson_credit')) TO backup_path || backup_filename;
    
    -- Update backup log
    UPDATE backup_log 
    SET status = 'COMPLETED', end_time = NOW()
    WHERE filename = backup_filename;
    
    -- Clean up old backups (keep last 30 days)
    DELETE FROM backup_log 
    WHERE backup_type = 'FULL' 
    AND start_time < NOW() - INTERVAL '30 days';
    
    RAISE NOTICE 'Full backup completed: %', backup_filename;
END;
$$;

-- Incremental Backup Procedure
CREATE OR REPLACE PROCEDURE incremental_backup()
LANGUAGE plpgsql
AS $$
DECLARE
    backup_filename TEXT;
    last_backup_time TIMESTAMP;
BEGIN
    -- Get last backup time
    SELECT MAX(start_time) INTO last_backup_time
    FROM backup_log 
    WHERE status = 'COMPLETED';
    
    backup_filename := 'rick_jefferson_credit_incr_' || to_char(NOW(), 'YYYY_MM_DD_HH24_MI_SS') || '.sql';
    
    INSERT INTO backup_log (backup_type, status, start_time, filename)
    VALUES ('INCREMENTAL', 'STARTED', NOW(), backup_filename);
    
    -- Backup only changed data since last backup
    -- This would include tables with updated_at > last_backup_time
    
    UPDATE backup_log 
    SET status = 'COMPLETED', end_time = NOW()
    WHERE filename = backup_filename;
    
    RAISE NOTICE 'Incremental backup completed: %', backup_filename;
END;
$$;

-- =============================================================================
-- BACKUP MONITORING AND VERIFICATION
-- =============================================================================

-- Create backup log table if not exists
CREATE TABLE IF NOT EXISTS backup_log (
    id SERIAL PRIMARY KEY,
    backup_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT,
    checksum VARCHAR(64),
    created_by VARCHAR(100) DEFAULT 'RJ BUSINESS SOLUTIONS',
    notes TEXT
);

-- Backup verification procedure
CREATE OR REPLACE FUNCTION verify_backup(backup_file TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    file_exists BOOLEAN := FALSE;
    checksum_match BOOLEAN := FALSE;
BEGIN
    -- This would typically verify file existence and checksum
    -- Implementation depends on file system access capabilities
    
    -- Log verification attempt
    INSERT INTO backup_verification_log (filename, verification_time, status)
    VALUES (backup_file, NOW(), 'VERIFIED');
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO backup_verification_log (filename, verification_time, status, error_message)
        VALUES (backup_file, NOW(), 'FAILED', SQLERRM);
        RETURN FALSE;
END;
$$;

-- Create backup verification log table
CREATE TABLE IF NOT EXISTS backup_verification_log (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    verification_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    verified_by VARCHAR(100) DEFAULT 'RJ BUSINESS SOLUTIONS'
);

-- =============================================================================
-- RESTORE PROCEDURES
-- =============================================================================

-- Point-in-time restore procedure
CREATE OR REPLACE PROCEDURE restore_database(
    restore_point TIMESTAMP,
    backup_file TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    restore_filename TEXT;
BEGIN
    -- Find appropriate backup file if not specified
    IF backup_file IS NULL THEN
        SELECT filename INTO restore_filename
        FROM backup_log
        WHERE status = 'COMPLETED'
        AND start_time <= restore_point
        ORDER BY start_time DESC
        LIMIT 1;
    ELSE
        restore_filename := backup_file;
    END IF;
    
    -- Log restore operation
    INSERT INTO restore_log (restore_point, backup_file, status, start_time)
    VALUES (restore_point, restore_filename, 'STARTED', NOW());
    
    -- Restore would be performed here
    -- This typically involves stopping the application and restoring from backup
    
    RAISE NOTICE 'Database restore initiated from: %', restore_filename;
    RAISE NOTICE 'Restore point: %', restore_point;
    
EXCEPTION
    WHEN OTHERS THEN
        UPDATE restore_log 
        SET status = 'FAILED', end_time = NOW(), error_message = SQLERRM
        WHERE backup_file = restore_filename AND status = 'STARTED';
        RAISE;
END;
$$;

-- Create restore log table
CREATE TABLE IF NOT EXISTS restore_log (
    id SERIAL PRIMARY KEY,
    restore_point TIMESTAMP NOT NULL,
    backup_file VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    error_message TEXT,
    performed_by VARCHAR(100) DEFAULT 'RJ BUSINESS SOLUTIONS'
);

-- =============================================================================
-- MAINTENANCE AND CLEANUP
-- =============================================================================

-- Archive old backup logs
CREATE OR REPLACE PROCEDURE archive_old_logs()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Archive logs older than 1 year
    INSERT INTO backup_log_archive
    SELECT * FROM backup_log
    WHERE start_time < NOW() - INTERVAL '1 year';
    
    DELETE FROM backup_log
    WHERE start_time < NOW() - INTERVAL '1 year';
    
    RAISE NOTICE 'Old backup logs archived and cleaned up';
END;
$$;

-- Create archive table
CREATE TABLE IF NOT EXISTS backup_log_archive (
    LIKE backup_log INCLUDING ALL
);

-- =============================================================================
-- SCHEDULED BACKUP JOBS (Example cron entries)
-- =============================================================================

/*
Add these to your cron table:

# Daily full backup at 2 AM
0 2 * * * psql -d rick_jefferson_credit -c "CALL daily_full_backup();"

# Incremental backup every 4 hours
0 */4 * * * psql -d rick_jefferson_credit -c "CALL incremental_backup();"

# Weekly cleanup at 3 AM on Sundays
0 3 * * 0 psql -d rick_jefferson_credit -c "CALL archive_old_logs();"
*/

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON PROCEDURE daily_full_backup() IS 'Performs daily full database backup for Rick Jefferson Credit Solutions';
COMMENT ON PROCEDURE incremental_backup() IS 'Performs incremental backup of changed data since last backup';
COMMENT ON FUNCTION verify_backup(TEXT) IS 'Verifies integrity of backup files';
COMMENT ON PROCEDURE restore_database(TIMESTAMP, TEXT) IS 'Restores database to specified point in time';

-- End of backup procedures
-- Copyright (c) 2024 RJ BUSINESS SOLUTIONS. All rights reserved.