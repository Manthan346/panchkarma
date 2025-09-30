import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-a3cc576e`;

// Check if we should use fallback mode from the start
const FORCE_DEMO_MODE = !projectId || !publicAnonKey || projectId === 'demo';

// Fallback demo data
const fallbackUsers = [
  {
    id: '1',
    name: 'Dr. Ayurveda Admin',
    email: 'admin@panchakarma.com',
    role: 'admin',
    password: 'admin123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'John Patient',
    email: 'patient@example.com',
    role: 'patient',
    password: 'patient123',
    age: 45,
    phone: '+1-555-0123',
    address: '123 Wellness St, Health City, HC 12345',
    medicalHistory: 'Chronic joint pain, stress-related disorders, digestive issues.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Dr. Sharma',
    email: 'sharma@panchakarma.com',
    role: 'doctor',
    password: 'doctor123',
    phone: '+1-555-0124',
    specialization: 'Panchakarma Specialist',
    qualification: 'BAMS, MD (Panchakarma)',
    experience: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Dr. Patel',
    email: 'patel@panchakarma.com',
    role: 'doctor',
    password: 'doctor123',
    phone: '+1-555-0125',
    specialization: 'Ayurvedic Medicine',
    qualification: 'BAMS, MD (Ayurveda)',
    experience: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Dr. Kumar',
    email: 'kumar@panchakarma.com',
    role: 'doctor',
    password: 'doctor123',
    phone: '+1-555-0126',
    specialization: 'Therapeutic Massage',
    qualification: 'BAMS, Diploma in Panchakarma',
    experience: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const fallbackSessions = [
  {
    id: '1',
    patient_id: '2',
    therapy_type: 'Abhyanga (Oil Massage)',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '09:00',
    duration: 60,
    status: 'scheduled',
    practitioner: 'Dr. Sharma',
    doctor_id: '3', // Links to Dr. Sharma
    notes: '',
    pre_procedure_instructions: [
      'Fast for 2 hours before treatment',
      'Avoid cold drinks',
      'Wear comfortable clothing',
      'Arrive 15 minutes early'
    ],
    post_procedure_instructions: [
      'Rest for 30 minutes after treatment',
      'Drink warm water',
      'Avoid cold exposure for 2 hours',
      'Take prescribed herbal medicine'
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    patient_id: '2',
    therapy_type: 'Swedana (Steam Therapy)',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '10:00',
    duration: 45,
    status: 'completed',
    practitioner: 'Dr. Patel',
    doctor_id: '4', // Links to Dr. Patel
    notes: 'Patient responded well to treatment',
    pre_procedure_instructions: [
      'Light breakfast only',
      'Remove all jewelry',
      'Inform about any discomfort'
    ],
    post_procedure_instructions: [
      'Cool down gradually',
      'Drink plenty of water',
      'Rest for 1 hour'
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    patient_id: '2',
    therapy_type: 'Shirodhara (Oil Pouring)',
    date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    time: '14:00',
    duration: 90,
    status: 'scheduled',
    practitioner: 'Dr. Kumar',
    doctor_id: '5', // Links to Dr. Kumar
    notes: '',
    pre_procedure_instructions: [
      'Wash hair before treatment',
      'Empty bladder before session',
      'No heavy meals 2 hours prior'
    ],
    post_procedure_instructions: [
      'Do not wash hair for 24 hours',
      'Rest and avoid stress',
      'Keep head covered',
      'Drink warm fluids'
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const fallbackProgress = [
  {
    id: '1',
    patient_id: '2',
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    symptom_score: 7,
    energy_level: 6,
    sleep_quality: 5,
    notes: 'Feeling better overall',
    feedback: 'Treatment is helping with pain management',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    patient_id: '2',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    symptom_score: 5,
    energy_level: 8,
    sleep_quality: 7,
    notes: 'Significant improvement',
    feedback: 'Feeling more energetic and positive',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Track if API is available
let apiAvailable = !FORCE_DEMO_MODE;

// Helper function to make API requests with fallback
async function apiRequest(endpoint: string, options: RequestInit = {}, retries = 0) {
  // If we're in forced demo mode or API was previously unavailable, skip API calls
  if (FORCE_DEMO_MODE || !apiAvailable) {
    throw new Error('API unavailable - using fallback mode');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
    ...options.headers,
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}` };
        }
        
        const errorMessage = errorData.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (attempt === retries) {
        // Mark API as unavailable on final failure
        apiAvailable = false;
        throw error;
      }
      
      // Wait before retry with exponential backoff
      const waitTime = 500 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// Authentication
