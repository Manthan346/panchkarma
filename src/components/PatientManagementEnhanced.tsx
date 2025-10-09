import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Search, Eye, Edit, Phone, Mail, MapPin, Loader2, Key, Copy } from 'lucide-react';
import { Patient } from '../App';
import { databaseService } from '../utils/database-smart';
import { toast } from 'sonner@2.0.3';

interface PatientManagementProps {
  patients?: Patient[];
  setPatients?: React.Dispatch<React.SetStateAction<Patient[]>>;
}

// Patient Details Dialog Component - Moved outside to prevent re-creation on every render
const PatientDetailsDialog = ({ patient }: { patient: Patient }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm">
        <Eye className="w-4 h-4 mr-1" />
        View
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Patient Details: {patient.name}</DialogTitle>
        <DialogDescription>
          Complete patient information and credentials
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Personal Information</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center text-sm">
                <span className="font-medium w-16">Email:</span>
                <span className="text-muted-foreground">{patient.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium w-16">Age:</span>
                <span className="text-muted-foreground">{patient.age} years</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium w-16">Phone:</span>
                <span className="text-muted-foreground">{patient.phone}</span>
              </div>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Login Credentials</Label>
            <div className="mt-2 space-y-2">
              <div className="text-sm">
                <span className="font-medium">Email:</span> {patient.email}
              </div>
              <div className="text-sm">
                <span className="font-medium">Password:</span> 
                <Badge variant="secondary" className="ml-2">••••••••</Badge>
                <span className="text-xs text-muted-foreground ml-2">(Contact admin for password reset)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Address and Medical History */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Address</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {patient.address || 'No address provided'}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Medical History</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {patient.medicalHistory || 'No medical history recorded'}
            </p>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export function PatientManagementEnhanced({ patients: externalPatients, setPatients: externalSetPatients }: PatientManagementProps = {}) {
  const [internalPatients, setInternalPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use external state if provided, otherwise use internal state
  const patients = externalPatients || internalPatients;
  const setPatients = externalSetPatients || setInternalPatients;

  // Load patients from database
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
      const patientsData = await databaseService.patients.getPatients();
      setInternalPatients(patientsData);
    } catch (error) {
      console.error('Failed to load patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
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
    password: '',
    age: '',
    phone: '',
    address: '',
    medicalHistory: ''
  });

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
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
      setEditPatient({...editPatient, password: newPassword});
    } else {
      setNewPatient({...newPatient, password: newPassword});
    }
    toast.success('Password generated successfully');
  };

  const copyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast.success('Password copied to clipboard');
  };

  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) return;

    // Validate form
    if (!editPatient.name || !editPatient.email || !editPatient.age || !editPatient.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Update patient in database
      const updateData: any = {
        name: editPatient.name,
        email: editPatient.email,
        age: parseInt(editPatient.age),
        phone: editPatient.phone,
        address: editPatient.address,
        medicalHistory: editPatient.medicalHistory
      };

      // Only update password if provided
      if (editPatient.password) {
        updateData.password = editPatient.password;
      }

      const updatedPatient = await databaseService.patients.updatePatient(selectedPatient.id, updateData);

      // Update patients list
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatient : p));
      
      setIsEditingPatient(false);
      setSelectedPatient(null);
      toast.success(`Patient ${editPatient.name} updated successfully`);
    } catch (error) {
      console.error('Failed to update patient:', error);
      toast.error('Failed to update patient');
    }
  };

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditPatient({
      name: patient.name,
      email: patient.email,
      password: '', // Don't show existing password
      age: patient.age.toString(),
      phone: patient.phone,
      address: patient.address,
      medicalHistory: patient.medicalHistory
    });
    setIsEditingPatient(true);
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newPatient.name || !newPatient.email || !newPatient.password || !newPatient.age || !newPatient.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if email already exists
    if (patients.some(p => p.email.toLowerCase() === newPatient.email.toLowerCase())) {
      toast.error('Patient with this email already exists');
      return;
    }

    try {
      // Create new patient in database
      const patientData = {
        name: newPatient.name,
        email: newPatient.email,
        password: newPatient.password,
        role: 'patient' as const,
        age: parseInt(newPatient.age),
        phone: newPatient.phone,
        address: newPatient.address,
        medicalHistory: newPatient.medicalHistory
      };

      const createdPatient = await databaseService.users.createUser(patientData);

      // Add to patients list
      setPatients(prev => [...prev, createdPatient as Patient]);
      
      // Reset form
      setNewPatient({
        name: '',
        email: '',
        password: '',
        age: '',
        phone: '',
        address: '',
        medicalHistory: ''
      });
      
      setIsAddingPatient(false);
      toast.success(`Patient ${newPatient.name} added successfully with credentials`);
    } catch (error) {
      console.error('Failed to create patient:', error);
      toast.error('Failed to create patient');
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
          <h2>Patient Management</h2>
          <p className="text-muted-foreground">
            Manage patient accounts and login credentials
          </p>
        </div>
        <Dialog open={isAddingPatient} onOpenChange={setIsAddingPatient}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Create patient account with login credentials
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter full name" 
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
                    placeholder="Age"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                    min="1"
                    max="120"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter patient password"
                    value={newPatient.password}
                    onChange={(e) => setNewPatient({...newPatient, password: e.target.value})}
                    required
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => handleGeneratePassword()}>
                    <Key className="w-4 h-4" />
                  </Button>
                  {newPatient.password && (
                    <Button type="button" variant="outline" size="sm" onClick={() => copyPassword(newPatient.password)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {newPatient.password && (
                  <p className="text-xs text-muted-foreground">Password: {newPatient.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input 
                  id="phone" 
                  placeholder="Enter phone number"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea 
                  id="address" 
                  placeholder="Enter full address"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="history">Medical History</Label>
                <Textarea 
                  id="history" 
                  placeholder="Enter medical history and conditions"
                  value={newPatient.medicalHistory}
                  onChange={(e) => setNewPatient({...newPatient, medicalHistory: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => {
                  setIsAddingPatient(false);
                  setNewPatient({
                    name: '',
                    email: '',
                    password: '',
                    age: '',
                    phone: '',
                    address: '',
                    medicalHistory: ''
                  });
                }}>
                  Cancel
                </Button>
                <Button type="submit">Add Patient</Button>
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
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patients ({filteredPatients.length})</CardTitle>
          <CardDescription>
            View and manage all patient accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden md:table-cell">Age</TableHead>
                  <TableHead className="hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="hidden xl:table-cell">Medical History</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No patients found matching your search.' : 'No patients registered yet.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">{patient.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">{patient.age} years</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {patient.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {patient.medicalHistory || 'No history recorded'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <PatientDetailsDialog patient={patient} />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(patient)}
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

      {/* Edit Patient Dialog */}
      <Dialog open={isEditingPatient} onOpenChange={setIsEditingPatient}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient: {selectedPatient?.name}</DialogTitle>
            <DialogDescription>
              Update patient information and credentials
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditPatient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input 
                  id="edit-name" 
                  placeholder="Enter full name" 
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
                  placeholder="Age"
                  value={editPatient.age}
                  onChange={(e) => setEditPatient({...editPatient, age: e.target.value})}
                  min="1"
                  max="120"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input 
                id="edit-email" 
                type="email" 
                placeholder="Enter email"
                value={editPatient.email}
                onChange={(e) => setEditPatient({...editPatient, email: e.target.value})}
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
                  value={editPatient.password}
                  onChange={(e) => setEditPatient({...editPatient, password: e.target.value})}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => handleGeneratePassword(true)}>
                  <Key className="w-4 h-4" />
                </Button>
                {editPatient.password && (
                  <Button type="button" variant="outline" size="sm" onClick={() => copyPassword(editPatient.password)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {editPatient.password && (
                <p className="text-xs text-muted-foreground">New password: {editPatient.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input 
                id="edit-phone" 
                placeholder="Enter phone number"
                value={editPatient.phone}
                onChange={(e) => setEditPatient({...editPatient, phone: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea 
                id="edit-address" 
                placeholder="Enter full address"
                value={editPatient.address}
                onChange={(e) => setEditPatient({...editPatient, address: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-history">Medical History</Label>
              <Textarea 
                id="edit-history" 
                placeholder="Enter medical history and conditions"
                value={editPatient.medicalHistory}
                onChange={(e) => setEditPatient({...editPatient, medicalHistory: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => {
                setIsEditingPatient(false);
                setSelectedPatient(null);
              }}>
                Cancel
              </Button>
              <Button type="submit">Update Patient</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
