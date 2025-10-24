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
// USER DATA CACHE - Prevent redundant queries
// ============================================
interface CacheEntry {
  data: any;
  timestamp: number;
}

const userDataCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds cache
const pendingRequests = new Map<string, Promise<any>>();

// Helper to get cached data
function getCachedUserData(userId: string): any | null {
  const cached = userDataCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('✅ Using cached user data for:', userId);
    return cached.data;
  }
  return null;
}

// Helper to set cached data
function setCachedUserData(userId: string, data: any): void {
  userDataCache.set(userId, {
    data,
    timestamp: Date.now()
  });
}

// Helper to clear cache for a user
function clearUserCache(userId: string): void {
  userDataCache.delete(userId);
  pendingRequests.delete(userId);
}

// Helper to clear all cache
function clearAllCache(): void {
  userDataCache.clear();
  pendingRequests.clear();
}

// ============================================
// TIMEOUT HELPER - Create abortable fetch
// ============================================
function createTimeoutPromise(timeoutMs: number, operation: string) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      console.error(`⏱️ Timeout after ${timeoutMs}ms in ${operation}`);
      reject(new Error(`Request timeout after ${timeoutMs / 1000}s - ${operation}`));
    }, timeoutMs);
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
      console.log('🔐 Signing in:', email);
      
      // Increased timeout to 60 seconds for auth (better for slow connections/unconfigured databases)
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password
        }),
        createTimeoutPromise(60000, 'authentication')
      ]) as any;

      if (error) {
        console.error('❌ Auth error:', error);
        throw error;
      }
      if (!data.user) {
        console.error('❌ No user returned');
        throw new Error('Login failed');
      }

      console.log('✅ Authentication successful, fetching user data...');

      // Clear any stale cache before fetching fresh data
      clearUserCache(data.user.id);
      
      const userData = await this.getUserData(data.user.id);
      if (!userData) throw new Error('User profile not found');
      
      console.log('✅ Sign in complete');
      return userData;
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      
      // Provide better error messages
      if (error.message?.includes('timeout')) {
        throw new Error('Connection timeout. Please check your internet connection and try again.');
      }
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password');
      }
      
      throw new Error(error.message || 'Invalid email or password');
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear all cache on signout
    clearAllCache();
  },

  async getCurrentUser() {
    try {
      console.log('👤 Getting current user...');
      
      const getUserPromise = async () => {
        const { data: { user }, error } = await Promise.race([
          supabase.auth.getUser(),
          createTimeoutPromise(10000, 'auth.getUser')
        ]) as any;
        
        if (error) throw error;
        if (!user) return null;
        
        return await this.getUserData(user.id);
      };
      
      const result = await Promise.race([
        getUserPromise(),
        createTimeoutPromise(20000, 'getCurrentUser')
      ]);
      
      console.log('✅ Current user loaded');
      return result as any;
    } catch (error) {
      console.error('❌ Get current user error:', error);
      return null;
    }
  },

  async getUserData(userId: string) {
    try {
      console.log('🔍 Getting user data for:', userId);
      
      // Check cache first
      const cachedData = getCachedUserData(userId);
      if (cachedData) {
        return cachedData;
      }
      
      // Check if there's already a pending request for this user
      const pendingRequest = pendingRequests.get(userId);
      if (pendingRequest) {
        console.log('⏳ Waiting for pending request for:', userId);
        return await pendingRequest;
      }
      
      // Create the request promise
      const requestPromise = (async () => {
        try {
          // Increased timeout to 60 seconds for slow connections/unconfigured databases
          const timeoutMs = 60000;
          
          const getUserPromise = async () => {
            // Step 1: Fetch profile with minimal fields first (faster)
            console.log('📊 Step 1: Fetching profile...');
            
            const profilePromise = supabase
              .from('profiles')
              .select('id, email, full_name, role, created_at, updated_at')
              .eq('id', userId)
              .maybeSingle();
            
            const { data: profile, error: profileError } = await Promise.race([
              profilePromise,
              createTimeoutPromise(30000, 'profile fetch')
            ]) as any;

            console.log('📊 Profile query result:', { profile, error: profileError });

            // If profile doesn't exist, create it from auth.users data
            if (!profile && profileError?.code === 'PGRST116') {
              console.log('⚠️ Profile not found, creating from auth data');
              
              const { data: { user } } = await Promise.race([
                supabase.auth.getUser(),
                createTimeoutPromise(5000, 'auth.getUser')
              ]) as any;
              
              if (!user || user.id !== userId) {
                throw new Error('User not found');
              }

              // Create profile from auth metadata
              const role = user.user_metadata?.role || 'patient';
              
              const { error: insertError } = await Promise.race([
                supabase
                  .from('profiles')
                  .insert({
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || user.email || 'User',
                    role: role
                  }),
                createTimeoutPromise(5000, 'profile insert')
              ]) as any;

              if (insertError) {
                console.error('❌ Failed to create profile:', insertError);
                throw new Error('Failed to create user profile');
              }

              console.log('✅ Profile created');

              // Create role-specific profile
              if (role === 'patient') {
                await Promise.race([
                  supabase
                    .from('patients')
                    .insert({
                      id: user.id,
                      phone: user.user_metadata?.phone || '',
                      age: user.user_metadata?.age || 0,
                      address: user.user_metadata?.address || '',
                      medical_history: user.user_metadata?.medicalHistory || ''
                    }),
                  createTimeoutPromise(5000, 'patient insert')
                ]);
              } else if (role === 'doctor') {
                await Promise.race([
                  supabase
                    .from('doctors')
                    .insert({
                      id: user.id,
                      phone: user.user_metadata?.phone || '',
                      specialization: user.user_metadata?.specialization || 'General Ayurveda',
                      qualification: user.user_metadata?.qualification || 'BAMS',
                      experience: user.user_metadata?.experience || 0
                    }),
                  createTimeoutPromise(5000, 'doctor insert')
                ]);
              }

              console.log('✅ Role-specific profile created');

              // Fetch the newly created profile
              const { data: newProfile, error: refetchError } = await Promise.race([
                supabase
                  .from('profiles')
                  .select('id, email, full_name, role, created_at, updated_at')
                  .eq('id', userId)
                  .maybeSingle(),
                createTimeoutPromise(5000, 'profile refetch')
              ]) as any;

              if (refetchError) throw refetchError;
              if (!newProfile) throw new Error('Failed to fetch newly created profile');

              // Fetch role-specific data
              let newRoleData = null;
              if (role === 'patient') {
                const { data } = await Promise.race([
                  supabase.from('patients').select('*').eq('id', userId).maybeSingle(),
                  createTimeoutPromise(5000, 'patient data fetch')
                ]) as any;
                newRoleData = data;
              } else if (role === 'doctor') {
                const { data } = await Promise.race([
                  supabase.from('doctors').select('*').eq('id', userId).maybeSingle(),
                  createTimeoutPromise(5000, 'doctor data fetch')
                ]) as any;
                newRoleData = data;
              }

              const userData = this.formatUserDataSeparate(newProfile, newRoleData);
              setCachedUserData(userId, userData);
              return userData;
            } else if (profileError) {
              throw profileError;
            }

            if (!profile) {
              throw new Error('User not found');
            }

            console.log('📊 Step 2: Fetching role-specific data for role:', profile.role);

            // Fetch role-specific data separately with timeout
            let roleSpecificData = null;
            if (profile.role === 'patient') {
              const { data: patientData, error: patientError } = await Promise.race([
                supabase
                  .from('patients')
                  .select('*')
                  .eq('id', userId)
                  .maybeSingle(),
                createTimeoutPromise(5000, 'patient data fetch')
              ]) as any;
              
              if (patientError) {
                console.error('⚠️ Patient data fetch error:', patientError);
              }
              roleSpecificData = patientData;
              console.log('📊 Patient data:', roleSpecificData);
            } else if (profile.role === 'doctor') {
              const { data: doctorData, error: doctorError } = await Promise.race([
                supabase
                  .from('doctors')
                  .select('*')
                  .eq('id', userId)
                  .maybeSingle(),
                createTimeoutPromise(5000, 'doctor data fetch')
              ]) as any;
              
              if (doctorError) {
                console.error('⚠️ Doctor data fetch error:', doctorError);
              }
              roleSpecificData = doctorData;
              console.log('📊 Doctor data:', roleSpecificData);
            }

            const userData = this.formatUserDataSeparate(profile, roleSpecificData);
            setCachedUserData(userId, userData);
            return userData;
          };

          const userData = await Promise.race([
            getUserPromise(),
            createTimeoutPromise(timeoutMs, 'getUserData')
          ]);
          
          console.log('✅ User data retrieved successfully');
          return userData as any;
        } finally {
          // Clean up pending request
          pendingRequests.delete(userId);
        }
      })();
      
      // Store the pending request
      pendingRequests.set(userId, requestPromise);
      
      return await requestPromise;
    } catch (error: any) {
      console.error('❌ getUserData error:', error);
      
      // Clear cache on error to allow retry
      clearUserCache(userId);
      
      // Provide more helpful error messages
      if (error.message?.includes('timeout')) {
        throw new Error('Connection timeout after 10s. Please check your internet connection and try again.');
      }
      
      if (error.message?.includes('FetchError') || error.message?.includes('NetworkError')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw new Error(error.message || 'Failed to load user data');
    }
  },

  // Helper function to format user data from profile with joined tables
  formatUserData(profile: any) {
    const baseData = {
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      role: profile.role
    };

    if (profile.role === 'patient') {
      const patientData = profile.patients?.[0] || {};
      return {
        ...baseData,
        phone: patientData.phone || '',
        age: patientData.age || 0,
        address: patientData.address || '',
        medicalHistory: patientData.medical_history || ''
      };
    } else if (profile.role === 'doctor') {
      const doctorData = profile.doctors?.[0] || {};
      return {
        ...baseData,
        phone: doctorData.phone || '',
        specialization: doctorData.specialization || '',
        qualification: doctorData.qualification || '',
        experience: doctorData.experience || 0
      };
    }

    return baseData;
  },

  // Helper function to format user data from separate profile and role data queries
  formatUserDataSeparate(profile: any, roleData: any) {
    const baseData = {
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      role: profile.role
    };

    if (profile.role === 'patient') {
      const age = typeof roleData?.age === 'number' ? roleData.age : (roleData?.age ? parseInt(roleData.age) : 0);
      console.log('👤 Formatting patient data - age:', age, 'from:', roleData?.age, 'type:', typeof roleData?.age);
      
      return {
        ...baseData,
        phone: roleData?.phone || '',
        age: age,
        address: roleData?.address || '',
        medicalHistory: roleData?.medical_history || ''
      };
    } else if (profile.role === 'doctor') {
      const experience = typeof roleData?.experience === 'number' ? roleData.experience : (roleData?.experience ? parseInt(roleData.experience) : 0);
      
      return {
        ...baseData,
        phone: roleData?.phone || '',
        specialization: roleData?.specialization || '',
        qualification: roleData?.qualification || '',
        experience: experience
      };
    }

    return baseData;
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

    return (data || []).map(profile => {
      const patientData = profile.patients?.[0] || {};
      console.log('📋 Mapping patient:', profile.id, 'patientData:', patientData);
      
      return {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        role: profile.role,
        phone: patientData.phone || '',
        age: typeof patientData.age === 'number' ? patientData.age : (patientData.age ? parseInt(patientData.age) : 0),
        address: patientData.address || '',
        medicalHistory: patientData.medical_history || '',
        created_at: profile.created_at,
        updated_at: profile.updated_at
      };
    });
  },

  async getPatient(id: string) {
    console.log('🔍 Fetching patient data for ID:', id);
    
    // Fetch profile and patient data separately to ensure we get fresh data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'patient')
      .maybeSingle();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      throw profileError;
    }
    if (!profileData) {
      console.error('❌ Profile not found');
      return null;
    }

    console.log('✅ Profile data:', profileData);

    // Fetch patient-specific data
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (patientError) {
      console.error('❌ Patient fetch error:', patientError);
      throw patientError;
    }

    console.log('📊 Patient data:', patientData);

    const result = {
      id: profileData.id,
      email: profileData.email,
      name: profileData.full_name,
      role: profileData.role,
      phone: patientData?.phone || '',
      age: typeof patientData?.age === 'number' ? patientData.age : (patientData?.age ? parseInt(patientData.age) : 0),
      address: patientData?.address || '',
      medicalHistory: patientData?.medical_history || ''
    };

    console.log('✅ Returning patient with age:', result.age, 'from raw data:', patientData?.age, 'type:', typeof patientData?.age);
    return result;
  },

  async createPatient(patientData: any) {
    return await authService.signUp(
      patientData.email,
      patientData.password || 'Patient123!',
      { ...patientData, role: 'patient' }
    );
  },

  async updatePatient(id: string, updates: any) {
    console.log('🔧 Updating patient:', id, 'with updates:', updates);
    
    // Clear cache before update
    clearUserCache(id);
    
    // Update profile
    if (updates.name || updates.email) {
      const profileUpdates: any = {};
      if (updates.name) profileUpdates.full_name = updates.name;
      if (updates.email) profileUpdates.email = updates.email;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id);

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
        throw profileError;
      }
      console.log('✅ Profile updated successfully');
    }

    // Check if patient record exists
    const { data: existingPatient, error: checkError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking patient record:', checkError);
      throw checkError;
    }

    // Build patient updates
    const patientUpdates: any = {};
    if (updates.phone !== undefined) patientUpdates.phone = updates.phone;
    if (updates.age !== undefined) patientUpdates.age = updates.age;
    if (updates.address !== undefined) patientUpdates.address = updates.address;
    if (updates.medicalHistory !== undefined) patientUpdates.medical_history = updates.medicalHistory;

    console.log('📝 Patient table updates:', patientUpdates);

    if (!existingPatient) {
      // Patient record doesn't exist, create it
      console.log('⚠️ Patient record not found, creating new record');
      const { error: insertError } = await supabase
        .from('patients')
        .insert({
          id: id,
          phone: patientUpdates.phone || '',
          age: patientUpdates.age || 0,
          address: patientUpdates.address || '',
          medical_history: patientUpdates.medical_history || ''
        });

      if (insertError) {
        console.error('❌ Patient insert error:', insertError);
        throw insertError;
      }
      console.log('✅ Patient record created successfully');
    } else {
      // Update existing patient record
      const { error: patientError } = await supabase
        .from('patients')
        .update(patientUpdates)
        .eq('id', id);

      if (patientError) {
        console.error('❌ Patient update error:', patientError);
        throw patientError;
      }
      console.log('✅ Patient table updated successfully');
      
      // Verify the update by selecting directly from patients table
      const { data: verifyData, error: verifyError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (verifyError) {
        console.error('❌ Error verifying patient update:', verifyError);
      } else {
        console.log('🔍 Verification - Patient data in DB:', verifyData);
      }
    }

    // Add a small delay to ensure database has committed the transaction
    await new Promise(resolve => setTimeout(resolve, 100));

    // Clear cache again to force fresh fetch
    clearUserCache(id);
    
    const updatedPatient = await this.getPatient(id);
    console.log('📊 Retrieved updated patient:', updatedPatient);
    return updatedPatient;
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

    return (data || []).map(profile => {
      const doctorData = profile.doctors?.[0] || {};
      const experience = typeof doctorData.experience === 'number' ? doctorData.experience : (doctorData.experience ? parseInt(doctorData.experience) : 0);
      console.log('👨‍⚕️ Mapping doctor:', profile.id, 'experience:', experience, 'from:', doctorData.experience);
      
      return {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        role: profile.role,
        phone: doctorData.phone || '',
        specialization: doctorData.specialization || '',
        qualification: doctorData.qualification || '',
        experience: experience,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      };
    });
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
    console.log('🔧 Updating doctor:', id, 'with updates:', updates);
    
    // Clear cache before update
    clearUserCache(id);
    
    // Update profile
    if (updates.name || updates.email) {
      const profileUpdates: any = {};
      if (updates.name) profileUpdates.full_name = updates.name;
      if (updates.email) profileUpdates.email = updates.email;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id);

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
        throw profileError;
      }
      console.log('✅ Profile updated successfully');
    }

    // Check if doctor record exists
    const { data: existingDoctor, error: checkError } = await supabase
      .from('doctors')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking doctor record:', checkError);
      throw checkError;
    }

    // Build doctor updates
    const doctorUpdates: any = {};
    if (updates.phone !== undefined) doctorUpdates.phone = updates.phone;
    if (updates.specialization !== undefined) doctorUpdates.specialization = updates.specialization;
    if (updates.qualification !== undefined) doctorUpdates.qualification = updates.qualification;
    if (updates.experience !== undefined) doctorUpdates.experience = updates.experience;

    console.log('📝 Doctor table updates:', doctorUpdates);
    
    if (!existingDoctor) {
      // Doctor record doesn't exist, create it
      console.log('⚠️ Doctor record not found, creating new record');
      const { error: insertError } = await supabase
        .from('doctors')
        .insert({
          id: id,
          phone: doctorUpdates.phone || '',
          specialization: doctorUpdates.specialization || 'General Ayurveda',
          qualification: doctorUpdates.qualification || 'BAMS',
          experience: doctorUpdates.experience || 0
        });

      if (insertError) {
        console.error('❌ Doctor insert error:', insertError);
        throw insertError;
      }
      console.log('✅ Doctor record created successfully');
    } else {
      // Update existing doctor record
      const { error: doctorError } = await supabase
        .from('doctors')
        .update(doctorUpdates)
        .eq('id', id);

      if (doctorError) {
        console.error('❌ Doctor update error:', doctorError);
        throw doctorError;
      }
      console.log('✅ Doctor table updated successfully');
    }

    // Clear cache again to force fresh fetch
    clearUserCache(id);
    
    const updatedDoctor = await this.getDoctor(id);
    console.log('📊 Retrieved updated doctor:', updatedDoctor);
    return updatedDoctor;
  }
};

