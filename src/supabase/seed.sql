-- Seed Data for Panchakarma Patient Management System
-- Run this after setting up the schema to create demo users and data

-- ============================================
-- IMPORTANT: Update passwords for production!
-- ============================================

-- Helper function to create users with proper auth
-- Note: You'll need to use Supabase Auth API for production user creation
-- This is simplified for demo purposes

-- ============================================
-- Create Demo Admin User
-- ============================================
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Insert into auth.users (This needs to be done via Supabase Auth API in production)
  -- For now, we'll just create profiles assuming auth users exist
  
  -- Create admin ID
  admin_id := gen_random_uuid();
  
  -- Insert profile
  INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    admin_id,
    'admin@panchakarma.com',
    'Dr. Ayurveda Admin',
    'admin',
    NOW(),
    NOW()
  ) ON CONFLICT (email) DO NOTHING;
  
  RAISE NOTICE 'Admin user created with email: admin@panchakarma.com';
  RAISE NOTICE 'Admin ID: %', admin_id;
END $$;

-- ============================================
-- Create Demo Doctors
-- ============================================
DO $$
DECLARE
  doctor1_id UUID;
  doctor2_id UUID;
  doctor3_id UUID;
BEGIN
  doctor1_id := gen_random_uuid();
  doctor2_id := gen_random_uuid();
  doctor3_id := gen_random_uuid();
  
  -- Dr. Sharma
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (doctor1_id, 'sharma@panchakarma.com', 'Dr. Sharma', 'doctor')
  ON CONFLICT (email) DO NOTHING;
  
  INSERT INTO doctors (id, phone, specialization, qualification, experience)
  VALUES (doctor1_id, '+1-555-0124', 'Panchakarma Specialist', 'BAMS, MD (Panchakarma)', 15)
  ON CONFLICT (id) DO NOTHING;
  
  -- Dr. Patel
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (doctor2_id, 'patel@panchakarma.com', 'Dr. Patel', 'doctor')
  ON CONFLICT (email) DO NOTHING;
  
  INSERT INTO doctors (id, phone, specialization, qualification, experience)
  VALUES (doctor2_id, '+1-555-0125', 'Ayurvedic Medicine', 'BAMS, MD (Ayurveda)', 12)
  ON CONFLICT (id) DO NOTHING;
  
  -- Dr. Kumar
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (doctor3_id, 'kumar@panchakarma.com', 'Dr. Kumar', 'doctor')
  ON CONFLICT (email) DO NOTHING;
  
  INSERT INTO doctors (id, phone, specialization, qualification, experience)
  VALUES (doctor3_id, '+1-555-0126', 'Therapeutic Massage', 'BAMS, Diploma in Panchakarma', 8)
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE 'Demo doctors created';
END $$;

-- ============================================
-- Create Demo Patient
-- ============================================
DO $$
DECLARE
  patient_id UUID;
BEGIN
  patient_id := gen_random_uuid();
  
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (patient_id, 'patient@example.com', 'John Patient', 'patient')
  ON CONFLICT (email) DO NOTHING;
  
  INSERT INTO patients (id, phone, age, address, medical_history)
  VALUES (
    patient_id,
    '+1-555-0123',
    45,
    '123 Wellness St, Health City, HC 12345',
    'Chronic joint pain, stress-related disorders, digestive issues. Previous treatments include conventional medication with limited success.'
  ) ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE 'Demo patient created';
  RAISE NOTICE 'Patient ID: %', patient_id;
  
  -- Create some therapy sessions for the patient
  INSERT INTO therapy_sessions (
    patient_id,
    doctor_id,
    therapy_type,
    date,
    time,
    duration,
    status,
    practitioner,
    pre_procedure_instructions,
    post_procedure_instructions
  )
  SELECT 
    patient_id,
    (SELECT id FROM doctors LIMIT 1),
    'Abhyanga (Oil Massage)',
    CURRENT_DATE + INTERVAL '1 day',
    '09:00',
    60,
    'scheduled',
    'Dr. Sharma',
    ARRAY['Fast for 2 hours before treatment', 'Avoid cold drinks', 'Wear comfortable clothing', 'Arrive 15 minutes early'],
    ARRAY['Rest for 30 minutes after treatment', 'Drink warm water', 'Avoid cold exposure for 2 hours', 'Take prescribed herbal medicine']
  WHERE NOT EXISTS (
    SELECT 1 FROM therapy_sessions WHERE patient_id = patient_id
  );
  
  -- Create progress data
  INSERT INTO progress_data (
    patient_id,
    date,
    symptom_score,
    energy_level,
    sleep_quality,
    notes,
    feedback
  )
  VALUES
    (patient_id, CURRENT_DATE - INTERVAL '7 days', 7, 6, 5, 'Feeling better overall, less joint stiffness in the morning', 'The massage therapy has been very helpful'),
    (patient_id, CURRENT_DATE - INTERVAL '3 days', 5, 8, 7, 'Significant improvement in energy levels and sleep quality', 'Steam therapy was particularly effective'),
    (patient_id, CURRENT_DATE, 4, 8, 8, 'Best I have felt in months! Morning stiffness almost gone', 'Very satisfied with the progress')
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Sample data created for patient';
END $$;

-- ============================================
-- Create Sample Notifications
-- ============================================
DO $$
DECLARE
  patient_id UUID;
BEGIN
  SELECT id INTO patient_id FROM patients LIMIT 1;
  
  IF patient_id IS NOT NULL THEN
    INSERT INTO notifications (patient_id, title, message, type, read)
    VALUES
      (patient_id, 'Upcoming Therapy Session', 'Your Abhyanga therapy is scheduled for tomorrow at 9:00 AM', 'reminder', false),
      (patient_id, 'Pre-Procedure Instructions', 'Please fast for 2 hours before your treatment', 'pre-procedure', false),
      (patient_id, 'Treatment Completed', 'Your session is complete. Please follow post-procedure instructions', 'post-procedure', true)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Sample notifications created';
  END IF;
END $$;

-- ============================================
-- Verify Setup
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Seed Data Summary:';
  RAISE NOTICE 'Profiles: %', (SELECT COUNT(*) FROM profiles);
  RAISE NOTICE 'Patients: %', (SELECT COUNT(*) FROM patients);
  RAISE NOTICE 'Doctors: %', (SELECT COUNT(*) FROM doctors);
  RAISE NOTICE 'Therapy Sessions: %', (SELECT COUNT(*) FROM therapy_sessions);
  RAISE NOTICE 'Progress Data: %', (SELECT COUNT(*) FROM progress_data);
  RAISE NOTICE 'Notifications: %', (SELECT COUNT(*) FROM notifications);
  RAISE NOTICE 'Therapy Types: %', (SELECT COUNT(*) FROM therapy_types);
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Create authentication accounts for these users via Supabase Auth:';
  RAISE NOTICE '1. admin@panchakarma.com (password: admin123)';
  RAISE NOTICE '2. sharma@panchakarma.com (password: doctor123)';
  RAISE NOTICE '3. patel@panchakarma.com (password: doctor123)';
  RAISE NOTICE '4. kumar@panchakarma.com (password: doctor123)';
  RAISE NOTICE '5. patient@example.com (password: patient123)';
  RAISE NOTICE '';
  RAISE NOTICE 'You can create these users via:';
  RAISE NOTICE '- Supabase Dashboard > Authentication > Add User';
  RAISE NOTICE '- Or use the Supabase Auth API from your application';
  RAISE NOTICE '===========================================';
END $$;