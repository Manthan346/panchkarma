import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Users, Clock, LogOut, Eye, Phone, Mail, MapPin, FileText, Loader2 } from 'lucide-react';
import { User, TherapySession, Patient } from '../App';
import { databaseService } from '../utils/database-smart';
import { Navbar } from './Navbar';
import { FeedbackManagement } from './FeedbackManagement';
import { toast } from 'sonner@2.0.3';

interface DoctorDashboardProps {
  user: User;
  onLogout: () => void;
}

export function DoctorDashboard({ user, onLogout }: DoctorDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all therapy sessions
        const sessionsData = await databaseService.therapySessions.getTherapySessions();
        
        // Fetch all doctors to get current user's doctor ID
        const doctorsData = await databaseService.doctors.getDoctors();
        const currentDoctor = doctorsData.find(d => d.email === user.email || d.id === user.id);
        
        // Filter sessions assigned to this doctor (by doctor_id or by name for legacy sessions)
        const doctorSessions = sessionsData.filter(
          session => {
            // Priority 1: Match by doctor_id if available
            if (session.doctor_id && currentDoctor?.id) {
              return session.doctor_id === currentDoctor.id;
            }
            // Priority 2: Fallback to name matching for legacy sessions
            return session.practitioner === user.name;
          }
        );
        setSessions(doctorSessions);

        // Fetch all patients
        const patientsData = await databaseService.patients.getPatients();
        
        // Get unique patients from doctor's sessions
        const patientIds = [...new Set(doctorSessions.map(s => s.patient_id))];
        const doctorPatients = patientsData.filter(p => patientIds.includes(p.id));
        setPatients(doctorPatients);

      } catch (error) {
        console.error('Error fetching doctor data:', error);
        toast.error('Failed to load doctor dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctorData();
  }, [user.name, user.email, user.id]);

  const todaysSessions = sessions.filter(
    session => session.date === new Date().toISOString().split('T')[0] &&
    session.status !== 'cancelled'
  );

  const upcomingSessions = sessions.filter(
    session => new Date(session.date) > new Date() && session.status === 'scheduled'
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedSessions = sessions.filter(
    session => session.status === 'completed'
  );

  const handleViewPatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      setShowPatientDetails(true);
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await databaseService.therapySessions.updateTherapySession(sessionId, { status: 'completed' });
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'completed' as const }
          : session
      ));
      toast.success('Session marked as completed');
    } catch (error) {
      console.error('Failed to complete session:', error);
      toast.error('Failed to complete session');
    }
  };

  const getPatientSessionCount = (patientId: string) => {
    return sessions.filter(s => s.patient_id === patientId).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading doctor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        user={user} 
        onLogout={onLogout} 
        title="🌿 Panchakarma Doctor Portal"
        showNotifications={false}
      />

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto mb-8">
            <TabsList className="grid w-full grid-cols-5 min-w-[300px] sm:min-w-[600px] lg:min-w-0">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">📊</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Appointments</span>
                <span className="sm:hidden">📅</span>
              </TabsTrigger>
              <TabsTrigger value="patients" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Patients</span>
                <span className="sm:hidden">👥</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Feedback</span>
                <span className="sm:hidden">💬</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Schedule</span>
                <span className="sm:hidden">⏰</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{patients.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Total patients
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
                    Future appointments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedSessions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Total sessions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>
                  Your therapy sessions for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaysSessions.length > 0 ? (
                    todaysSessions.map((session) => {
                      const patient = patients.find(p => p.id === session.patient_id);
                      return (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                <Clock className="w-3 h-3 mr-1" />
                                {session.time}
                              </Badge>
                              <p className="font-medium">{session.therapy_type}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Patient: {patient?.name || 'Unknown'} | Duration: {session.duration}min
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewPatient(session.patient_id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Patient
                            </Button>
                            {session.status === 'scheduled' && (
                              <Button 
                                size="sm"
                                onClick={() => handleCompleteSession(session.id)}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No sessions scheduled for today
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>My Appointments</CardTitle>
                <CardDescription>
                  All therapy sessions assigned to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Therapy Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.length > 0 ? (
                        sessions.map((session) => {
                          const patient = patients.find(p => p.id === session.patient_id);
                          return (
                            <TableRow key={session.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {new Date(session.date).toLocaleDateString()}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{session.time}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{patient?.name || 'Unknown'}</p>
                                  <p className="text-sm text-muted-foreground">{patient?.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>{session.therapy_type}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{session.duration}min</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  session.status === 'completed' ? 'default' : 
                                  session.status === 'cancelled' ? 'destructive' : 'secondary'
                                }>
                                  {session.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleViewPatient(session.patient_id)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {session.status === 'scheduled' && (
                                    <Button 
                                      size="sm"
                                      onClick={() => handleCompleteSession(session.id)}
                                    >
                                      Complete
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-muted-foreground">No appointments found</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients">
            <Card>
              <CardHeader>
                <CardTitle>My Patients</CardTitle>
                <CardDescription>
                  Patients you have treated or scheduled to treat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patients.length > 0 ? (
                    patients.map((patient) => (
                      <div key={patient.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{patient.name}</h3>
                            <p className="text-sm text-muted-foreground">Age: {patient.age}</p>
                          </div>
                          <Badge variant="outline">
                            {getPatientSessionCount(patient.id)} sessions
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Mail className="w-4 h-4 mr-2" />
                            {patient.email}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Phone className="w-4 h-4 mr-2" />
                            {patient.phone}
                          </div>
                          <div className="flex items-start text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                            {patient.address}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleViewPatient(patient.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Full Details
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <p className="text-muted-foreground">No patients assigned yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackManagement userRole="doctor" userName={user.name} userId={user.id} />
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Schedule</CardTitle>
                <CardDescription>
                  Your scheduled appointments for the coming days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingSessions.length > 0 ? (
                    upcomingSessions.map((session) => {
                      const patient = patients.find(p => p.id === session.patient_id);
                      return (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                {new Date(session.date).toLocaleDateString()}
                              </Badge>
                              <Badge variant="outline">
                                <Clock className="w-3 h-3 mr-1" />
                                {session.time}
                              </Badge>
                            </div>
                            <p className="font-medium">{session.therapy_type}</p>
                            <p className="text-sm text-muted-foreground">
                              Patient: {patient?.name || 'Unknown'} | Duration: {session.duration}min
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewPatient(session.patient_id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Patient
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No upcoming sessions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Patient Details Dialog */}
      <Dialog open={showPatientDetails} onOpenChange={setShowPatientDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patient Details: {selectedPatient?.name}</DialogTitle>
            <DialogDescription>
              Complete patient information and treatment history
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-3">Personal Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                      {selectedPatient.email}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                      {selectedPatient.phone}
                    </div>
                    <div className="flex items-start text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-muted-foreground mt-0.5" />
                      {selectedPatient.address}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Age:</span> {selectedPatient.age} years
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Treatment Summary</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Sessions:</span>
                      <Badge variant="secondary">
                        {getPatientSessionCount(selectedPatient.id)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completed:</span>
                      <Badge variant="outline">
                        {sessions.filter(s => s.patient_id === selectedPatient.id && s.status === 'completed').length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Upcoming:</span>
                      <Badge variant="outline">
                        {sessions.filter(s => s.patient_id === selectedPatient.id && s.status === 'scheduled').length}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div>
                <h4 className="font-medium mb-2">Medical History</h4>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {selectedPatient.medicalHistory || 'No medical history recorded'}
                </div>
              </div>

              {/* Session History */}
              <div>
                <h4 className="font-medium mb-2">Session History</h4>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {sessions.filter(s => s.patient_id === selectedPatient.id).length > 0 ? (
                    <div className="divide-y">
                      {sessions
                        .filter(s => s.patient_id === selectedPatient.id)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((session) => (
                          <div key={session.id} className="p-3 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{session.therapy_type}</span>
                              <Badge variant={
                                session.status === 'completed' ? 'default' : 
                                session.status === 'cancelled' ? 'destructive' : 'secondary'
                              }>
                                {session.status}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">
                              {new Date(session.date).toLocaleDateString()} at {session.time}
                            </p>
                            {session.notes && (
                              <p className="text-muted-foreground mt-1">Note: {session.notes}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No session history</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}