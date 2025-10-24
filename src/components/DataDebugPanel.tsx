import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RefreshCw, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { databaseService } from '../utils/database-smart';
import { toast } from 'sonner@2.0.3';

interface DataDebugPanelProps {
  userId?: string;
}

export function DataDebugPanel({ userId }: DataDebugPanelProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    try {
      setIsChecking(true);
      console.log('🔍 Starting data diagnostics...');

      const diagnostics: any = {
        timestamp: new Date().toISOString(),
        checks: []
      };

      // Check 1: Fetch all patients
      console.log('📊 Checking patients data...');
      try {
        const patients = await databaseService.patients.getPatients();
        console.log('✅ Patients data:', patients);
        
        diagnostics.checks.push({
          name: 'Fetch All Patients',
          status: 'success',
          count: patients.length,
          data: patients,
          details: patients.map(p => ({
            id: p.id,
            name: p.name,
            age: p.age,
            ageType: typeof p.age,
            hasAge: p.age !== null && p.age !== undefined && p.age !== 0
          }))
        });
      } catch (error: any) {
        console.error('❌ Failed to fetch patients:', error);
        diagnostics.checks.push({
          name: 'Fetch All Patients',
          status: 'error',
          error: error.message
        });
      }

      // Check 2: If userId provided, fetch specific patient
      if (userId) {
        console.log('👤 Checking specific patient:', userId);
        try {
          const patient = await databaseService.patients.getPatient(userId);
          console.log('✅ Patient data:', patient);
          
          diagnostics.checks.push({
            name: 'Fetch Specific Patient',
            status: 'success',
            data: patient,
            details: {
              id: patient?.id,
              name: patient?.name,
              age: patient?.age,
              ageType: typeof patient?.age,
              hasAge: patient?.age !== null && patient?.age !== undefined && patient?.age !== 0
            }
          });
        } catch (error: any) {
          console.error('❌ Failed to fetch patient:', error);
          diagnostics.checks.push({
            name: 'Fetch Specific Patient',
            status: 'error',
            error: error.message
          });
        }
      }

      // Check 3: Connection status
      try {
        const status = databaseService.connection.getStatus();
        console.log('🔌 Connection status:', status);
        
        diagnostics.checks.push({
          name: 'Connection Status',
          status: status.supabaseAvailable ? 'success' : 'warning',
          data: status
        });
      } catch (error: any) {
        diagnostics.checks.push({
          name: 'Connection Status',
          status: 'error',
          error: error.message
        });
      }

      setResults(diagnostics);
      toast.success('Diagnostics complete - Check results below');
      console.log('📋 Full diagnostic results:', diagnostics);

    } catch (error: any) {
      console.error('❌ Diagnostic error:', error);
      toast.error('Diagnostic failed: ' + error.message);
    } finally {
      setIsChecking(false);
    }
  };

  const renderCheckStatus = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Pass</Badge>;
      case 'warning':
        return <Badge variant="default" className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Warning</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Display Diagnostics
        </CardTitle>
        <CardDescription>
          Check if patient data (age, phone, etc.) is being loaded correctly from the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={isChecking} className="w-full">
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Run Data Diagnostics
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Last checked: {new Date(results.timestamp).toLocaleString()}
            </div>

            {results.checks.map((check: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{check.name}</span>
                  {renderCheckStatus(check.status)}
                </div>

                {check.error && (
                  <div className="text-sm text-destructive mt-2">
                    Error: {check.error}
                  </div>
                )}

                {check.count !== undefined && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Found {check.count} patients
                  </div>
                )}

                {check.details && (
                  <div className="mt-3 space-y-2">
                    {Array.isArray(check.details) ? (
                      <div className="space-y-2">
                        {check.details.map((detail: any, idx: number) => (
                          <div key={idx} className="text-xs bg-slate-50 p-2 rounded border">
                            <div><strong>Name:</strong> {detail.name}</div>
                            <div>
                              <strong>Age:</strong> {detail.age} 
                              <span className="text-muted-foreground ml-2">
                                (type: {detail.ageType})
                              </span>
                              {!detail.hasAge && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  NO AGE DATA
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs bg-slate-50 p-3 rounded border">
                        <div><strong>Name:</strong> {check.details.name}</div>
                        <div>
                          <strong>Age:</strong> {check.details.age}
                          <span className="text-muted-foreground ml-2">
                            (type: {check.details.ageType})
                          </span>
                          {!check.details.hasAge && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              NO AGE DATA
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {check.data && !check.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Show Raw Data
                    </summary>
                    <pre className="text-xs bg-slate-50 p-2 rounded mt-2 overflow-auto max-h-40">
                      {JSON.stringify(check.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="font-medium text-sm mb-2">💡 What to check:</div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• If age shows 0 but you entered 50, check if patient record exists in database</li>
                <li>• Open browser console (F12) to see detailed logs</li>
                <li>• Check if age type is "number" (not "string" or "undefined")</li>
                <li>• If "NO AGE DATA" badge appears, the patient table might be missing data</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="font-medium text-sm mb-2">🔧 Quick Fixes:</div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Try editing the patient and re-entering the age</li>
                <li>• Check that the patient record exists in the "patients" table (not just "profiles")</li>
                <li>• Verify data directly in Supabase dashboard</li>
                <li>• Check browser console for any error messages</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
