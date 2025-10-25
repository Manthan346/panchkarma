import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Bell, Calendar, Activity, MessageSquare, LogOut, Clock, Loader2 } from 'lucide-react';
import { User, Patient, TherapySession, ProgressData, Notification } from '../App';
import { databaseService } from '../utils/database-smart';
import { PatientProgress } from './PatientProgress';
import { PatientAppointments } from './PatientAppointments';
import { PatientFeedback } from './PatientFeedback';
import { Navbar } from './Navbar';
import { toast } from 'sonner';

interface PatientDashboardProps {
  user: User;
  onLogout: () => void;
}

export function PatientDashboard({ user, onLogout }: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<TherapySession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch patient profile
        const patient = await databaseService.patients.getPatient(user.id);
        setPatientData(patient);

        // Fetch therapy sessions
        const sessions = await databaseService.therapySessions.getPatientTherapySessions(user.id);
        const upcoming = sessions.filter(
          (session: TherapySession) => new Date(session.date) >= new Date() && session.status === 'scheduled'
        ).sort((a: TherapySession, b: TherapySession) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setUpcomingSessions(upcoming);

        // Fetch notifications
        const patientNotifications = await databaseService.notifications.getPatientNotifications(user.id);
        setNotifications(patientNotifications);

        // Fetch progress data
        const progress = await databaseService.progress.getPatientProgress(user.id);
        setProgressData(progress);

      } catch (error) {
        console.error('Error fetching patient data:', error);
        toast.error('Failed to load patient data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [user.id]);

  const unreadNotifications = notifications.filter(n => !n.read);
  const recentProgress = progressData.slice(-1)[0];
  
  // Get all sessions for completed count, not just upcoming ones
  const [allSessions, setAllSessions] = useState<TherapySession[]>([]);
  
  useEffect(() => {
    const fetchAllSessions = async () => {
      try {
        const sessions = await databaseService.therapySessions.getPatientTherapySessions(user.id);
        setAllSessions(sessions);
      } catch (error) {
        console.error('Error fetching all sessions:', error);
      }
    };
    fetchAllSessions();
  }, [user.id]);
  
  const completedSessions = allSessions.filter(s => s.status === 'completed').length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        user={user} 
        onLogout={onLogout} 
        title="🌿 My Panchakarma Journey"
        showNotifications={true}
        unreadCount={unreadNotifications.length}
      />

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto mb-8">
            <TabsList className="grid w-full grid-cols-4 min-w-[280px] sm:min-w-[400px] lg:min-w-0">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">🏠</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Appointments</span>
                <span className="sm:hidden">📅</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Progress</span>
                <span className="sm:hidden">📈</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Feedback</span>
                <span className="sm:hidden">💬</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Card */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle>Welcome to Your Wellness Journey</CardTitle>
                <CardDescription>
                  Track your Panchakarma treatments and monitor your progress towards better health
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Next Session</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {upcomingSessions.length > 0 ? (
                    <div>
                      <div className="text-2xl font-bold">
                        {new Date(upcomingSessions[0].date).toLocaleDateString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {upcomingSessions[0].therapy_type} at {upcomingSessions[0].time}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl font-bold">-</div>
                      <p className="text-xs text-muted-foreground">No upcoming sessions</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Treatment Progress</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {completedSessions}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sessions completed
                  </p>
                  <Progress value={Math.min((completedSessions / 10) * 100, 100)} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wellness Score</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {recentProgress ? recentProgress.energy_level : 'N/A'}/10
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Latest energy level
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Sessions and Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                  <CardDescription>
                    Your scheduled therapy appointments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingSessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{session.therapy_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.date).toLocaleDateString()} at {session.time}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            with {session.practitioner}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {session.duration}min
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {upcomingSessions.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No upcoming sessions scheduled
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>
                    Important updates and reminders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.slice(0, 3).map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.urgent ? 'bg-destructive' : 'bg-primary'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.date).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pre/Post Care Instructions */}
            {upcomingSessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Next Session Care Instructions</CardTitle>
                  <CardDescription>
                    Important guidelines for your upcoming {upcomingSessions[0].therapy_type} session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 text-orange-700">Before Your Treatment</h4>
                      <ul className="space-y-2">
                        {upcomingSessions[0].pre_procedure_instructions.map((instruction, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                            {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 text-green-700">After Your Treatment</h4>
                      <ul className="space-y-2">
                        {upcomingSessions[0].post_procedure_instructions.map((instruction, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                            {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="appointments">
            <PatientAppointments userId={user.id} />
          </TabsContent>

          <TabsContent value="progress">
            <PatientProgress userId={user.id} />
          </TabsContent>

          <TabsContent value="feedback">
            <PatientFeedback userId={user.id} userName={user.name} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
