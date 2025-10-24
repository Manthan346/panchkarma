import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle2, XCircle, Loader2, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '../utils/supabase-client';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export function DatabaseDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showSqlInstructions, setShowSqlInstructions] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // Test 1: Check Supabase connection
    try {
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (error) {
        diagnosticResults.push({
          test: 'Supabase Connection',
          status: 'error',
          message: `Failed to connect: ${error.message}`,
          details: error
        });
      } else {
        diagnosticResults.push({
          test: 'Supabase Connection',
          status: 'success',
          message: 'Connected successfully'
        });
      }
    } catch (error: any) {
      diagnosticResults.push({
        test: 'Supabase Connection',
        status: 'error',
        message: `Connection failed: ${error.message}`
      });
    }

    // Test 2: Check if profiles table exists
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      if (error && error.code === '42P01') {
        diagnosticResults.push({
          test: 'Profiles Table',
          status: 'error',
          message: 'Table does not exist - SQL not run yet!'
        });
      } else if (error) {
        diagnosticResults.push({
          test: 'Profiles Table',
          status: 'warning',
          message: `Table exists but error: ${error.message}`,
          details: error
        });
      } else {
        diagnosticResults.push({
          test: 'Profiles Table',
          status: 'success',
          message: `Table exists with ${data?.length || 0} rows`
        });
      }
    } catch (error: any) {
      diagnosticResults.push({
        test: 'Profiles Table',
        status: 'error',
        message: error.message
      });
    }

    // Test 3: Check if indexes exist (via query performance)
    try {
      const start = Date.now();
      const { error } = await supabase.from('profiles').select('id, email, role').limit(10);
      const duration = Date.now() - start;
      
      if (error) {
        diagnosticResults.push({
          test: 'Database Indexes',
          status: 'error',
          message: `Query failed: ${error.message}`
        });
      } else if (duration > 1000) {
        diagnosticResults.push({
          test: 'Database Indexes',
          status: 'warning',
          message: `Query slow (${duration}ms) - indexes may be missing`,
          details: 'Run PRODUCTION_READY_SCHEMA.sql in Supabase'
        });
      } else {
        diagnosticResults.push({
          test: 'Database Indexes',
          status: 'success',
          message: `Query fast (${duration}ms) - indexes working`
        });
      }
    } catch (error: any) {
      diagnosticResults.push({
        test: 'Database Indexes',
        status: 'error',
        message: error.message
      });
    }

    // Test 4: Check RLS policies
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        
        if (error && error.code === 'PGRST301') {
          diagnosticResults.push({
            test: 'RLS Policies',
            status: 'error',
            message: 'RLS blocking access - policies not configured correctly'
          });
        } else if (error) {
          diagnosticResults.push({
            test: 'RLS Policies',
            status: 'warning',
            message: `RLS error: ${error.message}`
          });
        } else if (data) {
          diagnosticResults.push({
            test: 'RLS Policies',
            status: 'success',
            message: 'RLS policies working correctly'
          });
        } else {
          diagnosticResults.push({
            test: 'RLS Policies',
            status: 'warning',
            message: 'User profile not found - may need to be created'
          });
        }
      } else {
        diagnosticResults.push({
          test: 'RLS Policies',
          status: 'warning',
          message: 'Not logged in - cannot test RLS'
        });
      }
    } catch (error: any) {
      diagnosticResults.push({
        test: 'RLS Policies',
        status: 'error',
        message: error.message
      });
    }

    // Test 5: Check helper functions
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        diagnosticResults.push({
          test: 'Helper Functions',
          status: 'error',
          message: 'Helper functions missing - SQL not run correctly'
        });
      } else {
        diagnosticResults.push({
          test: 'Helper Functions',
          status: 'success',
          message: 'Helper functions exist'
        });
      }
    } catch (error: any) {
      diagnosticResults.push({
        test: 'Helper Functions',
        status: 'error',
        message: 'Cannot check functions - may not exist'
      });
    }

    // Test 6: Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      diagnosticResults.push({
        test: 'Environment Variables',
        status: 'error',
        message: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set'
      });
    } else if (supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon')) {
      diagnosticResults.push({
        test: 'Environment Variables',
        status: 'error',
        message: 'Using placeholder values - update with real Supabase credentials'
      });
    } else {
      diagnosticResults.push({
        test: 'Environment Variables',
        status: 'success',
        message: 'Environment variables configured'
      });
    }

    setResults(diagnosticResults);
    setIsRunning(false);
  };

  const copyVerificationSql = () => {
    const sql = `-- Run this in Supabase SQL Editor to verify schema
SELECT 'Tables' as check_name, COUNT(*)::text as result, '7' as expected
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'patients', 'doctors', 'therapy_sessions', 'progress_data', 'notifications', 'feedback')

UNION ALL

SELECT 'Indexes' as check_name, COUNT(*)::text as result, '20+' as expected
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'patients', 'doctors', 'therapy_sessions', 'progress_data', 'notifications', 'feedback')

UNION ALL

SELECT 'Policies' as check_name, COUNT(*)::text as result, '40+' as expected
FROM pg_policies 
WHERE schemaname = 'public';`;

    navigator.clipboard.writeText(sql);
    alert('SQL copied! Now paste it in Supabase SQL Editor');
  };

  const hasErrors = results.some(r => r.status === 'error');
  const hasWarnings = results.some(r => r.status === 'warning');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Database Diagnostic Tool</CardTitle>
          <CardDescription>
            Run this to check if your database is configured correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              'Run Database Diagnostics'
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, index) => (
                <Alert key={index} variant={result.status === 'error' ? 'destructive' : 'default'}>
                  <div className="flex items-start gap-2">
                    {result.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {result.status === 'error' && <XCircle className="h-4 w-4" />}
                    {result.status === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                    <div className="flex-1">
                      <div className="font-medium">{result.test}</div>
                      <AlertDescription>{result.message}</AlertDescription>
                      {result.details && (
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}

          {hasErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Critical errors found! You need to:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Open Supabase Dashboard</li>
                    <li>Go to SQL Editor</li>
                    <li>Run PRODUCTION_READY_SCHEMA.sql</li>
                  </ol>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSqlInstructions(true)}
                    className="mt-2"
                  >
                    Show Me How
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!hasErrors && hasWarnings && (
            <Alert>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription>
                Some warnings detected. Your database may need optimization.
              </AlertDescription>
            </Alert>
          )}

          {!hasErrors && !hasWarnings && results.length > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-600">
                ✅ All checks passed! Your database is configured correctly.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {showSqlInstructions && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Step-by-Step Instructions</CardTitle>
            <CardDescription>Follow these steps to fix your database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Open Supabase Dashboard</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to your Supabase project dashboard
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Supabase
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Navigate to SQL Editor</h4>
                  <p className="text-sm text-muted-foreground">
                    Click "SQL Editor" in the left sidebar (looks like &lt;/&gt;)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Create New Query</h4>
                  <p className="text-sm text-muted-foreground">
                    Click "+ New Query" button
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Copy and Paste SQL</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Open PRODUCTION_READY_SCHEMA.sql from your project, copy ALL of it, and paste into the SQL Editor
                  </p>
                  <Alert>
                    <AlertDescription className="text-xs">
                      <strong>File location:</strong> /PRODUCTION_READY_SCHEMA.sql in your project root
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  5
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Run the SQL</h4>
                  <p className="text-sm text-muted-foreground">
                    Click the "RUN" button (bottom right) and wait for completion
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  6
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Verify Installation</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Copy this verification query and run it in SQL Editor
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyVerificationSql}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Verification SQL
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Expected: 7 tables, 20+ indexes, 40+ policies
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  7
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Refresh Your App</h4>
                  <p className="text-sm text-muted-foreground">
                    Hard refresh this page (Ctrl+Shift+R or Cmd+Shift+R) and run diagnostics again
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="default"
              className="w-full"
              onClick={() => {
                setShowSqlInstructions(false);
                window.location.reload();
              }}
            >
              I've Run the SQL - Reload App
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
