import { supabase } from './supabase-client';
import { toast } from 'sonner@2.0.3';

// Helper to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================
// AUTHENTICATION SERVICE
// ============================================
export const authService = {
  async signUp(email: string, password: string, userData: any) {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.name,
            role: userData.role
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: userData.name,
          role: userData.role
        });

      if (profileError) throw profileError;

      // Create role-specific profile
      if (userData.role === 'patient') {
        const { error: patientError } = await supabase
          .from('patients')
          .insert({
            id: authData.user.id,
            phone: userData.phone || '',
            age: userData.age || 0,
            address: userData.address || '',
            medical_history: userData.medicalHistory || ''
          });

        if (patientError) throw patientError;
      } else if (userData.role === 'doctor') {
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert({
            id: authData.user.id,
            phone: userData.phone || '',
            specialization: userData.specialization || 'General Ayurveda',
            qualification: userData.qualification || 'BAMS',
            experience: userData.experience || 0
          });

        if (doctorError) throw doctorError;
      }

      // Get complete user data
      return await this.getUserData(authData.user.id);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

      return await this.getUserData(data.user.id);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Invalid email or password');
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      return await this.getUserData(user.id);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async getUserData(userId: string) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    let additionalData = {};

    if (profile.role === 'patient') {
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', userId)
        .single();

      additionalData = {
        phone: patientData?.phone || '',
        age: patientData?.age || 0,
        address: patientData?.address || '',
        medicalHistory: patientData?.medical_history || ''
      };
    } else if (profile.role === 'doctor') {
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', userId)
        .single();

      additionalData = {
        phone: doctorData?.phone || '',
        specialization: doctorData?.specialization || '',
        qualification: doctorData?.qualification || '',
        experience: doctorData?.experience || 0
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      role: profile.role,
      ...additionalData
    };
  },

  // Legacy login method for backward compatibility
  async login(email: string, password: string) {
    return await this.signIn(email, password);
  }
};

// ============================================
// USERS SERVICE
// ============================================
export const userService = {
  async getUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createUser(userData: any) {
    // For admin creating users, we'll use the auth service
    return await authService.signUp(
      userData.email,
      userData.password || 'TempPass123!',
      userData
    );
  }
};

// ============================================
// PATIENTS SERVICE
// ============================================
export const patientService = {
  async getPatients() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        patients (*)
      `)
      .eq('role', 'patient')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      role: profile.role,
      phone: profile.patients?.[0]?.phone || '',
      age: profile.patients?.[0]?.age || 0,
      address: profile.patients?.[0]?.address || '',
      medicalHistory: profile.patients?.[0]?.medical_history || '',
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }));
  },

  async getPatient(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        patients (*)
      `)
      .eq('id', id)
      .eq('role', 'patient')
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.full_name,
      role: data.role,
      phone: data.patients?.[0]?.phone || '',
      age: data.patients?.[0]?.age || 0,
      address: data.patients?.[0]?.address || '',
      medicalHistory: data.patients?.[0]?.medical_history || ''
    };
  },

  async createPatient(patientData: any) {
    return await authService.signUp(
      patientData.email,
      patientData.password || 'Patient123!',
      { ...patientData, role: 'patient' }
    );
  },

  async updatePatient(id: string, updates: any) {
    // Update profile
    if (updates.name || updates.email) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          ...(updates.name && { full_name: updates.name }),
          ...(updates.email && { email: updates.email })
        })
        .eq('id', id);

      if (profileError) throw profileError;
    }

    // Update patient data
    const { error: patientError } = await supabase
      .from('patients')
      .update({
        ...(updates.phone !== undefined && { phone: updates.phone }),
        ...(updates.age !== undefined && { age: updates.age }),
        ...(updates.address !== undefined && { address: updates.address }),
        ...(updates.medicalHistory !== undefined && { medical_history: updates.medicalHistory })
      })
      .eq('id', id);

    if (patientError) throw patientError;

    return await this.getPatient(id);
  }
};

// ============================================
// DOCTORS SERVICE
// ============================================
export const doctorService = {
  async getDoctors() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        doctors (*)
      `)
      .eq('role', 'doctor')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      role: profile.role,
      phone: profile.doctors?.[0]?.phone || '',
      specialization: profile.doctors?.[0]?.specialization || '',
      qualification: profile.doctors?.[0]?.qualification || '',
      experience: profile.doctors?.[0]?.experience || 0,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }));
  },

  async getDoctor(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        doctors (*)
      `)
      .eq('id', id)
      .eq('role', 'doctor')
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.full_name,
      role: data.role,
      phone: data.doctors?.[0]?.phone || '',
      specialization: data.doctors?.[0]?.specialization || '',
      qualification: data.doctors?.[0]?.qualification || '',
      experience: data.doctors?.[0]?.experience || 0
    };
  },

  async createDoctor(doctorData: any) {
    return await authService.signUp(
      doctorData.email,
      doctorData.password || 'Doctor123!',
      { ...doctorData, role: 'doctor' }
    );
  },

  async updateDoctor(id: string, updates: any) {
    // Update profile
    if (updates.name || updates.email) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          ...(updates.name && { full_name: updates.name }),
          ...(updates.email && { email: updates.email })
        })
        .eq('id', id);

      if (profileError) throw profileError;
    }

    // Update doctor data
    const { error: doctorError } = await supabase
      .from('doctors')
      .update({
        ...(updates.phone !== undefined && { phone: updates.phone }),
        ...(updates.specialization !== undefined && { specialization: updates.specialization }),
        ...(updates.qualification !== undefined && { qualification: updates.qualification }),
        ...(updates.experience !== undefined && { experience: updates.experience })
      })
      .eq('id', id);

    if (doctorError) throw doctorError;

    return await this.getDoctor(id);
  }
};

