import { supabase } from './supabase-client';
import { toast } from 'sonner';

// ============================================
// AUTHENTICATION SERVICE - NO TIMEOUTS
// ============================================
export const authService = {
  async signUp(email: string, password: string, userData: any) {
    try {
      console.log('🔐 Starting signup for:', email, 'role:', userData.role);
      
      // Prepare all user metadata for the trigger to handle
      const userMetadata: any = {
        full_name: userData.name,
        role: userData.role
      };

      // Add role-specific metadata
      if (userData.role === 'patient') {
        userMetadata.phone = userData.phone || '';
        userMetadata.age = userData.age != null ? String(userData.age) : '0';
        userMetadata.address = userData.address || '';
        userMetadata.medicalHistory = userData.medicalHistory || '';
        console.log(`👤 Preparing patient signup with age: ${userData.age} -> ${userMetadata.age}`);
      } else if (userData.role === 'doctor') {
        userMetadata.phone = userData.phone || '';
        userMetadata.specialization = userData.specialization || 'General Ayurveda';
        userMetadata.qualification = userData.qualification || 'BAMS';
        userMetadata.experience = userData.experience != null ? String(userData.experience) : '0';
        console.log(`👨‍⚕️ Preparing doctor signup with experience: ${userData.experience} -> ${userMetadata.experience}`);
      }

      console.log('📦 Signup metadata:', userMetadata);
      
      // Let the database trigger handle all record creation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata
        }
      });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        throw authError;
      }
      if (!authData.user) {
        console.error('❌ No user returned from signup');
        throw new Error('User creation failed');
      }

      const userId = authData.user.id;
      console.log('✅ Auth user created with ID:', userId);
      console.log('✅ Database trigger automatically created profile and role-specific records');

      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('🎉 Signup completed successfully for:', userId);
      return await this.getUserData(userId);
    } catch (error: any) {
      console.error('❌ SignUp error:', error);
      throw error;
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed');

      return await this.getUserData(data.user.id);
    } catch (error: any) {
      console.error('❌ SignIn error:', error);
      throw error;
    }
  },

  // Alias for signIn (for compatibility)
  async login(email: string, password: string) {
    return await this.signIn(email, password);
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  },

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      return await this.getUserData(user.id);
    } catch (error) {
      console.error('❌ Get current user error:', error);
      return null;
    }
  },

  async getUserData(userId: string) {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('User not found');

      // Fetch role-specific data
      let roleData = null;
      if (profile.role === 'patient') {
        const { data } = await supabase
          .from('patients')
          .select('*')
          .eq('id', userId)
          .single();
        roleData = data;
      } else if (profile.role === 'doctor') {
        const { data } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', userId)
          .single();
        roleData = data;
      }

      // Format user data
      const baseData = {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        role: profile.role
      };

      if (profile.role === 'patient' && roleData) {
        const age = roleData.age != null ? Number(roleData.age) : 0;
        console.log(`📊 getUserData patient age: ${roleData.age} -> ${age}`);
        
        return {
          ...baseData,
          phone: roleData.phone || '',
          age: age,
          address: roleData.address || '',
          medicalHistory: roleData.medical_history || ''
        };
      } else if (profile.role === 'doctor' && roleData) {
        const experience = roleData.experience != null ? Number(roleData.experience) : 0;
        console.log(`📊 getUserData doctor experience: ${roleData.experience} -> ${experience}`);
        
        return {
          ...baseData,
          phone: roleData.phone || '',
          specialization: roleData.specialization || '',
          qualification: roleData.qualification || '',
          experience: experience
        };
      }

      return baseData;
    } catch (error: any) {
      console.error('❌ getUserData error:', error);
      throw error;
    }
  }
};

