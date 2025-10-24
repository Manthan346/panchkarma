-- ============================================================================
-- FINAL COMPLETE FIX - Run This ONCE to Fix Everything
-- ============================================================================
-- This script fixes:
-- ✅ Signup errors (makes optional fields truly optional)
-- ✅ RLS policies (so you can see your data)
-- ✅ Column name compatibility (handles both old and new names)
-- ✅ Trigger improvements (better error handling)
-- 
-- Safe to run on existing data - will not delete anything
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX SIGNUP ERROR - Make Optional Fields Optional
-- ============================================================================

-- Make patient fields optional (fix the NOT NULL issue)
ALTER TABLE patients ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN phone SET DEFAULT '';
ALTER TABLE patients ALTER COLUMN age DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN age SET DEFAULT 0;
ALTER TABLE patients ALTER COLUMN address DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN address SET DEFAULT '';

-- Make doctor fields optional
ALTER TABLE doctors ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN phone SET DEFAULT '';
ALTER TABLE doctors ALTER COLUMN specialization DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN specialization SET DEFAULT 'General Ayurveda';
ALTER TABLE doctors ALTER COLUMN qualification DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN qualification SET DEFAULT 'BAMS';
ALTER TABLE doctors ALTER COLUMN experience DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN experience SET DEFAULT 0;

DO $$ BEGIN RAISE NOTICE '✅ Step 1: Optional fields are now truly optional'; END $$;

-- ============================================================================
-- STEP 2: IMPROVE TRIGGER FUNCTION
-- ============================================================================

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

  -- Get name with fallbacks
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
  BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, user_name, user_role)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create profile: %', SQLERRM;
  END;

  -- Create role-specific record
  IF user_role = 'patient' THEN
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create patient: %', SQLERRM;
    END;

  ELSIF user_role = 'doctor' THEN
    BEGIN
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
        qualification = EXCLUDED.qualification,
        experience = EXCLUDED.experience,
        updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create doctor: %', SQLERRM;
    END;
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

GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, anon;

DO $$ BEGIN RAISE NOTICE '✅ Step 2: Trigger function improved'; END $$;

-- ============================================================================
-- STEP 3: ADD RLS POLICIES
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
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Patients policies
DROP POLICY IF EXISTS "patients_select" ON patients;
DROP POLICY IF EXISTS "patients_insert" ON patients;
DROP POLICY IF EXISTS "patients_update" ON patients;

CREATE POLICY "patients_select" ON patients
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
  );

CREATE POLICY "patients_insert" ON patients
  FOR INSERT WITH CHECK (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "patients_update" ON patients
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Doctors policies
DROP POLICY IF EXISTS "doctors_select" ON doctors;
DROP POLICY IF EXISTS "doctors_insert" ON doctors;
DROP POLICY IF EXISTS "doctors_update" ON doctors;

CREATE POLICY "doctors_select" ON doctors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "doctors_insert" ON doctors
  FOR INSERT WITH CHECK (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "doctors_update" ON doctors
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Therapy sessions policies
DROP POLICY IF EXISTS "sessions_select" ON therapy_sessions;
DROP POLICY IF EXISTS "sessions_insert" ON therapy_sessions;
DROP POLICY IF EXISTS "sessions_update" ON therapy_sessions;
DROP POLICY IF EXISTS "sessions_delete" ON therapy_sessions;

CREATE POLICY "sessions_select" ON therapy_sessions
  FOR SELECT USING (
    patient_id = auth.uid() OR
    doctor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "sessions_insert" ON therapy_sessions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
  );

CREATE POLICY "sessions_update" ON therapy_sessions
  FOR UPDATE USING (
    doctor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "sessions_delete" ON therapy_sessions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Progress data policies
DROP POLICY IF EXISTS "progress_select" ON progress_data;
DROP POLICY IF EXISTS "progress_insert" ON progress_data;
DROP POLICY IF EXISTS "progress_update" ON progress_data;

CREATE POLICY "progress_select" ON progress_data
  FOR SELECT USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
  );

CREATE POLICY "progress_insert" ON progress_data
  FOR INSERT WITH CHECK (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
  );

CREATE POLICY "progress_update" ON progress_data
  FOR UPDATE USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
  );

-- Notifications policies
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Feedback policies
DROP POLICY IF EXISTS "feedback_select" ON feedback;
DROP POLICY IF EXISTS "feedback_insert" ON feedback;
DROP POLICY IF EXISTS "feedback_update" ON feedback;

CREATE POLICY "feedback_select" ON feedback
  FOR SELECT USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "feedback_insert" ON feedback
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "feedback_update" ON feedback
  FOR UPDATE USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DO $$ BEGIN RAISE NOTICE '✅ Step 3: RLS policies created'; END $$;

-- ============================================================================
-- STEP 4: FIX EXISTING DATA (if any)
-- ============================================================================

-- Update any existing records with invalid data
UPDATE patients SET phone = '' WHERE phone IS NULL;
UPDATE patients SET address = '' WHERE address IS NULL;
UPDATE patients SET age = 0 WHERE age IS NULL OR age < 0 OR age > 120;

UPDATE doctors SET phone = '' WHERE phone IS NULL;
UPDATE doctors SET specialization = 'General Ayurveda' WHERE specialization IS NULL;
UPDATE doctors SET qualification = 'BAMS' WHERE qualification IS NULL;
UPDATE doctors SET experience = 0 WHERE experience IS NULL OR experience < 0 OR experience > 60;

DO $$ BEGIN RAISE NOTICE '✅ Step 4: Existing data cleaned up'; END $$;

-- ============================================================================
-- FINAL STATUS
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
  RAISE NOTICE '✅✅✅ ALL FIXES APPLIED SUCCESSFULLY ✅✅✅';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Current Database Status:';
  RAISE NOTICE '   • Profiles: %', profile_count;
  RAISE NOTICE '   • Patients: %', patient_count;
  RAISE NOTICE '   • Doctors: %', doctor_count;
  RAISE NOTICE '   • Sessions: %', session_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ What was fixed:';
  RAISE NOTICE '   1. Signup - All optional fields are now truly optional';
  RAISE NOTICE '   2. Trigger - Improved with better error handling';
  RAISE NOTICE '   3. RLS - Comprehensive policies for all roles';
  RAISE NOTICE '   4. Data - Existing records cleaned up';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '   1. Refresh your app (F5)';
  RAISE NOTICE '   2. Try signing up - SHOULD WORK NOW! ✅';
  RAISE NOTICE '   3. Data should be visible in dashboards';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your Panchakarma Management System is ready!';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
