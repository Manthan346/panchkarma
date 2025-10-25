import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const SQL_FIX = `-- Run this in Supabase SQL Editor to fix RLS recursion

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Allow users to read own data" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own data" ON profiles;
DROP POLICY IF EXISTS "Temp setup bypass" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Service role bypass" ON profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

DROP POLICY IF EXISTS "Users can view own patient data" ON patients;
DROP POLICY IF EXISTS "Users can update own patient data" ON patients;
DROP POLICY IF EXISTS "Doctors and admins can view patients" ON patients;
DROP POLICY IF EXISTS "Allow users to read own data" ON patients;
DROP POLICY IF EXISTS "Allow users to update own data" ON patients;
DROP POLICY IF EXISTS "patients_read_own" ON patients;
DROP POLICY IF EXISTS "patients_update_own" ON patients;
DROP POLICY IF EXISTS "patients_insert_own" ON patients;

DROP POLICY IF EXISTS "Users can view own doctor data" ON doctors;
DROP POLICY IF EXISTS "Users can update own doctor data" ON doctors;
DROP POLICY IF EXISTS "Public can view doctors" ON doctors;
DROP POLICY IF EXISTS "Allow users to read own data" ON doctors;
DROP POLICY IF EXISTS "Allow users to update own data" ON doctors;
DROP POLICY IF EXISTS "doctors_read_own" ON doctors;
DROP POLICY IF EXISTS "doctors_update_own" ON doctors;
DROP POLICY IF EXISTS "doctors_insert_own" ON doctors;
DROP POLICY IF EXISTS "doctors_read_all" ON doctors;

DROP POLICY IF EXISTS "Users can view own sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Doctors can view their sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Allow users to read own data" ON therapy_sessions;
DROP POLICY IF EXISTS "sessions_read_own" ON therapy_sessions;
DROP POLICY IF EXISTS "sessions_insert_own" ON therapy_sessions;
DROP POLICY IF EXISTS "sessions_update_own" ON therapy_sessions;
DROP POLICY IF EXISTS "sessions_read_doctor" ON therapy_sessions;

DROP POLICY IF EXISTS "progress_read_own" ON progress_data;
DROP POLICY IF EXISTS "progress_insert_own" ON progress_data;
DROP POLICY IF EXISTS "progress_update_own" ON progress_data;

DROP POLICY IF EXISTS "feedback_read_own" ON feedback;
DROP POLICY IF EXISTS "feedback_insert_own" ON feedback;
DROP POLICY IF EXISTS "feedback_update_own" ON feedback;

DROP POLICY IF EXISTS "notifications_read_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;

-- Step 2: Create simple, non-recursive policies

-- PROFILES
CREATE POLICY "profiles_read_own"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- PATIENTS
CREATE POLICY "patients_read_own"
ON patients FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "patients_update_own"
ON patients FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "patients_insert_own"
ON patients FOR INSERT
WITH CHECK (auth.uid() = id);

-- DOCTORS
CREATE POLICY "doctors_read_own"
ON doctors FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "doctors_read_all_authenticated"
ON doctors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "doctors_update_own"
ON doctors FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "doctors_insert_own"
ON doctors FOR INSERT
WITH CHECK (auth.uid() = id);

-- THERAPY_SESSIONS
CREATE POLICY "sessions_read_as_patient"
ON therapy_sessions FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "sessions_read_as_doctor"
ON therapy_sessions FOR SELECT
USING (auth.uid() = doctor_id);

CREATE POLICY "sessions_insert_as_patient"
ON therapy_sessions FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "sessions_update_as_patient"
ON therapy_sessions FOR UPDATE
USING (auth.uid() = patient_id)
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "sessions_update_as_doctor"
ON therapy_sessions FOR UPDATE
USING (auth.uid() = doctor_id);

-- PROGRESS_DATA
CREATE POLICY "progress_read_own"
ON progress_data FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "progress_insert_own"
ON progress_data FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "progress_update_own"
ON progress_data FOR UPDATE
USING (auth.uid() = patient_id)
WITH CHECK (auth.uid() = patient_id);

-- FEEDBACK
CREATE POLICY "feedback_read_own"
ON feedback FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "feedback_insert_own"
ON feedback FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "feedback_update_own"
ON feedback FOR UPDATE
USING (auth.uid() = patient_id)
WITH CHECK (auth.uid() = patient_id);

-- NOTIFICATIONS
CREATE POLICY "notifications_read_own"
ON notifications FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "notifications_insert_own"
ON notifications FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "notifications_update_own"
ON notifications FOR UPDATE
USING (auth.uid() = patient_id)
WITH CHECK (auth.uid() = patient_id);`;

export function RLSErrorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Listen for console errors
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    const checkForRLSError = (message: any) => {
      const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);
      if (msgStr.includes('42P17') || msgStr.includes('infinite recursion detected in policy')) {
        if (!hasError) {
          setHasError(true);
          setIsOpen(true);
        }
      }
    };

    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      args.forEach(checkForRLSError);
    };

    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      args.forEach(checkForRLSError);
    };

    return () => {
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };
  }, [hasError]);

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_FIX);
    toast.success('SQL copied to clipboard!');
  };

  const openSupabase = () => {
    // Try to get project ref from multiple sources
    let projectRef = localStorage.getItem('supabase_project_ref');
    
    // Fallback to extracting from URL or env
    if (!projectRef) {
      try {
        // Try to import from supabase info
        import('../utils/supabase/info').then(module => {
          projectRef = module.projectId;
        });
      } catch (e) {
        projectRef = 'YOUR_PROJECT_REF';
      }
    }
    
    if (projectRef && projectRef !== 'YOUR_PROJECT_REF') {
      window.open(`https://supabase.com/dashboard/project/${projectRef}/sql/new`, '_blank');
    } else {
      window.open('https://supabase.com/dashboard', '_blank');
      toast.info('Select your project, then click SQL Editor');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            Database RLS Error Detected
          </AlertDialogTitle>
          <AlertDialogDescription>
            Your Supabase database has Row Level Security (RLS) policies that reference themselves, creating an infinite loop. Follow the steps below to fix this issue in 2 minutes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 text-sm">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error Code 42P17: Infinite recursion detected in RLS policies
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Quick Fix (2 minutes)</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Click the button below to copy the fix SQL</li>
              <li>Open your Supabase SQL Editor (or click "Open SQL Editor")</li>
              <li>Paste the SQL and click "Run"</li>
              <li>Wait for success message</li>
              <li>Close this dialog and refresh the page</li>
            </ol>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Button onClick={copySQL} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy SQL Fix
              </Button>
              <Button onClick={openSupabase} variant="outline" className="flex-1">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open SQL Editor
              </Button>
            </div>

            <details className="bg-gray-50 border rounded-lg p-3">
              <summary className="cursor-pointer font-medium text-sm">
                Show SQL (Click to expand)
              </summary>
              <pre className="mt-3 text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto max-h-64">
                {SQL_FIX}
              </pre>
            </details>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Don't worry!</strong> The app is running in demo mode with full functionality.
              All features work - your data just isn't saved to the cloud yet.
            </AlertDescription>
          </Alert>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto"
          >
            I'll Fix This Later
          </Button>
          <Button
            onClick={() => {
              copySQL();
              openSupabase();
            }}
            className="w-full sm:w-auto"
          >
            Copy SQL & Open Editor
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
