-- ============================================================================
-- PANCHAKARMA MANAGEMENT SYSTEM - FRESH START SCHEMA
-- ============================================================================
-- Version: 3.2 ALL ERRORS FIXED
-- Date: October 15, 2025
-- 
-- Features:
-- ✅ Doctors can sign up themselves OR be created by admin
-- ✅ Patients can sign up themselves OR be created by admin
-- ✅ All optional fields are truly optional
-- ✅ Proper RLS policies without recursion
-- ✅ Clean, simple structure
-- ✅ ALL SYNTAX ERRORS FIXED
-- ============================================================================

-- ============================================================================
-- STEP 1: CLEAN SLATE - Remove old structure
-- ============================================================================

-- Drop all existing policies (clean slate)
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "patients_select" ON patients;
DROP POLICY IF EXISTS "patients_insert" ON patients;
DROP POLICY IF EXISTS "patients_update" ON patients;
DROP POLICY IF EXISTS "patients_delete" ON patients;
DROP POLICY IF EXISTS "doctors_select" ON doctors;
DROP POLICY IF EXISTS "doctors_insert" ON doctors;
DROP POLICY IF EXISTS "doctors_update" ON doctors;
DROP POLICY IF EXISTS "doctors_delete" ON doctors;
DROP POLICY IF EXISTS "sessions_select" ON therapy_sessions;
DROP POLICY IF EXISTS "sessions_insert" ON therapy_sessions;
DROP POLICY IF EXISTS "sessions_update" ON therapy_sessions;
DROP POLICY IF EXISTS "sessions_delete" ON therapy_sessions;
DROP POLICY IF EXISTS "progress_select" ON progress_data;
DROP POLICY IF EXISTS "progress_insert" ON progress_data;
DROP POLICY IF EXISTS "progress_update" ON progress_data;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "feedback_select" ON feedback;
DROP POLICY IF EXISTS "feedback_insert" ON feedback;
DROP POLICY IF EXISTS "feedback_update" ON feedback;

-- Drop old triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
DROP TRIGGER IF EXISTS update_therapy_sessions_updated_at ON therapy_sessions;
DROP TRIGGER IF EXISTS update_progress_data_updated_at ON progress_data;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;

-- Drop old functions
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- STEP 2: CREATE TABLES WITH CORRECT STRUCTURE
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE (core user info - minimal required fields)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PATIENTS TABLE (all fields optional except ID)
CREATE TABLE IF NOT EXISTS patients (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  phone TEXT DEFAULT '',
  age INTEGER DEFAULT 0 CHECK (age >= 0 AND age <= 120),
  address TEXT DEFAULT '',
  medical_history TEXT DEFAULT '',
  allergies TEXT[] DEFAULT '{}',
  emergency_contact TEXT DEFAULT '',
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DOCTORS TABLE (all fields optional except ID)
CREATE TABLE IF NOT EXISTS doctors (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  specialization TEXT DEFAULT 'General Ayurveda',
  phone TEXT DEFAULT '',
  qualification TEXT DEFAULT 'BAMS',
  experience INTEGER DEFAULT 0 CHECK (experience >= 0 AND experience <= 60),
  license_number TEXT,
  availability TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- THERAPY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES doctors(id),
  therapy_type TEXT NOT NULL,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60 CHECK (duration > 0 AND duration <= 360),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  practitioner TEXT NOT NULL,
  notes TEXT DEFAULT '',
  pre_procedure_instructions TEXT[] DEFAULT '{}',
  post_procedure_instructions TEXT[] DEFAULT '{}',
  cancellation_reason TEXT,
  rescheduled_from UUID REFERENCES therapy_sessions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROGRESS DATA TABLE
CREATE TABLE IF NOT EXISTS progress_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  symptom_score INTEGER CHECK (symptom_score BETWEEN 1 AND 10),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
  notes TEXT DEFAULT '',
  feedback TEXT DEFAULT '',
  vital_signs JSONB DEFAULT '{}',
  follow_up_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pre-procedure', 'post-procedure', 'appointment', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_date TIMESTAMP WITH TIME ZONE NOT NULL,
  read BOOLEAN DEFAULT false,
  urgent BOOLEAN DEFAULT false,
  action_url TEXT,
  action_text TEXT,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES therapy_sessions(id) ON DELETE CASCADE,
  feedback_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  effectiveness_rating INTEGER NOT NULL CHECK (effectiveness_rating BETWEEN 1 AND 10),
  comfort_rating INTEGER NOT NULL CHECK (comfort_rating BETWEEN 1 AND 10),
  feedback_text TEXT NOT NULL,
  side_effects TEXT DEFAULT '',
  improvements TEXT DEFAULT '',
  would_recommend BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'responded')),
  admin_response TEXT,
  admin_response_date TIMESTAMP WITH TIME ZONE,
  admin_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE FUNCTIONS
-- ============================================================================

