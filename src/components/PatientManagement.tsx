import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Search, Eye, Edit, Phone, Mail, MapPin, Loader2, User } from 'lucide-react';
import { Patient } from '../App';
import { databaseService } from '../utils/database-smart';
import { toast } from 'sonner@2.0.3';

interface PatientManagementProps {
  patients?: Patient[];
  setPatients?: React.Dispatch<React.SetStateAction<Patient[]>>;
}

export function PatientManagement({ patients: externalPatients, setPatients: externalSetPatients }: PatientManagementProps = {}) {
  const [internalPatients, setInternalPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const patients = externalPatients || internalPatients;
  const setPatients = externalSetPatients || setInternalPatients;

  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    phone: '',
    address: '',
    medicalHistory: ''
  });

  const [editPatient, setEditPatient] = useState({
    name: '',
    email: '',
    age: '',
    phone: '',
    address: '',
    medicalHistory: ''
  });

  useEffect(() => {
    if (!externalPatients) {
      loadPatients();
    } else {
      setIsLoading(false);
    }
  }, [externalPatients]);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const data = await databaseService.patients.getPatients();
      setInternalPatients(data);
    } catch (error: any) {
      console.error('Failed to load patients:', error);
      toast.error('Failed to load patients: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPatient.name || !newPatient.email || !newPatient.password || !newPatient.age || !newPatient.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const createdPatient = await databaseService.patients.createPatient({
        name: newPatient.name,
        email: newPatient.email,
        password: newPatient.password,
        age: parseInt(newPatient.age),
        phone: newPatient.phone,
        address: newPatient.address,
        medicalHistory: newPatient.medicalHistory
      });

      setPatients(prev => [createdPatient, ...prev]);
      setNewPatient({ name: '', email: '', password: '', age: '', phone: '', address: '', medicalHistory: '' });
      setIsAddDialogOpen(false);
      toast.success(`Patient ${newPatient.name} added successfully`);
    } catch (error: any) {
      console.error('Failed to create patient:', error);
      toast.error('Failed to create patient: ' + error.message);
    }
  };

  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient || !editPatient.name || !editPatient.email || !editPatient.age || !editPatient.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const updated = await databaseService.patients.updatePatient(selectedPatient.id, {
        name: editPatient.name,
        email: editPatient.email,
        age: parseInt(editPatient.age),
        phone: editPatient.phone,
        address: editPatient.address,
        medicalHistory: editPatient.medicalHistory
      });

      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updated : p));
      setIsEditDialogOpen(false);
      setSelectedPatient(null);
      toast.success(`Patient ${editPatient.name} updated successfully`);
    } catch (error: any) {
      console.error('Failed to update patient:', error);
      toast.error('Failed to update patient: ' + error.message);
    }
  };

  const openViewDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditPatient({
      name: patient.name,
      email: patient.email,
      age: patient.age.toString(),
      phone: patient.phone,
      address: patient.address,
      medicalHistory: patient.medicalHistory
    });
    setIsEditDialogOpen(true);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
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
              <CardTitle>Patient Management</CardTitle>
              <CardDescription>Manage patient records and information</CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search patients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No patients found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">{patient.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-2 text-muted-foreground" />
                            {patient.phone || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{patient.age} years</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {patient.address || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openViewDialog(patient)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(patient)}>
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

      {/* View Patient Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patient Details: {selectedPatient?.name}</DialogTitle>
            <DialogDescription>Complete patient information</DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <div className="flex items-center mt-1">
                      <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{selectedPatient.email}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <div className="flex items-center mt-1">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{selectedPatient.phone}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{selectedPatient.age} years</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                    <div className="flex items-start mt-1">
                      <MapPin className="w-4 h-4 mr-2 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{selectedPatient.address || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Medical History</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <p className="text-sm">{selectedPatient.medicalHistory || 'No medical history recorded'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>Update patient information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditPatient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input 
                  id="edit-name" 
                  value={editPatient.name}
                  onChange={(e) => setEditPatient({...editPatient, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-age">Age *</Label>
                <Input 
                  id="edit-age" 
                  type="number" 
                  value={editPatient.age}
                  onChange={(e) => setEditPatient({...editPatient, age: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input 
                id="edit-email" 
                type="email" 
                value={editPatient.email}
                onChange={(e) => setEditPatient({...editPatient, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input 
                id="edit-phone" 
                value={editPatient.phone}
                onChange={(e) => setEditPatient({...editPatient, phone: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea 
                id="edit-address" 
                value={editPatient.address}
                onChange={(e) => setEditPatient({...editPatient, address: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-history">Medical History</Label>
              <Textarea 
                id="edit-history" 
                value={editPatient.medicalHistory}
                onChange={(e) => setEditPatient({...editPatient, medicalHistory: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Patient</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Patient Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>Create a new patient account</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPatient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input 
                  id="name" 
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input 
                  id="age" 
                  type="number" 
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email" 
                value={newPatient.email}
                onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input 
                id="password" 
                type="password" 
                value={newPatient.password}
                onChange={(e) => setNewPatient({...newPatient, password: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input 
                id="phone" 
                value={newPatient.phone}
                onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea 
                id="address" 
                value={newPatient.address}
                onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="history">Medical History</Label>
              <Textarea 
                id="history" 
                value={newPatient.medicalHistory}
                onChange={(e) => setNewPatient({...newPatient, medicalHistory: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Patient</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
