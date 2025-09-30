import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use('*', logger(console.log));

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create tables for Panchakarma system
    const tables = [
      // Users table
      {
        name: 'users',
        schema: {
          id: 'primary',
          name: 'string',
          email: 'string',
          role: 'string', // 'admin' or 'patient'
          password: 'string', // In real app, this would be hashed
          created_at: 'timestamp',
          updated_at: 'timestamp'
        }
      },
      // Patients table (extends users)
      {
        name: 'patients',
        schema: {
          id: 'primary',
          user_id: 'string',
          age: 'number',
          phone: 'string',
          address: 'string',
          medical_history: 'string',
          created_at: 'timestamp',
          updated_at: 'timestamp'
        }
      },
      // Doctors table (extends users)
      {
        name: 'doctors',
        schema: {
          id: 'primary',
          user_id: 'string',
          phone: 'string',
          specialization: 'string',
          qualification: 'string',
          experience: 'number',
          created_at: 'timestamp',
          updated_at: 'timestamp'
        }
      },
      // Therapy sessions
      {
        name: 'therapy_sessions',
        schema: {
          id: 'primary',
          patient_id: 'string',
          therapy_type: 'string',
          date: 'string',
          time: 'string',
          duration: 'number',
          status: 'string', // 'scheduled', 'completed', 'cancelled'
          practitioner: 'string',
          notes: 'string',
          pre_procedure_instructions: 'json',
          post_procedure_instructions: 'json',
          created_at: 'timestamp',
          updated_at: 'timestamp'
        }
      },
      // Progress data
      {
        name: 'progress_data',
        schema: {
          id: 'primary',
          patient_id: 'string',
          date: 'string',
          symptom_score: 'number',
          energy_level: 'number',
          sleep_quality: 'number',
          notes: 'string',
          feedback: 'string',
          created_at: 'timestamp',
          updated_at: 'timestamp'
        }
      },
      // Notifications
      {
        name: 'notifications',
        schema: {
          id: 'primary',
          patient_id: 'string',
          type: 'string', // 'pre-procedure', 'post-procedure', 'appointment', 'reminder'
          title: 'string',
          message: 'string',
          date: 'string',
          read: 'boolean',
          urgent: 'boolean',
          created_at: 'timestamp',
          updated_at: 'timestamp'
        }
      }
    ];

    // Store table schemas in KV store for reference
    for (const table of tables) {
      await kv.set(`table_schema_${table.name}`, table.schema);
    }

    // Initialize with demo data
    await initializeDemoData();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

