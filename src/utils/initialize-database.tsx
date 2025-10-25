import { supabase } from './supabase-client';
import { setupDatabase } from './setup-database';

export async function initializeDatabaseWithDemoData() {
  try {
    console.log('Initializing database with demo data...');
    
    // First setup the database (handle RLS)
    const setupResult = await setupDatabase();
    if (!setupResult.success) {
      console.warn('Database setup failed, proceeding anyway...');
    }
    
    // Check if data already exists
    try {
      const { data: existingData, error: selectError } = await supabase
        .from('kv_store_a3cc576e')
        .select('key')
        .eq('key', 'user_1')
        .maybeSingle();
      
      if (selectError) {
        console.warn('Error checking existing data:', selectError);
        // Continue to try initialization
      } else if (existingData) {
        console.log('Database already initialized');
        return { success: true, alreadyInitialized: true };
      }
    } catch (checkError) {
      console.warn('Could not check existing data:', checkError);
      // Continue with initialization attempt
    }
    
    // Create demo users
    const demoData = [
      // Admin user
      {
        key: 'user_1',
        value: {
          id: '1',
          name: 'Dr. Ayurveda Admin',
          email: 'admin@panchakarma.com',
          role: 'admin',
          password: 'admin123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      // Patient user
      {
        key: 'user_2',
        value: {
          id: '2',
          name: 'John Patient',
          email: 'patient@example.com',
          role: 'patient',
          password: 'patient123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      // Patient profile
      {
        key: 'patient_2',
        value: {
          id: '2',
          user_id: '2',
          age: 45,
          phone: '+1-555-0123',
          address: '123 Wellness St, Health City, HC 12345',
          medical_history: 'Chronic joint pain, stress-related disorders, digestive issues. Previous treatments include conventional medication with limited success.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      // Doctor users
      {
        key: 'user_3',
        value: {
          id: '3',
          name: 'Dr. Sharma',
          email: 'sharma@panchakarma.com',
          role: 'doctor',
          password: 'doctor123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      {
        key: 'doctor_3',
        value: {
          id: '3',
          user_id: '3',
          phone: '+1-555-0124',
          specialization: 'Panchakarma Specialist',
          qualification: 'BAMS, MD (Panchakarma)',
          experience: 15,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      {
        key: 'user_4',
        value: {
          id: '4',
          name: 'Dr. Patel',
          email: 'patel@panchakarma.com',
          role: 'doctor',
          password: 'doctor123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      {
        key: 'doctor_4',
        value: {
          id: '4',
          user_id: '4',
          phone: '+1-555-0125',
          specialization: 'Ayurvedic Medicine',
          qualification: 'BAMS, MD (Ayurveda)',
          experience: 12,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      {
        key: 'user_5',
        value: {
          id: '5',
          name: 'Dr. Kumar',
          email: 'kumar@panchakarma.com',
          role: 'doctor',
          password: 'doctor123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      {
        key: 'doctor_5',
        value: {
          id: '5',
          user_id: '5',
          phone: '+1-555-0126',
          specialization: 'Therapeutic Massage',
          qualification: 'BAMS, Diploma in Panchakarma)',
          experience: 8,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      // Therapy sessions
      {
        key: 'therapy_session_1',
        value: {
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
        }
      },
      {
        key: 'therapy_session_2',
        value: {
          id: '2',
          patient_id: '2',
          therapy_type: 'Swedana (Steam Therapy)',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          time: '10:00',
          duration: 45,
          status: 'completed',
          practitioner: 'Dr. Patel',
          doctor_id: '4',
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
        }
      },
      {
        key: 'therapy_session_3',
        value: {
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
      },
      // Progress data
      {
        key: 'progress_1',
        value: {
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
        }
      },
      {
        key: 'progress_2',
        value: {
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
      },
      // Notifications
      {
        key: 'notification_1',
        value: {
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
        }
      },
      {
        key: 'notification_2',
        value: {
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
      },
      // Therapy types
      {
        key: 'therapy_types',
        value: [
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
        ]
      },
      // Practitioners
      {
        key: 'practitioners',
        value: [
          'Dr. Sharma',
          'Dr. Patel',
          'Dr. Kumar',
          'Dr. Gupta',
          'Dr. Singh'
        ]
      }
    ];
    
    // Insert all demo data with better error handling
    try {
      const { error } = await supabase
        .from('kv_store_a3cc576e')
        .insert(demoData);
      
      if (error) {
        console.error('Error inserting demo data:', error);
        
        // If it's an RLS error, try to provide helpful information
        if (error.code === '42501') {
          console.error('RLS Policy Error: The table has Row Level Security enabled but no policies allow data insertion.');
          console.error('This usually means the database needs to be configured properly.');
          
          // Return a special error that indicates RLS issue
          return { 
            success: false, 
            error: error,
            rlsError: true,
            message: 'Database table has Row Level Security enabled. Please configure database permissions.'
          };
        }
        
        throw error;
      }
      
      console.log('Demo data initialized successfully');
      return { success: true, alreadyInitialized: false };
      
    } catch (insertError) {
      console.error('Failed to insert demo data:', insertError);
      
      // Return error but don't crash the app
      return { 
        success: false, 
        error: insertError,
        message: 'Could not initialize database with demo data'
      };
    }
    
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error };
  }
}
