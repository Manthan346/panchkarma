-- ============================================================================
-- PANCHAKARMA PATIENT MANAGEMENT SYSTEM - YOUR SCHEMA WITH COLUMN NAMES FIXED
-- ============================================================================
-- Version: 2.1 FIXED
-- Date: October 15, 2025
-- This is YOUR exact schema (Version 2.1) with ONLY the column names changed
-- Everything else is EXACTLY as you provided
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- PROFILES TABLE - Core user information
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  full_name TEXT NOT NULL CHECK (length(full_name) >= 2),
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PATIENTS TABLE - Patient-specific information
-- ============================================================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  phone TEXT NOT NULL CHECK (phone ~ '^\+?[0-9\s-()]{8,}$'),
  age INTEGER NOT NULL CHECK (age >= 0 AND age <= 120),
  address TEXT NOT NULL,
  medical_history TEXT,
  allergies TEXT[] DEFAULT '{}',
  emergency_contact TEXT,
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DOCTORS TABLE - Doctor-specific information
-- ============================================================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  specialization TEXT NOT NULL,
  phone TEXT NOT NULL CHECK (phone ~ '^\+?[0-9\s-()]{8,}$'),
  qualification TEXT NOT NULL,
  experience INTEGER NOT NULL CHECK (experience >= 0 AND experience <= 60),
  license_number TEXT UNIQUE,
  availability TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- THERAPY SESSIONS TABLE - FIXED COLUMN NAMES
-- ============================================================================
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES doctors(id),
  therapy_type TEXT NOT NULL,
  session_date DATE NOT NULL CHECK (session_date >= CURRENT_DATE),  -- CHANGED FROM 'date'
  session_time TIME NOT NULL,  -- CHANGED FROM 'time'
  duration INTEGER NOT NULL CHECK (duration > 0 AND duration <= 360),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  practitioner TEXT NOT NULL,
  notes TEXT,
  pre_procedure_instructions TEXT[] DEFAULT '{}',
  post_procedure_instructions TEXT[] DEFAULT '{}',
  cancellation_reason TEXT,
  rescheduled_from UUID REFERENCES therapy_sessions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_datetime CHECK (
    (session_date > CURRENT_DATE) OR 
    (session_date = CURRENT_DATE AND session_time > CURRENT_TIME)
  )
);

-- ============================================================================
-- PROGRESS DATA TABLE - FIXED COLUMN NAMES
-- ============================================================================
CREATE TABLE IF NOT EXISTS progress_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,  -- CHANGED FROM 'date'
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

-- ============================================================================
-- NOTIFICATIONS TABLE - FIXED COLUMN NAMES
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pre-procedure', 'post-procedure', 'appointment', 'reminder')),
  title TEXT NOT NULL CHECK (length(title) > 0),
  message TEXT NOT NULL CHECK (length(message) > 0),
  notification_date TIMESTAMP WITH TIME ZONE NOT NULL,  -- CHANGED FROM 'date'
  read BOOLEAN DEFAULT false,
  urgent BOOLEAN DEFAULT false,
  action_url TEXT,
  action_text TEXT,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FEEDBACK TABLE - FIXED COLUMN NAMES
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES therapy_sessions(id) ON DELETE CASCADE,
  feedback_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),  -- CHANGED FROM 'date'
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

-- ============================================================================
-- HELPER FUNCTIONS
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
    RAISE EXCEPTION 'Error checking admin status: %', SQLERRM;
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
    RAISE EXCEPTION 'Error checking doctor/admin status: %', SQLERRM;
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

  IF user_role IS NULL THEN
    RAISE EXCEPTION 'User role not found';
  END IF;

  RETURN user_role;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting user role: %', SQLERRM;
END;
$$;

-- Enhanced function to validate and handle age input
CREATE OR REPLACE FUNCTION validate_age(age_input TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  age_val INTEGER;
BEGIN
  -- Try to convert input to integer
  BEGIN
    age_val := age_input::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    RETURN 0;  -- Return 0 if conversion fails
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
AS $$
DECLARE
  exp_val INTEGER;
BEGIN
  -- Try to convert input to integer
  BEGIN
    exp_val := exp_input::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    RETURN 0;  -- Return 0 if conversion fails
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
  age_val := validate_age(NEW.raw_user_meta_data->>'age');
  
  -- Validate experience
  exp_val := validate_experience(NEW.raw_user_meta_data->>'experience');

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
      COALESCE((NEW.raw_user_meta_data->>'languages')::TEXT[], '{}')
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
    RAISE EXCEPTION 'Error in handle_new_user: %', SQLERRM;
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
-- CREATE TRIGGERS
-- ============================================================================

-- Recreate all update triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_therapy_sessions_updated_at ON therapy_sessions;
CREATE TRIGGER update_therapy_sessions_updated_at
  BEFORE UPDATE ON therapy_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_progress_data_updated_at ON progress_data;
CREATE TRIGGER update_progress_data_updated_at
  BEFORE UPDATE ON progress_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- User creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_doctor_or_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_age(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_experience(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated, anon;

-- ============================================================================
-- DATA MIGRATION AND CLEANUP
-- ============================================================================

-- Fix any null or invalid ages
UPDATE patients 
SET age = 0 
WHERE age IS NULL OR age < 0 OR age > 120;

-- Fix any null or invalid experience values
UPDATE doctors 
SET experience = 0 
WHERE experience IS NULL OR experience < 0 OR experience > 60;

-- Update empty phone numbers with placeholder
UPDATE patients 
SET phone = 'Not Provided' 
WHERE phone IS NULL OR phone = '';

UPDATE doctors 
SET phone = 'Not Provided' 
WHERE phone IS NULL OR phone = '';

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

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT '✅ Schema installed successfully! Column names fixed.' as status;