// ============================================
// THERAPY SESSIONS SERVICE
// ============================================
export const therapySessionService = {
  async getTherapySessions() {
    const { data, error } = await supabase
      .from('therapy_sessions')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getPatientTherapySessions(patientId: string) {
    const { data, error } = await supabase
      .from('therapy_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createTherapySession(sessionData: any) {
    const { data, error } = await supabase
      .from('therapy_sessions')
      .insert({
        patient_id: sessionData.patient_id,
        doctor_id: sessionData.doctor_id || null,
        therapy_type: sessionData.therapy_type,
        date: sessionData.date,
        time: sessionData.time,
        duration: sessionData.duration || 60,
        status: sessionData.status || 'scheduled',
        practitioner: sessionData.practitioner || '',
        notes: sessionData.notes || '',
        pre_procedure_instructions: sessionData.pre_procedure_instructions || [],
        post_procedure_instructions: sessionData.post_procedure_instructions || []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTherapySession(id: string, updates: any) {
    const { data, error } = await supabase
      .from('therapy_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTherapySession(id: string) {
    const { error } = await supabase
      .from('therapy_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ============================================
// PROGRESS SERVICE
// ============================================
export const progressService = {
  async getPatientProgress(patientId: string) {
    const { data, error } = await supabase
      .from('progress_data')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createProgressEntry(progressData: any) {
    const { data, error } = await supabase
      .from('progress_data')
      .insert({
        patient_id: progressData.patient_id,
        date: progressData.date,
        symptom_score: progressData.symptom_score,
        energy_level: progressData.energy_level,
        sleep_quality: progressData.sleep_quality,
        notes: progressData.notes || '',
        feedback: progressData.feedback || ''
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ============================================
// NOTIFICATIONS SERVICE
// ============================================
export const notificationService = {
  async getPatientNotifications(patientId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createNotification(notificationData: any) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        patient_id: notificationData.patient_id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        read: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateNotification(id: string, updates: any) {
    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAsRead(id: string) {
    return await this.updateNotification(id, { read: true });
  },

  async markAllAsRead(patientId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('patient_id', patientId)
      .eq('read', false);

    if (error) throw error;
  }
};

// ============================================
// FEEDBACK SERVICE
// ============================================
export const feedbackService = {
  async getFeedback() {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPatientFeedback(patientId: string) {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createFeedback(feedbackData: any) {
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        patient_id: feedbackData.patient_id,
        patient_name: feedbackData.patient_name,
        session_id: feedbackData.session_id || null,
        therapy_type: feedbackData.therapy_type,
        overall_rating: feedbackData.overall_rating,
        effectiveness_rating: feedbackData.effectiveness_rating,
        comfort_rating: feedbackData.comfort_rating,
        experience: feedbackData.experience || '',
        improvements: feedbackData.improvements || '',
        side_effects: feedbackData.side_effects || '',
        would_recommend: feedbackData.would_recommend !== false,
        status: 'submitted'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateFeedback(id: string, updates: any) {
    const { data, error } = await supabase
      .from('feedback')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async respondToFeedback(id: string, response: string, respondedBy: string) {
    return await this.updateFeedback(id, {
      admin_response: response,
      responded_by: respondedBy,
      responded_at: new Date().toISOString(),
      status: 'responded'
    });
  }
};

// ============================================
// REFERENCE DATA SERVICE
// ============================================
export const referenceDataService = {
  async getTherapyTypes() {
    const { data, error } = await supabase
      .from('therapy_types')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getPractitioners() {
    // Get all doctors as practitioners
    const doctors = await doctorService.getDoctors();
    return doctors.map(d => d.name);
  }
};

// ============================================
// ANALYTICS SERVICE
// ============================================
export const analyticsService = {
  async getAnalytics() {
    const [sessions, patients, progressData] = await Promise.all([
      therapySessionService.getTherapySessions(),
      patientService.getPatients(),
      supabase.from('progress_data').select('*')
    ]);

    const totalPatients = patients.length;
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const upcomingSessions = sessions.filter(s => s.status === 'scheduled').length;

    const progress = progressData.data || [];
    const avgSymptomScore = progress.length > 0
      ? progress.reduce((sum, p) => sum + p.symptom_score, 0) / progress.length
      : 0;
    const avgEnergyLevel = progress.length > 0
      ? progress.reduce((sum, p) => sum + p.energy_level, 0) / progress.length
      : 0;
    const avgSleepQuality = progress.length > 0
      ? progress.reduce((sum, p) => sum + p.sleep_quality, 0) / progress.length
      : 0;

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
};

// ============================================
// CONNECTION SERVICE
// ============================================
export const connectionService = {
  async testConnection() {
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      
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
      usingDemoMode: false
    };
  }
};

// ============================================
// COMBINED DATABASE SERVICE
// ============================================
export const supabaseDatabaseService = {
  auth: authService,
  users: userService,
  patients: patientService,
  doctors: doctorService,
  therapySessions: therapySessionService,
  progress: progressService,
  notifications: notificationService,
  feedback: feedbackService,
  referenceData: referenceDataService,
  analytics: analyticsService,
  connection: connectionService
};