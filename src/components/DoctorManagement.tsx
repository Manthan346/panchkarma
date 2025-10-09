import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Search, Eye, Edit, Phone, Mail, GraduationCap, Briefcase, Loader2 } from 'lucide-react';
import { Doctor } from '../App';
import { databaseService } from '../utils/database-smart';
import { toast } from 'sonner@2.0.3';

interface DoctorManagementProps {
  doctors?: Doctor[];
  setDoctors?: React.Dispatch<React.SetStateAction<Doctor[]>>;
}

export function DoctorManagement({ doctors: externalDoctors, setDoctors: externalSetDoctors }: DoctorManagementProps = {}) {
  const [internalDoctors, setInternalDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use external state if provided, otherwise use internal state
  const doctors = externalDoctors || internalDoctors;
  const setDoctors = externalSetDoctors || setInternalDoctors;

  // Load doctors from database
  useEffect(() => {
    if (!externalDoctors) {
      loadDoctors();
    } else {
      setIsLoading(false);
    }
  }, [externalDoctors]);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      const doctorsData = await databaseService.doctors.getDoctors();
      setInternalDoctors(doctorsData);
    } catch (error) {
      console.error('Failed to load doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [isEditingDoctor, setIsEditingDoctor] = useState(false);
  const [showDoctorDetails, setShowDoctorDetails] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: ''
  });
  const [editDoctor, setEditDoctor] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: ''
  });

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle adding new doctor
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newDoctor.name || !newDoctor.email || !newDoctor.phone || !newDoctor.specialization) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if email already exists
    if (doctors.some(d => d.email.toLowerCase() === newDoctor.email.toLowerCase())) {
      toast.error('Doctor with this email already exists');
      return;
    }

    try {
      // Create new doctor in database
      const doctorData = {
        name: newDoctor.name,
        email: newDoctor.email,
        password: 'temp123', // Default password
        phone: newDoctor.phone,
        specialization: newDoctor.specialization,
        qualification: newDoctor.qualification,
        experience: parseInt(newDoctor.experience) || 0
      };

      const createdDoctor = await databaseService.doctors.createDoctor(doctorData);

      // Add to doctors list
      setDoctors(prev => [...prev, createdDoctor]);
      
      // Reset form
      setNewDoctor({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        qualification: '',
        experience: ''
      });
      
      setIsAddingDoctor(false);
      toast.success(`Doctor ${newDoctor.name} added successfully`);
    } catch (error) {
      console.error('Failed to create doctor:', error);
      toast.error('Failed to create doctor');
    }
  };

  // Handle editing doctor
  const handleEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDoctor) return;

    // Validate form
    if (!editDoctor.name || !editDoctor.email || !editDoctor.phone || !editDoctor.specialization) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Update doctor in database
      const updateData = {
        name: editDoctor.name,
        email: editDoctor.email,
        phone: editDoctor.phone,
        specialization: editDoctor.specialization,
        qualification: editDoctor.qualification,
        experience: parseInt(editDoctor.experience) || 0
      };

      const updatedDoctor = await databaseService.doctors.updateDoctor(selectedDoctor.id, updateData);

      // Update doctors list
      setDoctors(prev => prev.map(d => d.id === selectedDoctor.id ? updatedDoctor : d));
      
      setIsEditingDoctor(false);
      setSelectedDoctor(null);
      toast.success(`Doctor ${editDoctor.name} updated successfully`);
    } catch (error) {
      console.error('Failed to update doctor:', error);
      toast.error('Failed to update doctor');
    }
  };

  const openEditDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setEditDoctor({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience.toString()
    });
    setIsEditingDoctor(true);
  };

  const openDetailsDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorDetails(true);
  };

  const DoctorDetailsDialog = ({ doctor }: { doctor: Doctor }) => (
    <Dialog open={showDoctorDetails} onOpenChange={setShowDoctorDetails}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Doctor Details: {doctor.name}</DialogTitle>
          <DialogDescription>
            Complete doctor information and credentials
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-3">Personal Information</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  {doctor.email}
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                  {doctor.phone}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Professional Details</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Specialization:</span>
                  <Badge variant="secondary">{doctor.specialization}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Experience:</span>
                  <Badge variant="outline">{doctor.experience} years</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Qualification */}
          <div>
            <h4 className="font-medium mb-2">Qualifications</h4>
            <div className="p-3 bg-muted rounded-lg text-sm flex items-start">
              <GraduationCap className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
              {doctor.qualification}
            </div>
          </div>

          {/* Status */}
          <div>
            <h4 className="font-medium mb-2">Status</h4>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Doctor is active and available for appointments.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const AddDoctorDialog = () => (
    <Dialog open={isAddingDoctor} onOpenChange={setIsAddingDoctor}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New Doctor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Doctor</DialogTitle>
          <DialogDescription>
            Enter doctor information to create a new account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddDoctor} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input 
              id="name" 
              placeholder="Dr. Full Name" 
              value={newDoctor.name}
              onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="doctor@example.com"
              value={newDoctor.email}
              onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input 
              id="phone" 
              placeholder="Enter phone number"
              value={newDoctor.phone}
              onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization *</Label>
            <Input 
              id="specialization" 
              placeholder="e.g., Panchakarma Specialist"
              value={newDoctor.specialization}
              onChange={(e) => setNewDoctor({...newDoctor, specialization: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qualification">Qualification</Label>
            <Textarea 
              id="qualification" 
              placeholder="Enter qualifications and degrees"
              value={newDoctor.qualification}
              onChange={(e) => setNewDoctor({...newDoctor, qualification: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Input 
              id="experience" 
              type="number" 
              placeholder="Years"
              value={newDoctor.experience}
              onChange={(e) => setNewDoctor({...newDoctor, experience: e.target.value})}
              min="0"
              max="50"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => {
              setIsAddingDoctor(false);
              setNewDoctor({
                name: '',
                email: '',
                phone: '',
                specialization: '',
                qualification: '',
                experience: ''
              });
            }}>
              Cancel
            </Button>
            <Button type="submit">Add Doctor</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  const EditDoctorDialog = () => (
    <Dialog open={isEditingDoctor} onOpenChange={setIsEditingDoctor}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Doctor</DialogTitle>
          <DialogDescription>
            Update doctor information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleEditDoctor} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name *</Label>
            <Input 
              id="edit-name" 
              placeholder="Dr. Full Name" 
              value={editDoctor.name}
              onChange={(e) => setEditDoctor({...editDoctor, name: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email *</Label>
            <Input 
              id="edit-email" 
              type="email" 
              placeholder="doctor@example.com"
              value={editDoctor.email}
              onChange={(e) => setEditDoctor({...editDoctor, email: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone *</Label>
            <Input 
              id="edit-phone" 
              placeholder="Enter phone number"
              value={editDoctor.phone}
              onChange={(e) => setEditDoctor({...editDoctor, phone: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-specialization">Specialization *</Label>
            <Input 
              id="edit-specialization" 
              placeholder="e.g., Panchakarma Specialist"
              value={editDoctor.specialization}
              onChange={(e) => setEditDoctor({...editDoctor, specialization: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-qualification">Qualification</Label>
            <Textarea 
              id="edit-qualification" 
              placeholder="Enter qualifications and degrees"
              value={editDoctor.qualification}
              onChange={(e) => setEditDoctor({...editDoctor, qualification: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-experience">Years of Experience</Label>
            <Input 
              id="edit-experience" 
              type="number" 
              placeholder="Years"
              value={editDoctor.experience}
              onChange={(e) => setEditDoctor({...editDoctor, experience: e.target.value})}
              min="0"
              max="50"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => {
              setIsEditingDoctor(false);
              setSelectedDoctor(null);
            }}>
              Cancel
            </Button>
            <Button type="submit">Update Doctor</Button>
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
              <CardTitle>Doctor Management</CardTitle>
              <CardDescription>
                Manage doctor records, view credentials, and add new doctors
              </CardDescription>
            </div>
            <AddDoctorDialog />
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search doctors by name, email, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Doctors Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading doctors...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredDoctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No doctors found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDoctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">Dr. {doctor.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {doctor.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{doctor.email}</p>
                        <p className="text-sm text-muted-foreground">{doctor.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {doctor.specialization}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {doctor.experience} years
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDetailsDialog(doctor)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(doctor)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedDoctor && showDoctorDetails && (
        <DoctorDetailsDialog doctor={selectedDoctor} />
      )}
      <EditDoctorDialog />
    </div>
  );
}