// ============================================
// PATIENTS SERVICE - CLEAN & SIMPLE
// ============================================
export const patientService = {
  async getPatients() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          created_at,
          updated_at,
          patients (
            phone,
            age,
            address,
            medical_history
          )
        `)
        .eq('role', 'patient')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('📊 Raw patient data from Supabase:', JSON.stringify(data, null, 2));

      return (data || []).map(profile => {
        const patientData = Array.isArray(profile.patients) ? profile.patients[0] : profile.patients;
        
        console.log(`👤 Processing patient ${profile.full_name}:`, {
          raw_age: patientData?.age,
          type: typeof patientData?.age,
          patientData: patientData
        });

        const age = patientData?.age != null ? Number(patientData.age) : 0;

        return {
          id: profile.id,
          email: profile.email,
          name: profile.full_name,
          role: profile.role,
          phone: patientData?.phone || '',
          age: age,
          address: patientData?.address || '',
          medicalHistory: patientData?.medical_history || '',
          created_at: profile.created_at,
          updated_at: profile.updated_at
        };
      });
    } catch (error) {
      console.error('❌ Failed to fetch patients:', error);
      throw error;
    }
  },

  async getPatient(id: string) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'patient')
        .single();

      if (profileError) throw profileError;
      if (!profile) return null;

      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      console.log(`👤 Fetching single patient ${profile.full_name}:`, {
        raw_age: patientData?.age,
        type: typeof patientData?.age
      });

      const age = patientData?.age != null ? Number(patientData.age) : 0;

      return {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        role: profile.role,
        phone: patientData?.phone || '',
        age: age,
        address: patientData?.address || '',
        medicalHistory: patientData?.medical_history || ''
      };
    } catch (error) {
      console.error('❌ Failed to fetch patient:', error);
      throw error;
    }
  },

  async createPatient(patientData: any) {
    return await authService.signUp(
      patientData.email,
      patientData.password || 'Patient123!',
      { ...patientData, role: 'patient' }
    );
  },

  async updatePatient(id: string, updates: any) {
    try {
      console.log('🔄 Updating patient:', id, 'with updates:', updates);

      // Update profile
      if (updates.name || updates.email) {
        const profileUpdates: any = {};
        if (updates.name) profileUpdates.full_name = updates.name;
        if (updates.email) profileUpdates.email = updates.email;

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', id);

        if (profileError) throw profileError;
      }

      // Check if patient record exists
      const { data: existing } = await supabase
        .from('patients')
        .select('id')
        .eq('id', id)
        .single();

      // Build patient updates with proper type conversion
      const patientUpdates: any = {};
      if (updates.phone !== undefined) patientUpdates.phone = String(updates.phone);
      if (updates.age !== undefined) {
        const ageValue = Number(updates.age);
        console.log('🔢 Converting age:', updates.age, '->', ageValue, typeof ageValue);
        patientUpdates.age = ageValue;
      }
      if (updates.address !== undefined) patientUpdates.address = String(updates.address);
      if (updates.medicalHistory !== undefined) patientUpdates.medical_history = String(updates.medicalHistory);

      console.log('💾 Patient updates to save:', patientUpdates);

      if (!existing) {
        // Create new patient record
        const { error: insertError } = await supabase
          .from('patients')
          .insert({
            id: id,
            ...patientUpdates
          });

        if (insertError) throw insertError;
      } else {
        // Update existing patient record
        const { error: updateError } = await supabase
          .from('patients')
          .update(patientUpdates)
          .eq('id', id);

        if (updateError) throw updateError;
      }

      return await this.getPatient(id);
    } catch (error) {
      console.error('❌ Failed to update patient:', error);
      throw error;
    }
  }
};

// ============================================
// DOCTORS SERVICE - CLEAN & SIMPLE
// ============================================
export const doctorService = {
  async getDoctors() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          created_at,
          updated_at,
          doctors (
            phone,
            specialization,
            qualification,
            experience
          )
        `)
        .eq('role', 'doctor')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('👨‍⚕️ Raw doctor data from Supabase:', JSON.stringify(data, null, 2));

      return (data || []).map(profile => {
        const doctorData = Array.isArray(profile.doctors) ? profile.doctors[0] : profile.doctors;
        
        console.log(`👨‍⚕️ Processing doctor ${profile.full_name}:`, {
          raw_experience: doctorData?.experience,
          type: typeof doctorData?.experience,
          doctorData: doctorData
        });

        const experience = doctorData?.experience != null ? Number(doctorData.experience) : 0;

        return {
          id: profile.id,
          email: profile.email,
          name: profile.full_name,
          role: profile.role,
          phone: doctorData?.phone || '',
          specialization: doctorData?.specialization || '',
          qualification: doctorData?.qualification || '',
          experience: experience,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        };
      });
    } catch (error) {
      console.error('❌ Failed to fetch doctors:', error);
      throw error;
    }
  },

  async getDoctor(id: string) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'doctor')
        .single();

      if (profileError) throw profileError;
      if (!profile) return null;

      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();

      console.log(`👨‍⚕️ Fetching single doctor ${profile.full_name}:`, {
        raw_experience: doctorData?.experience,
        type: typeof doctorData?.experience
      });

      const experience = doctorData?.experience != null ? Number(doctorData.experience) : 0;

      return {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        role: profile.role,
        phone: doctorData?.phone || '',
        specialization: doctorData?.specialization || '',
        qualification: doctorData?.qualification || '',
        experience: experience
      };
    } catch (error) {
      console.error('❌ Failed to fetch doctor:', error);
      throw error;
    }
  },

  async createDoctor(doctorData: any) {
    return await authService.signUp(
      doctorData.email,
      doctorData.password || 'Doctor123!',
      { ...doctorData, role: 'doctor' }
    );
  },

  async updateDoctor(id: string, updates: any) {
    try {
      console.log('🔄 Updating doctor:', id, 'with updates:', updates);

      // Update profile
      if (updates.name || updates.email) {
        const profileUpdates: any = {};
        if (updates.name) profileUpdates.full_name = updates.name;
        if (updates.email) profileUpdates.email = updates.email;

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', id);

        if (profileError) throw profileError;
      }

      // Check if doctor record exists
      const { data: existing } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', id)
        .single();

      // Build doctor updates with proper type conversion
      const doctorUpdates: any = {};
      if (updates.phone !== undefined) doctorUpdates.phone = String(updates.phone);
      if (updates.specialization !== undefined) doctorUpdates.specialization = String(updates.specialization);
      if (updates.qualification !== undefined) doctorUpdates.qualification = String(updates.qualification);
      if (updates.experience !== undefined) {
        const expValue = Number(updates.experience);
        console.log('🔢 Converting experience:', updates.experience, '->', expValue, typeof expValue);
        doctorUpdates.experience = expValue;
      }

      console.log('💾 Doctor updates to save:', doctorUpdates);

      if (!existing) {
        // Create new doctor record
        const { error: insertError } = await supabase
          .from('doctors')
          .insert({
            id: id,
            ...doctorUpdates
          });

        if (insertError) throw insertError;
      } else {
        // Update existing doctor record
        const { error: updateError } = await supabase
          .from('doctors')
          .update(doctorUpdates)
          .eq('id', id);

        if (updateError) throw updateError;
      }

      return await this.getDoctor(id);
    } catch (error) {
      console.error('❌ Failed to update doctor:', error);
      throw error;
    }
  }
};

