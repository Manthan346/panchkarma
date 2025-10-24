-- ============================================================================
-- COLUMN RENAME MIGRATION - Safe Migration for Existing Database
-- ============================================================================
-- This script safely renames columns from old names to new names
-- Run this FIRST before running the full schema
-- ============================================================================

-- Step 1: Rename columns in therapy_sessions if they exist with old names
DO $$ 
BEGIN
    -- Check if 'date' column exists and rename to 'session_date'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapy_sessions' AND column_name = 'date'
    ) THEN
        ALTER TABLE therapy_sessions RENAME COLUMN date TO session_date;
        RAISE NOTICE 'Renamed therapy_sessions.date to session_date';
    END IF;

    -- Check if 'time' column exists and rename to 'session_time'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapy_sessions' AND column_name = 'time'
    ) THEN
        ALTER TABLE therapy_sessions RENAME COLUMN time TO session_time;
        RAISE NOTICE 'Renamed therapy_sessions.time to session_time';
    END IF;
END $$;

-- Step 2: Rename columns in progress_data if they exist with old names
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'progress_data' AND column_name = 'date'
    ) THEN
        ALTER TABLE progress_data RENAME COLUMN date TO record_date;
        RAISE NOTICE 'Renamed progress_data.date to record_date';
    END IF;
END $$;

-- Step 3: Rename columns in notifications if they exist with old names
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'date'
    ) THEN
        ALTER TABLE notifications RENAME COLUMN date TO notification_date;
        RAISE NOTICE 'Renamed notifications.date to notification_date';
    END IF;
END $$;

-- Step 4: Rename columns in feedback if they exist with old names
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feedback' AND column_name = 'date'
    ) THEN
        ALTER TABLE feedback RENAME COLUMN date TO feedback_date;
        RAISE NOTICE 'Renamed feedback.date to feedback_date';
    END IF;
END $$;

-- Step 5: Update indexes to use new column names
DROP INDEX IF EXISTS idx_therapy_sessions_date;
DROP INDEX IF EXISTS idx_therapy_sessions_doctor_date;
DROP INDEX IF EXISTS idx_progress_data_date;
DROP INDEX IF EXISTS idx_notifications_date;

-- Recreate indexes with new column names
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_date ON therapy_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_doctor_date ON therapy_sessions(doctor_id, session_date);
CREATE INDEX IF NOT EXISTS idx_progress_data_date ON progress_data(record_date);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(notification_date);

-- Step 6: Verify the migration
DO $$
DECLARE
    v_result TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION VERIFICATION';
    RAISE NOTICE '========================================';
    
    -- Check therapy_sessions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'session_date') THEN
        RAISE NOTICE '✅ therapy_sessions.session_date EXISTS';
    ELSE
        RAISE WARNING '❌ therapy_sessions.session_date MISSING';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'session_time') THEN
        RAISE NOTICE '✅ therapy_sessions.session_time EXISTS';
    ELSE
        RAISE WARNING '❌ therapy_sessions.session_time MISSING';
    END IF;
    
    -- Check progress_data
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'progress_data' AND column_name = 'record_date') THEN
        RAISE NOTICE '✅ progress_data.record_date EXISTS';
    ELSE
        RAISE WARNING '❌ progress_data.record_date MISSING';
    END IF;
    
    -- Check notifications
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'notification_date') THEN
        RAISE NOTICE '✅ notifications.notification_date EXISTS';
    ELSE
        RAISE WARNING '❌ notifications.notification_date MISSING';
    END IF;
    
    -- Check feedback
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'feedback_date') THEN
        RAISE NOTICE '✅ feedback.feedback_date EXISTS';
    ELSE
        RAISE WARNING '❌ feedback.feedback_date MISSING';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION COMPLETE!';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
-- After running this migration successfully:
-- 1. Check the output for all ✅ checkmarks
-- 2. If you see any ❌, the tables don't exist yet (that's OK)
-- 3. Now run PRODUCTION_SCHEMA_FINAL.sql (the version without column renames)
-- 4. Your application code is already updated to handle both old and new names
-- ============================================================================