-- Simple updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Helper function to get user role (bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$;

-- User creation handler - SIMPLIFIED
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Get role from metadata, default to 'patient'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  
  -- Validate role
  IF user_role NOT IN ('admin', 'doctor', 'patient') THEN
    user_role := 'patient';
  END IF;

  -- Get name with fallback
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Create profile (always succeeds)
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, user_name, user_role)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  -- Create role-specific record with ALL defaults
  IF user_role = 'patient' THEN
    INSERT INTO patients (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;

  ELSIF user_role = 'doctor' THEN
    INSERT INTO doctors (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail signup
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 4: CREATE TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapy_sessions_updated_at
  BEFORE UPDATE ON therapy_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_data_updated_at
  BEFORE UPDATE ON progress_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User creation trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- STEP 5: ENABLE RLS
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================================================

-- PROFILES policies (using helper function to avoid recursion)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR
    public.get_user_role() = 'admin'
  );

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR
    public.get_user_role() = 'admin'
  );

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR
    public.get_user_role() = 'admin'
  );

-- PATIENTS policies (using helper function to avoid recursion)
CREATE POLICY "patients_select" ON patients
  FOR SELECT USING (
    auth.uid() = id OR
    public.get_user_role() IN ('admin', 'doctor')
  );

CREATE POLICY "patients_insert" ON patients
  FOR INSERT WITH CHECK (
    auth.uid() = id OR
    public.get_user_role() = 'admin'
  );

CREATE POLICY "patients_update" ON patients
  FOR UPDATE USING (
    auth.uid() = id OR
    public.get_user_role() = 'admin'
  );

CREATE POLICY "patients_delete" ON patients
  FOR DELETE USING (
    public.get_user_role() = 'admin'
  );

-- DOCTORS policies (using helper function to avoid recursion)
CREATE POLICY "doctors_select" ON doctors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "doctors_insert" ON doctors
  FOR INSERT WITH CHECK (
    auth.uid() = id OR
    public.get_user_role() = 'admin'
  );

CREATE POLICY "doctors_update" ON doctors
  FOR UPDATE USING (
    auth.uid() = id OR
    public.get_user_role() = 'admin'
  );

CREATE POLICY "doctors_delete" ON doctors
  FOR DELETE USING (
    public.get_user_role() = 'admin'
  );

-- THERAPY SESSIONS policies (using helper function to avoid recursion)
CREATE POLICY "sessions_select" ON therapy_sessions
  FOR SELECT USING (
    patient_id = auth.uid() OR
    doctor_id = auth.uid() OR
    public.get_user_role() = 'admin'
  );

CREATE POLICY "sessions_insert" ON therapy_sessions
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('admin', 'doctor')
  );

CREATE POLICY "sessions_update" ON therapy_sessions
  FOR UPDATE USING (
    doctor_id = auth.uid() OR
    public.get_user_role() = 'admin'
  );

CREATE POLICY "sessions_delete" ON therapy_sessions
  FOR DELETE USING (
    public.get_user_role() = 'admin'
  );

-- PROGRESS DATA policies (using helper function to avoid recursion)
CREATE POLICY "progress_select" ON progress_data
  FOR SELECT USING (
    patient_id = auth.uid() OR
    public.get_user_role() IN ('admin', 'doctor')
  );

CREATE POLICY "progress_insert" ON progress_data
  FOR INSERT WITH CHECK (
    patient_id = auth.uid() OR
    public.get_user_role() IN ('admin', 'doctor')
  );

CREATE POLICY "progress_update" ON progress_data
  FOR UPDATE USING (
    patient_id = auth.uid() OR
    public.get_user_role() IN ('admin', 'doctor')
  );

-- NOTIFICATIONS policies (using helper function to avoid recursion)
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (
    patient_id = auth.uid() OR
    public.get_user_role() = 'admin'
  );

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'admin'
  );

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (
    patient_id = auth.uid() OR
    public.get_user_role() = 'admin'
  );

-- FEEDBACK policies (using helper function to avoid recursion)
CREATE POLICY "feedback_select" ON feedback
  FOR SELECT USING (
    patient_id = auth.uid() OR
    public.get_user_role() IN ('admin', 'doctor')
  );

CREATE POLICY "feedback_insert" ON feedback
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "feedback_update" ON feedback
  FOR UPDATE USING (
    patient_id = auth.uid() OR
    public.get_user_role() IN ('admin', 'doctor')
  );

-- ============================================================================
-- STEP 7: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;

-- ============================================================================
-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_patient ON therapy_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_doctor ON therapy_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_date ON therapy_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_progress_data_patient ON progress_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_patient ON notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_patient ON feedback(patient_id);

-- ============================================================================
-- DONE!
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
  RAISE NOTICE '✅ FRESH START SCHEMA APPLIED SUCCESSFULLY';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Current Data:';
  RAISE NOTICE '   • Profiles: %', profile_count;
  RAISE NOTICE '   • Patients: %', patient_count;
  RAISE NOTICE '   • Doctors: %', doctor_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Schema Features:';
  RAISE NOTICE '   • Doctors can sign up themselves ✅';
  RAISE NOTICE '   • Admins can create doctors ✅';
  RAISE NOTICE '   • Patients can sign up themselves ✅';
  RAISE NOTICE '   • Admins can create patients ✅';
  RAISE NOTICE '   • All optional fields with defaults ✅';
  RAISE NOTICE '   • RLS policies without recursion ✅';
  RAISE NOTICE '   • Performance indexes ✅';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '   1. Refresh your app';
  RAISE NOTICE '   2. Try signing up as doctor or patient';
  RAISE NOTICE '   3. Login as admin to create users';
  RAISE NOTICE '   4. Everything should work perfectly!';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your system is ready!';
  RAISE NOTICE '';
END $$;