// ============================================
// THERAPY SESSIONS SERVICE
// ============================================

// Helper function to map database columns to application format
// Handles BOTH old (date, time) and new (session_date, session_time) column names
function mapTherapySessionFromDB(session: any) {
  if (!session) return session;
  return {
    ...session,
    // Support both old and new column names
    date: session.session_date || session.date,
    time: session.session_time || session.time
  };
}

// Helper function to map application format to database columns
function mapTherapySessionToDB(sessionData: any) {
  const mapped: any = { ...sessionData };
  if (sessionData.date) {
    mapped.session_date = sessionData.date;
    delete mapped.date;
  }
  if (sessionData.time) {
    mapped.session_time = sessionData.time;
    delete mapped.time;
  }
  return mapped;
}

export const therapySessionService = {
  async getTherapySessions() {
    try {
      // Try new column names first
      const { data, error } = await supabase
        .from('therapy_sessions')
        .select('*')
        .order('session_date', { ascending: true });

      if (error) {
        // If error mentions session_date doesn't exist, try old column name
        if (error.message.includes('session_date')) {
          const { data: oldData, error: oldError } = await supabase
            .from('therapy_sessions')
            .select('*')
            .order('date', { ascending: true });
          
          if (oldError) throw oldError;
          return (oldData || []).map(mapTherapySessionFromDB);
        }
        throw error;
      }
      return (data || []).map(mapTherapySessionFromDB);
    } catch (error) {
      console.error('❌ Error fetching therapy sessions:', error);
      throw error;
    }
  },

  async getPatientTherapySessions(patientId: string) {
    try {
      // Try new column names first
      const { data, error } = await supabase
        .from('therapy_sessions')
        .select('*')
        .eq('patient_id', patientId)
        .order('session_date', { ascending: true });

      if (error) {
        // If error mentions session_date doesn't exist, try old column name
        if (error.message.includes('session_date')) {
          const { data: oldData, error: oldError } = await supabase
            .from('therapy_sessions')
            .select('*')
            .eq('patient_id', patientId)
            .order('date', { ascending: true });
          
          if (oldError) throw oldError;
          return (oldData || []).map(mapTherapySessionFromDB);
        }
        throw error;
      }
      return (data || []).map(mapTherapySessionFromDB);
    } catch (error) {
      console.error('❌ Error fetching patient therapy sessions:', error);
      throw error;
    }
  },

  async createTherapySession(sessionData: any) {
    const dbData = mapTherapySessionToDB(sessionData);
    const { data, error } = await supabase
      .from('therapy_sessions')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;
    return mapTherapySessionFromDB(data);
  },

  async updateTherapySession(id: string, updates: any) {
    const dbUpdates = mapTherapySessionToDB(updates);
    const { data, error } = await supabase
      .from('therapy_sessions')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapTherapySessionFromDB(data);
  }
};

