import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User } from '../App';
import { databaseService } from '../utils/database-smart';
import { toast } from 'sonner@2.0.3';
import { DatabaseDiagnostic } from './DatabaseDiagnostic';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient' as 'admin' | 'patient' | 'doctor'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Show loading toast
    const loadingToast = toast.loading('Signing in...');

    try {
      const user = await databaseService.auth.login(loginData.email, loginData.password);
      toast.dismiss(loadingToast);
      toast.success(`Welcome back, ${user.name}!`);
      onLogin(user);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      // Provide helpful error messages
      let displayMessage = errorMessage;
      if (errorMessage.includes('timeout') || errorMessage.includes('Connection timeout')) {
        displayMessage = '⚠️ Connection timeout. Please check your internet connection and try again.';
      } else if (errorMessage.includes('Invalid login credentials')) {
        displayMessage = '❌ Invalid email or password. Please try again.';
      }
      
      setError(displayMessage);
      toast.error(displayMessage, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!signupData.name || !signupData.email || !signupData.password) {
      setError('All fields are required');
      toast.error('All fields are required');
      setIsLoading(false);
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading('Creating account...');

    try {
      const newUser = await databaseService.users.createUser({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        role: signupData.role
      });

      toast.dismiss(loadingToast);
      toast.success(`Welcome to Panchakarma Management System, ${newUser.name}!`);
      onLogin(newUser);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      
      // Provide helpful error messages
      let displayMessage = errorMessage;
      if (errorMessage.includes('timeout') || errorMessage.includes('Connection timeout')) {
        displayMessage = '⚠️ Connection timeout. Please check your internet connection and try again.';
      }
      
      setError(displayMessage);
      toast.error(displayMessage, { duration: 5000 });
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">
            🌿 Panchakarma Management System
          </h1>
          <p className="text-muted-foreground">
            Traditional Ayurveda meets modern healthcare technology
          </p>
        </div>

        {error && error.includes('timeout') && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Database Connection Issues Detected</p>
                <p className="text-sm">Your database may not be configured correctly.</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDiagnostic(!showDiagnostic)}
                  >
                    {showDiagnostic ? 'Hide' : 'Show'} Quick Diagnostic
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.location.href = '?diagnostic=true'}
                  >
                    Open Full Diagnostic
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {showDiagnostic && (
          <div className="mb-4">
            <DatabaseDiagnostic />
          </div>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to your Panchakarma account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="font-medium mb-2">Demo Credentials:</p>
                  <p><strong>Admin:</strong> admin@panchakarma.com / admin123</p>
                  <p><strong>Doctor:</strong> sharma@panchakarma.com / doctor123</p>
                  <p><strong>Patient:</strong> patient@example.com / patient123</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                    />
                  </div>
                  {error && (
                    <div className="text-destructive text-sm">{error}</div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
                
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Demo Accounts:</p>
                  <div className="text-sm space-y-1">
                    <p><strong>Admin:</strong> admin@panchakarma.com / admin123</p>
                    <p><strong>Doctor:</strong> sharma@panchakarma.com / doctor123</p>
                    <p><strong>Patient:</strong> patient@example.com / patient123</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Join our Panchakarma wellness community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={signupData.name}
                      onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Account Type</Label>
                    <Select
                      value={signupData.role}
                      onValueChange={(value: 'admin' | 'patient' | 'doctor') => 
                        setSignupData({...signupData, role: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {error && (
                    <div className="text-destructive text-sm">{error}</div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}