// ============================================
// THERAPY SESSIONS SERVICE
// ============================================
// Helper function to map database columns to application format
function mapTherapySessionFromDB(session: any) {
  if (!session) return session;
  return {
    ...session,
    date: session.session_date,
    time: session.session_time
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
    const { data, error } = await supabase
      .from('therapy_sessions')
      .select('*')
      .order('session_date', { ascending: false })
      .order('session_time', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapTherapySessionFromDB);
  },

  async getPatientTherapySessions(patientId: string) {
    const { data, error } = await supabase
      .from('therapy_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapTherapySessionFromDB);
  },

  async createTherapySession(sessionData: any) {
    const { data, error } = await supabase
      .from('therapy_sessions')
      .insert({
        patient_id: sessionData.patient_id,
        doctor_id: sessionData.doctor_id || null,
        therapy_type: sessionData.therapy_type,
        session_date: sessionData.date,
        session_time: sessionData.time,
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
      .insert({
        patient_id: progressData.patient_id,
        record_date: progressData.date,
        symptom_score: progressData.symptom_score,
        energy_level: progressData.energy_level,
        sleep_quality: progressData.sleep_quality,
        notes: progressData.notes || '',
        feedback: progressData.feedback || ''
      })
      .select()
      .single();

    if (error) throw error;
    return mapProgressDataFromDB(data);
  }
};

// ============================================
// NOTIFICATIONS SERVICE
// ============================================

// Helper function to map database columns to application format
function mapNotificationFromDB(notification: any) {
  if (!notification) return notification;
  return {
    ...notification,
    date: notification.notification_date
  };
}

export const notificationService = {
  async getPatientNotifications(patientId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapNotificationFromDB);
  },

  async getAllNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapNotificationFromDB);
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
    return mapNotificationFromDB(data);
  },

  async updateNotification(id: string, updates: any) {
    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapNotificationFromDB(data);
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

// Helper function to map database columns to application format
function mapFeedbackFromDB(feedback: any) {
  if (!feedback) return feedback;
  return {
    ...feedback,
    date: feedback.feedback_date
  };
}

export const feedbackService = {
  async getFeedback() {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapFeedbackFromDB);
  },

  async getAllFeedback() {
    // Alias for getFeedback - same functionality
    return await this.getFeedback();
  },

  async getPatientFeedback(patientId: string) {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapFeedbackFromDB);
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
    return mapFeedbackFromDB(data);
  },

  async updateFeedback(id: string, updates: any) {
    const { data, error } = await supabase
      .from('feedback')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapFeedbackFromDB(data);
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
      // Test basic Supabase connectivity without RLS issues
      // Use auth.getSession() which doesn't require database access
      const { error: sessionError } = await supabase.auth.getSession();
      
      // If auth check works, Supabase is reachable
      // Now try a simple database ping (without RLS)
      const { error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });
      
      // If we get an RLS error, Supabase is still connected (just need to login)
      if (error && error.code === 'PGRST301') {
        // RLS policy error = Database is reachable, just need auth
        return {
          success: true,
          message: 'Connected to Supabase (login required for full access)',
          usingFallback: false,
          supabaseAvailable: true,
          requiresAuth: true
        };
      }
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        message: 'Connected to Supabase',
        usingFallback: false,
        supabaseAvailable: true
      };
    } catch (error: any) {
      console.log('Supabase connection test:', error);
      
      // Check if it's a network/CORS error vs database error
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
        return {
          success: false,
          message: 'Network error - using demo mode',
          usingFallback: true,
          supabaseAvailable: false,
          error
        };
      }
      
      // For other errors, still consider Supabase available
      // (might just be RLS/permissions)
      return {
        success: true,
        message: 'Connected to Supabase (limited access)',
        usingFallback: false,
        supabaseAvailable: true,
        limitedAccess: true
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