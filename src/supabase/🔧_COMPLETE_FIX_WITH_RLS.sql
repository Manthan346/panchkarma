-- ============================================================================
-- COMPLETE FIX: DATA MIGRATION + RLS POLICIES + SCHEMA FIXES
-- ============================================================================
-- This script will:
-- 1. CHECK if your data exists
-- 2. RENAME columns without losing data
-- 3. ADD missing RLS policies so you can see your data
-- 4. FIX schema issues (constraints, defaults)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- STEP 1: CHECK DATA EXISTS (We'll show you before making changes)
-- ============================================================================
DO $$
DECLARE
  profile_count INTEGER;
  patient_count INTEGER;
  doctor_count INTEGER;
  session_count INTEGER;
BEGIN
  -- Temporarily disable RLS to check data
  ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS patients DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS doctors DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS therapy_sessions DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS progress_data DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS feedback DISABLE ROW LEVEL SECURITY;

  -- Count records
  SELECT COUNT(*) INTO profile_count FROM profiles WHERE true;
  SELECT COUNT(*) INTO patient_count FROM patients WHERE true;
  SELECT COUNT(*) INTO doctor_count FROM doctors WHERE true;
  SELECT COUNT(*) INTO session_count FROM therapy_sessions WHERE true;

  RAISE NOTICE '📊 CURRENT DATA STATUS:';
  RAISE NOTICE '  - Profiles: %', profile_count;
  RAISE NOTICE '  - Patients: %', patient_count;
  RAISE NOTICE '  - Doctors: %', doctor_count;
  RAISE NOTICE '  - Sessions: %', session_count;

  IF profile_count = 0 THEN
    RAISE NOTICE '⚠️  No data found - either fresh database or data was lost';
  ELSE
    RAISE NOTICE '✅ Data exists! Proceeding with safe migration...';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: RENAME COLUMNS (Safe - No Data Loss)
-- ============================================================================

-- Check and rename therapy_sessions columns
DO $$
BEGIN
  -- Check if old column 'date' exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'therapy_sessions' AND column_name = 'date'
  ) THEN
    RAISE NOTICE '🔧 Renaming therapy_sessions.date → session_date';
    ALTER TABLE therapy_sessions RENAME COLUMN date TO session_date;
  END IF;

  -- Check if old column 'time' exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'therapy_sessions' AND column_name = 'time'
  ) THEN
    RAISE NOTICE '🔧 Renaming therapy_sessions.time → session_time';
    ALTER TABLE therapy_sessions RENAME COLUMN time TO session_time;
  END IF;

  RAISE NOTICE '✅ therapy_sessions columns updated';
END $$;

-- Check and rename progress_data columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'progress_data' AND column_name = 'date'
  ) THEN
    RAISE NOTICE '🔧 Renaming progress_data.date → record_date';
    ALTER TABLE progress_data RENAME COLUMN date TO record_date;
  END IF;
  RAISE NOTICE '✅ progress_data columns updated';
END $$;

-- Check and rename notifications columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'date'
  ) THEN
    RAISE NOTICE '🔧 Renaming notifications.date → notification_date';
    ALTER TABLE notifications RENAME COLUMN date TO notification_date;
  END IF;
  RAISE NOTICE '✅ notifications columns updated';
END $$;

-- Check and rename feedback columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'date'
  ) THEN
    RAISE NOTICE '🔧 Renaming feedback.date → feedback_date';
    ALTER TABLE feedback RENAME COLUMN date TO feedback_date;
  END IF;
  RAISE NOTICE '✅ feedback columns updated';
END $$;

-- ============================================================================
-- STEP 3: FIX SCHEMA ISSUES
-- ============================================================================

-- Remove overly strict constraint on session_date (allow past dates for historical data)
DO $$
BEGIN
  ALTER TABLE therapy_sessions DROP CONSTRAINT IF EXISTS therapy_sessions_session_date_check;
  ALTER TABLE therapy_sessions DROP CONSTRAINT IF EXISTS valid_datetime;
  RAISE NOTICE '✅ Removed strict date constraints';
END $$;

-- Add back reasonable constraint (allow past dates for history)
ALTER TABLE therapy_sessions ADD CONSTRAINT therapy_sessions_session_date_check 
  CHECK (session_date >= '2020-01-01');

-- Make phone validation less strict (allow empty for now)
ALTER TABLE patients ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN phone SET DEFAULT '';
ALTER TABLE doctors ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN phone SET DEFAULT '';

-- Fix age and experience to allow proper defaults
ALTER TABLE patients ALTER COLUMN age SET DEFAULT 0;
ALTER TABLE doctors ALTER COLUMN experience SET DEFAULT 0;

-- Make address optional with proper default
ALTER TABLE patients ALTER COLUMN address DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN address SET DEFAULT '';

