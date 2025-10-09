import { supabaseDatabaseService } from './supabase-database';
import { databaseService as demoService } from './database';
import { toast } from 'sonner@2.0.3';

// Track connection status
let isSupabaseConnected = false;
let hasShownToast = false;

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    const result = await supabaseDatabaseService.connection.testConnection();
    isSupabaseConnected = result.success && result.supabaseAvailable;
    return isSupabaseConnected;
  } catch (error) {
    console.log('Supabase not available, using demo mode');
    isSupabaseConnected = false;
    return false;
  }
}

// Initialize connection check
testSupabaseConnection().then((connected) => {
  if (connected && !hasShownToast) {
    toast.success('✅ Connected to Supabase Database');
    hasShownToast = true;
  } else if (!connected && !hasShownToast) {
    toast.info('📊 Running in Demo Mode - All features available');
    hasShownToast = true;
  }
});

// Smart service wrapper
function createSmartService<T extends Record<string, any>>(
  supabaseService: T,
  demoServiceObj: T
): T {
  const smartService: any = {};

  for (const key in supabaseService) {
    smartService[key] = async (...args: any[]) => {
      try {
        if (isSupabaseConnected) {
          return await supabaseService[key](...args);
        }
      } catch (error) {
        console.warn(`Supabase ${key} failed, falling back to demo:`, error);
        isSupabaseConnected = false;
      }
      
      // Fallback to demo service
      return await demoServiceObj[key](...args);
    };
  }

  return smartService as T;
}

// Create smart services
export const smartDatabaseService = {
  auth: createSmartService(supabaseDatabaseService.auth, demoService.auth),
  users: createSmartService(supabaseDatabaseService.users, demoService.users),
  patients: createSmartService(supabaseDatabaseService.patients, demoService.patients),
  doctors: createSmartService(supabaseDatabaseService.doctors, demoService.doctors),
  therapySessions: createSmartService(supabaseDatabaseService.therapySessions, demoService.therapySessions),
  progress: createSmartService(supabaseDatabaseService.progress, demoService.progress),
  notifications: createSmartService(supabaseDatabaseService.notifications, demoService.notifications),
  feedback: createSmartService(supabaseDatabaseService.feedback, demoService.feedback),
  referenceData: createSmartService(supabaseDatabaseService.referenceData, demoService.referenceData),
  analytics: createSmartService(supabaseDatabaseService.analytics, demoService.analytics),
  connection: {
    async testConnection() {
      const supabaseConnected = await testSupabaseConnection();
      if (supabaseConnected) {
        return await supabaseDatabaseService.connection.testConnection();
      }
      return await demoService.connection.testConnection();
    },
    getStatus() {
      return {
        supabaseAvailable: isSupabaseConnected,
        usingDemoMode: !isSupabaseConnected
      };
    }
  }
};

// Export as default database service
export { smartDatabaseService as databaseService };