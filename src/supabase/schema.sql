-- Panchakarma Patient Management System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (Using Supabase Auth)
-- ============================================
-- Note: User authentication is handled by Supabase Auth
-- We'll store additional profile info in separate tables

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- PATIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  phone TEXT,
  age INTEGER,
  address TEXT,
  medical_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Patients can view their own data"
  ON patients FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Patients can update their own data"
  ON patients FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Doctors can view all patients"
  ON patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('doctor', 'admin')
    )
  );

CREATE POLICY "Admins can manage patients"
  ON patients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- DOCTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  phone TEXT,
  specialization TEXT NOT NULL,
  qualification TEXT,
  experience INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Doctors can view their own data"
  ON doctors FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Doctors can update their own data"
  ON doctors FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Everyone can view doctors list"
  ON doctors FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage doctors"
  ON doctors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- THERAPY SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  doctor_id UUID REFERENCES doctors(id),
  therapy_type TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  practitioner TEXT,
  notes TEXT,
  pre_procedure_instructions TEXT[],
  post_procedure_instructions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Patients can view their own sessions"
  ON therapy_sessions FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view their assigned sessions"
  ON therapy_sessions FOR SELECT
  USING (
    auth.uid() = doctor_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('doctor', 'admin')
    )
  );

CREATE POLICY "Admins can manage all sessions"
  ON therapy_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Doctors can update their sessions"
  ON therapy_sessions FOR UPDATE
  USING (auth.uid() = doctor_id);

-- ============================================
-- PROGRESS DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS progress_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  date DATE NOT NULL,
  symptom_score INTEGER CHECK (symptom_score >= 0 AND symptom_score <= 10),
  energy_level INTEGER CHECK (energy_level >= 0 AND energy_level <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 0 AND sleep_quality <= 10),
  notes TEXT,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE progress_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Patients can manage their own progress"
  ON progress_data FOR ALL
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view all progress"
  ON progress_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('doctor', 'admin')
    )
  );

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('pre-procedure', 'post-procedure', 'reminder', 'info')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Patients can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can update their notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications"
  ON notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  patient_name TEXT NOT NULL,
  session_id UUID REFERENCES therapy_sessions(id),
  therapy_type TEXT NOT NULL,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 10),
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
  comfort_rating INTEGER CHECK (comfort_rating >= 1 AND comfort_rating <= 10),
  experience TEXT,
  improvements TEXT,
  side_effects TEXT,
  would_recommend BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'responded')),
  admin_response TEXT,
  responded_by TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Patients can view their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctors can view all feedback"
  ON feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('doctor', 'admin')
    )
  );

CREATE POLICY "Doctors can respond to feedback"
  ON feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('doctor', 'admin')
    )
  );

-- ============================================
-- THERAPY TYPES TABLE (Reference Data)
-- ============================================
CREATE TABLE IF NOT EXISTS therapy_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  duration INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE therapy_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view therapy types"
  ON therapy_types FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage therapy types"
  ON therapy_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapy_sessions_updated_at BEFORE UPDATE ON therapy_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_data_updated_at BEFORE UPDATE ON progress_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA (Therapy Types)
-- ============================================
INSERT INTO therapy_types (name, duration, description) VALUES
  ('Abhyanga (Oil Massage)', 60, 'Full body oil massage to improve circulation and reduce stress'),
  ('Swedana (Steam Therapy)', 45, 'Herbal steam therapy for detoxification and muscle relaxation'),
  ('Shirodhara (Oil Pouring)', 90, 'Continuous oil pouring on forehead for mental relaxation'),
  ('Panchakarma Detox', 120, 'Complete detoxification treatment program'),
  ('Nasya (Nasal Therapy)', 30, 'Nasal administration of medicated oils'),
  ('Basti (Medicated Enema)', 45, 'Herbal enema therapy for digestive and nervous system')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_patient ON therapy_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_doctor ON therapy_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_date ON therapy_sessions(date);
CREATE INDEX IF NOT EXISTS idx_progress_data_patient ON progress_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_patient ON notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_patient ON feedback(patient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id);