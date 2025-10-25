import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Calendar, Clock, User, MapPin, Phone, AlertCircle, CheckCircle, XCircle, Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { databaseService } from '../utils/database-smart';
import { toast } from 'sonner';
import { TherapySession } from '../App';
import { schedulingSettings } from '../utils/scheduling-settings';
import { DoctorLoadTest } from './DoctorLoadTest';

interface PatientAppointmentsProps {
  userId: string;
}

export function PatientAppointments({ userId }: PatientAppointmentsProps) {
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [therapyTypes, setTherapyTypes] = useState<any[]>([]);
  const [practitioners, setPractitioners] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    time: '',
    sessionId: ''
  });
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    therapy_type: '',
    date: '',
    time: '',
    practitioner: '',
    doctor_id: '',
    duration: 60
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [userId]);
 

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allSessionsData, therapyTypesData, practitionersData, doctorsData] = await Promise.all([
        // Load ALL sessions for proper slot calculation (not just patient's sessions)
        databaseService.therapySessions.getTherapySessions(),
        databaseService.referenceData.getTherapyTypes(),
        databaseService.referenceData.getPractitioners(),
        databaseService.doctors.getDoctors()
      ]);

      setSessions(allSessionsData);
      setTherapyTypes(therapyTypesData);
      setPractitioners(practitionersData);
      setDoctors(doctorsData);
      
      // Debug log for doctors
      console.log('PatientAppointments - Loaded doctors:', doctorsData);
      console.log('PatientAppointments - Doctors count:', doctorsData?.length || 0);
    } catch (error) {
      console.error('Failed to load appointments data:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter sessions for this patient
  const patientSessions = sessions.filter(session => session.patient_id === userId);
  
  const upcomingSessions = patientSessions.filter(
    session => new Date(session.date) >= new Date()
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastSessions = patientSessions.filter(
    session => new Date(session.date) < new Date()
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Handle session cancellation
  const handleCancelSession = async (sessionId: string) => {
    try {
      await databaseService.therapySessions.updateTherapySession(sessionId, { status: 'cancelled' });
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'cancelled' as const }
          : session
      ));
      toast.success('Session cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel session:', error);
      toast.error('Failed to cancel session');
    }
  };

  // Handle session rescheduling
  const handleRescheduleSession = async () => {
    if (!rescheduleData.date || !rescheduleData.time) {
      toast.error('Please select both date and time');
      return;
    }

    try {
      await databaseService.therapySessions.updateTherapySession(rescheduleData.sessionId, {
        date: rescheduleData.date,
        time: rescheduleData.time
      });
      
      setSessions(prev => prev.map(session => 
        session.id === rescheduleData.sessionId 
          ? { ...session, date: rescheduleData.date, time: rescheduleData.time }
          : session
      ));
      
      setIsRescheduling(false);
      setRescheduleData({ date: '', time: '', sessionId: '' });
      toast.success('Session rescheduled successfully');
    } catch (error) {
      console.error('Failed to reschedule session:', error);
      toast.error('Failed to reschedule session');
    }
  };

  // Handle new booking
  const handleBookNewSession = async () => {
    if (!newBooking.therapy_type || !newBooking.date || !newBooking.time || !newBooking.practitioner) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const sessionData = {
        patient_id: userId,
        therapy_type: newBooking.therapy_type,
        date: newBooking.date,
        time: newBooking.time,
        duration: newBooking.duration,
        status: 'scheduled',
        practitioner: newBooking.practitioner,
        doctor_id: newBooking.doctor_id || undefined,
        pre_procedure_instructions: [
          'Fast for 4 hours before the session',
          'Wear comfortable, loose-fitting clothes',
          'Arrive 15 minutes early for consultation'
        ],
        post_procedure_instructions: [
          'Rest for at least 30 minutes after the procedure',
          'Drink warm water and avoid cold beverages',
          'Follow prescribed dietary guidelines'
        ]
      };

      const newSession = await databaseService.therapySessions.createTherapySession(sessionData);
      setSessions(prev => [...prev, newSession]);
      setShowBookingForm(false);
      setNewBooking({
        therapy_type: '',
        date: '',
        time: '',
        practitioner: '',
        doctor_id: '',
        duration: 60
      });
      toast.success('New session booked successfully');
    } catch (error) {
      console.error('Failed to book new session:', error);
      toast.error('Failed to book new session');
    }
  };

  // Handle booking similar session
  const handleBookSimilar = (originalSession: TherapySession) => {
    setNewBooking({
      therapy_type: originalSession.therapy_type,
      date: '',
      time: '',
      practitioner: originalSession.practitioner,
      doctor_id: originalSession.doctor_id || '',
      duration: originalSession.duration
    });
    setShowBookingForm(true);
  };

  const SessionDetailsDialog = ({ session }: { session: any }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Session Details</DialogTitle>
          <DialogDescription>
            Complete information about your therapy session
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Session Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Therapy Type</label>
              <p className="text-sm text-muted-foreground mt-1">{session.therapy_type}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Duration</label>
              <p className="text-sm text-muted-foreground mt-1">{session.duration} minutes</p>
            </div>
            <div>
              <label className="text-sm font-medium">Date & Time</label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(session.date).toLocaleDateString()} at {session.time}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">
                {session.doctor_id ? 'Doctor' : 'Practitioner'}
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                {session.doctor_id && '🩺 '}{session.practitioner}
              </p>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium">Status</label>
            <div className="mt-1">
              <Badge variant={
                session.status === 'completed' ? 'default' : 
                session.status === 'cancelled' ? 'destructive' : 'secondary'
              }>
                {session.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                {session.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                {session.status === 'scheduled' && <Clock className="w-3 h-3 mr-1" />}
                {session.status}
              </Badge>
            </div>
          </div>

          {/* Pre-procedure Instructions */}
          <div>
            <label className="text-sm font-medium text-orange-700">Pre-Procedure Instructions</label>
            <div className="mt-2 space-y-2">
              {session.pre_procedure_instructions.map((instruction, index) => (
                <div key={index} className="flex items-start text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                  {instruction}
                </div>
              ))}
            </div>
          </div>

          {/* Post-procedure Instructions */}
          <div>
            <label className="text-sm font-medium text-green-700">Post-Procedure Instructions</label>
            <div className="mt-2 space-y-2">
              {session.post_procedure_instructions.map((instruction, index) => (
                <div key={index} className="flex items-start text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                  {instruction}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {session.notes && (
            <div>
              <label className="text-sm font-medium">Session Notes</label>
              <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-lg">
                {session.notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            {session.status === 'scheduled' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setRescheduleData({ ...rescheduleData, sessionId: session.id });
                    setIsRescheduling(true);
                  }}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Reschedule
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Session</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this therapy session? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Session</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleCancelSession(session.id)}>
                        Cancel Session
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            {session.status === 'completed' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleBookSimilar(session)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Book Follow-up
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Component - Remove when fixed */}
     
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Management</CardTitle>
          <CardDescription>
            View your scheduled sessions and manage appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={() => setShowBookingForm(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Book New Session
            </Button>
            <Button variant="outline" onClick={() => toast.info('Calling clinic at +1 (555) 123-4567')}>
              <Phone className="w-4 h-4 mr-2" />
              Contact Clinic
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>
            Your scheduled therapy sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{session.therapy_type}</h3>
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          {session.duration}min
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(session.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {session.time}
                        </div>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {session.practitioner}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <SessionDetailsDialog session={session} />
                    </div>
                  </div>

                  {/* Quick Pre-care Reminder */}
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">Pre-care Reminder</p>
                        <p className="text-sm text-orange-700">
                          {session.pre_procedure_instructions[0]}
                        </p>
                        <Button variant="link" className="text-orange-700 p-0 h-auto text-sm">
                          View all instructions
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming appointments</p>
                <Button className="mt-4" onClick={() => setShowBookingForm(true)}>Schedule Your Next Session</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>
            Your completed and past therapy sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pastSessions.length > 0 ? (
              pastSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{session.therapy_type}</h3>
                        <Badge variant={session.status === 'completed' ? 'default' : 'destructive'}>
                          {session.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {session.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(session.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {session.time}
                        </div>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {session.practitioner}
                        </div>
                      </div>
                      {session.notes && (
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          <strong>Notes:</strong> {session.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <SessionDetailsDialog session={session} />
                      {session.status === 'completed' && (
                        <Button variant="outline" size="sm" onClick={() => handleBookSimilar(session)}>
                          Book Similar
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Post-care Instructions for completed sessions */}
                  {session.status === 'completed' && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Post-care Instructions</p>
                          <p className="text-sm text-green-700">
                            {session.post_procedure_instructions[0]}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No session history available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Clinic Contact Information</CardTitle>
          <CardDescription>
            Get in touch for appointments or questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    123 Wellness Center Ave<br />
                    Ayurveda City, AC 12345
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Operating Hours</p>
                <div className="text-sm text-muted-foreground mt-1">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p>Saturday: 9:00 AM - 4:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduling} onOpenChange={setIsRescheduling}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
            <DialogDescription>
              Select a new date and time for your therapy session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reschedule-date">New Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleData.date}
                onChange={(e) => setRescheduleData({...rescheduleData, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="reschedule-time">New Time</Label>
              <Select value={rescheduleData.time} onValueChange={(value) => setRescheduleData({...rescheduleData, time: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="14:00">2:00 PM</SelectItem>
                  <SelectItem value="15:00">3:00 PM</SelectItem>
                  <SelectItem value="16:00">4:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsRescheduling(false)}>
                Cancel
              </Button>
              <Button onClick={handleRescheduleSession}>
                Reschedule Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Booking Dialog */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book New Session</DialogTitle>
            <DialogDescription>
              Schedule a new therapy session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="therapy-type">Therapy Type *</Label>
              <Select value={newBooking.therapy_type} onValueChange={(value) => {
                // Update therapy type and duration
                const selectedTherapy = therapyTypes.find(t => t.name === value);
                setNewBooking({
                  ...newBooking, 
                  therapy_type: value,
                  duration: selectedTherapy?.duration || 60
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select therapy type" />
                </SelectTrigger>
                <SelectContent>
                  {therapyTypes.length > 0 ? (
                    therapyTypes.filter(t => t.name && t.name.trim() !== '').map(therapy => (
                      <SelectItem key={therapy.name} value={therapy.name}>
                        {therapy.name} ({therapy.duration}min)
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Abhyanga">Abhyanga (Oil Massage)</SelectItem>
                      <SelectItem value="Shirodhara">Shirodhara</SelectItem>
                      <SelectItem value="Panchakarma Detox">Panchakarma Detox</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="practitioner">Doctor/Practitioner *</Label>
              <Select value={newBooking.practitioner} onValueChange={(value) => {
                // Find if selected value is a doctor (to store doctor_id)
                const selectedDoctor = doctors.find(d => d.name === value);
                const newDoctorId = selectedDoctor?.id || '';
                
                setNewBooking({
                  ...newBooking, 
                  practitioner: value,
                  doctor_id: newDoctorId
                });

                // Recalculate available slots for the new doctor
                if (newBooking.date && newBooking.duration) {
                  const allSessions = sessions.map(s => ({ 
                    date: s.date, 
                    time: s.time, 
                    duration: s.duration,
                    doctor_id: s.doctor_id,
                    practitioner: s.practitioner
                  }));
                  const slots = schedulingSettings.getAvailableTimeSlots(
                    newBooking.date,
                    allSessions,
                    newBooking.duration,
                    newDoctorId
                  );
                  setAvailableSlots(slots);
                  
                  // Clear time if it's no longer available
                  if (newBooking.time && !slots.includes(newBooking.time)) {
                    setNewBooking(prev => ({ ...prev, time: '' }));
                  }
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select practitioner" />
                </SelectTrigger>
                <SelectContent>
                  {/* Show doctors first */}
                  {doctors && doctors.length > 0 ? (
                    doctors.map(doctor => (
                      <SelectItem key={doctor.id || doctor.name} value={doctor.name}>
                        {doctor.name}{doctor.specialization ? ` - ${doctor.specialization}` : ''}
                      </SelectItem>
                    ))
                  ) : null}
                  
                  {/* Show practitioners */}
                  {practitioners && practitioners.length > 0 ? (
                    practitioners.filter(p => p && p.trim() !== '' && !doctors.some(d => d.name === p)).map(practitioner => (
                      <SelectItem key={practitioner} value={practitioner}>
                        {practitioner}
                      </SelectItem>
                    ))
                  ) : null}
                  
                  {/* If no doctors or practitioners */}
                  {(!doctors || doctors.length === 0) && (!practitioners || practitioners.length === 0) && (
                    <SelectItem value="no-data" disabled>No practitioners available - Please contact admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="booking-date">Date *</Label>
              <Input
                id="booking-date"
                type="date"
                value={newBooking.date}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setNewBooking({...newBooking, date: newDate});
                  
                  // Calculate available slots for the selected date and doctor
                  if (newDate && newBooking.duration && newBooking.doctor_id) {
                    const allSessions = sessions.map(s => ({ 
                      date: s.date, 
                      time: s.time, 
                      duration: s.duration,
                      doctor_id: s.doctor_id,
                      practitioner: s.practitioner
                    }));
                    const slots = schedulingSettings.getAvailableTimeSlots(
                      newDate,
                      allSessions,
                      newBooking.duration,
                      newBooking.doctor_id
                    );
                    setAvailableSlots(slots);
                  }
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="booking-time">Time Slot *</Label>
              <Select value={newBooking.time} onValueChange={(value) => setNewBooking({...newBooking, time: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.length > 0 ? (
                    availableSlots.filter(s => s && s.trim() !== '').map(slot => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))
                  ) : newBooking.date && newBooking.doctor_id ? (
                    <SelectItem value="no-slots" disabled>No slots available for this doctor</SelectItem>
                  ) : (
                    <SelectItem value="select-doctor-date" disabled>Select doctor and date first</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {availableSlots.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {availableSlots.length} slots available for {newBooking.practitioner}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={newBooking.duration.toString()} onValueChange={(value) => setNewBooking({...newBooking, duration: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBookingForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleBookNewSession}>
                Book Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