async function initializeDemoData() {
  try {
    // Check if demo data already exists
    const existingUsers = await kv.getByPrefix('user_');
    if (existingUsers.length > 0) {
      console.log('Demo data already exists');
      return;
    }

    // Create demo admin user
    const adminUser = {
      id: '1',
      name: 'Dr. Ayurveda Admin',
      email: 'admin@panchakarma.com',
      role: 'admin',
      password: 'admin123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await kv.set('user_1', adminUser);

    // Create demo patient users
    const patientUser = {
      id: '2',
      name: 'John Patient',
      email: 'patient@example.com',
      role: 'patient',
      password: 'patient123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await kv.set('user_2', patientUser);

    // Create patient profile
    const patientProfile = {
      id: '2',
      user_id: '2',
      age: 45,
      phone: '+1-555-0123',
      address: '123 Wellness St, Health City, HC 12345',
      medical_history: 'Chronic joint pain, stress-related disorders, digestive issues. Previous treatments include conventional medication with limited success.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await kv.set('patient_2', patientProfile);

    // Create demo doctor user
    const doctorUser = {
      id: '3',
      name: 'Dr. Sharma',
      email: 'sharma@panchakarma.com',
      role: 'doctor',
      password: 'doctor123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await kv.set('user_3', doctorUser);

    // Create doctor profile
    const doctorProfile = {
      id: '3',
      user_id: '3',
      phone: '+1-555-0124',
      specialization: 'Panchakarma Specialist',
      qualification: 'BAMS, MD (Panchakarma)',
      experience: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await kv.set('doctor_3', doctorProfile);

    // Create demo therapy sessions
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const dayAfterTomorrow = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    const therapySessions = [
      {
        id: '1',
        patient_id: '2',
        therapy_type: 'Abhyanga (Oil Massage)',
        date: tomorrow,
        time: '09:00',
        duration: 60,
        status: 'scheduled',
        practitioner: 'Dr. Sharma',
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
        date: yesterday,
        time: '10:00',
        duration: 45,
        status: 'completed',
        practitioner: 'Dr. Patel',
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
        date: dayAfterTomorrow,
        time: '11:00',
        duration: 90,
        status: 'scheduled',
        practitioner: 'Dr. Kumar',
        notes: '',
        pre_procedure_instructions: [
          'Wash hair before treatment',
          'No heavy meals 3 hours prior',
          'Inform about head injuries if any'
        ],
        post_procedure_instructions: [
          'Do not wash hair for 24 hours',
          'Keep head covered',
          'Avoid loud noises',
          'Rest and meditate'
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const session of therapySessions) {
      await kv.set(`therapy_session_${session.id}`, session);
    }

    // Create demo progress data
    const progressData = [
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
        date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        symptom_score: 6,
        energy_level: 7,
        sleep_quality: 6,
        notes: 'Improved sleep quality',
        feedback: 'Less joint stiffness in the morning',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
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

    for (const progress of progressData) {
      await kv.set(`progress_${progress.id}`, progress);
    }

    // Create demo notifications
    const notifications = [
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
        type: 'post-procedure',
        title: 'Post-Treatment Care',
        message: 'Remember to rest for 30 minutes and drink warm water. Avoid cold exposure.',
        date: yesterday,
        read: true,
        urgent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        patient_id: '2',
        type: 'appointment',
        title: 'Upcoming Shirodhara Session',
        message: 'Your Shirodhara treatment is scheduled for tomorrow at 11:00 AM with Dr. Kumar.',
        date: new Date().toISOString().split('T')[0],
        read: false,
        urgent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
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

    for (const notification of notifications) {
      await kv.set(`notification_${notification.id}`, notification);
    }

    // Store therapy types and practitioners
    const therapyTypes = [
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
        name: 'Udvartana (Herbal Powder Massage)',
        duration: 75,
        description: 'Dry powder massage for weight management and skin health'
      }
    ];

    const practitioners = [
      'Dr. Sharma',
      'Dr. Patel',
      'Dr. Kumar',
      'Dr. Gupta',
      'Dr. Singh'
    ];

    await kv.set('therapy_types', therapyTypes);
    await kv.set('practitioners', practitioners);

    console.log('Demo data initialized successfully');
  } catch (error) {
    console.error('Demo data initialization error:', error);
  }
}

// Helper function to generate unique ID
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Routes

// Authentication
app.post('/make-server-a3cc576e/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // Get all users
    const users = await kv.getByPrefix('user_');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Users
app.get('/make-server-a3cc576e/users', async (c) => {
  try {
    const users = await kv.getByPrefix('user_');
    return c.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

app.post('/make-server-a3cc576e/users', async (c) => {
  try {
    const userData = await c.req.json();
    const id = generateId();
    const user = {
      id,
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`user_${id}`, user);
    
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
      await kv.set(`patient_${id}`, patientProfile);
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
      await kv.set(`doctor_${id}`, doctorProfile);
    }
    
    return c.json({ user });
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Patients
app.get('/make-server-a3cc576e/patients', async (c) => {
  try {
    const patients = await kv.getByPrefix('patient_');
    const users = await kv.getByPrefix('user_');
    
    // Combine patient data with user data
    const fullPatients = patients.map(patient => {
      const user = users.find(u => u.id === patient.user_id);
      return {
        ...user,
        ...patient,
        age: patient.age,
        phone: patient.phone,
        address: patient.address,
        medicalHistory: patient.medical_history
      };
    });
    
    return c.json({ patients: fullPatients });
  } catch (error) {
    console.error('Get patients error:', error);
    return c.json({ error: 'Failed to fetch patients' }, 500);
  }
});

app.get('/make-server-a3cc576e/patients/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const patient = await kv.get(`patient_${id}`);
    const user = await kv.get(`user_${id}`);
    
    if (!patient || !user) {
      return c.json({ error: 'Patient not found' }, 404);
    }
    
    const fullPatient = {
      ...user,
      ...patient,
      age: patient.age,
      phone: patient.phone,
      address: patient.address,
      medicalHistory: patient.medical_history
    };
    
    return c.json({ patient: fullPatient });
  } catch (error) {
    console.error('Get patient error:', error);
    return c.json({ error: 'Failed to fetch patient' }, 500);
  }
});

app.put('/make-server-a3cc576e/patients/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const existingPatient = await kv.get(`patient_${id}`);
    const existingUser = await kv.get(`user_${id}`);
    
    if (!existingPatient || !existingUser) {
      return c.json({ error: 'Patient not found' }, 404);
    }
    
    // Update patient profile
    const updatedPatient = {
      ...existingPatient,
      age: updates.age !== undefined ? updates.age : existingPatient.age,
      phone: updates.phone !== undefined ? updates.phone : existingPatient.phone,
      address: updates.address !== undefined ? updates.address : existingPatient.address,
      medical_history: updates.medicalHistory !== undefined ? updates.medicalHistory : existingPatient.medical_history,
      updated_at: new Date().toISOString()
    };
    
    // Update user data
    const updatedUser = {
      ...existingUser,
      name: updates.name !== undefined ? updates.name : existingUser.name,
      email: updates.email !== undefined ? updates.email : existingUser.email,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`patient_${id}`, updatedPatient);
    await kv.set(`user_${id}`, updatedUser);
    
    const fullPatient = {
      ...updatedUser,
      ...updatedPatient,
      age: updatedPatient.age,
      phone: updatedPatient.phone,
      address: updatedPatient.address,
      medicalHistory: updatedPatient.medical_history
    };
    
    return c.json({ patient: fullPatient });
  } catch (error) {
    console.error('Update patient error:', error);
    return c.json({ error: 'Failed to update patient' }, 500);
  }
});

// Doctors
app.get('/make-server-a3cc576e/doctors', async (c) => {
  try {
    const doctors = await kv.getByPrefix('doctor_');
    const users = await kv.getByPrefix('user_');
    
    // Combine doctor data with user data
    const fullDoctors = doctors.map(doctor => {
      const user = users.find(u => u.id === doctor.user_id);
      return {
        ...user,
        ...doctor,
        phone: doctor.phone,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience
      };
    });
    
    return c.json({ doctors: fullDoctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    return c.json({ error: 'Failed to fetch doctors' }, 500);
  }
});

app.get('/make-server-a3cc576e/doctors/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const doctor = await kv.get(`doctor_${id}`);
    const user = await kv.get(`user_${id}`);
    
    if (!doctor || !user) {
      return c.json({ error: 'Doctor not found' }, 404);
    }
    
    const fullDoctor = {
      ...user,
      ...doctor,
      phone: doctor.phone,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience
    };
    
    return c.json({ doctor: fullDoctor });
  } catch (error) {
    console.error('Get doctor error:', error);
    return c.json({ error: 'Failed to fetch doctor' }, 500);
  }
});

app.put('/make-server-a3cc576e/doctors/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const existingDoctor = await kv.get(`doctor_${id}`);
    const existingUser = await kv.get(`user_${id}`);
    
    if (!existingDoctor || !existingUser) {
      return c.json({ error: 'Doctor not found' }, 404);
    }
    
    // Update doctor profile
    const updatedDoctor = {
      ...existingDoctor,
      phone: updates.phone !== undefined ? updates.phone : existingDoctor.phone,
      specialization: updates.specialization !== undefined ? updates.specialization : existingDoctor.specialization,
      qualification: updates.qualification !== undefined ? updates.qualification : existingDoctor.qualification,
      experience: updates.experience !== undefined ? updates.experience : existingDoctor.experience,
      updated_at: new Date().toISOString()
    };
    
    // Update user data
    const updatedUser = {
      ...existingUser,
      name: updates.name !== undefined ? updates.name : existingUser.name,
      email: updates.email !== undefined ? updates.email : existingUser.email,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`doctor_${id}`, updatedDoctor);
    await kv.set(`user_${id}`, updatedUser);
    
    const fullDoctor = {
      ...updatedUser,
      ...updatedDoctor,
      phone: updatedDoctor.phone,
      specialization: updatedDoctor.specialization,
      qualification: updatedDoctor.qualification,
      experience: updatedDoctor.experience
    };
    
    return c.json({ doctor: fullDoctor });
  } catch (error) {
    console.error('Update doctor error:', error);
    return c.json({ error: 'Failed to update doctor' }, 500);
  }
});

// Therapy Sessions
app.get('/make-server-a3cc576e/therapy-sessions', async (c) => {
  try {
    const sessions = await kv.getByPrefix('therapy_session_');
    return c.json({ sessions });
  } catch (error) {
    console.error('Get therapy sessions error:', error);
    return c.json({ error: 'Failed to fetch therapy sessions' }, 500);
  }
});

app.get('/make-server-a3cc576e/therapy-sessions/patient/:patientId', async (c) => {
  try {
    const patientId = c.req.param('patientId');
    const allSessions = await kv.getByPrefix('therapy_session_');
    const patientSessions = allSessions.filter(session => session.patient_id === patientId);
    return c.json({ sessions: patientSessions });
  } catch (error) {
    console.error('Get patient therapy sessions error:', error);
    return c.json({ error: 'Failed to fetch patient therapy sessions' }, 500);
  }
});

app.post('/make-server-a3cc576e/therapy-sessions', async (c) => {
  try {
    const sessionData = await c.req.json();
    const id = generateId();
    const session = {
      id,
      ...sessionData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`therapy_session_${id}`, session);
    return c.json({ session });
  } catch (error) {
    console.error('Create therapy session error:', error);
    return c.json({ error: 'Failed to create therapy session' }, 500);
  }
});

app.put('/make-server-a3cc576e/therapy-sessions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const existingSession = await kv.get(`therapy_session_${id}`);
    if (!existingSession) {
      return c.json({ error: 'Therapy session not found' }, 404);
    }
    
    const updatedSession = {
      ...existingSession,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`therapy_session_${id}`, updatedSession);
    return c.json({ session: updatedSession });
  } catch (error) {
    console.error('Update therapy session error:', error);
    return c.json({ error: 'Failed to update therapy session' }, 500);
  }
});

// Progress Data
app.get('/make-server-a3cc576e/progress/patient/:patientId', async (c) => {
  try {
    const patientId = c.req.param('patientId');
    const allProgress = await kv.getByPrefix('progress_');
    const patientProgress = allProgress.filter(progress => progress.patient_id === patientId);
    return c.json({ progress: patientProgress });
  } catch (error) {
    console.error('Get patient progress error:', error);
    return c.json({ error: 'Failed to fetch patient progress' }, 500);
  }
});

app.post('/make-server-a3cc576e/progress', async (c) => {
  try {
    const progressData = await c.req.json();
    const id = generateId();
    const progress = {
      id,
      ...progressData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`progress_${id}`, progress);
    return c.json({ progress });
  } catch (error) {
    console.error('Create progress error:', error);
    return c.json({ error: 'Failed to create progress entry' }, 500);
  }
});

// Notifications
app.get('/make-server-a3cc576e/notifications/patient/:patientId', async (c) => {
  try {
    const patientId = c.req.param('patientId');
    const allNotifications = await kv.getByPrefix('notification_');
    const patientNotifications = allNotifications.filter(notification => notification.patient_id === patientId);
    return c.json({ notifications: patientNotifications });
  } catch (error) {
    console.error('Get patient notifications error:', error);
    return c.json({ error: 'Failed to fetch patient notifications' }, 500);
  }
});

app.post('/make-server-a3cc576e/notifications', async (c) => {
  try {
    const notificationData = await c.req.json();
    const id = generateId();
    const notification = {
      id,
      ...notificationData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`notification_${id}`, notification);
    return c.json({ notification });
  } catch (error) {
    console.error('Create notification error:', error);
    return c.json({ error: 'Failed to create notification' }, 500);
  }
});

app.put('/make-server-a3cc576e/notifications/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const existingNotification = await kv.get(`notification_${id}`);
    if (!existingNotification) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    
    const updatedNotification = {
      ...existingNotification,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`notification_${id}`, updatedNotification);
    return c.json({ notification: updatedNotification });
  } catch (error) {
    console.error('Update notification error:', error);
    return c.json({ error: 'Failed to update notification' }, 500);
  }
});

// Reference Data
app.get('/make-server-a3cc576e/therapy-types', async (c) => {
  try {
    const therapyTypes = await kv.get('therapy_types');
    return c.json({ therapyTypes });
  } catch (error) {
    console.error('Get therapy types error:', error);
    return c.json({ error: 'Failed to fetch therapy types' }, 500);
  }
});

app.get('/make-server-a3cc576e/practitioners', async (c) => {
  try {
    const practitioners = await kv.get('practitioners');
    return c.json({ practitioners });
  } catch (error) {
    console.error('Get practitioners error:', error);
    return c.json({ error: 'Failed to fetch practitioners' }, 500);
  }
});

// Analytics
app.get('/make-server-a3cc576e/analytics', async (c) => {
  try {
    const sessions = await kv.getByPrefix('therapy_session_');
    const patients = await kv.getByPrefix('patient_');
    const progress = await kv.getByPrefix('progress_');
    
    const totalPatients = patients.length;
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const upcomingSessions = sessions.filter(s => s.status === 'scheduled').length;
    
    // Calculate average scores from progress data
    const avgSymptomScore = progress.reduce((sum, p) => sum + p.symptom_score, 0) / (progress.length || 1);
    const avgEnergyLevel = progress.reduce((sum, p) => sum + p.energy_level, 0) / (progress.length || 1);
    const avgSleepQuality = progress.reduce((sum, p) => sum + p.sleep_quality, 0) / (progress.length || 1);
    
    return c.json({
      analytics: {
        totalPatients,
        totalSessions,
        completedSessions,
        upcomingSessions,
        avgSymptomScore: Math.round(avgSymptomScore * 10) / 10,
        avgEnergyLevel: Math.round(avgEnergyLevel * 10) / 10,
        avgSleepQuality: Math.round(avgSleepQuality * 10) / 10
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// Initialize database on startup
await initializeDatabase();

Deno.serve(app.fetch);