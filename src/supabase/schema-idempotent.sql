-- Panchakarma Patient Management System Database Schema
-- IDEMPOTENT VERSION - Can be run multiple times safely
-- FIXED: No RLS recursion issues

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING POLICIES (so we can recreate them)
-- ============================================

-- Drop profiles policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
    DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
    DROP POLICY IF EXISTS "Allow service role full access to profiles" ON profiles;
    DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins bypass RLS on profiles" ON profiles;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Drop patients policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Patients can view their own data" ON patients;
    DROP POLICY IF EXISTS "Patients can update their own data" ON patients;
    DROP POLICY IF EXISTS "Doctors can view all patients" ON patients;
    DROP POLICY IF EXISTS "Admins can manage patients" ON patients;
    DROP POLICY IF EXISTS "Allow service role full access to patients" ON patients;
    DROP POLICY IF EXISTS "Patients can insert own data" ON patients;
    DROP POLICY IF EXISTS "Admins bypass RLS on patients" ON patients;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Drop doctors policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Doctors can view their own data" ON doctors;
    DROP POLICY IF EXISTS "Doctors can update their own data" ON doctors;
    DROP POLICY IF EXISTS "Admins can view all doctors" ON doctors;
    DROP POLICY IF EXISTS "Admins can manage doctors" ON doctors;
    DROP POLICY IF EXISTS "Allow service role full access to doctors" ON doctors;
    DROP POLICY IF EXISTS "Everyone can view all doctors" ON doctors;
    DROP POLICY IF EXISTS "Doctors can insert own data" ON doctors;
    DROP POLICY IF EXISTS "Admins bypass RLS on doctors" ON doctors;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Drop therapy_sessions policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Patients can view their own sessions" ON therapy_sessions;
    DROP POLICY IF EXISTS "Doctors can view assigned sessions" ON therapy_sessions;
    DROP POLICY IF EXISTS "Admins can manage all sessions" ON therapy_sessions;
    DROP POLICY IF EXISTS "Allow service role full access to therapy_sessions" ON therapy_sessions;
    DROP POLICY IF EXISTS "Patients can manage own sessions" ON therapy_sessions;
    DROP POLICY IF EXISTS "Doctors can manage assigned sessions" ON therapy_sessions;
    DROP POLICY IF EXISTS "Admins bypass RLS on therapy_sessions" ON therapy_sessions;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Drop progress_data policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Patients can view their own progress" ON progress_data;
    DROP POLICY IF EXISTS "Patients can insert their own progress" ON progress_data;
    DROP POLICY IF EXISTS "Doctors can view patient progress" ON progress_data;
    DROP POLICY IF EXISTS "Admins can manage all progress" ON progress_data;
    DROP POLICY IF EXISTS "Allow service role full access to progress_data" ON progress_data;
    DROP POLICY IF EXISTS "Patients can manage own progress" ON progress_data;
    DROP POLICY IF EXISTS "Admins bypass RLS on progress_data" ON progress_data;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Drop notifications policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
    DROP POLICY IF EXISTS "Allow service role full access to notifications" ON notifications;
    DROP POLICY IF EXISTS "Patients can manage own notifications" ON notifications;
    DROP POLICY IF EXISTS "Admins bypass RLS on notifications" ON notifications;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Drop feedback policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Patients can view their own feedback" ON feedback;
    DROP POLICY IF EXISTS "Patients can insert their own feedback" ON feedback;
    DROP POLICY IF EXISTS "Patients can update their own feedback" ON feedback;
    DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
    DROP POLICY IF EXISTS "Admins can manage all feedback" ON feedback;
    DROP POLICY IF EXISTS "Allow service role full access to feedback" ON feedback;
    DROP POLICY IF EXISTS "Patients can manage own feedback" ON feedback;
    DROP POLICY IF EXISTS "Admins bypass RLS on feedback" ON feedback;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- ============================================
-- CREATE TABLES
-- ============================================

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  phone TEXT,
  age INTEGER,
  address TEXT,
  medical_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  specialization TEXT,
  phone TEXT,
  qualification TEXT,
  experience INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- THERAPY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapy_type TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  practitioner TEXT NOT NULL,
  doctor_id UUID REFERENCES doctors(id),
  notes TEXT,
  pre_procedure_instructions TEXT[],
  post_procedure_instructions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROGRESS DATA TABLE
