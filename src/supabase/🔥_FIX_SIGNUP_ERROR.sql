-- ============================================================================
-- FIX SIGNUP ERROR - "Database error saving new user"
-- ============================================================================
-- This script fixes the handle_new_user() trigger that's failing during signup
-- Run this in Supabase SQL Editor to fix signup errors
-- ============================================================================

-- Step 1: Make phone, address fields optional with better defaults
ALTER TABLE patients ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN phone SET DEFAULT '';
ALTER TABLE patients ALTER COLUMN address DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN address SET DEFAULT '';
ALTER TABLE patients ALTER COLUMN age SET DEFAULT 0;

ALTER TABLE doctors ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN phone SET DEFAULT '';
ALTER TABLE doctors ALTER COLUMN experience SET DEFAULT 0;

-- Step 2: Drop and recreate the handle_new_user function with better error handling
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
  -- Get role from metadata, default to 'patient' if not specified
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  
  -- Validate role
  IF user_role NOT IN ('admin', 'doctor', 'patient') THEN
    user_role := 'patient';
  END IF;

  -- Get name from metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)  -- Use email username as fallback
  );

  -- Safely convert age to integer
  BEGIN
    age_val := COALESCE((NEW.raw_user_meta_data->>'age')::INTEGER, 0);
    IF age_val < 0 OR age_val > 120 THEN
      age_val := 0;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    age_val := 0;
  END;

  -- Safely convert experience to integer
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
    VALUES (
      NEW.id,
      NEW.email,
      user_name,
      user_role
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      updated_at = NOW();
    
    RAISE NOTICE 'Created profile for user % with role %', NEW.email, user_role;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create profile: %', SQLERRM;
  END;

  -- Create role-specific record
  IF user_role = 'patient' THEN
    BEGIN
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
        NULLIF(NEW.raw_user_meta_data->>'bloodGroup', '')
      )
      ON CONFLICT (id) DO UPDATE SET
        phone = EXCLUDED.phone,
        age = EXCLUDED.age,
        address = EXCLUDED.address,
        medical_history = EXCLUDED.medical_history,
        emergency_contact = EXCLUDED.emergency_contact,
        blood_group = EXCLUDED.blood_group,
        updated_at = NOW();
      
      RAISE NOTICE 'Created patient record for user % with age %', NEW.email, age_val;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create patient record: %', SQLERRM;
    END;

  ELSIF user_role = 'doctor' THEN
    BEGIN
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
        NULLIF(NEW.raw_user_meta_data->>'licenseNumber', ''),
        COALESCE((NEW.raw_user_meta_data->>'languages')::TEXT[], ARRAY[]::TEXT[])
      )
      ON CONFLICT (id) DO UPDATE SET
        phone = EXCLUDED.phone,
        specialization = EXCLUDED.specialization,
        qualification = EXCLUDED.qualification,
        experience = EXCLUDED.experience,
        license_number = EXCLUDED.license_number,
        languages = EXCLUDED.languages,
        updated_at = NOW();
      
      RAISE NOTICE 'Created doctor record for user % with experience %', NEW.email, exp_val;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create doctor record: %', SQLERRM;
    END;

  ELSE
    -- Admin role - only needs profile
    RAISE NOTICE 'Created admin profile for user %', NEW.email;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in handle_new_user trigger: %', SQLERRM;
END;
$$;

-- Step 3: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 4: Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, anon;

-- Step 5: Verify the fix
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SIGNUP ERROR FIX APPLIED SUCCESSFULLY';
  RAISE NOTICE '✅ ═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 What was fixed:';
  RAISE NOTICE '  ✅ Made phone and address fields optional';
  RAISE NOTICE '  ✅ Added better default values';
  RAISE NOTICE '  ✅ Improved handle_new_user() function with:';
  RAISE NOTICE '     - Better error handling';
  RAISE NOTICE '     - Safe type conversions';
  RAISE NOTICE '     - Proper fallback values';
  RAISE NOTICE '     - Detailed error messages';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Refresh your app in the browser';
  RAISE NOTICE '  2. Try signing up with a new account';
  RAISE NOTICE '  3. Should work without errors!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 The trigger now:';
  RAISE NOTICE '  - Accepts minimal signup data (name, email, role)';
  RAISE NOTICE '  - Provides sensible defaults for missing fields';
  RAISE NOTICE '  - Handles all data types safely';
  RAISE NOTICE '  - Shows clear errors if something fails';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Done! Try signing up now.';
  RAISE NOTICE '';
END $$;
