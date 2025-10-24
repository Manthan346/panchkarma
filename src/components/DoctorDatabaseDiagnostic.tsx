import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Loader2, AlertTriangle, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../utils/supabase-client';
import { toast } from 'sonner@2.0.3';

interface DiagnosticResult {
  profilesWithoutDoctors: any[];
  doctorsWithoutProfiles: any[];
  completeRecords: any[];
}

export function DoctorDatabaseDiagnostic() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Starting doctor database diagnostic...');

      // Get all profiles with role='doctor'
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .eq('role', 'doctor');

      if (profileError) throw profileError;

      console.log('📋 Found profiles with role=doctor:', profiles?.length);

      // Get all doctor records
      const { data: doctors, error: doctorError } = await supabase
        .from('doctors')
        .select('id, phone, specialization, qualification, experience, created_at');

      if (doctorError) throw doctorError;

      console.log('👨‍⚕️ Found doctor records:', doctors?.length);

      // Create sets for quick lookup
      const profileIds = new Set((profiles || []).map(p => p.id));
      const doctorIds = new Set((doctors || []).map(d => d.id));

      // Find mismatches
      const profilesWithoutDoctors = (profiles || []).filter(p => !doctorIds.has(p.id));
      const doctorsWithoutProfiles = (doctors || []).filter(d => !profileIds.has(d.id));
      const completeRecords = (profiles || []).filter(p => doctorIds.has(p.id));

      const diagnosticResult = {
        profilesWithoutDoctors,
        doctorsWithoutProfiles,
        completeRecords
      };

      setResult(diagnosticResult);

      console.log('✅ Diagnostic complete:', {
        complete: completeRecords.length,
        orphanedProfiles: profilesWithoutDoctors.length,
        orphanedDoctors: doctorsWithoutProfiles.length
      });

      if (profilesWithoutDoctors.length > 0 || doctorsWithoutProfiles.length > 0) {
        toast.warning('Found orphaned records', {
          description: `${profilesWithoutDoctors.length} profiles without doctor records, ${doctorsWithoutProfiles.length} doctor records without profiles`
        });
      } else {
        toast.success('All doctor records are properly linked!');
      }

    } catch (error: any) {
      console.error('❌ Diagnostic error:', error);
      toast.error('Diagnostic failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupOrphanedRecords = async () => {
    if (!result) return;

    const confirmCleanup = window.confirm(
      `This will delete:\n` +
      `- ${result.profilesWithoutDoctors.length} orphaned profiles\n` +
      `- ${result.doctorsWithoutProfiles.length} orphaned doctor records\n\n` +
      `Are you sure you want to continue?`
    );

    if (!confirmCleanup) return;

    setIsCleaningUp(true);
    try {
      let deletedCount = 0;

      // Delete orphaned profiles (ones without doctor records)
      for (const profile of result.profilesWithoutDoctors) {
        console.log('🧹 Deleting orphaned profile:', profile.id, profile.email);
        
        // Delete from profiles table
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profile.id);

        if (error) {
          console.error('Failed to delete profile:', error);
        } else {
          deletedCount++;
        }
      }

      // Delete orphaned doctor records (ones without profiles)
      for (const doctor of result.doctorsWithoutProfiles) {
        console.log('🧹 Deleting orphaned doctor record:', doctor.id);
        
        const { error } = await supabase
          .from('doctors')
          .delete()
          .eq('id', doctor.id);

        if (error) {
          console.error('Failed to delete doctor record:', error);
        } else {
          deletedCount++;
        }
      }

      toast.success(`Cleaned up ${deletedCount} orphaned records`);
      
      // Re-run diagnostic
      await runDiagnostic();

    } catch (error: any) {
      console.error('❌ Cleanup error:', error);
      toast.error('Cleanup failed: ' + error.message);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const hasIssues = result && (
    result.profilesWithoutDoctors.length > 0 || 
    result.doctorsWithoutProfiles.length > 0
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Doctor Database Diagnostic</CardTitle>
              <CardDescription>
                Check for orphaned records and database inconsistencies
              </CardDescription>
            </div>
            <Button onClick={runDiagnostic} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Diagnostic
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {result && (
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Complete Records</p>
                      <p className="text-2xl font-semibold">{result.completeRecords.length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Orphaned Profiles</p>
                      <p className="text-2xl font-semibold">{result.profilesWithoutDoctors.length}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Orphaned Doctors</p>
                      <p className="text-2xl font-semibold">{result.doctorsWithoutProfiles.length}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Alert */}
            {hasIssues ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Database Inconsistencies Detected</AlertTitle>
                <AlertDescription>
                  Found orphaned records that need cleanup. These records can cause "no doctors available" 
                  errors during appointment booking.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Database is Healthy</AlertTitle>
                <AlertDescription>
                  All doctor profiles are properly linked with their corresponding records.
                </AlertDescription>
              </Alert>
            )}

            {/* Cleanup Button */}
            {hasIssues && (
              <div className="flex justify-end">
                <Button 
                  onClick={cleanupOrphanedRecords} 
                  disabled={isCleaningUp}
                  variant="destructive"
                >
                  {isCleaningUp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cleaning Up...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clean Up Orphaned Records
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Orphaned Profiles Table */}
            {result.profilesWithoutDoctors.length > 0 && (
              <div>
                <h3 className="mb-4">Orphaned Profiles (no doctor record)</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.profilesWithoutDoctors.map(profile => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-mono text-xs">{profile.id.slice(0, 8)}...</TableCell>
                          <TableCell>{profile.email}</TableCell>
                          <TableCell>{profile.full_name}</TableCell>
                          <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Orphaned Doctor Records Table */}
            {result.doctorsWithoutProfiles.length > 0 && (
              <div>
                <h3 className="mb-4">Orphaned Doctor Records (no profile)</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.doctorsWithoutProfiles.map(doctor => (
                        <TableRow key={doctor.id}>
                          <TableCell className="font-mono text-xs">{doctor.id.slice(0, 8)}...</TableCell>
                          <TableCell>{doctor.specialization}</TableCell>
                          <TableCell>{doctor.experience} years</TableCell>
                          <TableCell>{new Date(doctor.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Complete Records Table */}
            {result.completeRecords.length > 0 && (
              <div>
                <h3 className="mb-4">Complete Doctor Records ({result.completeRecords.length})</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.completeRecords.slice(0, 5).map(profile => (
                        <TableRow key={profile.id}>
                          <TableCell>{profile.full_name}</TableCell>
                          <TableCell>{profile.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Complete
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {result.completeRecords.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            ... and {result.completeRecords.length - 5} more
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
