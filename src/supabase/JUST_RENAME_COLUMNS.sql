-- ============================================================================
-- SIMPLE COLUMN RENAME - Just fix the column names, nothing else
-- ============================================================================
-- This ONLY renames columns. No table creation, no functions, nothing else.
-- Run this FIRST, then run your existing schema if needed.
-- ============================================================================

-- Rename therapy_sessions columns
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'date') THEN
        ALTER TABLE therapy_sessions RENAME COLUMN date TO session_date;
        RAISE NOTICE '✅ Renamed therapy_sessions.date → session_date';
    ELSE
        RAISE NOTICE '⚠️  therapy_sessions.date does not exist (already renamed or table does not exist)';
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'time') THEN
        ALTER TABLE therapy_sessions RENAME COLUMN time TO session_time;
        RAISE NOTICE '✅ Renamed therapy_sessions.time → session_time';
    ELSE
        RAISE NOTICE '⚠️  therapy_sessions.time does not exist (already renamed or table does not exist)';
    END IF;
END $$;

-- Rename progress_data columns
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'progress_data' AND column_name = 'date') THEN
        ALTER TABLE progress_data RENAME COLUMN date TO record_date;
        RAISE NOTICE '✅ Renamed progress_data.date → record_date';
    ELSE
        RAISE NOTICE '⚠️  progress_data.date does not exist (already renamed or table does not exist)';
    END IF;
END $$;

-- Rename notifications columns
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'date') THEN
        ALTER TABLE notifications RENAME COLUMN date TO notification_date;
        RAISE NOTICE '✅ Renamed notifications.date → notification_date';
    ELSE
        RAISE NOTICE '⚠️  notifications.date does not exist (already renamed or table does not exist)';
    END IF;
END $$;

-- Rename feedback columns
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'date') THEN
        ALTER TABLE feedback RENAME COLUMN date TO feedback_date;
        RAISE NOTICE '✅ Renamed feedback.date → feedback_date';
    ELSE
        RAISE NOTICE '⚠️  feedback.date does not exist (already renamed or table does not exist)';
    END IF;
END $$;

-- Update indexes to match new column names
DROP INDEX IF EXISTS idx_therapy_sessions_date;
DROP INDEX IF EXISTS idx_therapy_sessions_doctor_date;
DROP INDEX IF EXISTS idx_progress_data_date;
DROP INDEX IF EXISTS idx_notifications_date;

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_date ON therapy_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_doctor_date ON therapy_sessions(doctor_id, session_date);
CREATE INDEX IF NOT EXISTS idx_progress_data_date ON progress_data(record_date);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(notification_date);

-- ============================================================================
-- DONE! 🎉
-- ============================================================================

SELECT 'Column rename complete! Check the notices above for results.' as status;
