import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './supabase/info';

// Construct Supabase URL from project ID
const supabaseUrl = `https://${projectId}.supabase.co`;

// Create Supabase client with optimized timeout settings
export const supabase = createClient(supabaseUrl, publicAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'panchakarma-pms'
    }
  },
  // Optimize fetch settings
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper function to check connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('kv_store_a3cc576e')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    return { success: true, connected: true };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { success: false, connected: false, error };
  }
}

// Initialize the database table if it doesn't exist
export async function initializeDatabase() {
  try {
    // Try to create the table (will fail if it already exists, which is fine)
    const { error } = await supabase.rpc('create_kv_store_if_not_exists');
    
    // Ignore error if table already exists
    if (error && !error.message.includes('already exists')) {
      console.warn('Database initialization warning:', error);
    }
    
    return { success: true };
  } catch (error) {
    console.warn('Database initialization warning:', error);
    return { success: false, error };
  }
}