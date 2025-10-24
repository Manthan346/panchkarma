-- ============================================================================
-- EMERGENCY DATABASE FIX
-- ============================================================================
-- This script will:
-- 1. Check current database state
-- 2. Fix column names if needed
-- 3. Temporarily disable RLS to check for data
-- ============================================================================

-- STEP 1: Check what we have
DO $$
BEGIN
  RAISE NOTICE '=== CHECKING DATABASE STATE ===';
END $$;

-- Check if tables exist
SELECT 
    '✓ Table exists: ' || table_name as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'patients', 'doctors', 'therapy_sessions', 'progress_data', 'notifications', 'feedback')
ORDER BY table_name;

-- Check data counts (this will fail if RLS is enabled and blocking)
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'patient') as patients,
  (SELECT COUNT(*) FROM profiles WHERE role = 'doctor') as doctors,
  (SELECT COUNT(*) FROM therapy_sessions) as sessions,
  (SELECT COUNT(*) FROM notifications) as notifications;

-- STEP 2: Check therapy_sessions columns
DO $$
DECLARE
  has_old_columns BOOLEAN;
  has_new_columns BOOLEAN;
BEGIN
  -- Check if old column 'date' exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'therapy_sessions' AND column_name = 'date'
  ) INTO has_old_columns;

  -- Check if new column 'session_date' exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'therapy_sessions' AND column_name = 'session_date'
  ) INTO has_new_columns;

  IF has_old_columns AND NOT has_new_columns THEN
    RAISE NOTICE '🔧 FOUND OLD COLUMN NAMES - RENAMING NOW...';
    
    -- Rename therapy_sessions columns
    ALTER TABLE therapy_sessions RENAME COLUMN date TO session_date;
    ALTER TABLE therapy_sessions RENAME COLUMN time TO session_time;
    RAISE NOTICE '✅ Renamed therapy_sessions.date → session_date';
    RAISE NOTICE '✅ Renamed therapy_sessions.time → session_time';
    
    -- Rename progress_data column
    ALTER TABLE progress_data RENAME COLUMN date TO record_date;
    RAISE NOTICE '✅ Renamed progress_data.date → record_date';
    
    -- Rename notifications column
    ALTER TABLE notifications RENAME COLUMN date TO notification_date;
    RAISE NOTICE '✅ Renamed notifications.date → notification_date';
    
    -- Rename feedback column if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'feedback' AND column_name = 'date'
    ) THEN
      ALTER TABLE feedback RENAME COLUMN date TO feedback_date;
      RAISE NOTICE '✅ Renamed feedback.date → feedback_date';
    END IF;
    
  ELSIF has_new_columns THEN
    RAISE NOTICE '✅ Database already has correct column names';
  ELSE
    RAISE NOTICE '❌ therapy_sessions table not found or has no date columns';
  END IF;
END $$;

-- STEP 3: Check RLS status
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS ENABLED' 
    ELSE '🔓 RLS DISABLED' 
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'patients', 'doctors', 'therapy_sessions', 'progress_data', 'notifications', 'feedback')
ORDER BY tablename;

-- STEP 4: Final check - show data counts
DO $$
BEGIN
  RAISE NOTICE '=== FINAL DATA COUNT ===';
END $$;

SELECT 
  'Patients: ' || COUNT(*) as count FROM profiles WHERE role = 'patient'
UNION ALL
SELECT 
  'Doctors: ' || COUNT(*) FROM profiles WHERE role = 'doctor'
UNION ALL
SELECT 
  'Sessions: ' || COUNT(*) FROM therapy_sessions
UNION ALL
SELECT 
  'Progress: ' || COUNT(*) FROM progress_data
UNION ALL
SELECT 
  'Notifications: ' || COUNT(*) FROM notifications
UNION ALL
SELECT 
  'Feedback: ' || COUNT(*) FROM feedback;

-- ============================================================================
-- INSTRUCTIONS:
-- ============================================================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Check the output messages
-- 3. If you see "RLS ENABLED" and zero counts, RLS is blocking access
-- 4. If columns were renamed, refresh your app - it should work now
-- ============================================================================
