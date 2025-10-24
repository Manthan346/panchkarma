import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { supabase } from '../utils/supabase-client';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

export function PatientDataDiagnostic() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    const diagnosticResults: DiagnosticResult[] = [];

    try {
      // Step 1: Check auth session
      diagnosticResults.push({
        step: 'Checking authentication',
        status: 'success',
        message: 'Checking current session...'
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        diagnosticResults.push({
          step: 'Authentication',
          status: 'error',
          message: 'Not authenticated or session expired',
          data: authError
        });
        setResults([...diagnosticResults]);
        setIsRunning(false);
        return;
      }

      diagnosticResults.push({
        step: 'Authentication',
        status: 'success',
        message: `Authenticated as: ${user.email}`,
        data: { userId: user.id, email: user.email }
      });

      // Step 2: Check profile exists
      diagnosticResults.push({
        step: 'Fetching profile',
        status: 'success',
        message: 'Querying profiles table...'
      });

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        diagnosticResults.push({
          step: 'Profile Query',
          status: 'error',
          message: `Failed to fetch profile: ${profileError.message}`,
          data: profileError
        });
      } else if (!profile) {
        diagnosticResults.push({
          step: 'Profile Query',
          status: 'warning',
          message: 'Profile not found in database',
          data: null
        });
      } else {
        diagnosticResults.push({
          step: 'Profile Query',
          status: 'success',
          message: `Profile found: ${profile.full_name} (${profile.role})`,
          data: profile
        });
      }

      // Step 3: Check patient record exists
      diagnosticResults.push({
        step: 'Fetching patient data',
        status: 'success',
        message: 'Querying patients table...'
      });

      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (patientError) {
        diagnosticResults.push({
          step: 'Patient Query',
          status: 'error',
          message: `Failed to fetch patient data: ${patientError.message}`,
          data: patientError
        });
      } else if (!patientData) {
        diagnosticResults.push({
          step: 'Patient Query',
          status: 'warning',
          message: 'Patient record not found - need to create one',
          data: null
        });
        
        // Try to create patient record
        const { error: insertError } = await supabase
          .from('patients')
          .insert({
            id: user.id,
            phone: '',
            age: 0,
            address: '',
            medical_history: ''
          });

        if (insertError) {
          diagnosticResults.push({
            step: 'Create Patient Record',
            status: 'error',
            message: `Failed to create patient record: ${insertError.message}`,
            data: insertError
          });
        } else {
          diagnosticResults.push({
            step: 'Create Patient Record',
            status: 'success',
            message: 'Successfully created patient record',
            data: null
          });
        }
      } else {
        diagnosticResults.push({
          step: 'Patient Query',
          status: 'success',
          message: `Patient data found`,
          data: {
            phone: patientData.phone || '(empty)',
            age: patientData.age || 0,
            address: patientData.address || '(empty)',
            medical_history: patientData.medical_history || '(empty)'
          }
        });
      }

      // Step 4: Test RLS policies
      diagnosticResults.push({
        step: 'Testing RLS Policies',
        status: 'success',
        message: 'Testing read/write permissions...'
      });

      // Test update permission
      const { error: updateTestError } = await supabase
        .from('patients')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateTestError) {
        diagnosticResults.push({
          step: 'RLS Update Permission',
          status: 'error',
          message: `Cannot update patient record: ${updateTestError.message}`,
          data: updateTestError
        });
      } else {
        diagnosticResults.push({
          step: 'RLS Update Permission',
          status: 'success',
          message: 'Update permission verified',
          data: null
        });
      }

    } catch (error: any) {
      diagnosticResults.push({
        step: 'Diagnostic Error',
        status: 'error',
        message: `Unexpected error: ${error.message}`,
        data: error
      });
    }

    setResults(diagnosticResults);
    setIsRunning(false);
  };

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'error' | 'warning') => {
    const variants: Record<string, any> = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary'
    };
    return variants[status] || 'default';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Data Diagnostic Tool</CardTitle>
        <CardDescription>
          Run diagnostics to check patient profile data and database connectivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="font-semibold">Diagnostic Results:</h3>
            {results.map((result, index) => (
              <Alert key={index} className="relative">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{result.step}</p>
                      <Badge variant={getStatusBadge(result.status)}>
                        {result.status}
                      </Badge>
                    </div>
                    <AlertDescription>
                      {result.message}
                    </AlertDescription>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {results.length > 0 && !isRunning && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Summary:</h4>
            <div className="text-sm space-y-1">
              <p>✅ Successful: {results.filter(r => r.status === 'success').length}</p>
              <p>⚠️ Warnings: {results.filter(r => r.status === 'warning').length}</p>
              <p>❌ Errors: {results.filter(r => r.status === 'error').length}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
