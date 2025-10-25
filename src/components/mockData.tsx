import { User, Patient, TherapySession, ProgressData, Notification } from '../App';

// Mock users data
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Dr. Ayurveda Admin',
    email: 'admin@panchakarma.com',
    role: 'admin',
    password: 'admin123'
  },
  {
    id: '2',
    name: 'John Patient',
    email: 'patient@example.com',
    role: 'patient',
    password: 'patient123'
  }
];

// Mock therapy sessions
export const mockTherapySessions: TherapySession[] = [
  {
    id: '1',
    patientId: '2',
    therapyType: 'Abhyanga (Oil Massage)',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    time: '09:00',
    duration: 60,
    status: 'scheduled',
    practitioner: 'Dr. Sharma',
    preProcedureInstructions: [
      'Fast for 2 hours before treatment',
      'Avoid cold drinks',
      'Wear comfortable clothing',
      'Arrive 15 minutes early'
    ],
    postProcedureInstructions: [
      'Rest for 30 minutes after treatment',
      'Drink warm water',
      'Avoid cold exposure for 2 hours',
      'Take prescribed herbal medicine'
    ]
  },
  {
    id: '2',
    patientId: '2',
    therapyType: 'Swedana (Steam Therapy)',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    time: '10:00',
    duration: 45,
    status: 'completed',
    practitioner: 'Dr. Patel',
    notes: 'Patient responded well to treatment',
    preProcedureInstructions: [
      'Light breakfast only',
      'Remove all jewelry',
      'Inform about any discomfort'
    ],
    postProcedureInstructions: [
      'Cool down gradually',
      'Drink plenty of water',
      'Rest for 1 hour'
    ]
  },
  {
    id: '3',
    patientId: '2',
    therapyType: 'Shirodhara (Oil Pouring)',
    date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // Day after tomorrow
    time: '11:00',
    duration: 90,
    status: 'scheduled',
    practitioner: 'Dr. Kumar',
    preProcedureInstructions: [
      'Wash hair before treatment',
      'No heavy meals 3 hours prior',
      'Inform about head injuries if any'
    ],
    postProcedureInstructions: [
      'Do not wash hair for 24 hours',
      'Keep head covered',
      'Avoid loud noises',
      'Rest and meditate'
    ]
  }
];

// Mock progress data
export const mockProgressData: ProgressData[] = [
  {
    id: '1',
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], // 7 days ago
    symptomScore: 7,
    energyLevel: 6,
    sleepQuality: 5,
    notes: 'Feeling better overall',
    feedback: 'Treatment is helping with pain management'
  },
  {
    id: '2',
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], // 5 days ago
    symptomScore: 6,
    energyLevel: 7,
    sleepQuality: 6,
    notes: 'Improved sleep quality',
    feedback: 'Less joint stiffness in the morning'
  },
  {
    id: '3',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], // 3 days ago
    symptomScore: 5,
    energyLevel: 8,
    sleepQuality: 7,
    notes: 'Significant improvement',
    feedback: 'Feeling more energetic and positive'
  }
];

// Mock notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'pre-procedure',
    title: 'Tomorrow\'s Abhyanga Treatment',
    message: 'Please fast for 2 hours before your 9:00 AM appointment. Wear comfortable clothing.',
    date: new Date().toISOString().split('T')[0], // Today
    read: false,
    urgent: true
  },
  {
    id: '2',
    type: 'post-procedure',
    title: 'Post-Treatment Care',
    message: 'Remember to rest for 30 minutes and drink warm water. Avoid cold exposure.',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    read: true,
    urgent: false
  },
  {
    id: '3',
    type: 'appointment',
    title: 'Upcoming Shirodhara Session',
    message: 'Your Shirodhara treatment is scheduled for tomorrow at 11:00 AM with Dr. Kumar.',
    date: new Date().toISOString().split('T')[0], // Today
    read: false,
    urgent: false
  },
  {
    id: '4',
    type: 'reminder',
    title: 'Daily Progress Update',
    message: 'Please update your daily symptoms and energy levels in the app.',
    date: new Date().toISOString().split('T')[0], // Today
    read: false,
    urgent: false
  }
];

// Mock patients data (extended user data)
export const mockPatients: Patient[] = [
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
    currentTherapies: mockTherapySessions,
    progressData: mockProgressData,
    notifications: mockNotifications
  },
  {
    id: '3',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@email.com',
    role: 'patient',
    password: 'sarah123',
    age: 38,
    phone: '+1-555-0124',
    address: '456 Serenity Ave, Calm Town, CT 67890',
    medicalHistory: 'Anxiety, insomnia, migraine headaches. Seeking holistic treatment approach.',
    currentTherapies: [],
    progressData: [],
    notifications: []
  },
  {
    id: '4',
    name: 'Michael Brown',
    email: 'michael.brown@email.com',
    role: 'patient',
    password: 'michael123',
    age: 52,
    phone: '+1-555-0125',
    address: '789 Balance Blvd, Harmony Hills, HH 34567',
    medicalHistory: 'Diabetes, high blood pressure, weight management issues. Looking for complementary therapy.',
    currentTherapies: [],
    progressData: [],
    notifications: []
  }
];

// Therapy types available
export const therapyTypes = [
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

// Practitioners available
export const practitioners = [
  'Dr. Sharma',
  'Dr. Patel',
  'Dr. Kumar',
  'Dr. Gupta',
  'Dr. Singh'
];
