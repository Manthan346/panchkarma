import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Search, Eye, Edit, Phone, Mail, Award, Loader2, Key, Copy } from 'lucide-react';
import { Doctor } from '../App';
import { databaseService } from '../utils/database-smart';
import { toast } from 'sonner';

interface DoctorManagementProps {
  doctors?: Doctor[];
  setDoctors?: React.Dispatch<React.SetStateAction<Doctor[]>>;
}

// Doctor Details Dialog Component - Moved outside to prevent re-creation on every render
const DoctorDetailsDialog = ({ doctor }: { doctor: Doctor }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm">
        <Eye className="w-4 h-4 mr-1" />
        View
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Doctor Details: Dr. {doctor.name}</DialogTitle>
        <DialogDescription>
          Complete doctor information and credentials
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6">
        {/* Professional Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Professional Information</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center text-sm">
                <span className="font-medium w-24">Email:</span>
                <span className="text-muted-foreground">{doctor.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium w-24">Phone:</span>
                <span className="text-muted-foreground">{doctor.phone}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium w-24">Experience:</span>
                <span className="text-muted-foreground">{doctor.experience} years</span>
              </div>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Login Credentials</Label>
            <div className="mt-2 space-y-2">
              <div className="text-sm">
                <span className="font-medium">Email:</span> {doctor.email}
              </div>
              <div className="text-sm">
                <span className="font-medium">Password:</span> 
                <Badge variant="secondary" className="ml-2">••••••••</Badge>
                <span className="text-xs text-muted-foreground ml-2">(Contact admin for password reset)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specialization and Qualification */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Specialization</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {doctor.specialization}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Qualification</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {doctor.qualification || 'No qualification specified'}
            </p>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export function DoctorManagementEnhanced({ doctors: externalDoctors, setDoctors: externalSetDoctors }: DoctorManagementProps = {}) {
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
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: ''
  });
  const [editDoctor, setEditDoctor] = useState({
    name: '',
    email: '',
    password: '',
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

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGeneratePassword = (isEdit = false) => {
    const newPassword = generatePassword();
    if (isEdit) {
      setEditDoctor({...editDoctor, password: newPassword});
    } else {
      setNewDoctor({...newDoctor, password: newPassword});
    }
    toast.success('Password generated successfully');
  };

  const copyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast.success('Password copied to clipboard');
  };

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
      const updateData: any = {
        name: editDoctor.name,
        email: editDoctor.email,
        phone: editDoctor.phone,
        specialization: editDoctor.specialization,
        qualification: editDoctor.qualification,
        experience: parseInt(editDoctor.experience) || 0
      };

      // Only update password if provided
      if (editDoctor.password) {
        updateData.password = editDoctor.password;
      }

      const updatedDoctor = await databaseService.doctors.updateDoctor(selectedDoctor.id, updateData);

      // Update doctors list
      setDoctors(prev => prev.map(d => d.id === selectedDoctor.id ? updatedDoctor : d));
      
      setIsEditingDoctor(false);
      setSelectedDoctor(null);
      toast.success(`Dr. ${editDoctor.name} updated successfully`);
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
      password: '', // Don't show existing password
      phone: doctor.phone,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience.toString()
    });
    setIsEditingDoctor(true);
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newDoctor.name || !newDoctor.email || !newDoctor.password || !newDoctor.phone || !newDoctor.specialization) {
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
        password: newDoctor.password,
        role: 'doctor' as const,
        phone: newDoctor.phone,
        specialization: newDoctor.specialization,
        qualification: newDoctor.qualification,
        experience: parseInt(newDoctor.experience) || 0
      };

      const createdDoctor = await databaseService.users.createUser(doctorData);

      // Add to doctors list
      setDoctors(prev => [...prev, createdDoctor as Doctor]);
      
      // Reset form
      setNewDoctor({
        name: '',
        email: '',
        password: '',
        phone: '',
        specialization: '',
        qualification: '',
        experience: ''
      });
      
      setIsAddingDoctor(false);
      toast.success(`Dr. ${newDoctor.name} added successfully with credentials`);
    } catch (error) {
      console.error('Failed to create doctor:', error);
      toast.error('Failed to create doctor');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2>Doctor Management</h2>
          <p className="text-muted-foreground">
            Manage doctor accounts and login credentials
          </p>
        </div>
        <Dialog open={isAddingDoctor} onOpenChange={setIsAddingDoctor}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
              <DialogDescription>
                Create doctor account with login credentials
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input 
                  id="name" 
                  placeholder="Enter doctor's full name" 
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
                  placeholder="Enter email"
                  value={newDoctor.email}
                  onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter doctor password"
                    value={newDoctor.password}
                    onChange={(e) => setNewDoctor({...newDoctor, password: e.target.value})}
                    required
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => handleGeneratePassword()}>
                    <Key className="w-4 h-4" />
                  </Button>
                  {newDoctor.password && (
                    <Button type="button" variant="outline" size="sm" onClick={() => copyPassword(newDoctor.password)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {newDoctor.password && (
                  <p className="text-xs text-muted-foreground">Password: {newDoctor.password}</p>
                )}
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
                <Input 
                  id="qualification" 
                  placeholder="e.g., BAMS, MD (Panchakarma)"
                  value={newDoctor.qualification}
                  onChange={(e) => setNewDoctor({...newDoctor, qualification: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (years)</Label>
                <Input 
                  id="experience" 
                  type="number"
                  placeholder="Years of experience"
                  value={newDoctor.experience}
                  onChange={(e) => setNewDoctor({...newDoctor, experience: e.target.value})}
                  min="0"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => {
                  setIsAddingDoctor(false);
                  setNewDoctor({
                    name: '',
                    email: '',
                    password: '',
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
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Doctors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Doctors ({filteredDoctors.length})</CardTitle>
          <CardDescription>
            View and manage all doctor accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead className="hidden md:table-cell">Experience</TableHead>
                  <TableHead className="hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="hidden xl:table-cell">Specialization</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No doctors found matching your search.' : 'No doctors registered yet.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">Dr. {doctor.name}</div>
                          <div className="text-sm text-muted-foreground">{doctor.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">{doctor.experience} years</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {doctor.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {doctor.specialization}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <DoctorDetailsDialog doctor={doctor} />
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

      {/* Edit Doctor Dialog */}
      <Dialog open={isEditingDoctor} onOpenChange={setIsEditingDoctor}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Doctor: Dr. {selectedDoctor?.name}</DialogTitle>
            <DialogDescription>
              Update doctor information and credentials
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditDoctor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input 
                id="edit-name" 
                placeholder="Enter doctor's full name" 
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
                placeholder="Enter email"
                value={editDoctor.email}
                onChange={(e) => setEditDoctor({...editDoctor, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
              <div className="flex space-x-2">
                <Input 
                  id="edit-password" 
                  type="password" 
                  placeholder="Enter new password"
                  value={editDoctor.password}
                  onChange={(e) => setEditDoctor({...editDoctor, password: e.target.value})}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => handleGeneratePassword(true)}>
                  <Key className="w-4 h-4" />
                </Button>
                {editDoctor.password && (
                  <Button type="button" variant="outline" size="sm" onClick={() => copyPassword(editDoctor.password)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {editDoctor.password && (
                <p className="text-xs text-muted-foreground">New password: {editDoctor.password}</p>
              )}
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
              <Input 
                id="edit-qualification" 
                placeholder="e.g., BAMS, MD (Panchakarma)"
                value={editDoctor.qualification}
                onChange={(e) => setEditDoctor({...editDoctor, qualification: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-experience">Experience (years)</Label>
              <Input 
                id="edit-experience" 
                type="number"
                placeholder="Years of experience"
                value={editDoctor.experience}
                onChange={(e) => setEditDoctor({...editDoctor, experience: e.target.value})}
                min="0"
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
    </div>
  );
}
