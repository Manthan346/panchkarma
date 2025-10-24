import React, { useEffect, useState } from 'react';
import { databaseService } from '../utils/database-smart';
import { supabase } from '../utils/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export function DoctorLoadTest() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [doctorRecords, setDoctorRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fixDoctorProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔧 Fixing doctor profiles...');
      
      // Get all doctor records
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('*');
      
      if (!doctorsData || doctorsData.length === 0) {
        setError('No doctor records found to fix');
        return;
      }
      
      let fixedCount = 0;
      let orphanedIds: string[] = [];
      
      // For each doctor record, check if profile exists and fix it
      for (const doctor of doctorsData) {
        console.log(`🔍 Checking profile for doctor ID: ${doctor.id}`);
        
        // Check if profile exists
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', doctor.id)
          .maybeSingle();
        
        if (!existingProfile) {
          console.error(`❌ No profile found for doctor ID: ${doctor.id}`);
          
          // Check if there's an auth user with this ID
          const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
          const authUser = users?.find(u => u.id === doctor.id);
          
          if (authUser) {
            console.log(`🔧 Creating missing profile for ${authUser.email}`);
            
            // Create the missing profile
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: doctor.id,
                email: authUser.email,
                full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Doctor',
                role: 'doctor',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            
            if (insertError) {
              console.error('❌ Failed to create profile:', insertError);
              setError(`Failed to create profile: ${insertError.message}`);
            } else {
              console.log('✅ Profile created successfully!');
              fixedCount++;
            }
          } else {
            console.error(`❌ No auth user found for doctor ID: ${doctor.id} - This is an orphaned record`);
            orphanedIds.push(doctor.id);
          }
        } else if (existingProfile.role !== 'doctor') {
          console.log(`🔧 Fixing role for ${existingProfile.email}: ${existingProfile.role} -> doctor`);
          
          // Update the role to 'doctor'
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'doctor' })
            .eq('id', doctor.id);
          
          if (updateError) {
            console.error('❌ Failed to update role:', updateError);
            setError(`Failed to update role: ${updateError.message}`);
          } else {
            console.log('✅ Role updated successfully!');
            fixedCount++;
          }
        } else {
          console.log(`✅ Profile for ${existingProfile.email} is already correct`);
        }
      }
      
      // Show results
      if (fixedCount > 0) {
        setError(null);
        console.log(`✅ Fixed ${fixedCount} doctor profile(s)`);
      }
      
      if (orphanedIds.length > 0) {
        setError(`Found ${orphanedIds.length} orphaned doctor record(s) with no auth user. These need to be deleted and recreated. IDs: ${orphanedIds.join(', ')}`);
      }
      
      // Reload doctors after fix
      await loadDoctors();
      
    } catch (err: any) {
      console.error('❌ Error fixing doctor profiles:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  const deleteOrphanedDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🗑️ Deleting orphaned doctor records...');
      
      // Get all doctor records
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('*');
      
      if (!doctorsData || doctorsData.length === 0) {
        setError('No doctor records found');
        return;
      }
      
      let deletedCount = 0;
      
      for (const doctor of doctorsData) {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', doctor.id)
          .maybeSingle();
        
        if (!existingProfile) {
          console.log(`🗑️ Deleting orphaned doctor record: ${doctor.id}`);
          
          const { error: deleteError } = await supabase
            .from('doctors')
            .delete()
            .eq('id', doctor.id);
          
          if (deleteError) {
            console.error('❌ Failed to delete:', deleteError);
          } else {
            console.log('✅ Deleted successfully');
            deletedCount++;
          }
        }
      }
      
      console.log(`✅ Deleted ${deletedCount} orphaned doctor record(s)`);
      setError(null);
      
      // Reload doctors after deletion
      await loadDoctors();
      
    } catch (err: any) {
      console.error('❌ Error deleting orphaned doctors:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Testing doctor load...');
      
      // Test 1: Load via service
      const data = await databaseService.doctors.getDoctors();
      console.log('✅ Service returned doctors:', data);
      setDoctors(data || []);
      
      // Test 2: Check profiles table directly
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor');
      
      console.log('📋 Profiles with role=doctor:', profilesData);
      console.log('📋 Profiles error:', profilesError);
      setProfiles(profilesData || []);
      
      // Test 3: Check doctors table directly
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*');
      
      console.log('👨‍⚕️ Doctor records:', doctorsData);
      console.log('👨‍⚕️ Doctors error:', doctorsError);
      setDoctorRecords(doctorsData || []);
      
      // Test 4: Check if there's a mismatch
      if (doctorsData && doctorsData.length > 0 && (!profilesData || profilesData.length === 0)) {
        console.error('⚠️ MISMATCH: Doctors table has records but no matching profiles with role=doctor!');
        
        // Check what the actual profiles look like for these IDs
        for (const doctor of doctorsData) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', doctor.id)
            .single();
          
          console.log(`📋 Profile for doctor ${doctor.id}:`, profile);
        }
      }
      
    } catch (err: any) {
      console.error('❌ Error loading doctors:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doctor Load Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={loadDoctors} disabled={loading}>
              {loading ? 'Loading...' : 'Reload Doctors'}
            </Button>
            <Button onClick={fixDoctorProfiles} disabled={loading} variant="secondary">
              {loading ? 'Fixing...' : 'Fix Doctor Profiles'}
            </Button>
            <Button onClick={deleteOrphanedDoctors} disabled={loading} variant="destructive">
              {loading ? 'Deleting...' : 'Delete Orphaned Records'}
            </Button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded">
            <div>
              <strong>Service Doctors:</strong> {doctors.length}
            </div>
            <div>
              <strong>Doctor Profiles:</strong> {profiles.length}
            </div>
            <div>
              <strong>Doctor Records:</strong> {doctorRecords.length}
            </div>
          </div>
          
          {doctorRecords.length > 0 && profiles.length === 0 && (
            <div className="p-4 bg-red-100 text-red-900 rounded">
              <strong>⚠️ DATA MISMATCH DETECTED!</strong>
              <p>There are {doctorRecords.length} doctor record(s) but no profiles with role='doctor'.</p>
              <p>This means the profile was not created properly or the role field is incorrect.</p>
            </div>
          )}
          
          {profiles.length > 0 && (
            <div className="space-y-2">
              <strong>Doctor Profiles Found:</strong>
              {profiles.map((profile, index) => (
                <div key={profile.id || index} className="p-3 bg-green-50 rounded">
                  <div><strong>ID:</strong> {profile.id}</div>
                  <div><strong>Email:</strong> {profile.email || 'N/A'}</div>
                  <div><strong>Full Name:</strong> {profile.full_name || 'N/A'}</div>
                  <div><strong>Role:</strong> {profile.role || 'N/A'}</div>
                </div>
              ))}
            </div>
          )}
          
          {doctorRecords.length > 0 && (
            <div className="space-y-2">
              <strong>Doctor Table Records:</strong>
              {doctorRecords.map((record, index) => (
                <div key={record.id || index} className="p-3 bg-yellow-50 rounded">
                  <div><strong>ID:</strong> {record.id}</div>
                  <div><strong>Phone:</strong> {record.phone || 'N/A'}</div>
                  <div><strong>Specialization:</strong> {record.specialization || 'N/A'}</div>
                  <div><strong>Qualification:</strong> {record.qualification || 'N/A'}</div>
                  <div><strong>Experience:</strong> {record.experience || 'N/A'}</div>
                </div>
              ))}
            </div>
          )}
          
          {doctors.length === 0 && profiles.length === 0 && doctorRecords.length === 0 && !loading && !error && (
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded">
              No doctors found in any table. Please create a doctor first.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
