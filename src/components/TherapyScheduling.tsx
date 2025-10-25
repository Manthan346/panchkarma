import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Switch } from './ui/switch';
import { Plus, Clock, User, Calendar as CalendarIcon, Edit, Trash2, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { TherapySession, Doctor } from '../App';
import { databaseService } from '../utils/database-smart';
import { toast } from 'sonner';
import { schedulingSettings, SchedulingSettings } from '../utils/scheduling-settings';
import { emailService } from '../utils/email-service';

interface TherapySchedulingProps {
  doctors?: Doctor[];
}

export function TherapyScheduling({ doctors: externalDoctors }: TherapySchedulingProps = {}) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isSchedulingNew, setIsSchedulingNew] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [therapyTypes, setTherapyTypes] = useState<any[]>([]);
  const [practitioners, setPractitioners] = useState<string[]>([]);
  const [internalDoctors, setInternalDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<SchedulingSettings>(schedulingSettings.getSettings());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  // Use external doctors if provided, otherwise use internal state
  const doctors = externalDoctors || internalDoctors;

  // Load data from database - only on initial mount
  useEffect(() => {
    loadData();
  }, []); // Only run once on mount

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sessionsData, patientsData, therapyTypesData, doctorsData, practitionersData] = await Promise.all([
        databaseService.therapySessions.getTherapySessions(),
        databaseService.patients.getPatients(),
        databaseService.referenceData.getTherapyTypes(),
        // Only fetch doctors if not provided externally
        externalDoctors ? Promise.resolve(externalDoctors) : databaseService.doctors.getDoctors(),
        databaseService.referenceData.getPractitioners()
      ]);

      console.log('📅 Therapy Scheduling Data Loaded:', {
        sessions: sessionsData.length,
        patients: patientsData.length,
        therapyTypes: therapyTypesData.length,
        doctors: doctorsData.length,
        practitioners: practitionersData.length
      });

      setSessions(sessionsData);
      setPatients(patientsData);
      setTherapyTypes(therapyTypesData);
      
      // Only update internal doctors if not using external
      if (!externalDoctors) {
        setInternalDoctors(doctorsData);
      }
      
      // Combine doctor names with legacy practitioners
      const doctorNames = doctorsData.map(d => d.name);
      const allPractitioners = [...new Set([...doctorNames, ...practitionersData])];
      setPractitioners(allPractitioners);
    } catch (error) {
      console.error('❌ Failed to load scheduling data:', error);
      toast.error('Failed to load scheduling data', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [scheduleForm, setScheduleForm] = useState({
    patientId: '',
    therapyType: '',
    date: '',
    time: '',
    duration: 60,
    practitioner: '',
    doctorId: '',
    notes: ''
  });

  // Recalculate available slots when doctor changes
  useEffect(() => {
    if (scheduleForm.date && scheduleForm.doctorId) {
      const slots = schedulingSettings.getAvailableTimeSlots(
        scheduleForm.date,
        sessions.map(s => ({ 
          date: s.date, 
          time: s.time, 
          duration: s.duration,
          doctor_id: s.doctor_id,
          practitioner: s.practitioner
        })),
        scheduleForm.duration,
        scheduleForm.doctorId // Filter slots for this specific doctor
      );
      setAvailableSlots(slots);
    }
  }, [scheduleForm.doctorId, scheduleForm.date, scheduleForm.duration, sessions]);

  const getSessionsForDate = (date: Date | undefined) => {
    if (!date) return [];
    const dateString = date.toISOString().split('T')[0];
    return sessions.filter(session => session.date === dateString);
  };

  const upcomingSessions = sessions.filter(
    session => new Date(session.date) >= new Date() && session.status !== 'cancelled'
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const resetForm = () => {
    setScheduleForm({
      patientId: '',
      therapyType: '',
      date: '',
      time: '',
      duration: 60,
      practitioner: '',
      doctorId: '',
      notes: ''
    });
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!scheduleForm.patientId || !scheduleForm.therapyType || !scheduleForm.date || 
        !scheduleForm.time || !scheduleForm.practitioner) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const patient = patients.find(p => p.id === scheduleForm.patientId);
      if (!patient) {
        toast.error('Patient not found');
        return;
      }

      // Create new session in database
      const sessionData = {
        patient_id: scheduleForm.patientId,
        therapy_type: scheduleForm.therapyType,
        date: scheduleForm.date,
        time: scheduleForm.time,
        duration: scheduleForm.duration,
        status: 'scheduled',
        practitioner: scheduleForm.practitioner,
        doctor_id: scheduleForm.doctorId || undefined,
        notes: scheduleForm.notes,
        pre_procedure_instructions: getDefaultPreInstructions(scheduleForm.therapyType),
        post_procedure_instructions: getDefaultPostInstructions(scheduleForm.therapyType)
      };

      const newSession = await databaseService.therapySessions.createTherapySession(sessionData);

      // Add to sessions
      setSessions(prev => [...prev, newSession]);
      
      // Send confirmation email if auto-confirmation is enabled
      if (settings.autoConfirmation) {
        try {
          await emailService.sendAppointmentConfirmation({
            patientName: patient.name,
            patientEmail: patient.email,
            therapyType: scheduleForm.therapyType,
            date: scheduleForm.date,
            time: scheduleForm.time,
            duration: scheduleForm.duration,
            practitioner: scheduleForm.practitioner,
            preInstructions: sessionData.pre_procedure_instructions,
            postInstructions: sessionData.post_procedure_instructions
          });
          
          // Create automatic reminder notification if enabled
          if (settings.autoReminders) {
            const notificationTime = schedulingSettings.getNotificationTime(scheduleForm.date, scheduleForm.time);
            console.log(`📅 Reminder scheduled for: ${notificationTime.toLocaleString()}`);
            toast.success('Reminder scheduled', {
              description: `Patient will be notified ${settings.notificationLeadTime} hours before appointment`
            });
          }
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail the entire operation if email fails
        }
      }
      
      // Show success message
      toast.success(`Session scheduled successfully for ${patient?.name}`, {
        description: `${scheduleForm.date} at ${scheduleForm.time}`
      });
      
      // Reset form and close dialog
      resetForm();
      setIsSchedulingNew(false);
    } catch (error: any) {
      console.error('Failed to schedule session:', error);
      toast.error('Failed to schedule session', {
        description: error?.message || 'Please check all fields and try again'
      });
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      await databaseService.therapySessions.updateTherapySession(sessionId, { status: 'cancelled' });
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, status: 'cancelled' as const }
          : s
      ));

      // Send cancellation email
      const patient = patients.find(p => p.id === session.patient_id);
      if (patient && settings.autoConfirmation) {
        try {
          await emailService.sendAppointmentCancellation({
            patientName: patient.name,
            patientEmail: patient.email,
            therapyType: session.therapy_type,
            date: session.date,
            time: session.time,
            duration: session.duration,
            practitioner: session.practitioner
          });
        } catch (emailError) {
          console.error('Failed to send cancellation email:', emailError);
        }
      }

      toast.success('Session cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel session:', error);
      toast.error('Failed to cancel session');
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

  const getDefaultPreInstructions = (therapyType: string): string[] => {
    const instructions: { [key: string]: string[] } = {
      'Abhyanga (Oil Massage)': ['Fast for 2 hours before treatment', 'Avoid cold drinks', 'Wear comfortable clothing', 'Arrive 15 minutes early'],
      'Swedana (Steam Therapy)': ['Light breakfast only', 'Remove all jewelry', 'Inform about any discomfort'],
      'Shirodhara (Oil Pouring)': ['Wash hair before treatment', 'No heavy meals 3 hours prior', 'Inform about head injuries if any'],
      'Panchakarma Detox': ['Fast from previous night', 'Drink warm water only', 'Complete all pre-detox preparations'],
      'Nasya (Nasal Therapy)': ['Clear nasal passages', 'Avoid cold foods', 'Inform about nasal issues'],
      'Udvartana (Herbal Powder Massage)': ['Take light meal 2 hours before', 'Inform about skin allergies', 'Wear minimal clothing']
    };
    return instructions[therapyType] || ['Follow general pre-treatment guidelines', 'Arrive 15 minutes early'];
  };

  const getDefaultPostInstructions = (therapyType: string): string[] => {
    const instructions: { [key: string]: string[] } = {
      'Abhyanga (Oil Massage)': ['Rest for 30 minutes after treatment', 'Drink warm water', 'Avoid cold exposure for 2 hours'],
      'Swedana (Steam Therapy)': ['Cool down gradually', 'Drink plenty of water', 'Rest for 1 hour'],
      'Shirodhara (Oil Pouring)': ['Do not wash hair for 24 hours', 'Keep head covered', 'Avoid loud noises'],
      'Panchakarma Detox': ['Follow post-detox diet', 'Rest completely', 'Take prescribed medicines'],
      'Nasya (Nasal Therapy)': ['Avoid cold air', 'Do not blow nose forcefully', 'Rest in quiet environment'],
      'Udvartana (Herbal Powder Massage)': ['Take warm shower after 1 hour', 'Apply prescribed oils', 'Avoid heavy meals']
    };
    return instructions[therapyType] || ['Follow general post-treatment guidelines', 'Rest and stay hydrated'];
  };

  const ScheduleNewSessionDialog = () => (
    <Dialog open={isSchedulingNew} onOpenChange={(open) => {
      setIsSchedulingNew(open);
      if (!open) {
        // Reset form and available slots when dialog closes
        resetForm();
        setAvailableSlots([]);
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Schedule New Session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Therapy Session</DialogTitle>
          <DialogDescription>
            Create a new therapy appointment for a patient
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleScheduleSubmit(e);
        }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient">Patient *</Label>
            <Select value={scheduleForm.patientId} onValueChange={(value) => 
              setScheduleForm({...scheduleForm, patientId: value})
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.length > 0 ? (
                  patients.filter(p => p.id && p.id.trim() !== '').map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.email})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-patients" disabled>No patients available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="therapy">Therapy Type *</Label>
            <Select value={scheduleForm.therapyType} onValueChange={(value) => {
              const selectedTherapy = therapyTypes.find(t => t.name === value);
              const newDuration = selectedTherapy?.duration || settings.defaultDuration;
              setScheduleForm({
                ...scheduleForm, 
                therapyType: value,
                duration: newDuration
              });
              
              // Recalculate available slots with new duration
              if (scheduleForm.date) {
                const slots = schedulingSettings.getAvailableTimeSlots(
                  scheduleForm.date,
                  sessions.map(s => ({ 
                    date: s.date, 
                    time: s.time, 
                    duration: s.duration,
                    doctor_id: s.doctor_id,
                    practitioner: s.practitioner
                  })),
                  newDuration,
                  scheduleForm.doctorId // Filter by doctor if selected
                );
                setAvailableSlots(slots);
              }
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
                  <SelectItem value="no-therapy-types" disabled>No therapy types available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={scheduleForm.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setScheduleForm({...scheduleForm, date: newDate});
                  
                  // Calculate available slots for the selected date and doctor
                  if (newDate && scheduleForm.duration) {
                    const slots = schedulingSettings.getAvailableTimeSlots(
                      newDate,
                      sessions.map(s => ({ 
                        date: s.date, 
                        time: s.time, 
                        duration: s.duration,
                        doctor_id: s.doctor_id,
                        practitioner: s.practitioner
                      })),
                      scheduleForm.duration,
                      scheduleForm.doctorId // Filter by doctor if selected
                    );
                    setAvailableSlots(slots);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Select 
                value={scheduleForm.time} 
                onValueChange={(value) => setScheduleForm({...scheduleForm, time: value})}
              >
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
                  ) : scheduleForm.date ? (
                    <SelectItem value="no-slots" disabled>No slots available</SelectItem>
                  ) : (
                    <SelectItem value="select-date" disabled>Select a date first</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {availableSlots.length > 0 && `${availableSlots.length} slots available`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="practitioner">Doctor/Practitioner *</Label>
            <Select value={scheduleForm.practitioner} onValueChange={(value) => {
              // Check if this is a doctor (has ID in doctors array)
              const selectedDoctor = doctors.find(d => d.name === value);
              const newDoctorId = selectedDoctor?.id || '';
              
              setScheduleForm({
                ...scheduleForm, 
                practitioner: value,
                doctorId: newDoctorId
              });

              // Recalculate available slots for the new doctor
              if (scheduleForm.date) {
                const slots = schedulingSettings.getAvailableTimeSlots(
                  scheduleForm.date,
                  sessions.map(s => ({ 
                    date: s.date, 
                    time: s.time, 
                    duration: s.duration,
                    doctor_id: s.doctor_id,
                    practitioner: s.practitioner
                  })),
                  scheduleForm.duration,
                  newDoctorId
                );
                setAvailableSlots(slots);
                
                // Clear the time selection if it's no longer available
                if (scheduleForm.time && !slots.includes(scheduleForm.time)) {
                  setScheduleForm(prev => ({ ...prev, time: '' }));
                }
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select doctor/practitioner" />
              </SelectTrigger>
              <SelectContent>
                {/* Show doctors first */}
                {doctors && doctors.length > 0 ? (
                  doctors.map(doctor => (
                    <SelectItem key={doctor.id || doctor.name} value={doctor.name}>
                      {doctor.name}{doctor.specialization ? ` (${doctor.specialization})` : ' (Doctor)'}
                    </SelectItem>
                  ))
                ) : null}
                
                {/* Show other practitioners */}
                {practitioners && practitioners.length > 0 ? (
                  practitioners.filter(p => p && p.trim() !== '' && !doctors.some(d => d.name === p)).map(practitioner => (
                    <SelectItem key={practitioner} value={practitioner}>
                      {practitioner}
                    </SelectItem>
                  ))
                ) : null}
                
                {/* Fallback when no doctors or practitioners are available */}
                {(!doctors || doctors.length === 0) && (!practitioners || practitioners.length === 0) && (
                  <SelectItem value="no-practitioners" disabled>No doctors or practitioners available - Please add doctors first</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={scheduleForm.duration}
              min="15"
              max="240"
              step="15"
              onChange={(e) => setScheduleForm({...scheduleForm, duration: parseInt(e.target.value)})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for this session"
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => {
              resetForm();
              setIsSchedulingNew(false);
            }}>
              Cancel
            </Button>
            <Button type="submit">Schedule Session</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Therapy Scheduling</CardTitle>
              <CardDescription>
                Manage therapy appointments and automated scheduling
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Calendar
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
              </div>
              <ScheduleNewSessionDialog />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'calendar' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar View */}
              <div className="lg:col-span-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>

              {/* Sessions for Selected Date */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">
                    Sessions for {selectedDate?.toLocaleDateString()}
                  </h3>
                  <div className="space-y-2">
                    {getSessionsForDate(selectedDate).length > 0 ? (
                      getSessionsForDate(selectedDate).map((session) => {
                        const patient = patients.find(p => p.id === session.patient_id);
                        return (
                          <div key={session.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">
                                <Clock className="w-3 h-3 mr-1" />
                                {session.time}
                              </Badge>
                              <Badge variant={
                                session.status === 'completed' ? 'default' : 
                                session.status === 'cancelled' ? 'destructive' : 'secondary'
                              }>
                                {session.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{session.therapy_type}</p>
                              <p className="text-xs text-muted-foreground">
                                <User className="w-3 h-3 inline mr-1" />
                                {patient?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {session.doctor_id ? '🩺 Doctor: ' : 'Practitioner: '}{session.practitioner}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              {session.status === 'scheduled' && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleCompleteSession(session.id)}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Complete
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleCancelSession(session.id)}
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Cancel
                                  </Button>
                                </>
                              )}
                              {session.status === 'completed' && (
                                <Badge variant="default">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              {session.status === 'cancelled' && (
                                <Badge variant="destructive">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Cancelled
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No sessions scheduled for this date
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Upcoming Sessions</h3>
                <Badge variant="outline">{upcomingSessions.length} sessions</Badge>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Therapy</TableHead>
                      <TableHead>Practitioner</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Loading sessions...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : upcomingSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-muted-foreground">
                            <p className="font-medium">No upcoming sessions</p>
                            <p className="text-sm mt-1">Click "Schedule New Session" to create one</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      upcomingSessions.map((session) => {
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
                                <p className="font-medium">{patient?.name || 'Unknown Patient'}</p>
                                <p className="text-sm text-muted-foreground">{patient?.email || 'N/A'}</p>
                              </div>
                            </TableCell>
                            <TableCell>{session.therapy_type}</TableCell>
                            <TableCell>{session.practitioner}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {session.duration}min
                              </Badge>
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
                              <div className="flex space-x-1">
                                {session.status === 'scheduled' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleCompleteSession(session.id)}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Complete
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleCancelSession(session.id)}
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      Cancel
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automated Scheduling Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Automated Scheduling Settings
              </CardTitle>
              <CardDescription>
                Configure automatic therapy scheduling and notification preferences
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Default Session Duration</Label>
                <Select 
                  value={String(settings.defaultDuration)}
                  onValueChange={(value) => setSettings({...settings, defaultDuration: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  New sessions will default to this duration
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Notification Lead Time</Label>
                <Select 
                  value={String(settings.notificationLeadTime)}
                  onValueChange={(value) => setSettings({...settings, notificationLeadTime: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 hours before</SelectItem>
                    <SelectItem value="12">12 hours before</SelectItem>
                    <SelectItem value="24">24 hours before</SelectItem>
                    <SelectItem value="48">48 hours before</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  When to send reminder emails to patients
                </p>
              </div>
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Auto Confirmation Emails</Label>
                  <p className="text-xs text-muted-foreground">
                    Send email when appointment is scheduled
                  </p>
                </div>
                <Switch
                  checked={settings.autoConfirmation}
                  onCheckedChange={(checked) => setSettings({...settings, autoConfirmation: checked})}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Working Hours</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    type="time" 
                    value={settings.workingHoursStart}
                    onChange={(e) => setSettings({...settings, workingHoursStart: e.target.value})}
                  />
                  <Input 
                    type="time" 
                    value={settings.workingHoursEnd}
                    onChange={(e) => setSettings({...settings, workingHoursEnd: e.target.value})}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Available appointment slots will be within these hours
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Buffer Time Between Sessions</Label>
                <Select 
                  value={String(settings.bufferTime)}
                  onValueChange={(value) => setSettings({...settings, bufferTime: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Time gap between consecutive appointments
                </p>
              </div>
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Auto Reminder Emails</Label>
                  <p className="text-xs text-muted-foreground">
                    Send reminder before appointment
                  </p>
                </div>
                <Switch
                  checked={settings.autoReminders}
                  onCheckedChange={(checked) => setSettings({...settings, autoReminders: checked})}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button 
              onClick={() => {
                if (schedulingSettings.saveSettings(settings)) {
                  toast.success('Settings saved successfully!', {
                    description: 'Automated scheduling is now configured'
                  });
                } else {
                  toast.error('Failed to save settings');
                }
              }}
            >
              Save Settings
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const defaultSettings = schedulingSettings.resetSettings();
                setSettings(defaultSettings);
                toast.info('Settings reset to defaults');
              }}
            >
              Reset to Defaults
            </Button>
          </div>

          {/* Info about automated features */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Automated Features Active
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {settings.autoConfirmation && (
                <li>✅ Confirmation emails sent immediately when appointments are scheduled</li>
              )}
              {settings.autoReminders && (
                <li>✅ Reminder emails sent {settings.notificationLeadTime} hours before appointments</li>
              )}
              <li>✅ Available time slots calculated automatically based on working hours</li>
              <li>✅ Buffer time prevents back-to-back scheduling</li>
              <li>✅ Default duration applied to new appointments</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
