-- ============================================================================
-- COMPLETE AUTH FIX - Signup + RLS + Column Names
-- ============================================================================
-- This is a COMBINED fix that handles:
-- 1. Signup errors (handle_new_user trigger)
-- 2. RLS policies (data visibility)
-- 3. Column name migrations (old → new)
-- Run this ONCE to fix everything
-- ============================================================================

-- ============================================================================
-- PART 1: FIX SIGNUP ERROR
-- ============================================================================

-- Make optional fields truly optional
ALTER TABLE patients ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN phone SET DEFAULT '';
ALTER TABLE patients ALTER COLUMN address DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN address SET DEFAULT '';
ALTER TABLE patients ALTER COLUMN age SET DEFAULT 0;

ALTER TABLE doctors ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN phone SET DEFAULT '';
ALTER TABLE doctors ALTER COLUMN experience SET DEFAULT 0;

-- Recreate handle_new_user function with robust error handling
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
  age_val INTEGER;
  exp_val INTEGER;
BEGIN
  -- Get role from metadata, default to 'patient'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  
  -- Validate role
  IF user_role NOT IN ('admin', 'doctor', 'patient') THEN
    user_role := 'patient';
  END IF;

  -- Get name from metadata with fallbacks
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Safely convert age
  BEGIN
    age_val := COALESCE((NEW.raw_user_meta_data->>'age')::INTEGER, 0);
    IF age_val < 0 OR age_val > 120 THEN
      age_val := 0;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    age_val := 0;
  END;

  -- Safely convert experience
  BEGIN
    exp_val := COALESCE((NEW.raw_user_meta_data->>'experience')::INTEGER, 0);
    IF exp_val < 0 OR exp_val > 60 THEN
      exp_val := 0;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    exp_val := 0;
  END;

  -- Create profile
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, user_name, user_role)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  -- Create role-specific record
  IF user_role = 'patient' THEN
    INSERT INTO patients (
      id, phone, age, address, medical_history, 
      emergency_contact, blood_group
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      age_val,
      COALESCE(NEW.raw_user_meta_data->>'address', ''),
      COALESCE(NEW.raw_user_meta_data->>'medicalHistory', ''),
      COALESCE(NEW.raw_user_meta_data->>'emergencyContact', ''),
      NULLIF(NEW.raw_user_meta_data->>'bloodGroup', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = EXCLUDED.phone,
      age = EXCLUDED.age,
      address = EXCLUDED.address,
      updated_at = NOW();

  ELSIF user_role = 'doctor' THEN
    INSERT INTO doctors (
      id, phone, specialization, qualification, 
      experience, license_number, languages
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'specialization', 'General Ayurveda'),
      COALESCE(NEW.raw_user_meta_data->>'qualification', 'BAMS'),
      exp_val,
      NULLIF(NEW.raw_user_meta_data->>'licenseNumber', ''),
      COALESCE((NEW.raw_user_meta_data->>'languages')::TEXT[], ARRAY[]::TEXT[])
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = EXCLUDED.phone,
      specialization = EXCLUDED.specialization,
      updated_at = NOW();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'handle_new_user error: %', SQLERRM;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

RAISE NOTICE '✅ Part 1: Signup error fixed';

-- ============================================================================
-- PART 2: RENAME COLUMNS (Safe Migration)
-- ============================================================================

-- Rename therapy_sessions columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'therapy_sessions' AND column_name = 'date'
  ) THEN
    ALTER TABLE therapy_sessions RENAME COLUMN date TO session_date;
    RAISE NOTICE '✅ Renamed therapy_sessions.date → session_date';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'therapy_sessions' AND column_name = 'time'
  ) THEN
    ALTER TABLE therapy_sessions RENAME COLUMN time TO session_time;
    RAISE NOTICE '✅ Renamed therapy_sessions.time → session_time';
  END IF;
END $$;

-- Rename progress_data columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'progress_data' AND column_name = 'date'
  ) THEN
    ALTER TABLE progress_data RENAME COLUMN date TO record_date;
    RAISE NOTICE '✅ Renamed progress_data.date → record_date';
  END IF;
END $$;

-- Rename notifications columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'date'
  ) THEN
    ALTER TABLE notifications RENAME COLUMN date TO notification_date;
    RAISE NOTICE '✅ Renamed notifications.date → notification_date';
  END IF;
END $$;

-- Rename feedback columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'date'
  ) THEN
    ALTER TABLE feedback RENAME COLUMN date TO feedback_date;
    RAISE NOTICE '✅ Renamed feedback.date → feedback_date';
  END IF;
END $$;

RAISE NOTICE '✅ Part 2: Column names updated';

