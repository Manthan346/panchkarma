import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { databaseService } from '../utils/database';

export function DiagnosticPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Check Supabase credentials
    diagnosticResults.tests.push({
      name: 'Supabase Credentials',
      status: projectId && publicAnonKey ? 'pass' : 'fail',
      message: projectId && publicAnonKey 
        ? `Project ID: ${projectId}` 
        : 'Missing credentials',
      details: {
        projectId,
        hasAnonKey: !!publicAnonKey
      }
    });

    // Test 2: Test Edge Function connectivity
    const edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/make-server-a3cc576e/users`;
    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        diagnosticResults.tests.push({
          name: 'Edge Function Connection',
          status: 'pass',
          message: `Connected successfully (${response.status})`,
          details: {
            url: edgeFunctionUrl,
            dataReceived: data.users?.length || 0
          }
        });
      } else {
        diagnosticResults.tests.push({
          name: 'Edge Function Connection',
          status: 'fail',
          message: `HTTP ${response.status} - ${response.statusText}`,
          details: {
            url: edgeFunctionUrl,
            status: response.status,
            statusText: response.statusText
          }
        });
      }
    } catch (error: any) {
      diagnosticResults.tests.push({
        name: 'Edge Function Connection',
        status: 'fail',
        message: error.message,
        details: {
          url: edgeFunctionUrl,
          error: error.message
        }
      });
    }

    // Test 3: Test database service
    try {
      const connectionTest = await databaseService.connection.testConnection();
      diagnosticResults.tests.push({
        name: 'Database Service',
        status: connectionTest.usingFallback ? 'warning' : 'pass',
        message: connectionTest.message,
        details: {
          usingFallback: connectionTest.usingFallback
        }
      });
    } catch (error: any) {
      diagnosticResults.tests.push({
        name: 'Database Service',
        status: 'fail',
        message: error.message,
        details: { error: error.message }
      });
    }

    // Test 4: Fetch sample data
    try {
      const users = await databaseService.users.getUsers();
      diagnosticResults.tests.push({
        name: 'Data Fetching',
        status: 'pass',
        message: `Successfully fetched ${users?.length || 0} users`,
        details: {
          userCount: users?.length || 0,
          sampleUser: users?.[0]?.name || 'N/A'
        }
      });
    } catch (error: any) {
      diagnosticResults.tests.push({
        name: 'Data Fetching',
        status: 'fail',
        message: error.message,
        details: { error: error.message }
      });
    }

    // Test 5: Local storage check
    const savedUser = localStorage.getItem('panchakarma_user');
    diagnosticResults.tests.push({
      name: 'Session Storage',
      status: savedUser ? 'pass' : 'warning',
      message: savedUser ? 'User session found' : 'No active session',
      details: {
        hasSession: !!savedUser,
        user: savedUser ? JSON.parse(savedUser).name : 'N/A'
      }
    });

    setResults(diagnosticResults);
    setIsRunning(false);
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

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary'
    };
    return <Badge variant={variants[status] || 'outline'}>{status.toUpperCase()}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Diagnostics</CardTitle>
            <CardDescription>
              Check your Supabase connection and data flow
            </CardDescription>
          </div>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            size="sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Diagnostics
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!results && !isRunning && (
          <Alert>
            <AlertDescription>
              Click "Run Diagnostics" to check your system status
            </AlertDescription>
          </Alert>
        )}

        {results && (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground">
              Last run: {new Date(results.timestamp).toLocaleString()}
            </div>

            {results.tests.map((test: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(test.status)}
                    <span className="font-medium">{test.name}</span>
                  </div>
                  {getStatusBadge(test.status)}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {test.message}
                </div>
                {test.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}

            {/* Summary */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Status:</span>
                <div className="flex space-x-2">
                  <Badge variant="default">
                    {results.tests.filter((t: any) => t.status === 'pass').length} Passed
                  </Badge>
                  {results.tests.filter((t: any) => t.status === 'warning').length > 0 && (
                    <Badge variant="secondary">
                      {results.tests.filter((t: any) => t.status === 'warning').length} Warnings
                    </Badge>
                  )}
                  {results.tests.filter((t: any) => t.status === 'fail').length > 0 && (
                    <Badge variant="destructive">
                      {results.tests.filter((t: any) => t.status === 'fail').length} Failed
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {results.tests.some((t: any) => t.status === 'fail') && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Action Required:</div>
                  {results.tests.find((t: any) => t.name === 'Edge Function Connection' && t.status === 'fail') && (
                    <div className="text-sm">
                      • Edge Function not deployed. Run: <code className="bg-muted px-1 rounded">supabase functions deploy make-server-a3cc576e</code>
                    </div>
                  )}
                  {results.tests.find((t: any) => t.name === 'Supabase Credentials' && t.status === 'fail') && (
                    <div className="text-sm">
                      • Supabase credentials missing. Check /utils/supabase/info.tsx
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {results.tests.every((t: any) => t.status === 'pass') && (
              <Alert className="border-green-600 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  All systems operational! Your app is connected to Supabase.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
