import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Bell, Calendar, Activity, MessageSquare, LogOut, Clock } from 'lucide-react';
import { User } from '../App';
import { mockPatients, mockTherapySessions, mockProgressData, mockNotifications } from './mockData';
import { PatientProgress } from './PatientProgress';
import { PatientAppointments } from './PatientAppointments';
import { PatientFeedback } from './PatientFeedback';

interface PatientDashboardProps {
  user: User;
  onLogout: () => void;
}

export function PatientDashboard({ user, onLogout }: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Get patient data (in real app, this would be fetched from API)
  const patientData = mockPatients.find(p => p.id === user.id);
  const upcomingSessions = mockTherapySessions.filter(
    session => session.patientId === user.id && new Date(session.date) >= new Date()
  );
  const unreadNotifications = mockNotifications.filter(n => !n.read);
  const recentProgress = mockProgressData.slice(-1)[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-green-700">
                🌿 My Panchakarma Journey
              </h1>
              <Badge variant="secondary">Patient</Badge>
            </div>
            <div className="flex items-center space-x-4">
              {unreadNotifications.length > 0 && (
                <div className="relative">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                </div>
              )}
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

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
                        {upcomingSessions[0].therapyType} at {upcomingSessions[0].time}
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
                    {mockTherapySessions.filter(s => s.patientId === user.id && s.status === 'completed').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sessions completed
                  </p>
                  <Progress value={65} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wellness Score</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {recentProgress ? recentProgress.energyLevel : 'N/A'}/10
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
                          <p className="font-medium">{session.therapyType}</p>
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
                    {mockNotifications.slice(0, 3).map((notification) => (
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
                    Important guidelines for your upcoming {upcomingSessions[0].therapyType} session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 text-orange-700">Before Your Treatment</h4>
                      <ul className="space-y-2">
                        {upcomingSessions[0].preProcedureInstructions.map((instruction, index) => (
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
                        {upcomingSessions[0].postProcedureInstructions.map((instruction, index) => (
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
            <PatientFeedback userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}