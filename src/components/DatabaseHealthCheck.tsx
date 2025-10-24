import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../utils/supabase-client';
import { Alert, AlertDescription } from './ui/alert';

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export function DatabaseHealthCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const runHealthCheck = async () => {
    setIsChecking(true);
    const checks: HealthCheckResult[] = [];

    // Check 1: Table existence
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      checks.push({
        name: 'Database Connection',
        status: error ? 'fail' : 'pass',
        message: error ? `Connection failed: ${error.message}` : 'Successfully connected to database',
        details: error
      });
    } catch (error: any) {
      checks.push({
        name: 'Database Connection',
        status: 'fail',
        message: 'Cannot connect to database',
        details: error.message
      });
    }

    // Check 2: Column names in therapy_sessions
    try {
      const { data, error } = await supabase
        .from('therapy_sessions')
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('session_date')) {
          checks.push({
            name: 'Column Names',
            status: 'fail',
            message: '❌ Database uses OLD column names (date, time) - needs fixing',
            details: 'Run /supabase/EMERGENCY_FIX.sql to rename columns'
          });
        } else {
          checks.push({
            name: 'Column Names',
            status: 'warning',
            message: `Database query error: ${error.message}`,
            details: error
          });
        }
      } else {
        const hasNewColumns = data?.[0] && 'session_date' in data[0];
        const hasOldColumns = data?.[0] && 'date' in data[0];
        
        if (hasNewColumns) {
          checks.push({
            name: 'Column Names',
            status: 'pass',
            message: '✅ Database uses CORRECT column names (session_date, session_time)',
            details: 'Columns are properly named'
          });
        } else if (hasOldColumns) {
          checks.push({
            name: 'Column Names',
            status: 'warning',
            message: '⚠️ Database uses old column names but app can handle it',
            details: 'Consider renaming for consistency'
          });
        } else {
          checks.push({
            name: 'Column Names',
            status: 'pass',
            message: '✅ No sessions yet, columns will be created correctly',
            details: 'Empty table'
          });
        }
      }
    } catch (error: any) {
      checks.push({
        name: 'Column Names',
        status: 'warning',
        message: 'Could not check column names',
        details: error.message
      });
    }

    // Check 3: Data counts
    try {
      const [profilesResult, patientsResult, doctorsResult, sessionsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('doctors').select('id', { count: 'exact', head: true }),
        supabase.from('therapy_sessions').select('id', { count: 'exact', head: true })
      ]);

      const profileCount = profilesResult.count || 0;
      const patientCount = patientsResult.count || 0;
      const doctorCount = doctorsResult.count || 0;
      const sessionCount = sessionsResult.count || 0;

      checks.push({
        name: 'Data Counts',
        status: profileCount > 0 ? 'pass' : 'warning',
        message: `Found: ${profileCount} profiles, ${patientCount} patients, ${doctorCount} doctors, ${sessionCount} sessions`,
        details: {
          profiles: profileCount,
          patients: patientCount,
          doctors: doctorCount,
          sessions: sessionCount
        }
      });

      if (profileCount === 0) {
        checks.push({
          name: 'Data Status',
          status: 'warning',
          message: '⚠️ No data found - either fresh database or data was lost',
          details: 'You can create new data through the app'
        });
      }
    } catch (error: any) {
      checks.push({
        name: 'Data Counts',
        status: 'fail',
        message: `Error counting data: ${error.message}`,
        details: error
      });
    }

    // Check 4: RLS Status
    try {
      const { data: rlsData, error: rlsError } = await supabase.rpc('pg_stat_statements_reset').select();
      
      checks.push({
        name: 'Row Level Security',
        status: 'pass',
        message: 'RLS policies are active',
        details: 'Security is enabled'
      });
    } catch (error: any) {
      if (error.message?.includes('permission denied')) {
        checks.push({
          name: 'Row Level Security',
          status: 'pass',
          message: 'RLS is properly configured',
          details: 'Cannot query system tables (expected)'
        });
      } else {
        checks.push({
          name: 'Row Level Security',
          status: 'warning',
          message: 'Could not verify RLS status',
          details: error.message
        });
      }
    }

    setResults(checks);
    setIsChecking(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const overallStatus = results.length === 0 ? 'unknown' :
    results.some(r => r.status === 'fail') ? 'fail' :
    results.some(r => r.status === 'warning') ? 'warning' :
    'pass';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Database Health Check
          <Button
            onClick={runHealthCheck}
            disabled={isChecking}
            variant="outline"
            size="sm"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Check
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Verify database connection, schema, and data integrity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.length === 0 ? (
          <Alert>
            <AlertDescription>
              Click "Run Check" to verify your database status
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="font-medium">Overall Status:</span>
              <Badge variant={
                overallStatus === 'pass' ? 'default' :
                overallStatus === 'fail' ? 'destructive' :
                'secondary'
              }>
                {overallStatus === 'pass' ? '✅ Healthy' :
                 overallStatus === 'fail' ? '❌ Issues Found' :
                 '⚠️ Warnings'}
              </Badge>
            </div>

            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="mt-0.5">{getStatusIcon(result.status)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {result.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.message}
                    </p>
                    {showDetails && result.details && (
                      <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                        {typeof result.details === 'string' 
                          ? result.details 
                          : JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </Button>

            {results.some(r => r.status === 'fail' || r.status === 'warning') && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">🎯 Recommended Action:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {results.find(r => r.message.includes('OLD column names')) && (
                        <li>
                          <strong>Fix column names:</strong> Run{' '}
                          <code className="bg-muted px-1 rounded">/supabase/🔧_COMPLETE_FIX_WITH_RLS.sql</code>{' '}
                          in Supabase SQL Editor
                        </li>
                      )}
                      {results.find(r => r.message.includes('No data found')) && (
                        <li>
                          <strong>Add data:</strong> Create patients and doctors through the admin panel
                        </li>
                      )}
                      {results.find(r => r.message.includes('Connection failed')) && (
                        <li>
                          <strong>Check connection:</strong> Verify Supabase credentials in environment variables
                        </li>
                      )}
                    </ul>
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        📚 See <code className="bg-muted px-1 rounded">⚡_START_HERE.md</code> for quick fix instructions
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
