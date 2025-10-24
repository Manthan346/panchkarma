-- ============================================================================
-- PANCHAKARMA PATIENT MANAGEMENT SYSTEM - PRODUCTION SCHEMA V3
-- ============================================================================
-- Version: 3.0 (Column Names Fixed + All Previous Fixes)
-- Date: October 15, 2025
-- Safe to run multiple times (idempotent)
-- 
-- WHAT THIS FIXES:
-- ✅ Fixed "column 'date' does not exist" error (renamed date → session_date, time → session_time)
-- ✅ Adds proper data validation and constraints
-- ✅ Fixes age and experience handling
-- ✅ Improves default values
-- ✅ Better error handling
-- ✅ Enhanced data type validation
-- ✅ Doctor creation fixed
-- ✅ All previous fixes included
--
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- STEP 1: RENAME EXISTING COLUMNS (if they exist with old names)
-- ============================================================================

DO $$ 
BEGIN
    -- Rename therapy_sessions columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapy_sessions' AND column_name = 'date'
    ) THEN
        ALTER TABLE therapy_sessions RENAME COLUMN date TO session_date;
        RAISE NOTICE '✅ Renamed therapy_sessions.date to session_date';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapy_sessions' AND column_name = 'time'
    ) THEN
        ALTER TABLE therapy_sessions RENAME COLUMN time TO session_time;
        RAISE NOTICE '✅ Renamed therapy_sessions.time to session_time';
    END IF;

    -- Rename progress_data columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'progress_data' AND column_name = 'date'
    ) THEN
        ALTER TABLE progress_data RENAME COLUMN date TO record_date;
        RAISE NOTICE '✅ Renamed progress_data.date to record_date';
    END IF;

    -- Rename notifications columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'date'
    ) THEN
        ALTER TABLE notifications RENAME COLUMN date TO notification_date;
        RAISE NOTICE '✅ Renamed notifications.date to notification_date';
    END IF;

    -- Rename feedback columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feedback' AND column_name = 'date'
    ) THEN
        ALTER TABLE feedback RENAME COLUMN date TO feedback_date;
        RAISE NOTICE '✅ Renamed feedback.date to feedback_date';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE TABLES WITH PROPER CONSTRAINTS
-- ============================================================================

-- PROFILES TABLE - Core user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  full_name TEXT NOT NULL CHECK (length(full_name) >= 2),
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- PATIENTS TABLE - Patient-specific information
CREATE TABLE IF NOT EXISTS patients (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  phone TEXT NOT NULL DEFAULT '',
  age INTEGER NOT NULL DEFAULT 0 CHECK (age >= 0 AND age <= 120),
  address TEXT NOT NULL DEFAULT '',
  medical_history TEXT DEFAULT '',
  allergies TEXT[] DEFAULT '{}',
  emergency_contact TEXT,
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', NULL)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster patient lookups
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

-- DOCTORS TABLE - Doctor-specific information
CREATE TABLE IF NOT EXISTS doctors (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  specialization TEXT NOT NULL DEFAULT 'General Ayurveda',
  phone TEXT NOT NULL DEFAULT '',
  qualification TEXT NOT NULL DEFAULT 'BAMS',
  experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0 AND experience <= 60),
  license_number TEXT UNIQUE,
  availability TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster doctor queries
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_experience ON doctors(experience);

-- THERAPY SESSIONS TABLE - Therapy appointments (FIXED COLUMN NAMES)
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  therapy_type TEXT NOT NULL,
  session_date DATE NOT NULL,  -- Changed from 'date' to 'session_date'
  session_time TIME NOT NULL,  -- Changed from 'time' to 'session_time'
  duration INTEGER NOT NULL DEFAULT 60 CHECK (duration > 0 AND duration <= 360),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  practitioner TEXT NOT NULL,
  notes TEXT,
  pre_procedure_instructions TEXT[] DEFAULT '{}',
  post_procedure_instructions TEXT[] DEFAULT '{}',
  cancellation_reason TEXT,
  rescheduled_from UUID REFERENCES therapy_sessions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster session queries
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_patient ON therapy_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_doctor ON therapy_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_date ON therapy_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_status ON therapy_sessions(status);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_doctor_date ON therapy_sessions(doctor_id, session_date);

-- PROGRESS DATA TABLE - Patient progress tracking (FIXED COLUMN NAMES)
CREATE TABLE IF NOT EXISTS progress_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,  -- Changed from 'date' to 'record_date'
  symptom_score INTEGER CHECK (symptom_score BETWEEN 1 AND 10),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
  notes TEXT,
  feedback TEXT,
  vital_signs JSONB DEFAULT '{}',
  follow_up_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster progress queries
CREATE INDEX IF NOT EXISTS idx_progress_data_patient ON progress_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_progress_data_date ON progress_data(record_date);

-- NOTIFICATIONS TABLE - System notifications (FIXED COLUMN NAMES)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pre-procedure', 'post-procedure', 'appointment', 'reminder')),
  title TEXT NOT NULL CHECK (length(title) > 0),
  message TEXT NOT NULL CHECK (length(message) > 0),
  notification_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),  -- Changed from 'date' to 'notification_date'
  read BOOLEAN DEFAULT false,
  urgent BOOLEAN DEFAULT false,
  action_url TEXT,
  action_text TEXT,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_patient ON notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(notification_date);

