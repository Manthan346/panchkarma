import { toast } from 'sonner';

// Demo data - Always available and working
const demoUsers = [
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
    medicalHistory: 'Chronic joint pain, stress-related disorders, digestive issues. Previous treatments include conventional medication with limited success.',
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

const demoSessions = [
  {
    id: '1',
    patient_id: '2',
    therapy_type: 'Abhyanga (Oil Massage)',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '09:00',
    duration: 60,
    status: 'scheduled',
    practitioner: 'Dr. Sharma',
    doctor_id: '3',
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
    doctor_id: '4',
    notes: 'Patient responded well to treatment. Showed significant improvement in joint mobility.',
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
    doctor_id: '5',
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

const demoProgress = [
  {
    id: '1',
    patient_id: '2',
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    symptom_score: 7,
    energy_level: 6,
    sleep_quality: 5,
    notes: 'Feeling better overall, less joint stiffness in the morning',
    feedback: 'Treatment is helping with pain management. Very satisfied with the care.',
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
    notes: 'Significant improvement in energy levels and sleep quality',
    feedback: 'Feeling more energetic and positive. The treatments are really working!',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    patient_id: '2',
    date: new Date().toISOString().split('T')[0],
    symptom_score: 4,
    energy_level: 9,
    sleep_quality: 8,
    notes: 'Best I\'ve felt in months. Pain significantly reduced.',
    feedback: 'The Panchakarma treatments have exceeded my expectations.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const demoNotifications = [
  {
    id: '1',
    patient_id: '2',
    type: 'pre-procedure',
    title: 'Tomorrow\'s Abhyanga Treatment',
    message: 'Please fast for 2 hours before your 9:00 AM appointment. Wear comfortable clothing and arrive 15 minutes early.',
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
    message: 'Please update your daily symptoms and energy levels in the app to help track your progress.',
    date: new Date().toISOString().split('T')[0],
    read: false,
    urgent: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    patient_id: '2',
    type: 'post-procedure',
    title: 'Post-Treatment Care',
    message: 'Remember to follow the post-procedure instructions: drink warm water, rest, and avoid cold exposure.',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    read: true,
    urgent: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const demoFeedback = [
  {
    id: '1',
    patient_id: '2',
    session_id: '2',
    patient_name: 'John Patient',
    therapy_type: 'Swedana (Steam Therapy)',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    rating: 9,
    effectiveness_rating: 8,
    comfort_rating: 9,
    feedback: 'The Swedana therapy was incredibly relaxing. I felt much better after the session and noticed improved circulation.',
    side_effects: 'None reported',
    improvements: 'Better sleep quality, reduced muscle tension',
    would_recommend: true,
    status: 'responded',
    admin_response: 'Thank you for your feedback! I\'m glad to hear about the improvements in your sleep quality and reduced muscle tension. This is exactly what we aim for with Swedana therapy. Keep following the post-treatment guidelines for continued benefits.',
    admin_response_date: new Date().toISOString().split('T')[0],
    admin_name: 'Dr. Patel',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const demoTherapyTypes = [
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
  },
  {
    name: 'Basti (Medicated Enema)',
    duration: 45,
    description: 'Herbal enema therapy for digestive and nervous system'
  }
];

const demoPractitioners = [
  'Dr. Sharma',
  'Dr. Patel',
  'Dr. Kumar',
  'Dr. Gupta',
  'Dr. Singh'
];

// Generate unique IDs
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Authentication service - Always works with demo data
export const authService = {
  async login(email: string, password: string) {
    const user = demoUsers.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    return { ...user };
  },

  async getUserData(userId: string) {
    const user = demoUsers.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    return { ...user };
  },

  async signUp(email: string, password: string, userData: any) {
    // Check if user already exists
    const existing = demoUsers.find(u => u.email === email);
    if (existing) {
      throw new Error('User already exists');
    }
    
    const newUser = {
      id: generateId(),
      email,
      password,
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    demoUsers.push(newUser);
    return { ...newUser };
  },

  async signIn(email: string, password: string) {
    return await this.login(email, password);
  },

  async signOut() {
    // Demo logout - just return success
    return { success: true };
  },

  async getCurrentUser() {
    // In demo mode, return null (user must login)
    return null;
  },

  async updatePassword(userId: string, newPassword: string) {
    const userIndex = demoUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    demoUsers[userIndex].password = newPassword;
    demoUsers[userIndex].updated_at = new Date().toISOString();
    return { success: true };
  },
};

// Users service
export const userService = {
  async getUsers() {
    return [...demoUsers];
  },

  async createUser(userData: any) {
    const newUser = {
      id: generateId(),
      ...userData,
      // Add default fields for doctors if not provided
      ...(userData.role === 'doctor' && {
        phone: userData.phone || '+1-000-0000',
        specialization: userData.specialization || 'General Ayurveda',
        qualification: userData.qualification || 'BAMS',
        experience: userData.experience || 0
      }),
      // Add default fields for patients if not provided
      ...(userData.role === 'patient' && {
        phone: userData.phone || '+1-000-0000',
        age: userData.age || 0,
        address: userData.address || '',
        medicalHistory: userData.medicalHistory || ''
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    demoUsers.push(newUser);
    return newUser;
  },
};

// Patients service
export const patientService = {
  async getPatients() {
    return demoUsers.filter(u => u.role === 'patient');
  },

  async getPatient(id: string) {
    return demoUsers.find(u => u.id === id && u.role === 'patient') || null;
  },

  async createPatient(patientData: any) {
    const newPatient = {
      id: generateId(),
      ...patientData,
      role: 'patient',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    demoUsers.push(newPatient);
    return newPatient;
  },

  async updatePatient(id: string, updates: any) {
    const patientIndex = demoUsers.findIndex(u => u.id === id && u.role === 'patient');
    if (patientIndex === -1) {
      throw new Error('Patient not found');
    }
    
    demoUsers[patientIndex] = {
      ...demoUsers[patientIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return demoUsers[patientIndex];
  },
};

// Doctors service
export const doctorService = {
  async getDoctors() {
    return demoUsers.filter(u => u.role === 'doctor');
  },

  async getDoctor(id: string) {
    return demoUsers.find(u => u.id === id && u.role === 'doctor') || null;
  },

  async createDoctor(doctorData: any) {
    const newDoctor = {
      id: generateId(),
      ...doctorData,
      role: 'doctor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    demoUsers.push(newDoctor);
    return newDoctor;
  },

  async updateDoctor(id: string, updates: any) {
    const doctorIndex = demoUsers.findIndex(u => u.id === id && u.role === 'doctor');
    if (doctorIndex === -1) {
      throw new Error('Doctor not found');
    }
    
    demoUsers[doctorIndex] = {
      ...demoUsers[doctorIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return demoUsers[doctorIndex];
  },
};

// Therapy Sessions service
export const therapySessionService = {
  async getTherapySessions() {
    return [...demoSessions];
  },

  async getPatientTherapySessions(patientId: string) {
    return demoSessions.filter(s => s.patient_id === patientId);
  },

  async createTherapySession(sessionData: any) {
    const newSession = {
      id: generateId(),
      ...sessionData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    demoSessions.push(newSession);
    return newSession;
  },

  async updateTherapySession(id: string, updates: any) {
    const sessionIndex = demoSessions.findIndex(s => s.id === id);
    if (sessionIndex === -1) {
      throw new Error('Therapy session not found');
    }
    
    demoSessions[sessionIndex] = {
      ...demoSessions[sessionIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return demoSessions[sessionIndex];
  },
};

// Progress service
export const progressService = {
  async getPatientProgress(patientId: string) {
    return demoProgress.filter(p => p.patient_id === patientId);
  },

  async createProgressEntry(progressData: any) {
    const newProgress = {
      id: generateId(),
      ...progressData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    demoProgress.push(newProgress);
    return newProgress;
  },
};

// Notifications service
export const notificationService = {
  async getPatientNotifications(patientId: string) {
    return demoNotifications.filter(n => n.patient_id === patientId);
  },

  async getAllNotifications() {
    return [...demoNotifications];
  },

  async createNotification(notificationData: any) {
    const newNotification = {
      id: generateId(),
      ...notificationData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    demoNotifications.push(newNotification);
    return newNotification;
  },

  async updateNotification(id: string, updates: any) {
    const notificationIndex = demoNotifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      throw new Error('Notification not found');
    }
    
    demoNotifications[notificationIndex] = {
      ...demoNotifications[notificationIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return demoNotifications[notificationIndex];
  },
};

// Reference Data service
export const referenceDataService = {
  async getTherapyTypes() {
    return [...demoTherapyTypes];
  },

  async getPractitioners() {
    return [...demoPractitioners];
  },
};

// Analytics service
export const analyticsService = {
  async getAnalytics() {
    const totalPatients = demoUsers.filter(u => u.role === 'patient').length;
    const totalSessions = demoSessions.length;
    const completedSessions = demoSessions.filter(s => s.status === 'completed').length;
    const upcomingSessions = demoSessions.filter(s => s.status === 'scheduled').length;
    
    const avgSymptomScore = demoProgress.reduce((sum, p) => sum + p.symptom_score, 0) / (demoProgress.length || 1);
    const avgEnergyLevel = demoProgress.reduce((sum, p) => sum + p.energy_level, 0) / (demoProgress.length || 1);
    const avgSleepQuality = demoProgress.reduce((sum, p) => sum + p.sleep_quality, 0) / (demoProgress.length || 1);
    
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

// Feedback service
export const feedbackService = {
  async getAllFeedback() {
    return [...demoFeedback];
  },

  async getPatientFeedback(patientId: string) {
    return demoFeedback.filter(f => f.patient_id === patientId);
  },

  async getFeedbackBySession(sessionId: string) {
    return demoFeedback.find(f => f.session_id === sessionId);
  },

  async createFeedback(feedbackData: any) {
    const newFeedback = {
      id: generateId(),
      ...feedbackData,
      status: 'submitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    demoFeedback.push(newFeedback);
    return newFeedback;
  },

  async updateFeedback(id: string, updates: any) {
    const feedbackIndex = demoFeedback.findIndex(f => f.id === id);
    if (feedbackIndex === -1) {
      throw new Error('Feedback not found');
    }
    
    demoFeedback[feedbackIndex] = {
      ...demoFeedback[feedbackIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return demoFeedback[feedbackIndex];
  },

  async respondToFeedback(id: string, response: string, adminName: string) {
    const feedbackIndex = demoFeedback.findIndex(f => f.id === id);
    if (feedbackIndex === -1) {
      throw new Error('Feedback not found');
    }
    
    demoFeedback[feedbackIndex] = {
      ...demoFeedback[feedbackIndex],
      admin_response: response,
      admin_response_date: new Date().toISOString().split('T')[0],
      admin_name: adminName,
      status: 'responded',
      updated_at: new Date().toISOString()
    };
    return demoFeedback[feedbackIndex];
  },
};

// Connection service - Always reports demo mode for now
export const connectionService = {
  async testConnection() {
    return { 
      success: true, 
      message: 'Demo mode - All features available',
      usingFallback: true,
      supabaseAvailable: false,
      demoMode: true
    };
  },
  
  getStatus() {
    return {
      supabaseAvailable: false,
      usingDemoMode: true,
      demoMode: true
    };
  }
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
  feedback: feedbackService,
  referenceData: referenceDataService,
  analytics: analyticsService,
  connection: connectionService,
};
