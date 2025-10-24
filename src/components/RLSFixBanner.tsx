import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { X, AlertTriangle, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const SQL_FIX = `-- RLS RECURSION FIX - Run this in Supabase SQL Editor

-- Drop old policies
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

-- Create new non-recursive policies
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "patients_read_own" ON patients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "patients_update_own" ON patients FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "patients_insert_own" ON patients FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "doctors_read_own" ON doctors FOR SELECT USING (auth.uid() = id);
CREATE POLICY "doctors_read_all_authenticated" ON doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "doctors_update_own" ON doctors FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "doctors_insert_own" ON doctors FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "sessions_read_as_patient" ON therapy_sessions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "sessions_read_as_doctor" ON therapy_sessions FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "sessions_insert_as_patient" ON therapy_sessions FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "sessions_update_as_patient" ON therapy_sessions FOR UPDATE USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "sessions_update_as_doctor" ON therapy_sessions FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "progress_read_own" ON progress_data FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "progress_insert_own" ON progress_data FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "progress_update_own" ON progress_data FOR UPDATE USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "feedback_read_own" ON feedback FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "feedback_insert_own" ON feedback FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "feedback_update_own" ON feedback FOR UPDATE USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "notifications_read_own" ON notifications FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);`;

export function RLSFixBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check for RLS errors in console
    const checkForError = () => {
      const consoleError = console.error;
      console.error = (...args: any[]) => {
        consoleError.apply(console, args);
        const msgStr = JSON.stringify(args);
        if (msgStr.includes('42P17') || msgStr.includes('RLS_RECURSION_ERROR')) {
          setHasError(true);
        }
      };
    };

    checkForError();
  }, []);

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_FIX);
    toast.success('✅ SQL copied! Now paste it in Supabase SQL Editor');
  };

  const openSupabase = () => {
    window.open('https://supabase.com/dashboard', '_blank');
    toast.info('Select your project → SQL Editor → Paste → Run');
  };

  if (isDismissed || !hasError) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-red-50 to-orange-50 border-b-4 border-red-500 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <Alert className="bg-white border-red-300">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-bold text-lg text-red-900 mb-1">
                  ⚠️ Action Required: Database RLS Error Detected
                </h3>
                <AlertDescription className="text-red-800">
                  Error Code 42P17: Your Supabase database has an infinite recursion in RLS policies.
                  <strong className="block mt-1">You need to run a SQL fix in your Supabase dashboard (takes 2 minutes).</strong>
                </AlertDescription>
              </div>

              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Fix Steps (2 minutes):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-900">
                  <li>Click "Copy SQL" below</li>
                  <li>Click "Open Supabase" (opens in new tab)</li>
                  <li>Select your project → click "SQL Editor" → click "New query"</li>
                  <li>Paste the SQL (Ctrl+V) and click "RUN"</li>
                  <li>Come back here and refresh this page (Ctrl+Shift+R)</li>
                </ol>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={copySQL}
                  className="bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Copy className="h-5 w-5 mr-2" />
                  1. Copy SQL
                </Button>
                <Button 
                  onClick={openSupabase}
                  variant="outline"
                  size="lg"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  2. Open Supabase
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="lg"
                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  3. Refresh After Fix
                </Button>
              </div>

              <p className="text-sm text-gray-600">
                💡 <strong>Good news:</strong> The app works perfectly in demo mode right now. 
                The fix just enables cloud data storage so your data persists after refresh.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  );
}