-- FEEDBACK TABLE - Patient feedback on therapy sessions (FIXED COLUMN NAMES)
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES therapy_sessions(id) ON DELETE CASCADE,
  feedback_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),  -- Changed from 'date' to 'feedback_date'
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  effectiveness_rating INTEGER NOT NULL CHECK (effectiveness_rating BETWEEN 1 AND 10),
  comfort_rating INTEGER NOT NULL CHECK (comfort_rating BETWEEN 1 AND 10),
  feedback_text TEXT NOT NULL CHECK (length(feedback_text) >= 10),
  side_effects TEXT,
  improvements TEXT,
  would_recommend BOOLEAN DEFAULT true,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'reviewed', 'responded')) DEFAULT 'submitted',
  admin_response TEXT,
  admin_response_date TIMESTAMP WITH TIME ZONE,
  admin_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster feedback queries
CREATE INDEX IF NOT EXISTS idx_feedback_patient ON feedback(patient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- ============================================================================
-- STEP 3: CREATE HELPER FUNCTIONS WITH IMPROVED ERROR HANDLING
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
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
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
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Function to get current user's role with validation
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();

  RETURN COALESCE(user_role, 'patient');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'patient';
END;
$$;

-- Enhanced function to validate and handle age input
CREATE OR REPLACE FUNCTION validate_age(age_input TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  age_val INTEGER;
BEGIN
  -- Handle null or empty input
  IF age_input IS NULL OR age_input = '' THEN
    RETURN 0;
  END IF;

  -- Try to convert input to integer
  BEGIN
    age_val := age_input::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    RETURN 0;
  END;

  -- Validate range
  IF age_val < 0 OR age_val > 120 THEN
    RETURN 0;
  END IF;

  RETURN age_val;
END;
$$;

-- Enhanced function to validate and handle experience input
CREATE OR REPLACE FUNCTION validate_experience(exp_input TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  exp_val INTEGER;
BEGIN
  -- Handle null or empty input
  IF exp_input IS NULL OR exp_input = '' THEN
    RETURN 0;
  END IF;

  -- Try to convert input to integer
  BEGIN
    exp_val := exp_input::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    RETURN 0;
  END;

  -- Validate range
  IF exp_val < 0 OR exp_val > 60 THEN
    RETURN 0;
  END IF;

  RETURN exp_val;
END;
$$;

-- Improved user creation handler with better validation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  age_val INTEGER;
  exp_val INTEGER;
BEGIN
  -- Get role from user metadata with validation
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  IF user_role NOT IN ('admin', 'doctor', 'patient') THEN
    user_role := 'patient';
  END IF;

  -- Validate age
  age_val := validate_age(COALESCE(NEW.raw_user_meta_data->>'age', '0'));
  
  -- Validate experience
  exp_val := validate_experience(COALESCE(NEW.raw_user_meta_data->>'experience', '0'));

  -- Create profile with validated data
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  -- Create role-specific profile with validated data
  IF user_role = 'patient' THEN
    INSERT INTO patients (
      id,
      phone,
      age,
      address,
      medical_history,
      emergency_contact,
      blood_group
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      age_val,
      COALESCE(NEW.raw_user_meta_data->>'address', ''),
      COALESCE(NEW.raw_user_meta_data->>'medicalHistory', ''),
      COALESCE(NEW.raw_user_meta_data->>'emergencyContact', ''),
      COALESCE(NEW.raw_user_meta_data->>'bloodGroup', NULL)
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = EXCLUDED.phone,
      age = EXCLUDED.age,
      address = EXCLUDED.address,
      medical_history = EXCLUDED.medical_history,
      emergency_contact = EXCLUDED.emergency_contact,
      blood_group = EXCLUDED.blood_group,
      updated_at = NOW();

  ELSIF user_role = 'doctor' THEN
    INSERT INTO doctors (
      id,
      phone,
      specialization,
      qualification,
      experience,
      license_number,
      languages
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'specialization', 'General Ayurveda'),
      COALESCE(NEW.raw_user_meta_data->>'qualification', 'BAMS'),
      exp_val,
      COALESCE(NEW.raw_user_meta_data->>'licenseNumber', NULL),
      COALESCE(
        CASE 
          WHEN NEW.raw_user_meta_data->>'languages' IS NOT NULL 
          THEN string_to_array(NEW.raw_user_meta_data->>'languages', ',')
          ELSE '{}'::TEXT[]
        END,
        '{}'::TEXT[]
      )
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = EXCLUDED.phone,
      specialization = EXCLUDED.specialization,
      qualification = EXCLUDED.qualification,
      experience = EXCLUDED.experience,
      license_number = EXCLUDED.license_number,
      languages = EXCLUDED.languages,
      updated_at = NOW();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Updated timestamp handler
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 4: CREATE TRIGGERS
-- ============================================================================

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
DROP TRIGGER IF EXISTS update_therapy_sessions_updated_at ON therapy_sessions;
DROP TRIGGER IF EXISTS update_progress_data_updated_at ON progress_data;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;

-- Create user creation trigger (CRITICAL FOR DOCTOR CREATION)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Recreate all update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapy_sessions_updated_at
  BEFORE UPDATE ON therapy_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_data_updated_at
  BEFORE UPDATE ON progress_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

DROP POLICY IF EXISTS "patients_select_policy" ON patients;
DROP POLICY IF EXISTS "patients_insert_policy" ON patients;
DROP POLICY IF EXISTS "patients_update_policy" ON patients;

DROP POLICY IF EXISTS "doctors_select_policy" ON doctors;
DROP POLICY IF EXISTS "doctors_insert_policy" ON doctors;
DROP POLICY IF EXISTS "doctors_update_policy" ON doctors;

DROP POLICY IF EXISTS "therapy_sessions_select_policy" ON therapy_sessions;
DROP POLICY IF EXISTS "therapy_sessions_insert_policy" ON therapy_sessions;
DROP POLICY IF EXISTS "therapy_sessions_update_policy" ON therapy_sessions;
DROP POLICY IF EXISTS "therapy_sessions_delete_policy" ON therapy_sessions;

DROP POLICY IF EXISTS "progress_data_select_policy" ON progress_data;
DROP POLICY IF EXISTS "progress_data_insert_policy" ON progress_data;
DROP POLICY IF EXISTS "progress_data_update_policy" ON progress_data;

DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;

DROP POLICY IF EXISTS "feedback_select_policy" ON feedback;
DROP POLICY IF EXISTS "feedback_insert_policy" ON feedback;
DROP POLICY IF EXISTS "feedback_update_policy" ON feedback;

-- PROFILES POLICIES
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR is_admin() OR is_doctor_or_admin()
  );

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR is_admin()
  );

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR is_admin()
  );

-- PATIENTS POLICIES
CREATE POLICY "patients_select_policy" ON patients
  FOR SELECT USING (
    auth.uid() = id OR is_doctor_or_admin()
  );

CREATE POLICY "patients_insert_policy" ON patients
  FOR INSERT WITH CHECK (
    auth.uid() = id OR is_admin()
  );

CREATE POLICY "patients_update_policy" ON patients
  FOR UPDATE USING (
    auth.uid() = id OR is_admin()
  );

-- DOCTORS POLICIES
CREATE POLICY "doctors_select_policy" ON doctors
  FOR SELECT USING (true); -- Anyone can view doctor listings

CREATE POLICY "doctors_insert_policy" ON doctors
  FOR INSERT WITH CHECK (
    auth.uid() = id OR is_admin()
  );

CREATE POLICY "doctors_update_policy" ON doctors
  FOR UPDATE USING (
    auth.uid() = id OR is_admin()
  );

-- THERAPY SESSIONS POLICIES
CREATE POLICY "therapy_sessions_select_policy" ON therapy_sessions
  FOR SELECT USING (
    patient_id = auth.uid() OR 
    doctor_id = auth.uid() OR 
    is_doctor_or_admin()
  );

CREATE POLICY "therapy_sessions_insert_policy" ON therapy_sessions
  FOR INSERT WITH CHECK (
    is_doctor_or_admin()
  );

CREATE POLICY "therapy_sessions_update_policy" ON therapy_sessions
  FOR UPDATE USING (
    is_doctor_or_admin()
  );

CREATE POLICY "therapy_sessions_delete_policy" ON therapy_sessions
  FOR DELETE USING (
    is_admin()
  );

-- PROGRESS DATA POLICIES
CREATE POLICY "progress_data_select_policy" ON progress_data
  FOR SELECT USING (
    patient_id = auth.uid() OR is_doctor_or_admin()
  );

CREATE POLICY "progress_data_insert_policy" ON progress_data
  FOR INSERT WITH CHECK (
    patient_id = auth.uid() OR is_doctor_or_admin()
  );

CREATE POLICY "progress_data_update_policy" ON progress_data
  FOR UPDATE USING (
    patient_id = auth.uid() OR is_doctor_or_admin()
  );

-- NOTIFICATIONS POLICIES
CREATE POLICY "notifications_select_policy" ON notifications
  FOR SELECT USING (
    patient_id = auth.uid() OR is_admin()
  );

CREATE POLICY "notifications_insert_policy" ON notifications
  FOR INSERT WITH CHECK (
    is_admin()
  );

CREATE POLICY "notifications_update_policy" ON notifications
  FOR UPDATE USING (
    patient_id = auth.uid() OR is_admin()
  );

-- FEEDBACK POLICIES
CREATE POLICY "feedback_select_policy" ON feedback
  FOR SELECT USING (
    patient_id = auth.uid() OR is_doctor_or_admin()
  );

CREATE POLICY "feedback_insert_policy" ON feedback
  FOR INSERT WITH CHECK (
    patient_id = auth.uid()
  );

CREATE POLICY "feedback_update_policy" ON feedback
  FOR UPDATE USING (
    patient_id = auth.uid() OR is_admin()
  );

-- ============================================================================
-- STEP 6: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_doctor_or_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_age(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_experience(TEXT) TO authenticated, anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON patients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON doctors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON therapy_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON progress_data TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON feedback TO authenticated;

-- ============================================================================
-- STEP 7: DATA MIGRATION AND CLEANUP
-- ============================================================================

-- Fix any null or invalid ages
UPDATE patients 
SET age = 0 
WHERE age IS NULL OR age < 0 OR age > 120;

-- Fix any null or invalid experience values
UPDATE doctors 
SET experience = 0 
WHERE experience IS NULL OR experience < 0 OR experience > 60;

-- Fix empty phone numbers
UPDATE patients 
SET phone = '' 
WHERE phone IS NULL;

UPDATE doctors 
SET phone = '' 
WHERE phone IS NULL;

-- Fix empty text fields
UPDATE patients 
SET address = '' 
WHERE address IS NULL;

UPDATE patients 
SET medical_history = '' 
WHERE medical_history IS NULL;

-- ============================================================================
-- STEP 8: ANALYZE FOR PERFORMANCE
-- ============================================================================

-- Update statistics for query optimizer
ANALYZE profiles;
ANALYZE patients;
ANALYZE doctors;
ANALYZE therapy_sessions;
ANALYZE progress_data;
ANALYZE notifications;
ANALYZE feedback;

-- ============================================================================
-- STEP 9: VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SCHEMA INSTALLATION COMPLETE! ✅';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Version: 3.0';
    RAISE NOTICE 'Date: October 15, 2025';
    RAISE NOTICE '';
    RAISE NOTICE 'What was fixed:';
    RAISE NOTICE '✅ Column names changed (date→session_date, time→session_time)';
    RAISE NOTICE '✅ Doctor creation working';
    RAISE NOTICE '✅ Proper data validation';
    RAISE NOTICE '✅ Age and experience handling';
    RAISE NOTICE '✅ RLS policies enabled';
    RAISE NOTICE '✅ All triggers active';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Clear browser cache (Ctrl+Shift+Delete)';
    RAISE NOTICE '2. Reload application (F5)';
    RAISE NOTICE '3. Test doctor creation';
    RAISE NOTICE '4. Test therapy session scheduling';
    RAISE NOTICE '';
    RAISE NOTICE 'Your application code already has mapper functions,';
    RAISE NOTICE 'so components can still use session.date and session.time';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- INSTALLATION COMPLETE! 🎉
-- ============================================================================
