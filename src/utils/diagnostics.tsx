import { projectId, publicAnonKey } from './supabase/info';

export interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export class SystemDiagnostics {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-a3cc576e`;
  }

  async runAllDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Test 1: Configuration Check
    results.push(this.testConfiguration());

    // Test 2: Network Connectivity
    results.push(await this.testNetworkConnectivity());

    // Test 3: Supabase Project Status
    results.push(await this.testSupabaseProjectStatus());

    // Test 4: Edge Function Availability
    results.push(await this.testEdgeFunctionAvailability());

    // Test 5: Authentication
    results.push(await this.testAuthentication());

    // Test 6: Database Connectivity
    results.push(await this.testDatabaseConnectivity());

    return results;
  }

  private testConfiguration(): DiagnosticResult {
    const issues = [];

    if (!projectId || projectId === 'demo') {
      issues.push('Project ID is missing or set to demo');
    }

    if (!publicAnonKey) {
      issues.push('Public anonymous key is missing');
    }

    if (publicAnonKey && !publicAnonKey.startsWith('eyJ')) {
      issues.push('Public key format appears invalid (should start with eyJ)');
    }

    if (issues.length === 0) {
      return {
        test: 'Configuration Check',
        status: 'pass',
        message: 'All configuration values are present and appear valid',
        details: { projectId, hasKey: !!publicAnonKey }
      };
    } else {
      return {
        test: 'Configuration Check',
        status: 'fail',
        message: `Configuration issues: ${issues.join(', ')}`,
        details: { issues, projectId, hasKey: !!publicAnonKey }
      };
    }
  }

  private async testNetworkConnectivity(): Promise<DiagnosticResult> {
    try {
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        return {
          test: 'Network Connectivity',
          status: 'pass',
          message: 'Internet connection is working properly'
        };
      } else {
        return {
          test: 'Network Connectivity',
          status: 'warning',
          message: `Network test returned ${response.status}`,
          details: { status: response.status, statusText: response.statusText }
        };
      }
    } catch (error) {
      return {
        test: 'Network Connectivity',
        status: 'fail',
        message: 'Network connectivity test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private async testSupabaseProjectStatus(): Promise<DiagnosticResult> {
    try {
      const supabaseUrl = `https://${projectId}.supabase.co`;
      const response = await fetch(supabaseUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok || response.status === 404) {
        // 404 is normal for the root Supabase URL
        return {
          test: 'Supabase Project Status',
          status: 'pass',
          message: 'Supabase project appears to be active and accessible',
          details: { projectUrl: supabaseUrl, status: response.status }
        };
      } else if (response.status === 503) {
        return {
          test: 'Supabase Project Status',
          status: 'fail',
          message: 'Supabase project may be paused (common on free tier)',
          details: { projectUrl: supabaseUrl, status: response.status }
        };
      } else {
        return {
          test: 'Supabase Project Status',
          status: 'warning',
          message: `Unexpected response from Supabase project: ${response.status}`,
          details: { projectUrl: supabaseUrl, status: response.status }
        };
      }
    } catch (error) {
      return {
        test: 'Supabase Project Status',
        status: 'fail',
        message: 'Cannot reach Supabase project',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          projectUrl: `https://${projectId}.supabase.co`
        }
      };
    }
  }

  private async testEdgeFunctionAvailability(): Promise<DiagnosticResult> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        return {
          test: 'Edge Function Availability',
          status: 'pass',
          message: 'Edge function is deployed and responding',
          details: { url: this.baseUrl, status: response.status }
        };
      } else if (response.status === 404) {
        return {
          test: 'Edge Function Availability',
          status: 'fail',
          message: 'Edge function not found - may not be deployed',
          details: { url: this.baseUrl, status: response.status }
        };
      } else if (response.status === 401 || response.status === 403) {
        return {
          test: 'Edge Function Availability',
          status: 'warning',
          message: 'Edge function exists but has authentication issues',
          details: { url: this.baseUrl, status: response.status }
        };
      } else {
        return {
          test: 'Edge Function Availability',
          status: 'warning',
          message: `Edge function returned unexpected status: ${response.status}`,
          details: { url: this.baseUrl, status: response.status }
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('timeout')) {
        return {
          test: 'Edge Function Availability',
          status: 'fail',
          message: 'Edge function request timed out',
          details: { error: errorMessage, url: this.baseUrl }
        };
      } else {
        return {
          test: 'Edge Function Availability',
          status: 'fail',
          message: 'Cannot reach edge function',
          details: { error: errorMessage, url: this.baseUrl }
        };
      }
    }
  }

  private async testAuthentication(): Promise<DiagnosticResult> {
    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        return {
          test: 'Authentication',
          status: 'pass',
          message: 'Authentication is working correctly',
          details: { endpoint: '/users', status: response.status }
        };
      } else if (response.status === 401) {
        return {
          test: 'Authentication',
          status: 'fail',
          message: 'Authentication failed - check anon key',
          details: { endpoint: '/users', status: response.status }
        };
      } else if (response.status === 403) {
        return {
          test: 'Authentication',
          status: 'fail',
          message: 'Access forbidden - check RLS policies',
          details: { endpoint: '/users', status: response.status }
        };
      } else {
        return {
          test: 'Authentication',
          status: 'warning',
          message: `Unexpected auth response: ${response.status}`,
          details: { endpoint: '/users', status: response.status }
        };
      }
    } catch (error) {
      return {
        test: 'Authentication',
        status: 'fail',
        message: 'Authentication test failed',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoint: '/users'
        }
      };
    }
  }

  private async testDatabaseConnectivity(): Promise<DiagnosticResult> {
    try {
      const response = await fetch(`${this.baseUrl}/therapy-types`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          test: 'Database Connectivity',
          status: 'pass',
          message: 'Database queries are working correctly',
          details: { 
            endpoint: '/therapy-types', 
            status: response.status,
            hasData: !!data.therapyTypes?.length
          }
        };
      } else {
        return {
          test: 'Database Connectivity',
          status: 'fail',
          message: `Database query failed with status ${response.status}`,
          details: { endpoint: '/therapy-types', status: response.status }
        };
      }
    } catch (error) {
      return {
        test: 'Database Connectivity',
        status: 'fail',
        message: 'Database connectivity test failed',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoint: '/therapy-types'
        }
      };
    }
  }

  // Utility method to get a summary of diagnostic results
  static getSummary(results: DiagnosticResult[]): {
    passed: number;
    failed: number;
    warnings: number;
    total: number;
    overallStatus: 'healthy' | 'issues' | 'critical';
  } {
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const total = results.length;

    let overallStatus: 'healthy' | 'issues' | 'critical';
    if (failed === 0 && warnings === 0) {
      overallStatus = 'healthy';
    } else if (failed === 0) {
      overallStatus = 'issues';
    } else {
      overallStatus = 'critical';
    }

    return { passed, failed, warnings, total, overallStatus };
  }
}