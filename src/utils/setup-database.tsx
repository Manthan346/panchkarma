import { supabase } from './supabase-client';

export async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // First, try to create the table if it doesn't exist
    const { error: createTableError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS kv_store_a3cc576e (
          key TEXT NOT NULL PRIMARY KEY,
          value JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Disable RLS for this demo table
        ALTER TABLE kv_store_a3cc576e DISABLE ROW LEVEL SECURITY;
        
        -- Create an index for better performance
        CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_a3cc576e(key);
      `
    });
    
    if (createTableError) {
      console.log('Could not create table via RPC, trying direct approach...');
      
      // Try creating table directly (might fail, but that's ok if it exists)
      try {
        await supabase
          .from('kv_store_a3cc576e')
          .select('count', { count: 'exact', head: true });
        console.log('Table exists and is accessible');
      } catch (tableError) {
        console.log('Table access test failed:', tableError);
        throw new Error('Cannot access or create database table');
      }
    }
    
    console.log('Database setup completed');
    return { success: true };
    
  } catch (error) {
    console.error('Database setup error:', error);
    return { success: false, error };
  }
}

export async function disableRLS() {
  try {
    // Try to disable RLS using a function call
    const { error } = await supabase.rpc('disable_rls_kv_store');
    
    if (error && !error.message.includes('does not exist')) {
      console.warn('Could not disable RLS:', error);
    }
    
    return { success: true };
  } catch (error) {
    console.warn('RLS disable attempt failed:', error);
    return { success: false, error };
  }
}