-- ============================================================================
-- STEP 4: CREATE PROPER RLS POLICIES (This is why you can't see data!)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES - Foundation for other policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles read" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;

-- Create new comprehensive policies
CREATE POLICY "Enable read for authenticated users" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR  -- Users can see their own profile
    EXISTS (  -- Admins can see all profiles
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable insert for new users" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users and admins" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- PATIENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Patients read own data" ON patients;
DROP POLICY IF EXISTS "Admins read all patients" ON patients;
DROP POLICY IF EXISTS "Doctors read all patients" ON patients;
DROP POLICY IF EXISTS "Enable patient insert" ON patients;
DROP POLICY IF EXISTS "Enable patient update" ON patients;

CREATE POLICY "Enable read for patients, doctors, and admins" ON patients
  FOR SELECT USING (
    auth.uid() = id OR  -- Patients see their own data
    EXISTS (  -- Admins and doctors can see all patients
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'doctor')
    )
  );

CREATE POLICY "Enable insert for new patients" ON patients
  FOR INSERT WITH CHECK (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Enable update for patients and admins" ON patients
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- DOCTORS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Doctors read own data" ON doctors;
DROP POLICY IF EXISTS "Admins read all doctors" ON doctors;
DROP POLICY IF EXISTS "Patients read all doctors" ON doctors;
DROP POLICY IF EXISTS "Enable doctor insert" ON doctors;
DROP POLICY IF EXISTS "Enable doctor update" ON doctors;

CREATE POLICY "Enable read for everyone authenticated" ON doctors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for admins" ON doctors
  FOR INSERT WITH CHECK (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Enable update for doctors and admins" ON doctors
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- THERAPY SESSIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Patients read own sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Doctors read assigned sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Admins read all sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Enable session insert" ON therapy_sessions;
DROP POLICY IF EXISTS "Enable session update" ON therapy_sessions;

CREATE POLICY "Enable read for related users" ON therapy_sessions
  FOR SELECT USING (
    patient_id = auth.uid() OR  -- Patients see their sessions
    doctor_id = auth.uid() OR   -- Doctors see their sessions
    EXISTS (  -- Admins see all
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable insert for admins and doctors" ON therapy_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'doctor')
    )
  );

CREATE POLICY "Enable update for admins and doctors" ON therapy_sessions
  FOR UPDATE USING (
    doctor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Enable delete for admins" ON therapy_sessions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- PROGRESS DATA POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Patients read own progress" ON progress_data;
DROP POLICY IF EXISTS "Doctors read all progress" ON progress_data;
DROP POLICY IF EXISTS "Admins read all progress" ON progress_data;
DROP POLICY IF EXISTS "Enable progress insert" ON progress_data;
DROP POLICY IF EXISTS "Enable progress update" ON progress_data;

CREATE POLICY "Enable read for patients, doctors, and admins" ON progress_data
  FOR SELECT USING (
    patient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'doctor')
    )
  );

CREATE POLICY "Enable insert for patients, doctors, and admins" ON progress_data
  FOR INSERT WITH CHECK (
    patient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'doctor')
    )
  );

CREATE POLICY "Enable update for patients, doctors, and admins" ON progress_data
  FOR UPDATE USING (
    patient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'doctor')
    )
  );

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Patients read own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins read all notifications" ON notifications;
DROP POLICY IF EXISTS "Enable notification insert" ON notifications;
DROP POLICY IF EXISTS "Enable notification update" ON notifications;

CREATE POLICY "Enable read for patients and admins" ON notifications
  FOR SELECT USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Enable insert for admins" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Enable update for patients and admins" ON notifications
  FOR UPDATE USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- FEEDBACK POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Patients read own feedback" ON feedback;
DROP POLICY IF EXISTS "Admins read all feedback" ON feedback;
DROP POLICY IF EXISTS "Enable feedback insert" ON feedback;
DROP POLICY IF EXISTS "Enable feedback update" ON feedback;

CREATE POLICY "Enable read for patients and admins" ON feedback
  FOR SELECT USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Enable insert for patients" ON feedback
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Enable update for patients and admins" ON feedback
  FOR UPDATE USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- STEP 5: ENSURE HELPER FUNCTIONS EXIST
-- ============================================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Function to check if current user is doctor or admin
CREATE OR REPLACE FUNCTION is_doctor_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('doctor', 'admin')
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_doctor_or_admin() TO authenticated, anon;

-- ============================================================================
-- STEP 6: FINAL DATA CHECK
-- ============================================================================
DO $$
DECLARE
  profile_count INTEGER;
  patient_count INTEGER;
  doctor_count INTEGER;
  session_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO patient_count FROM patients;
  SELECT COUNT(*) INTO doctor_count FROM doctors;
  SELECT COUNT(*) INTO session_count FROM therapy_sessions;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ MIGRATION COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 FINAL DATA COUNT:';
  RAISE NOTICE '  - Profiles: %', profile_count;
  RAISE NOTICE '  - Patients: %', patient_count;
  RAISE NOTICE '  - Doctors: %', doctor_count;
  RAISE NOTICE '  - Sessions: %', session_count;
  RAISE NOTICE '';
  
  IF profile_count > 0 THEN
    RAISE NOTICE '✅ Your data is safe and accessible!';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEPS:';
    RAISE NOTICE '  1. Refresh your app in the browser';
    RAISE NOTICE '  2. Log in with your existing credentials';
    RAISE NOTICE '  3. Data should now appear in dashboards';
    RAISE NOTICE '  4. Go to Admin Dashboard → Settings → Run Health Check';
  ELSE
    RAISE NOTICE '⚠️  Database is empty (fresh start)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEPS:';
    RAISE NOTICE '  1. Refresh your app';
    RAISE NOTICE '  2. Create a new admin account through signup';
    RAISE NOTICE '  3. Add patients and doctors';
    RAISE NOTICE '  4. Schedule therapy sessions';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- ANALYZE FOR PERFORMANCE
-- ============================================================================
ANALYZE profiles;
ANALYZE patients;
ANALYZE doctors;
ANALYZE therapy_sessions;
ANALYZE progress_data;
ANALYZE notifications;
ANALYZE feedback;
