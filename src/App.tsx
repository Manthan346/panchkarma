import React, { useState, useEffect } from 'react';
import { AuthPage } from './components/AuthPage';
import { AdminDashboard } from './components/AdminDashboard';
import { PatientDashboard } from './components/PatientDashboard';
import { DoctorDashboard } from './components/DoctorDashboard';
import { SupabaseDiagnostic } from './components/SupabaseDiagnostic';
import { Toaster } from './components/ui/sonner';
import { databaseService } from './utils/database-smart';
import { supabase } from './utils/supabase-client';
import { toast } from 'sonner@2.0.3';

// User data structure
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'patient' | 'doctor';
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Patient extends User {
  age: number;
  phone: string;
  address: string;
  medicalHistory: string;
  user_id?: string;
}

export interface Doctor extends User {
  specialization: string;
  phone: string;
  qualification: string;
  experience: number;
  user_id?: string;
}

export interface TherapySession {
  id: string;
  patient_id: string;
  therapy_type: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  practitioner: string;
  doctor_id?: string; // ID reference to the doctor
  notes?: string;
  pre_procedure_instructions: string[];
  post_procedure_instructions: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ProgressData {
  id: string;
  patient_id: string;
  date: string;
  symptom_score: number;
  energy_level: number;
  sleep_quality: number;
  notes: string;
  feedback: string;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  patient_id: string;
  type: 'pre-procedure' | 'post-procedure' | 'appointment' | 'reminder';
  title: string;
  message: string;
  date: string;
  read: boolean;
  urgent: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Feedback {
  id: string;
  patient_id: string;
  session_id: string;
  patient_name?: string;
  therapy_type?: string;
  date: string;
  rating: number; // 1-10 scale
  effectiveness_rating: number; // 1-10 scale
  comfort_rating: number; // 1-10 scale
  feedback: string;
  side_effects: string;
  improvements: string;
  would_recommend: boolean;
  status: 'submitted' | 'reviewed' | 'responded';
  admin_response?: string;
  admin_response_date?: string;
  admin_name?: string;
  created_at?: string;
  updated_at?: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // Check URL for diagnostic mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('diagnostic') === 'true') {
      setShowDiagnostic(true);
      setIsLoading(false);
    }
  }, []);

 useEffect(() => {
  const checkSession = async () => {
    setIsLoading(true);

    try {
      // 1️⃣ Get Supabase session with timeout
      const sessionTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase session timeout')), 5000)
      );

      const { data: { session } } = await Promise.race([
        supabase.auth.getSession(),
        sessionTimeout
      ]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

      // 2️⃣ If session exists, fetch user data safely
      if (session?.user?.id) {
        const userDataTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('getUserData timeout')), 5000)
        );

        const userData = await Promise.race([
          databaseService.auth.getUserData(session.user.id),
          userDataTimeout
        ]);

        if (userData) {
          setCurrentUser(userData);
          localStorage.setItem('panchakarma_user', JSON.stringify(userData));
        } else {
          console.warn('User data not found, falling back to localStorage');
          const savedUser = localStorage.getItem('panchakarma_user');
          if (savedUser) setCurrentUser(JSON.parse(savedUser));
        }
      } else {
        // 3️⃣ No session, fallback to localStorage
        const savedUser = localStorage.getItem('panchakarma_user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
      }
        // Test connection in background (silent)
         try {
        const connResult = await databaseService.connection.testConnection();
        if (connResult.usingFallback) {
          toast.info('📊 Running in Demo Mode', { duration: 4000 });
        } else {
          toast.success('✅ Connected to Supabase', { duration: 3000 });
        }
      } catch (error) {
        console.warn('DB connection test failed:', error);
      }
    } catch (error) {
      console.error('Session check error:', error);
      // Always fallback to localStorage to prevent freeze
      const savedUser = localStorage.getItem('panchakarma_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
    } finally {
      setIsLoading(false); // ✅ ensures app stops showing loading
    }
  };

  checkSession();

    checkSession();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      if (event === 'SIGNED_IN' && session?.user?.id) {
        const userData = await databaseService.auth.getUserData(session.user.id);
        setCurrentUser(userData);
        localStorage.setItem('panchakarma_user', JSON.stringify(userData));
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('panchakarma_user');
      }
    } catch (error) {
      console.log('Auth state change error (demo fallback):', error);
    }
  });

  return () => subscription.unsubscribe();
}, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Store user session (in a real app, use secure tokens)
    localStorage.setItem('panchakarma_user', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }));
    toast.success(`Welcome back, ${user.name}!`);
  };

  const handleLogout = async () => {
    try {
      // Try to sign out from Supabase
      await databaseService.auth.signOut();
    } catch (error) {
      console.log('Supabase signout:', error);
    }
    
    setCurrentUser(null);
    localStorage.removeItem('panchakarma_user');
    toast.success('Logged out successfully');
  };

  // Show diagnostic page if requested
  if (showDiagnostic) {
    return (
      <>
        <SupabaseDiagnostic />
        <Toaster />
      </>
    );
  }



  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {currentUser.role === 'admin' ? (
        <AdminDashboard user={currentUser} onLogout={handleLogout} />
      ) : currentUser.role === 'doctor' ? (
        <DoctorDashboard user={currentUser} onLogout={handleLogout} />
      ) : (
        <PatientDashboard user={currentUser} onLogout={handleLogout} />
      )}
      <Toaster />
    </div>
  );
}