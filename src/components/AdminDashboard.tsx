import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Calendar, Users, Clock, Bell, LogOut, Plus, Settings, Loader2, MoreHorizontal } from 'lucide-react';
import { User, Patient, TherapySession } from '../App';
import { databaseService } from '../utils/database-smart';
import { PatientManagementEnhanced } from './PatientManagementEnhanced';
import { DoctorManagementEnhanced } from './DoctorManagementEnhanced';
import { TherapyScheduling } from './TherapyScheduling';
import { AdminAnalytics } from './AdminAnalytics';
import { NotificationCenter } from './NotificationCenter';
import { DiagnosticPanel } from './DiagnosticPanel';
import { FeedbackManagement } from './FeedbackManagement';
import { DataDebugPanel } from './DataDebugPanel';
import { DoctorDatabaseDiagnostic } from './DoctorDatabaseDiagnostic';
import { DatabaseHealthCheck } from './DatabaseHealthCheck';
import { Navbar } from './Navbar';
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

  // Function to refresh data
  const refreshData = async () => {
    try {
      const [patientsData, doctorsData, sessionsData] = await Promise.all([
        databaseService.patients.getPatients(),
        databaseService.doctors.getDoctors(),
        databaseService.therapySessions.getTherapySessions()
      ]);
      
      setPatients(patientsData);
      setDoctors(doctorsData);
      setSessions(sessionsData);
    } catch (error: any) {
      console.error('❌ Error refreshing admin data:', {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint
      });
      
      // Show user-friendly error
      if (error?.message?.includes('session_date')) {
        toast.error('Database column mismatch detected', {
          description: 'Please check EMERGENCY_RECOVERY_PLAN.md for fix instructions'
        });
      } else {
        toast.error('Failed to load data', {
          description: error?.message || 'Unknown error'
        });
      }
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        await refreshData();
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
      <Navbar 
        user={user} 
        onLogout={onLogout} 
        title="Panchakarma Admin Dashboard"
        showNotifications={true}
        unreadCount={3}
        onNotificationClick={() => setActiveTab('notifications')}
      />

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto mb-8">
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 min-w-[300px] sm:min-w-[800px] lg:min-w-0">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Home</span>
              </TabsTrigger>
              <TabsTrigger value="patients" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Patients</span>
                <span className="sm:hidden">👥</span>
              </TabsTrigger>
              <TabsTrigger value="doctors" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Doctors</span>
                <span className="sm:hidden">👨‍⚕️</span>
              </TabsTrigger>
              <TabsTrigger value="scheduling" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Schedule</span>
                <span className="sm:hidden">📅</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="text-xs sm:text-sm hidden sm:block">Feedback</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm hidden sm:block">Analytics</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm hidden sm:block">Notify</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm hidden sm:block">Settings</TabsTrigger>
            </TabsList>
            
            {/* Mobile More Options */}
            <div className="sm:hidden flex justify-center mt-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    More Options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setActiveTab('feedback')}>
                    💬 Feedback
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('analytics')}>
                    📊 Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('notifications')}>
                    🔔 Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                    ⚙️ Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

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
            <PatientManagementEnhanced patients={patients} setPatients={setPatients} />
          </TabsContent>

          <TabsContent value="doctors">
            <DoctorManagementEnhanced doctors={doctors} setDoctors={setDoctors} />
          </TabsContent>

          <TabsContent value="scheduling">
            <TherapyScheduling doctors={doctors} />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackManagement userRole="admin" userName={user.name} userId={user.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-6">
              {/* Database Health Check - PRIORITY #1 */}
              <DatabaseHealthCheck />
              
              {/* Doctor Database Diagnostic - Check for orphaned records */}
              <DoctorDatabaseDiagnostic />
              
              {/* Data Display Diagnostic - Check age/phone showing correctly */}
              <DataDebugPanel />
              
              {/* Connection Diagnostic Panel */}
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
                      <li>• <code className="bg-muted px-1 py-0.5 rounded">⚡_IMMEDIATE_ACTION_REQUIRED.md</code> - Emergency fixes</li>
                      <li>• <code className="bg-muted px-1 py-0.5 rounded">🆘_DATA_RECOVERY_GUIDE.md</code> - Data recovery</li>
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