CREATE TABLE IF NOT EXISTS progress_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  symptom_score INTEGER CHECK (symptom_score BETWEEN 1 AND 10),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
  notes TEXT,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pre-procedure', 'post-procedure', 'appointment', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  urgent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  session_id UUID REFERENCES therapy_sessions(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 10),
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 10),
  comfort_rating INTEGER CHECK (comfort_rating BETWEEN 1 AND 10),
  feedback_text TEXT,
  side_effects TEXT,
  improvements TEXT,
  would_recommend BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'reviewed', 'responded')) DEFAULT 'submitted',
  admin_response TEXT,
  admin_response_date TIMESTAMP WITH TIME ZONE,
  admin_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- ============================================

-- Function to check if current user is admin
-- Uses SECURITY DEFINER to bypass RLS when checking role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$function$;

-- Function to check if current user is doctor or admin
CREATE OR REPLACE FUNCTION is_doctor_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('doctor', 'admin')
  );
END;
$function$;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN (
    SELECT role FROM profiles
    WHERE id = auth.uid()
  );
END;
$function$;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES (NO RECURSION)
-- ============================================

-- PROFILES POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile  
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Authenticated users can insert their own profile
CREATE POLICY "Authenticated users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins bypass RLS (using SECURITY DEFINER function)
CREATE POLICY "Admins bypass RLS on profiles"
  ON profiles FOR ALL
  USING (is_admin());

-- Service role has full access
CREATE POLICY "Allow service role full access to profiles"
  ON profiles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- PATIENTS POLICIES
-- Patients can view their own data
CREATE POLICY "Patients can view their own data"
  ON patients FOR SELECT
  USING (auth.uid() = id);

-- Patients can update their own data
CREATE POLICY "Patients can update their own data"
  ON patients FOR UPDATE
  USING (auth.uid() = id);

-- Patients can insert their own data
CREATE POLICY "Patients can insert own data"
  ON patients FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Doctors and admins can view all patients (using SECURITY DEFINER function)
CREATE POLICY "Doctors can view all patients"
  ON patients FOR SELECT
  USING (is_doctor_or_admin());

-- Admins bypass RLS
CREATE POLICY "Admins bypass RLS on patients"
  ON patients FOR ALL
  USING (is_admin());

-- Service role has full access
CREATE POLICY "Allow service role full access to patients"
  ON patients FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- DOCTORS POLICIES
-- Doctors can view their own data
CREATE POLICY "Doctors can view their own data"
  ON doctors FOR SELECT
  USING (auth.uid() = id);

-- Doctors can update their own data
CREATE POLICY "Doctors can update their own data"
  ON doctors FOR UPDATE
  USING (auth.uid() = id);

-- Doctors can insert their own data
CREATE POLICY "Doctors can insert own data"
  ON doctors FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Everyone can view all doctors (needed for patient to see doctor info)
CREATE POLICY "Everyone can view all doctors"
  ON doctors FOR SELECT
  USING (true);

-- Admins bypass RLS
CREATE POLICY "Admins bypass RLS on doctors"
  ON doctors FOR ALL
  USING (is_admin());

-- Service role has full access
CREATE POLICY "Allow service role full access to doctors"
  ON doctors FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- THERAPY SESSIONS POLICIES
-- Patients can view their own sessions (direct comparison, no subquery)
CREATE POLICY "Patients can view their own sessions"
  ON therapy_sessions FOR SELECT
  USING (auth.uid() = patient_id);

-- Patients can manage their own sessions
CREATE POLICY "Patients can manage own sessions"
  ON therapy_sessions FOR ALL
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Doctors can view sessions assigned to them OR all if doctor/admin role
CREATE POLICY "Doctors can view assigned sessions"
  ON therapy_sessions FOR SELECT
  USING (auth.uid() = doctor_id OR is_doctor_or_admin());