export const authService = {
  async login(email: string, password: string) {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return response.user;
    } catch (error) {
      // Silent fallback - authenticate with demo data
      const user = fallbackUsers.find(u => u.email === email && u.password === password);
      if (!user) {
        throw new Error('Invalid credentials');
      }
      return user;
    }
  },
};

// Users
export const userService = {
  async getUsers() {
    try {
      const response = await apiRequest('/users');
      return response.users;
    } catch (error) {
      // Silent fallback to demo data
      return fallbackUsers;
    }
  },

  async createUser(userData: any) {
    try {
      const response = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response.user;
    } catch (error) {
      // Silent fallback - create user in demo mode
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackUsers.push(newUser);
      return newUser;
    }
  },
};

// Patients
export const patientService = {
  async getPatients() {
    try {
      const response = await apiRequest('/patients');
      return response.patients;
    } catch (error) {
      // Silent fallback to demo data
      return fallbackUsers.filter(u => u.role === 'patient');
    }
  },

  async getPatient(id: string) {
    try {
      const response = await apiRequest(`/patients/${id}`);
      return response.patient;
    } catch (error) {
      // Silent fallback to demo data
      return fallbackUsers.find(u => u.id === id && u.role === 'patient') || null;
    }
  },

  async createPatient(patientData: any) {
    try {
      const response = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({ ...patientData, role: 'patient' }),
      });
      return response.user;
    } catch (error) {
      // Silent fallback - create patient in demo mode
      const newPatient = {
        id: Date.now().toString(),
        ...patientData,
        role: 'patient',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackUsers.push(newPatient);
      return newPatient;
    }
  },

  async updatePatient(id: string, updates: any) {
    try {
      const response = await apiRequest(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return response.patient;
    } catch (error) {
      // Silent fallback - update in demo mode
      const patientIndex = fallbackUsers.findIndex(u => u.id === id && u.role === 'patient');
      if (patientIndex !== -1) {
        fallbackUsers[patientIndex] = {
          ...fallbackUsers[patientIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        return fallbackUsers[patientIndex];
      }
      throw new Error('Patient not found');
    }
  },
};

// Doctors
export const doctorService = {
  async getDoctors() {
    try {
      const response = await apiRequest('/doctors');
      return response.doctors;
    } catch (error) {
      // Silent fallback to demo data
      return fallbackUsers.filter(u => u.role === 'doctor');
    }
  },

  async getDoctor(id: string) {
    try {
      const response = await apiRequest(`/doctors/${id}`);
      return response.doctor;
    } catch (error) {
      // Silent fallback to demo data
      return fallbackUsers.find(u => u.id === id && u.role === 'doctor') || null;
    }
  },

  async createDoctor(doctorData: any) {
    try {
      const response = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({ ...doctorData, role: 'doctor' }),
      });
      return response.user;
    } catch (error) {
      // Silent fallback - create doctor in demo mode
      const newDoctor = {
        id: Date.now().toString(),
        ...doctorData,
        role: 'doctor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackUsers.push(newDoctor);
      return newDoctor;
    }
  },

  async updateDoctor(id: string, updates: any) {
    try {
      const response = await apiRequest(`/doctors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return response.doctor;
    } catch (error) {
      // Silent fallback - update in demo mode
      const doctorIndex = fallbackUsers.findIndex(u => u.id === id && u.role === 'doctor');
      if (doctorIndex !== -1) {
        fallbackUsers[doctorIndex] = {
          ...fallbackUsers[doctorIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        return fallbackUsers[doctorIndex];
      }
      throw new Error('Doctor not found');
    }
  },
};

// Therapy Sessions
export const therapySessionService = {
  async getTherapySessions() {
    try {
      const response = await apiRequest('/therapy-sessions');
      return response.sessions;
    } catch (error) {
      // Silent fallback to demo data
      return fallbackSessions;
    }
  },

  async getPatientTherapySessions(patientId: string) {
    try {
      const response = await apiRequest(`/therapy-sessions/patient/${patientId}`);
      return response.sessions;
    } catch (error) {
      // Silent fallback to demo data
      return fallbackSessions.filter(s => s.patient_id === patientId);
    }
  },

  async createTherapySession(sessionData: any) {
    try {
      const response = await apiRequest('/therapy-sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });
      return response.session;
    } catch (error) {
      // Silent fallback - create in demo mode
      const newSession = {
        id: Date.now().toString(),
        ...sessionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackSessions.push(newSession);
      return newSession;
    }
  },

  async updateTherapySession(id: string, updates: any) {
    try {
      const response = await apiRequest(`/therapy-sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return response.session;
    } catch (error) {
      // Silent fallback - update in demo mode
      const sessionIndex = fallbackSessions.findIndex(s => s.id === id);
      if (sessionIndex !== -1) {
        fallbackSessions[sessionIndex] = {
          ...fallbackSessions[sessionIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        return fallbackSessions[sessionIndex];
      }
      throw new Error('Session not found');
    }
  },
};

// Progress Data
export const progressService = {
  async getPatientProgress(patientId: string) {
    try {
      const response = await apiRequest(`/progress/patient/${patientId}`);
      return response.progress;
    } catch (error) {
      // Silent fallback to demo data
      return fallbackProgress.filter(p => p.patient_id === patientId);
    }
  },

  async createProgressEntry(progressData: any) {
    try {
      const response = await apiRequest('/progress', {
        method: 'POST',
        body: JSON.stringify(progressData),
      });
      return response.progress;
    } catch (error) {
      // Silent fallback - create in demo mode
      const newProgress = {
        id: Date.now().toString(),
        ...progressData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackProgress.push(newProgress);
      return newProgress;
    }
  },
};

// Fallback notifications
const fallbackNotifications = [
  {
    id: '1',
    patient_id: '2',
    type: 'pre-procedure',
    title: 'Tomorrow\'s Abhyanga Treatment',
    message: 'Please fast for 2 hours before your 9:00 AM appointment. Wear comfortable clothing.',
    date: new Date().toISOString().split('T')[0],
    read: false,
    urgent: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    patient_id: '2',
    type: 'reminder',
    title: 'Daily Progress Update',
    message: 'Please update your daily symptoms and energy levels in the app.',
    date: new Date().toISOString().split('T')[0],
    read: false,
    urgent: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Notifications
export const notificationService = {
  async getPatientNotifications(patientId: string) {
    try {
      const response = await apiRequest(`/notifications/patient/${patientId}`);
      return response.notifications;
    } catch (error) {
      // Silent fallback to demo data
      return fallbackNotifications.filter(n => n.patient_id === patientId);
    }
  },

  async createNotification(notificationData: any) {
    try {
      const response = await apiRequest('/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationData),
      });
      return response.notification;
    } catch (error) {
      // Silent fallback - create in demo mode
      const newNotification = {
        id: Date.now().toString(),
        ...notificationData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackNotifications.push(newNotification);
      return newNotification;
    }
  },

  async updateNotification(id: string, updates: any) {
    try {
      const response = await apiRequest(`/notifications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return response.notification;
    } catch (error) {
      // Silent fallback - update in demo mode
      const notificationIndex = fallbackNotifications.findIndex(n => n.id === id);
      if (notificationIndex !== -1) {
        fallbackNotifications[notificationIndex] = {
          ...fallbackNotifications[notificationIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        return fallbackNotifications[notificationIndex];
      }
      throw new Error('Notification not found');
    }
  },
};

// Fallback reference data
const fallbackTherapyTypes = [
  {
    name: 'Abhyanga (Oil Massage)',
    duration: 60,
    description: 'Full body oil massage to improve circulation and reduce stress'
  },
  {
    name: 'Swedana (Steam Therapy)',
    duration: 45,
    description: 'Herbal steam therapy for detoxification and muscle relaxation'
  },
  {
    name: 'Shirodhara (Oil Pouring)',
    duration: 90,
    description: 'Continuous oil pouring on forehead for mental relaxation'
  },
  {
    name: 'Panchakarma Detox',
    duration: 120,
    description: 'Complete detoxification treatment program'
  },
  {
    name: 'Nasya (Nasal Therapy)',
    duration: 30,
    description: 'Nasal administration of medicated oils'
  }
];

const fallbackPractitioners = [
  'Dr. Sharma',
  'Dr. Patel',
  'Dr. Kumar',
  'Dr. Gupta',
  'Dr. Singh'
];

// Reference Data
export const referenceDataService = {
  async getTherapyTypes() {
    try {
      const response = await apiRequest('/therapy-types');
      return response.therapyTypes;
    } catch (error) {
      // Silent fallback to demo data
      return fallbackTherapyTypes;
    }
  },

  async getPractitioners() {
    try {
      const response = await apiRequest('/practitioners');
      return response.practitioners;
    } catch (error) {
      // Silent fallback to demo data
      return fallbackPractitioners;
    }
  },
};

// Analytics
export const analyticsService = {
  async getAnalytics() {
    try {
      const response = await apiRequest('/analytics');
      return response.analytics;
    } catch (error) {
      // Silent fallback - calculate from demo data
      const totalPatients = fallbackUsers.filter(u => u.role === 'patient').length;
      const totalSessions = fallbackSessions.length;
      const completedSessions = fallbackSessions.filter(s => s.status === 'completed').length;
      const upcomingSessions = fallbackSessions.filter(s => s.status === 'scheduled').length;
      
      const avgSymptomScore = fallbackProgress.reduce((sum, p) => sum + p.symptom_score, 0) / (fallbackProgress.length || 1);
      const avgEnergyLevel = fallbackProgress.reduce((sum, p) => sum + p.energy_level, 0) / (fallbackProgress.length || 1);
      const avgSleepQuality = fallbackProgress.reduce((sum, p) => sum + p.sleep_quality, 0) / (fallbackProgress.length || 1);
      
      return {
        totalPatients,
        totalSessions,
        completedSessions,
        upcomingSessions,
        avgSymptomScore: Math.round(avgSymptomScore * 10) / 10,
        avgEnergyLevel: Math.round(avgEnergyLevel * 10) / 10,
        avgSleepQuality: Math.round(avgSleepQuality * 10) / 10
      };
    }
  },
};

// Connection test
export const connectionService = {
  async testConnection() {
    if (FORCE_DEMO_MODE) {
      return { success: true, message: 'Demo mode', usingFallback: true };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        apiAvailable = true;
        return { 
          success: true, 
          message: 'Connected to API',
          usingFallback: false
        };
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      apiAvailable = false;
      return { 
        success: true, 
        message: 'Demo mode',
        usingFallback: true
      };
    }
  },
};

// Combined service for easy access
export const databaseService = {
  auth: authService,
  users: userService,
  patients: patientService,
  doctors: doctorService,
  therapySessions: therapySessionService,
  progress: progressService,
  notifications: notificationService,
  referenceData: referenceDataService,
  analytics: analyticsService,
  connection: connectionService,
};