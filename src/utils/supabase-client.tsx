import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey, supabaseUrl } from './supabase/info';

// Create Supabase client
export const supabase = createClient(supabaseUrl, publicAnonKey);

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