// ============================================
// PROGRESS SERVICE
// ============================================

// Helper function to map database columns to application format
function mapProgressDataFromDB(progress: any) {
  if (!progress) return progress;
  return {
    ...progress,
    date: progress.record_date
  };
}

export const progressService = {
  async getPatientProgress(patientId: string) {
    const { data, error } = await supabase
      .from('progress_data')
      .select('*')
      .eq('patient_id', patientId)
      .order('record_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapProgressDataFromDB);
  },

  async createProgressEntry(progressData: any) {
    const { data, error } = await supabase
      .from('progress_data')
      .insert([progressData])
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

  async getAllNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createNotification(notificationData: any) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
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
  }
};

// ============================================
// FEEDBACK SERVICE
// ============================================
export const feedbackService = {
  async getAllFeedback() {
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
      .insert([feedbackData])
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

  async respondToFeedback(id: string, response: string, adminName: string) {
    const { data, error } = await supabase
      .from('feedback')
      .update({
        admin_response: response,
        admin_response_date: new Date().toISOString(),
        admin_name: adminName,
        status: 'responded'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ============================================
// REFERENCE DATA SERVICE
// ============================================
export const referenceDataService = {
  async getTherapyTypes() {
    return [
      { name: 'Abhyanga (Oil Massage)', duration: 60 },
      { name: 'Swedana (Steam Therapy)', duration: 45 },
      { name: 'Shirodhara (Oil Pouring)', duration: 90 },
      { name: 'Panchakarma Detox', duration: 120 },
      { name: 'Nasya (Nasal Therapy)', duration: 30 },
      { name: 'Basti (Medicated Enema)', duration: 45 }
    ];
  },

  async getPractitioners() {
    const doctors = await doctorService.getDoctors();
    return doctors.map(d => d.name);
  }
};

// ============================================
// ANALYTICS SERVICE
// ============================================
export const analyticsService = {
  async getAnalytics() {
    const [patients, sessions, progress] = await Promise.all([
      patientService.getPatients(),
      therapySessionService.getTherapySessions(),
      supabase.from('progress_data').select('*')
    ]);

    const progressData = progress.data || [];
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const upcomingSessions = sessions.filter(s => s.status === 'scheduled');

    const avgSymptomScore = progressData.length > 0
      ? progressData.reduce((sum, p) => sum + (p.symptom_score || 0), 0) / progressData.length
      : 0;

    const avgEnergyLevel = progressData.length > 0
      ? progressData.reduce((sum, p) => sum + (p.energy_level || 0), 0) / progressData.length
      : 0;

    const avgSleepQuality = progressData.length > 0
      ? progressData.reduce((sum, p) => sum + (p.sleep_quality || 0), 0) / progressData.length
      : 0;

    return {
      totalPatients: patients.length,
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      upcomingSessions: upcomingSessions.length,
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
      const { error } = await supabase.from('profiles').select('count').limit(1);
      return {
        success: !error,
        message: error ? 'Connection failed' : 'Connected to Supabase',
        supabaseAvailable: !error,
        usingFallback: false,
        usingDemoMode: false
      };
    } catch (error) {
      return {
        success: false,
        message: 'Connection failed',
        supabaseAvailable: false,
        usingFallback: false,
        usingDemoMode: false
      };
    }
  },

  getStatus() {
    return {
      supabaseAvailable: true,
      usingDemoMode: false,
      usingFallback: false
    };
  }
};

// ============================================
// USERS SERVICE (for compatibility)
// ============================================
export const userService = {
  async createUser(userData: any) {
    return await authService.signUp(userData.email, userData.password, userData);
  },

  async getUser(userId: string) {
    return await authService.getUserData(userId);
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