-- ============================================================================
-- PART 3: ADD RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Enable read for authenticated users" ON profiles;
CREATE POLICY "Enable read for authenticated users" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Enable insert for new users" ON profiles;
CREATE POLICY "Enable insert for new users" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Enable update for users and admins" ON profiles;
CREATE POLICY "Enable update for users and admins" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Patients policies
DROP POLICY IF EXISTS "Enable read for patients, doctors, and admins" ON patients;
CREATE POLICY "Enable read for patients, doctors, and admins" ON patients
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
  );

DROP POLICY IF EXISTS "Enable insert for new patients" ON patients;
CREATE POLICY "Enable insert for new patients" ON patients
  FOR INSERT WITH CHECK (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Enable update for patients and admins" ON patients;
CREATE POLICY "Enable update for patients and admins" ON patients
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Doctors policies
DROP POLICY IF EXISTS "Enable read for everyone authenticated" ON doctors;
CREATE POLICY "Enable read for everyone authenticated" ON doctors
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for admins" ON doctors;
CREATE POLICY "Enable insert for admins" ON doctors
  FOR INSERT WITH CHECK (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Enable update for doctors and admins" ON doctors;
CREATE POLICY "Enable update for doctors and admins" ON doctors
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Therapy sessions policies
DROP POLICY IF EXISTS "Enable read for related users" ON therapy_sessions;
CREATE POLICY "Enable read for related users" ON therapy_sessions
  FOR SELECT USING (
    patient_id = auth.uid() OR
    doctor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Enable insert for admins and doctors" ON therapy_sessions;
CREATE POLICY "Enable insert for admins and doctors" ON therapy_sessions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
  );

DROP POLICY IF EXISTS "Enable update for admins and doctors" ON therapy_sessions;
CREATE POLICY "Enable update for admins and doctors" ON therapy_sessions
  FOR UPDATE USING (
    doctor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Enable delete for admins" ON therapy_sessions;
CREATE POLICY "Enable delete for admins" ON therapy_sessions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Progress data policies
DROP POLICY IF EXISTS "Enable read for patients, doctors, and admins" ON progress_data;
CREATE POLICY "Enable read for patients, doctors, and admins" ON progress_data
  FOR SELECT USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
  );

DROP POLICY IF EXISTS "Enable insert for patients, doctors, and admins" ON progress_data;
CREATE POLICY "Enable insert for patients, doctors, and admins" ON progress_data
  FOR INSERT WITH CHECK (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
  );

DROP POLICY IF EXISTS "Enable update for patients, doctors, and admins" ON progress_data;
CREATE POLICY "Enable update for patients, doctors, and admins" ON progress_data
  FOR UPDATE USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
  );

-- Notifications policies
DROP POLICY IF EXISTS "Enable read for patients and admins" ON notifications;
CREATE POLICY "Enable read for patients and admins" ON notifications
  FOR SELECT USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Enable insert for admins" ON notifications;
CREATE POLICY "Enable insert for admins" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Enable update for patients and admins" ON notifications;
CREATE POLICY "Enable update for patients and admins" ON notifications
  FOR UPDATE USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Feedback policies
DROP POLICY IF EXISTS "Enable read for patients and admins" ON feedback;
CREATE POLICY "Enable read for patients and admins" ON feedback
  FOR SELECT USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Enable insert for patients" ON feedback;
CREATE POLICY "Enable insert for patients" ON feedback
  FOR INSERT WITH CHECK (patient_id = auth.uid());

DROP POLICY IF EXISTS "Enable update for patients and admins" ON feedback;
CREATE POLICY "Enable update for patients and admins" ON feedback
  FOR UPDATE USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

RAISE NOTICE '✅ Part 3: RLS policies created';

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, anon;

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

DO $$
DECLARE
  profile_count INTEGER;
  patient_count INTEGER;
  doctor_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO patient_count FROM patients;
  SELECT COUNT(*) INTO doctor_count FROM doctors;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ COMPLETE AUTH FIX APPLIED SUCCESSFULLY';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Current Data:';
  RAISE NOTICE '  - Profiles: %', profile_count;
  RAISE NOTICE '  - Patients: %', patient_count;
  RAISE NOTICE '  - Doctors: %', doctor_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ What was fixed:';
  RAISE NOTICE '  1. Signup errors - handle_new_user() trigger improved';
  RAISE NOTICE '  2. Column names - date/time renamed to session_date/session_time';
  RAISE NOTICE '  3. RLS policies - proper access control for all roles';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Refresh your app (F5)';
  RAISE NOTICE '  2. Try signing up - should work now!';
  RAISE NOTICE '  3. Try logging in - data should be visible!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Your app is ready to use!';
  RAISE NOTICE '';
END $$;
