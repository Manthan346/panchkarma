import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '../utils/supabase-client';
import { Badge } from './ui/badge';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'running';
  message: string;
  details?: string;
  fix?: string;
}

export function SupabaseDiagnostic() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<string>('');

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    const tests: TestResult[] = [];

    // Test 1: Environment variables
    tests.push({
      name: '1. Environment Variables',
      status: 'running',
      message: 'Checking...'
    });
    setResults([...tests]);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      tests[0] = {
        name: '1. Environment Variables',
        status: 'fail',
        message: 'Environment variables missing',
        fix: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file'
      };
      setResults([...tests]);
      setIsRunning(false);
      return;
    }

    tests[0] = {
      name: '1. Environment Variables',
      status: 'pass',
      message: 'Environment variables found',
      details: `URL: ${supabaseUrl.substring(0, 30)}...`
    };
    setResults([...tests]);

    // Test 2: Connection to Supabase
    tests.push({
      name: '2. Supabase Connection',
      status: 'running',
      message: 'Testing connection...'
    });
    setResults([...tests]);

    try {
      const start = Date.now();
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      const duration = Date.now() - start;

      if (error) {
        tests[1] = {
          name: '2. Supabase Connection',
          status: 'fail',
          message: `Connection failed: ${error.message}`,
          details: `Error code: ${error.code}`,
          fix: error.code === '42P01' 
            ? 'Table does not exist - SQL schema not run yet'
            : 'Check your Supabase URL and API key'
        };
      } else {
        tests[1] = {
          name: '2. Supabase Connection',
          status: 'pass',
          message: `Connected successfully (${duration}ms)`,
          details: `Count: ${data || 0}`
        };
      }
    } catch (error: any) {
      tests[1] = {
        name: '2. Supabase Connection',
        status: 'fail',
        message: 'Network error',
        details: error.message,
        fix: 'Check your internet connection and Supabase project status'
      };
    }
    setResults([...tests]);

    // Test 3: Check all tables exist
    tests.push({
      name: '3. Database Tables',
      status: 'running',
      message: 'Checking tables...'
    });
    setResults([...tests]);

    const requiredTables = ['profiles', 'patients', 'doctors', 'therapy_sessions', 'progress_data', 'notifications', 'feedback'];
    const tableResults = [];

    for (const table of requiredTables) {
      try {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        tableResults.push({ table, exists: !error, error: error?.message });
      } catch (error) {
        tableResults.push({ table, exists: false, error: 'Network error' });
      }
    }

    const missingTables = tableResults.filter(t => !t.exists);
    if (missingTables.length > 0) {
      tests[2] = {
        name: '3. Database Tables',
        status: 'fail',
        message: `Missing ${missingTables.length} table(s)`,
        details: `Missing: ${missingTables.map(t => t.table).join(', ')}`,
        fix: 'Run PRODUCTION_READY_SCHEMA.sql in Supabase SQL Editor'
      };
    } else {
      tests[2] = {
        name: '3. Database Tables',
        status: 'pass',
        message: `All ${requiredTables.length} tables exist`,
        details: tableResults.map(t => t.table).join(', ')
      };
    }
    setResults([...tests]);

    // Test 4: Check authentication
    tests.push({
      name: '4. Authentication Status',
      status: 'running',
      message: 'Checking auth...'
    });
    setResults([...tests]);

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        tests[3] = {
          name: '4. Authentication Status',
          status: 'warning',
          message: 'Not authenticated',
          details: 'You need to log in to test full functionality',
          fix: 'Try logging in with admin@panchakarma.com / admin123'
        };
      } else if (user) {
        tests[3] = {
          name: '4. Authentication Status',
          status: 'pass',
          message: 'Authenticated',
          details: `User ID: ${user.id.substring(0, 8)}... Email: ${user.email}`
        };
      } else {
        tests[3] = {
          name: '4. Authentication Status',
          status: 'warning',
          message: 'No user session',
          details: 'Not logged in',
          fix: 'Log in to test authenticated features'
        };
      }
    } catch (error: any) {
      tests[3] = {
        name: '4. Authentication Status',
        status: 'fail',
        message: 'Auth check failed',
        details: error.message,
        fix: 'Check Supabase authentication settings'
      };
    }
    setResults([...tests]);

    // Test 5: Test query performance
    tests.push({
      name: '5. Query Performance',
      status: 'running',
      message: 'Testing query speed...'
    });
    setResults([...tests]);

    try {
      const start = Date.now();
      const { data, error } = await supabase.from('profiles').select('id, email').limit(10);
      const duration = Date.now() - start;

      if (error) {
        tests[4] = {
          name: '5. Query Performance',
          status: 'fail',
          message: `Query failed: ${error.message}`,
          details: `Error: ${error.code}`,
          fix: error.code === 'PGRST301' ? 'RLS policies blocking access' : 'Check database configuration'
        };
      } else if (duration > 2000) {
        tests[4] = {
          name: '5. Query Performance',
          status: 'warning',
          message: `Query slow (${duration}ms)`,
          details: 'Indexes may be missing',
          fix: 'Run PRODUCTION_READY_SCHEMA.sql to add performance indexes'
        };
      } else {
        tests[4] = {
          name: '5. Query Performance',
          status: 'pass',
          message: `Query fast (${duration}ms)`,
          details: `Retrieved ${data?.length || 0} rows`
        };
      }
    } catch (error: any) {
      tests[4] = {
        name: '5. Query Performance',
        status: 'fail',
        message: 'Query error',
        details: error.message
      };
    }
    setResults([...tests]);

    // Test 6: Check RLS policies
    tests.push({
      name: '6. RLS Policies',
      status: 'running',
      message: 'Checking RLS...'
    });
    setResults([...tests]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        tests[5] = {
          name: '6. RLS Policies',
          status: 'warning',
          message: 'Cannot test RLS (not logged in)',
          fix: 'Log in first to test RLS policies'
        };
      } else {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        
        if (error) {
          tests[5] = {
            name: '6. RLS Policies',
            status: 'fail',
            message: `RLS error: ${error.message}`,
            details: `Code: ${error.code}`,
            fix: 'RLS policies may be incorrectly configured. Run PRODUCTION_READY_SCHEMA.sql'
          };
        } else if (!data) {
          tests[5] = {
            name: '6. RLS Policies',
            status: 'warning',
            message: 'User profile not found',
            details: 'Profile may need to be created',
            fix: 'Sign up or create profile in Supabase'
          };
        } else {
          tests[5] = {
            name: '6. RLS Policies',
            status: 'pass',
            message: 'RLS working correctly',
            details: `Can access own profile: ${data.email}`
          };
        }
      }
    } catch (error: any) {
      tests[5] = {
        name: '6. RLS Policies',
        status: 'fail',
        message: 'RLS test failed',
        details: error.message
      };
    }
    setResults([...tests]);

    // Test 7: Check if demo users exist
    tests.push({
      name: '7. Demo Users',
      status: 'running',
      message: 'Checking demo data...'
    });
    setResults([...tests]);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .in('email', ['admin@panchakarma.com', 'sharma@panchakarma.com', 'patient@example.com']);

      if (error) {
        tests[6] = {
          name: '7. Demo Users',
          status: 'fail',
          message: 'Cannot check demo users',
          details: error.message,
          fix: 'Run seed.sql to create demo users'
        };
      } else if (!data || data.length === 0) {
        tests[6] = {
          name: '7. Demo Users',
          status: 'warning',
          message: 'No demo users found',
          details: 'You need to create users or run seed data',
          fix: 'Run supabase/seed.sql in SQL Editor'
        };
      } else {
        tests[6] = {
          name: '7. Demo Users',
          status: 'pass',
          message: `Found ${data.length} demo user(s)`,
          details: data.map(u => u.email).join(', ')
        };
      }
    } catch (error: any) {
      tests[6] = {
        name: '7. Demo Users',
        status: 'fail',
        message: 'Demo user check failed',
        details: error.message
      };
    }
    setResults([...tests]);

    // Generate summary
    const passed = tests.filter(t => t.status === 'pass').length;
    const failed = tests.filter(t => t.status === 'fail').length;
    const warnings = tests.filter(t => t.status === 'warning').length;

    if (failed > 0) {
      setSummary(`❌ ${failed} critical issue(s) found. Your database is NOT configured correctly.`);
    } else if (warnings > 0) {
      setSummary(`⚠️ ${warnings} warning(s). Database is mostly working but needs attention.`);
    } else {
      setSummary(`✅ All tests passed! Your database is configured correctly.`);
    }

    setIsRunning(false);
  };

  const copyFixCommand = () => {
    const sql = `-- Run this in Supabase SQL Editor
-- Location: https://supabase.com/dashboard → Your Project → SQL Editor → + New Query

-- Copy the entire PRODUCTION_READY_SCHEMA.sql file and paste it here, then click RUN`;
    navigator.clipboard.writeText(sql);
    alert('Instructions copied! Now go to Supabase SQL Editor');
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            🔍 Supabase Database Diagnostic
          </h1>
          <p className="text-muted-foreground">
            Find out exactly what's wrong with your database connection
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Run Complete Diagnostic</CardTitle>
            <CardDescription>
              This will check your Supabase connection, tables, authentication, and more
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="w-full"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Run Full Diagnostic
                </>
              )}
            </Button>

            {summary && (
              <Alert variant={summary.includes('❌') ? 'destructive' : 'default'}>
                <AlertDescription className="text-center font-medium">
                  {summary}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{statusIcon(result.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{result.name}</h3>
                        <Badge
                          variant={
                            result.status === 'pass'
                              ? 'default'
                              : result.status === 'fail'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {result.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {result.message}
                      </p>
                      {result.details && (
                        <p className="text-xs text-muted-foreground bg-muted p-2 rounded mb-2">
                          {result.details}
                        </p>
                      )}
                      {result.fix && (
                        <Alert>
                          <AlertDescription className="text-sm">
                            <strong>Fix:</strong> {result.fix}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {results.some(r => r.status === 'fail' && r.fix?.includes('PRODUCTION_READY_SCHEMA')) && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">🚨 Action Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Your database schema is not set up correctly. Follow these steps:</p>
              
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Supabase Dashboard</a></li>
                <li>Click <strong>SQL Editor</strong> in the left sidebar</li>
                <li>Click <strong>+ New Query</strong></li>
                <li>Open file <code className="bg-white px-2 py-1 rounded">/PRODUCTION_READY_SCHEMA.sql</code> from your project</li>
                <li>Copy ALL of it (Ctrl+A, Ctrl+C)</li>
                <li>Paste into SQL Editor (Ctrl+V)</li>
                <li>Click <strong>RUN</strong> button</li>
                <li>Wait for "Success" message (5-10 seconds)</li>
                <li>Come back here and click "Run Full Diagnostic" again</li>
              </ol>

              <Button
                onClick={copyFixCommand}
                variant="outline"
                className="w-full"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy SQL Instructions
              </Button>

              <Button
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="w-full"
              >
                Open Supabase Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quick Environment Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Supabase URL:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {import.meta.env.VITE_SUPABASE_URL?.substring(0, 40) || 'Not set'}...
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Anon Key:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) || 'Not set'}...
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
