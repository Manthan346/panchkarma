import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Calendar, Users, Clock, Bell, LogOut, Plus, Settings, Loader2 } from 'lucide-react';
import { User, Patient, TherapySession } from '../App';
import { databaseService } from '../utils/database';
import { PatientManagement } from './PatientManagement';
import { DoctorManagement } from './DoctorManagement';
import { TherapyScheduling } from './TherapyScheduling';
import { AdminAnalytics } from './AdminAnalytics';
import { NotificationCenter } from './NotificationCenter';
import { DiagnosticPanel } from './DiagnosticPanel';
import { toast } from 'sonner@2.0.3';
import type { Doctor } from '../App';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch patients
        const patientsData = await databaseService.patients.getPatients();
        setPatients(patientsData);

        // Fetch doctors
        const doctorsData = await databaseService.doctors.getDoctors();
        setDoctors(doctorsData);

        // Fetch therapy sessions
        const sessionsData = await databaseService.therapySessions.getTherapySessions();
        setSessions(sessionsData);

      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load admin dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const todaysSessions = sessions.filter(
    session => session.date === new Date().toISOString().split('T')[0]
  );

  const upcomingSessions = sessions.filter(
    session => new Date(session.date) > new Date()
  );

  const completedSessions = sessions.filter(
    session => session.status === 'completed'
  );

  // Helper function to get active therapies count for a patient
  const getActiveTherapiesCount = (patientId: string) => {
    return sessions.filter(
      session => session.patient_id === patientId && 
      (session.status === 'scheduled' || session.status === 'completed') &&
      new Date(session.date) >= new Date()
    ).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-green-700">
                🌿 Panchakarma Admin
              </h1>
              <Badge variant="secondary">Administrator</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.name}
              </span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{patients.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active in treatment
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todaysSessions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Scheduled for today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingSessions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Sessions this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedSessions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>
            </div>



            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule</CardTitle>
                  <CardDescription>
                    Upcoming therapy sessions for today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todaysSessions.length > 0 ? (
                      todaysSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{session.therapy_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.time} - {session.practitioner}
                            </p>
                          </div>
                          <Badge 
                            variant={session.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {session.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No sessions scheduled for today
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Patients</CardTitle>
                  <CardDescription>
                    Latest patient registrations and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patients.slice(0, 3).map((patient) => (
                      <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Age: {patient.age} | {getActiveTherapiesCount(patient.id)} active therapies
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patients">
            <PatientManagement patients={patients} setPatients={setPatients} />
          </TabsContent>

          <TabsContent value="doctors">
            <DoctorManagement doctors={doctors} setDoctors={setDoctors} />
          </TabsContent>

          <TabsContent value="scheduling">
            <TherapyScheduling />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-6">
              {/* Diagnostic Panel */}
              <DiagnosticPanel />
              
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>
                    Application configuration and system details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Application Mode:</span>
                      <Badge className="ml-2">Panchakarma Management System</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Build Version:</span>
                      <span className="ml-2 text-muted-foreground">1.0.0</span>
                    </div>
                    <div>
                      <span className="font-medium">Database:</span>
                      <span className="ml-2 text-muted-foreground">Supabase PostgreSQL</span>
                    </div>
                    <div>
                      <span className="font-medium">Authentication:</span>
                      <span className="ml-2 text-muted-foreground">JWT Tokens</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      📚 For deployment instructions and troubleshooting, please refer to:
                    </p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• <code className="bg-muted px-1 py-0.5 rounded">SUPABASE_SETUP.md</code> - Supabase connection guide</li>
                      <li>• <code className="bg-muted px-1 py-0.5 rounded">DEPLOYMENT.md</code> - Full deployment guide</li>
                      <li>• <code className="bg-muted px-1 py-0.5 rounded">QUICK_START.md</code> - Quick start guide</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}