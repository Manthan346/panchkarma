import React from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase-client';

export function QuickDiagnostic() {
  const runQuickTest = async () => {
    console.log('🔍 Running quick diagnostic...');
    
    try {
      // Test 1: Auth status
      const startAuth = Date.now();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      const authTime = Date.now() - startAuth;
      
      if (authError) {
        toast.error(`Auth Error (${authTime}ms): ${authError.message}`);
        console.error('❌ Auth test failed:', authError);
        return;
      }
      
      toast.success(`✅ Auth OK (${authTime}ms)`);
      console.log(`✅ Auth OK (${authTime}ms):`, user?.email);
      
      if (!user) {
        toast.warning('Not logged in');
        return;
      }
      
      // Test 2: Profile query
      const startProfile = Date.now();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      const profileTime = Date.now() - startProfile;
      
      if (profileError) {
        toast.error(`Profile Error (${profileTime}ms): ${profileError.message}`);
        console.error('❌ Profile test failed:', profileError);
        return;
      }
      
      toast.success(`✅ Profile OK (${profileTime}ms)`);
      console.log(`✅ Profile OK (${profileTime}ms):`, profile);
      
      // Test 3: Role-specific data
      if (profile?.role === 'patient') {
        const startPatient = Date.now();
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        const patientTime = Date.now() - startPatient;
        
        if (patientError) {
          toast.error(`Patient Error (${patientTime}ms): ${patientError.message}`);
          console.error('❌ Patient test failed:', patientError);
          return;
        }
        
        toast.success(`✅ Patient Data OK (${patientTime}ms)`);
        console.log(`✅ Patient Data OK (${patientTime}ms):`, patientData);
      }
      
      const totalTime = authTime + profileTime;
      toast.success(`🎉 All tests passed! Total: ${totalTime}ms`, {
        description: 'Database is working correctly'
      });
      
    } catch (error: any) {
      toast.error('Diagnostic Failed', {
        description: error.message
      });
      console.error('❌ Diagnostic error:', error);
    }
  };
  
  return (
    <Button 
      onClick={runQuickTest}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 shadow-lg"
    >
      🔍 Quick Test
    </Button>
  );
}