-- Doctors can update sessions assigned to them
CREATE POLICY "Doctors can manage assigned sessions"
  ON therapy_sessions FOR ALL
  USING (auth.uid() = doctor_id OR is_doctor_or_admin());

-- Admins bypass RLS
CREATE POLICY "Admins bypass RLS on therapy_sessions"
  ON therapy_sessions FOR ALL
  USING (is_admin());

-- Service role has full access
CREATE POLICY "Allow service role full access to therapy_sessions"
  ON therapy_sessions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- PROGRESS DATA POLICIES
-- Patients can view their own progress (direct comparison)
CREATE POLICY "Patients can view their own progress"
  ON progress_data FOR SELECT
  USING (auth.uid() = patient_id);

-- Patients can manage their own progress
CREATE POLICY "Patients can manage own progress"
  ON progress_data FOR ALL
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Doctors and admins can view all progress
CREATE POLICY "Doctors can view patient progress"
  ON progress_data FOR SELECT
  USING (is_doctor_or_admin());

-- Admins bypass RLS
CREATE POLICY "Admins bypass RLS on progress_data"
  ON progress_data FOR ALL
  USING (is_admin());

-- Service role has full access
CREATE POLICY "Allow service role full access to progress_data"
  ON progress_data FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- NOTIFICATIONS POLICIES
-- Users can view their own notifications (direct comparison)
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = patient_id);

-- Users can manage their own notifications
CREATE POLICY "Patients can manage own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Admins bypass RLS
CREATE POLICY "Admins bypass RLS on notifications"
  ON notifications FOR ALL
  USING (is_admin());

-- Service role has full access
CREATE POLICY "Allow service role full access to notifications"
  ON notifications FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- FEEDBACK POLICIES
-- Patients can view their own feedback (direct comparison)
CREATE POLICY "Patients can view their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = patient_id);

-- Patients can manage their own feedback
CREATE POLICY "Patients can manage own feedback"
  ON feedback FOR ALL
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON feedback FOR SELECT
  USING (is_admin());

-- Admins bypass RLS
CREATE POLICY "Admins bypass RLS on feedback"
  ON feedback FOR ALL
  USING (is_admin());

-- Service role has full access
CREATE POLICY "Allow service role full access to feedback"
  ON feedback FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_patients_id ON patients(id);
CREATE INDEX IF NOT EXISTS idx_doctors_id ON doctors(id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_patient_id ON therapy_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_doctor_id ON therapy_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_date ON therapy_sessions(date);
CREATE INDEX IF NOT EXISTS idx_progress_data_patient_id ON progress_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_progress_data_date ON progress_data(date);
CREATE INDEX IF NOT EXISTS idx_notifications_patient_id ON notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_patient_id ON feedback(patient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_therapy_sessions_updated_at ON therapy_sessions;
CREATE TRIGGER update_therapy_sessions_updated_at BEFORE UPDATE ON therapy_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_progress_data_updated_at ON progress_data;
CREATE TRIGGER update_progress_data_updated_at BEFORE UPDATE ON progress_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE WHEN AUTH USER IS CREATED
-- ============================================

-- Function to automatically create profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from user metadata (default to 'patient' if not specified)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role
  );
  
  -- Create role-specific profile
  IF user_role = 'patient' THEN
    INSERT INTO public.patients (id, phone, age, address, medical_history)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      COALESCE((NEW.raw_user_meta_data->>'age')::INTEGER, 0),
      COALESCE(NEW.raw_user_meta_data->>'address', ''),
      COALESCE(NEW.raw_user_meta_data->>'medicalHistory', '')
    );
  ELSIF user_role = 'doctor' THEN
    INSERT INTO public.doctors (id, phone, specialization, qualification, experience)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'specialization', 'General Ayurveda'),
      COALESCE(NEW.raw_user_meta_data->>'qualification', 'BAMS'),
      COALESCE((NEW.raw_user_meta_data->>'experience')::INTEGER, 0)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- GRANT EXECUTE PERMISSIONS ON HELPER FUNCTIONS
-- ============================================

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_doctor_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;
GRANT EXECUTE ON FUNCTION is_doctor_or_admin() TO anon;
GRANT EXECUTE ON FUNCTION get_user_role() TO anon;
