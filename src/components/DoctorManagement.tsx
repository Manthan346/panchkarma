import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Search, Eye, Edit, Phone, Mail, Award, Briefcase, Loader2 } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const doctors = externalDoctors || internalDoctors;
  const setDoctors = externalSetDoctors || setInternalDoctors;

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
    phone: '',
    specialization: '',
    qualification: '',
    experience: ''
  });

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
      const data = await databaseService.doctors.getDoctors();
      setInternalDoctors(data);
    } catch (error: any) {
      console.error('Failed to load doctors:', error);
      toast.error('Failed to load doctors: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDoctor.name || !newDoctor.email || !newDoctor.password || !newDoctor.phone || !newDoctor.specialization) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const createdDoctor = await databaseService.doctors.createDoctor({
        name: newDoctor.name,
        email: newDoctor.email,
        password: newDoctor.password,
        phone: newDoctor.phone,
        specialization: newDoctor.specialization,
        qualification: newDoctor.qualification,
        experience: parseInt(newDoctor.experience) || 0
      });

      setDoctors(prev => [createdDoctor, ...prev]);
      setNewDoctor({ name: '', email: '', password: '', phone: '', specialization: '', qualification: '', experience: '' });
      setIsAddDialogOpen(false);
      toast.success(`Doctor ${newDoctor.name} added successfully`);
    } catch (error: any) {
      console.error('Failed to create doctor:', error);
      toast.error('Failed to create doctor: ' + error.message);
    }
  };

  const handleEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDoctor || !editDoctor.name || !editDoctor.email || !editDoctor.phone || !editDoctor.specialization) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const updated = await databaseService.doctors.updateDoctor(selectedDoctor.id, {
        name: editDoctor.name,
        email: editDoctor.email,
        phone: editDoctor.phone,
        specialization: editDoctor.specialization,
        qualification: editDoctor.qualification,
        experience: parseInt(editDoctor.experience) || 0
      });

      setDoctors(prev => prev.map(d => d.id === selectedDoctor.id ? updated : d));
      setIsEditDialogOpen(false);
      setSelectedDoctor(null);
      toast.success(`Doctor ${editDoctor.name} updated successfully`);
    } catch (error: any) {
      console.error('Failed to update doctor:', error);
      toast.error('Failed to update doctor: ' + error.message);
    }
  };

  const openViewDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsViewDialogOpen(true);
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
    setIsEditDialogOpen(true);
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Doctor Management</CardTitle>
              <CardDescription>Manage doctor profiles and information</CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Doctor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search doctors by name, email, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No doctors found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Award className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{doctor.name}</p>
                            <p className="text-sm text-muted-foreground">{doctor.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Phone className="w-3 h-3 mr-2 text-muted-foreground" />
                          {doctor.phone || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{doctor.specialization}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Briefcase className="w-3 h-3 mr-2 text-muted-foreground" />
                          {doctor.experience} years
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openViewDialog(doctor)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(doctor)}>
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

      {/* View Doctor Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Doctor Details: {selectedDoctor?.name}</DialogTitle>
            <DialogDescription>Complete doctor information</DialogDescription>
          </DialogHeader>
          {selectedDoctor && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <div className="flex items-center mt-1">
                      <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{selectedDoctor.email}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <div className="flex items-center mt-1">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{selectedDoctor.phone}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Specialization</Label>
                    <div className="mt-1">
                      <Badge variant="secondary">{selectedDoctor.specialization}</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Qualification</Label>
                    <div className="flex items-center mt-1">
                      <Award className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{selectedDoctor.qualification || 'Not provided'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Experience</Label>
                    <div className="flex items-center mt-1">
                      <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{selectedDoctor.experience} years</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>Update doctor information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditDoctor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input 
                id="edit-name" 
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
                value={editDoctor.email}
                onChange={(e) => setEditDoctor({...editDoctor, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input 
                id="edit-phone" 
                value={editDoctor.phone}
                onChange={(e) => setEditDoctor({...editDoctor, phone: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-specialization">Specialization *</Label>
              <Input 
                id="edit-specialization" 
                value={editDoctor.specialization}
                onChange={(e) => setEditDoctor({...editDoctor, specialization: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-qualification">Qualification</Label>
              <Input 
                id="edit-qualification" 
                value={editDoctor.qualification}
                onChange={(e) => setEditDoctor({...editDoctor, qualification: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-experience">Experience (years)</Label>
              <Input 
                id="edit-experience" 
                type="number" 
                value={editDoctor.experience}
                onChange={(e) => setEditDoctor({...editDoctor, experience: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Doctor</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Doctor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
            <DialogDescription>Create a new doctor account</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddDoctor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name" 
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
                value={newDoctor.email}
                onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input 
                id="password" 
                type="password" 
                value={newDoctor.password}
                onChange={(e) => setNewDoctor({...newDoctor, password: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input 
                id="phone" 
                value={newDoctor.phone}
                onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization *</Label>
              <Input 
                id="specialization" 
                value={newDoctor.specialization}
                onChange={(e) => setNewDoctor({...newDoctor, specialization: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification</Label>
              <Input 
                id="qualification" 
                value={newDoctor.qualification}
                onChange={(e) => setNewDoctor({...newDoctor, qualification: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Experience (years)</Label>
              <Input 
                id="experience" 
                type="number" 
                value={newDoctor.experience}
                onChange={(e) => setNewDoctor({...newDoctor, experience: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Doctor</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
