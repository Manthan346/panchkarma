/* Environment-based Supabase Configuration */

// Fallback values for development/demo mode
const FALLBACK_PROJECT_ID = "zojbxdrvqtnyskpaslri";
const FALLBACK_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvamJ4ZHJ2cXRueXNrcGFzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAxNTEsImV4cCI6MjA3NDYzNjE1MX0.ijm8c0TUFei0HKlPTbxaAxxs0Pfvj-Tp2Lu-lCoqgYc";

// Use environment variables or fallback to hardcoded values
export const projectId = import.meta.env?.VITE_PROJECT_ID || FALLBACK_PROJECT_ID;
export const publicAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;
export const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;
export const edgeFunctionUrl = import.meta.env?.VITE_EDGE_FUNCTION_URL || `https://${projectId}.supabase.co/functions/v1/make-server-a3cc576e`;

// Force demo mode flag
export const forceDemoMode = import.meta.env?.VITE_FORCE_DEMO_MODE === 'true';

// App configuration
export const appConfig = {
  name: import.meta.env?.VITE_APP_NAME || 'Panchakarma Patient Management System',
  version: import.meta.env?.VITE_APP_VERSION || '1.0.0'
};