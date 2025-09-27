import React, { useState, useEffect } from 'react';
import { AuthPage } from './components/AuthPage';
import { AdminDashboard } from './components/AdminDashboard';
import { PatientDashboard } from './components/PatientDashboard';

// Mock user data structure
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'patient';
  password: string;
}

export interface Patient extends User {
  age: number;
  phone: string;
  address: string;
  medicalHistory: string;
  currentTherapies: TherapySession[];
  progressData: ProgressData[];
  notifications: Notification[];
}

export interface TherapySession {
  id: string;
  patientId: string;
  therapyType: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  practitioner: string;
  notes?: string;
  preProcedureInstructions: string[];
  postProcedureInstructions: string[];
}

export interface ProgressData {
  id: string;
  date: string;
  symptomScore: number;
  energyLevel: number;
  sleepQuality: number;
  notes: string;
  feedback: string;
}

export interface Notification {
  id: string;
  type: 'pre-procedure' | 'post-procedure' | 'appointment' | 'reminder';
  title: string;
  message: string;
  date: string;
  read: boolean;
  urgent: boolean;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (simulate session storage)
    const savedUser = localStorage.getItem('panchakarma_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('panchakarma_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('panchakarma_user');
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
      ) : (
        <PatientDashboard user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}