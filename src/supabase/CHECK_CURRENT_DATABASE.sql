-- ============================================================================
-- DATABASE DIAGNOSTIC - Check what you currently have
-- ============================================================================
-- Run this first to see the current state of your database
-- ============================================================================

-- Check if tables exist
SELECT 
    'TABLE EXISTS: ' || table_name as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'patients', 'doctors', 'therapy_sessions', 'progress_data', 'notifications', 'feedback')
ORDER BY table_name;

-- Check therapy_sessions columns
SELECT 
    'therapy_sessions column: ' || column_name || ' (' || data_type || ')' as column_info
FROM information_schema.columns 
WHERE table_name = 'therapy_sessions'
ORDER BY ordinal_position;

-- Check progress_data columns
SELECT 
    'progress_data column: ' || column_name || ' (' || data_type || ')' as column_info
FROM information_schema.columns 
WHERE table_name = 'progress_data'
ORDER BY ordinal_position;

-- Check notifications columns
SELECT 
    'notifications column: ' || column_name || ' (' || data_type || ')' as column_info
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Check feedback columns
SELECT 
    'feedback column: ' || column_name || ' (' || data_type || ')' as column_info
FROM information_schema.columns 
WHERE table_name = 'feedback'
ORDER BY ordinal_position;

-- Check if trigger exists
SELECT 
    'TRIGGER EXISTS: ' || trigger_name as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if functions exist
SELECT 
    'FUNCTION EXISTS: ' || routine_name as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('handle_new_user', 'is_admin', 'is_doctor_or_admin', 'validate_age', 'validate_experience')
ORDER BY routine_name;

-- ============================================================================
-- INTERPRETATION GUIDE:
-- ============================================================================
-- 
-- If you see "therapy_sessions column: date":
--   → Your database uses OLD column names
--   → Use APPROACH 1 or 3 from SIMPLE_2_STEP_FIX.md
--
-- If you see "therapy_sessions column: session_date":
--   → Your database uses NEW column names
--   → Just run PRODUCTION_SCHEMA_FINAL.sql
--
-- If you see NO tables:
--   → Fresh database
--   → Use APPROACH 2 from SIMPLE_2_STEP_FIX.md
--
-- ============================================================================
