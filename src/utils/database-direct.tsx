import { supabase } from './supabase-client';

// Helper to get/set data in KV store
async function kvGet(key: string) {
  try {
    const { data, error } = await supabase
      .from('kv_store_a3cc576e')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    
    if (error) throw error;
    return data?.value || null;
  } catch (error) {
    console.error(`Error getting key ${key}:`, error);
    return null;
  }
}

async function kvSet(key: string, value: any) {
  try {
    const { error } = await supabase
      .from('kv_store_a3cc576e')
      .upsert({ key, value }, { onConflict: 'key' });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error(`Error setting key ${key}:`, error);
    return { success: false, error };
  }
}

async function kvGetByPrefix(prefix: string) {
  try {
    const { data, error } = await supabase
      .from('kv_store_a3cc576e')
      .select('value')
      .like('key', `${prefix}%`);
    
    if (error) throw error;
    return data?.map(d => d.value) || [];
  } catch (error) {
    console.error(`Error getting prefix ${prefix}:`, error);
    return [];
  }
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Authentication
export const authService = {
  async login(email: string, password: string) {
    try {
      const users = await kvGetByPrefix('user_');
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  },
};

// Users
export const userService = {
  async getUsers() {
    return await kvGetByPrefix('user_');
  },

  async createUser(userData: any) {
    const id = generateId();
    const user = {
      id,
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kvSet(`user_${id}`, user);
    
    // If it's a patient, create patient profile
    if (userData.role === 'patient') {
      const patientProfile = {
        id,
        user_id: id,
        age: userData.age || 0,
        phone: userData.phone || '',
        address: userData.address || '',
        medical_history: userData.medicalHistory || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await kvSet(`patient_${id}`, patientProfile);
    }
    
    // If it's a doctor, create doctor profile
    if (userData.role === 'doctor') {
      const doctorProfile = {
        id,
        user_id: id,
        phone: userData.phone || '',
        specialization: userData.specialization || '',
        qualification: userData.qualification || '',
        experience: userData.experience || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await kvSet(`doctor_${id}`, doctorProfile);
    }
    
    return user;
  },
};

// Patients
export const patientService = {
  async getPatients() {
    const patients = await kvGetByPrefix('patient_');
    const users = await kvGetByPrefix('user_');
    
    return patients.map((patient: any) => {
      const user = users.find((u: any) => u.id === patient.user_id);
      return {
        ...user,
        ...patient,
        age: patient.age,
        phone: patient.phone,
        address: patient.address,
        medicalHistory: patient.medical_history
      };
    });
  },

  async getPatient(id: string) {
    const patient = await kvGet(`patient_${id}`);
    const user = await kvGet(`user_${id}`);
    
    if (!patient || !user) {
      return null;
    }
    
    return {
      ...user,
      ...patient,
      age: patient.age,
      phone: patient.phone,
      address: patient.address,
      medicalHistory: patient.medical_history
    };
  },

  async createPatient(patientData: any) {
    return await userService.createUser({ ...patientData, role: 'patient' });
  },

  async updatePatient(id: string, updates: any) {
    const existingPatient = await kvGet(`patient_${id}`);
    const existingUser = await kvGet(`user_${id}`);
    
    if (!existingPatient || !existingUser) {
      throw new Error('Patient not found');
    }
    
    const updatedPatient = {
      ...existingPatient,
      age: updates.age !== undefined ? updates.age : existingPatient.age,
      phone: updates.phone !== undefined ? updates.phone : existingPatient.phone,
      address: updates.address !== undefined ? updates.address : existingPatient.address,
      medical_history: updates.medicalHistory !== undefined ? updates.medicalHistory : existingPatient.medical_history,
      updated_at: new Date().toISOString()
    };
    
    const updatedUser = {
      ...existingUser,
      name: updates.name !== undefined ? updates.name : existingUser.name,
      email: updates.email !== undefined ? updates.email : existingUser.email,
      updated_at: new Date().toISOString()
    };
    
    await kvSet(`patient_${id}`, updatedPatient);
    await kvSet(`user_${id}`, updatedUser);
    
    return {
      ...updatedUser,
      ...updatedPatient,
      age: updatedPatient.age,
      phone: updatedPatient.phone,
      address: updatedPatient.address,
      medicalHistory: updatedPatient.medical_history
    };
  },
};

// Doctors
export const doctorService = {
  async getDoctors() {
    const doctors = await kvGetByPrefix('doctor_');
    const users = await kvGetByPrefix('user_');
    
    return doctors.map((doctor: any) => {
      const user = users.find((u: any) => u.id === doctor.user_id);
      return {
        ...user,
        ...doctor,
        phone: doctor.phone,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience
      };
    });
  },

  async getDoctor(id: string) {
    const doctor = await kvGet(`doctor_${id}`);
    const user = await kvGet(`user_${id}`);
    
    if (!doctor || !user) {
      return null;
    }
    
    return {
      ...user,
      ...doctor,
      phone: doctor.phone,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience
    };
  },

  async createDoctor(doctorData: any) {
    return await userService.createUser({ ...doctorData, role: 'doctor' });
  },

  async updateDoctor(id: string, updates: any) {
    const existingDoctor = await kvGet(`doctor_${id}`);
    const existingUser = await kvGet(`user_${id}`);
    
    if (!existingDoctor || !existingUser) {
      throw new Error('Doctor not found');
    }
    
    const updatedDoctor = {
      ...existingDoctor,
      phone: updates.phone !== undefined ? updates.phone : existingDoctor.phone,
      specialization: updates.specialization !== undefined ? updates.specialization : existingDoctor.specialization,
      qualification: updates.qualification !== undefined ? updates.qualification : existingDoctor.qualification,
      experience: updates.experience !== undefined ? updates.experience : existingDoctor.experience,
      updated_at: new Date().toISOString()
    };
    
    const updatedUser = {
      ...existingUser,
      name: updates.name !== undefined ? updates.name : existingUser.name,
      email: updates.email !== undefined ? updates.email : existingUser.email,
      updated_at: new Date().toISOString()
    };
    
    await kvSet(`doctor_${id}`, updatedDoctor);
    await kvSet(`user_${id}`, updatedUser);
    
    return {
      ...updatedUser,
      ...updatedDoctor,
      phone: updatedDoctor.phone,
      specialization: updatedDoctor.specialization,
      qualification: updatedDoctor.qualification,
      experience: updatedDoctor.experience
    };
  },
};

// Therapy Sessions
export const therapySessionService = {
  async getTherapySessions() {
    return await kvGetByPrefix('therapy_session_');
  },

  async getPatientTherapySessions(patientId: string) {
    const allSessions = await kvGetByPrefix('therapy_session_');
    return allSessions.filter((session: any) => session.patient_id === patientId);
  },

  async createTherapySession(sessionData: any) {
    const id = generateId();
    const session = {
      id,
      ...sessionData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kvSet(`therapy_session_${id}`, session);
    return session;
  },

  async updateTherapySession(id: string, updates: any) {
    const existingSession = await kvGet(`therapy_session_${id}`);
    if (!existingSession) {
      throw new Error('Therapy session not found');
    }
    
    const updatedSession = {
      ...existingSession,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await kvSet(`therapy_session_${id}`, updatedSession);
    return updatedSession;
  },
};

// Progress Data
export const progressService = {
  async getPatientProgress(patientId: string) {
    const allProgress = await kvGetByPrefix('progress_');
    return allProgress.filter((progress: any) => progress.patient_id === patientId);
  },

  async createProgressEntry(progressData: any) {
    const id = generateId();
    const progress = {
      id,
      ...progressData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kvSet(`progress_${id}`, progress);
    return progress;
  },
};

// Notifications
export const notificationService = {
  async getPatientNotifications(patientId: string) {
    const allNotifications = await kvGetByPrefix('notification_');
    return allNotifications.filter((notification: any) => notification.patient_id === patientId);
  },

  async createNotification(notificationData: any) {
    const id = generateId();
    const notification = {
      id,
      ...notificationData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kvSet(`notification_${id}`, notification);
    return notification;
  },

  async updateNotification(id: string, updates: any) {
    const existingNotification = await kvGet(`notification_${id}`);
    if (!existingNotification) {
      throw new Error('Notification not found');
    }
    
    const updatedNotification = {
      ...existingNotification,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await kvSet(`notification_${id}`, updatedNotification);
    return updatedNotification;
  },
};

// Reference Data
export const referenceDataService = {
  async getTherapyTypes() {
    const data = await kvGet('therapy_types');
    return data || [];
  },

  async getPractitioners() {
    const data = await kvGet('practitioners');
    return data || [];
  },
};

// Analytics
export const analyticsService = {
  async getAnalytics() {
    const sessions = await kvGetByPrefix('therapy_session_');
    const patients = await kvGetByPrefix('patient_');
    const progress = await kvGetByPrefix('progress_');
    
    const totalPatients = patients.length;
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s: any) => s.status === 'completed').length;
    const upcomingSessions = sessions.filter((s: any) => s.status === 'scheduled').length;
    
    const avgSymptomScore = progress.reduce((sum: number, p: any) => sum + p.symptom_score, 0) / (progress.length || 1);
    const avgEnergyLevel = progress.reduce((sum: number, p: any) => sum + p.energy_level, 0) / (progress.length || 1);
    const avgSleepQuality = progress.reduce((sum: number, p: any) => sum + p.sleep_quality, 0) / (progress.length || 1);
    
    return {
      totalPatients,
      totalSessions,
      completedSessions,
      upcomingSessions,
      avgSymptomScore: Math.round(avgSymptomScore * 10) / 10,
      avgEnergyLevel: Math.round(avgEnergyLevel * 10) / 10,
      avgSleepQuality: Math.round(avgSleepQuality * 10) / 10
    };
  },
};

// Connection test
export const connectionService = {
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('kv_store_a3cc576e')
        .select('count', { count: 'exact', head: true });
      
      if (error) throw error;
      
      return { 
        success: true, 
        message: 'Connected to Supabase',
        usingFallback: false,
        supabaseAvailable: true
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Connection failed',
        usingFallback: true,
        supabaseAvailable: false,
        error
      };
    }
  },
  
  getStatus() {
    return {
      supabaseAvailable: true,
      usingDemoMode: false,
    };
  }
};

// Combined service for easy access
export const databaseServiceDirect = {
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