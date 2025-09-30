import React, { useState, useEffect } from 'react';
import { AuthPage } from './components/AuthPage';
import { AdminDashboard } from './components/AdminDashboard';
import { PatientDashboard } from './components/PatientDashboard';
import { DoctorDashboard } from './components/DoctorDashboard';
import { Toaster } from './components/ui/sonner';
import { databaseService } from './utils/database';
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user session exists in localStorage (basic session management)
    const checkSession = async () => {
      try {
        const savedUser = localStorage.getItem('panchakarma_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
        }
        
        // Test connection in background (silent)
        const connectionResult = await databaseService.connection.testConnection();
        
        // Show demo mode notice once per session if using fallback
        const hasSeenDemoNotice = sessionStorage.getItem('demo_notice_shown');
        if (!hasSeenDemoNotice && connectionResult.usingFallback) {
          toast.info('Using demo mode with sample data', {
            description: 'Connect to Supabase for persistent storage',
            duration: 3000
          });
          sessionStorage.setItem('demo_notice_shown', 'true');
        }
      } catch (error) {
        // Silent fail - just continue with demo mode
      }
      setIsLoading(false);
    };

    checkSession();
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

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('panchakarma_user');
    toast.success('Logged out successfully');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
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