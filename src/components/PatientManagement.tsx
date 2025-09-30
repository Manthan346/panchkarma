import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Search, Eye, Edit, Phone, Mail, MapPin, Loader2 } from 'lucide-react';
import { Patient } from '../App';
import { databaseService } from '../utils/database';
import { toast } from 'sonner@2.0.3';

interface PatientManagementProps {
  patients?: Patient[];
  setPatients?: React.Dispatch<React.SetStateAction<Patient[]>>;
}

export function PatientManagement({ patients: externalPatients, setPatients: externalSetPatients }: PatientManagementProps = {}) {
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
      // If external patients are provided, don't show loading
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

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle editing patient
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
      const updateData = {
        name: editPatient.name,
        email: editPatient.email,
        age: parseInt(editPatient.age),
        phone: editPatient.phone,
        address: editPatient.address,
        medicalHistory: editPatient.medicalHistory
      };

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
      age: patient.age.toString(),
      phone: patient.phone,
      address: patient.address,
      medicalHistory: patient.medicalHistory
    });
    setIsEditingPatient(true);
  };

  // Handle adding new patient
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newPatient.name || !newPatient.email || !newPatient.age || !newPatient.phone) {
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
        password: 'temp123', // Default password
        age: parseInt(newPatient.age),
        phone: newPatient.phone,
        address: newPatient.address,
        medicalHistory: newPatient.medicalHistory
      };

      const createdPatient = await databaseService.patients.createPatient(patientData);

      // Add to patients list
      setPatients(prev => [...prev, createdPatient]);
      
      // Reset form
      setNewPatient({
        name: '',
        email: '',
        age: '',
        phone: '',
        address: '',
        medicalHistory: ''
      });
      
      setIsAddingPatient(false);
      toast.success(`Patient ${newPatient.name} added successfully`);
    } catch (error) {
      console.error('Failed to create patient:', error);
      toast.error('Failed to create patient');
    }
  };

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
            Complete patient information and treatment history
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Personal Information</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  {patient.email}
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                  {patient.phone}
                </div>
                <div className="flex items-start text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground mt-0.5" />
                  {patient.address}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Age:</span> {patient.age} years
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Treatment Status</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Therapies:</span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progress Entries:</span>
                  <Badge variant="outline">0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status:</span>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div>
            <Label className="text-sm font-medium">Medical History</Label>
            <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
              {patient.medicalHistory}
            </div>
          </div>

          {/* Patient Status */}
          <div>
            <Label className="text-sm font-medium">Treatment Status</Label>
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Patient registered and available for therapy scheduling.
                Use the Scheduling tab to assign treatments.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const EditPatientDialog = () => (
    <Dialog open={isEditingPatient} onOpenChange={setIsEditingPatient}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Patient</DialogTitle>
          <DialogDescription>
            Update patient information
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
  );

  const AddPatientDialog = () => (
    <Dialog open={isAddingPatient} onOpenChange={setIsAddingPatient}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Enter patient information to create a new account
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
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Patient Management</CardTitle>
              <CardDescription>
                Manage patient records, view treatment history, and add new patients
              </CardDescription>
            </div>
            <AddPatientDialog />
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search patients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Patients Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Active Therapies</TableHead>
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
                        <span>Loading patients...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No patients found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {patient.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{patient.email}</p>
                        <p className="text-sm text-muted-foreground">{patient.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        0 active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
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
      <EditPatientDialog />
    </div>
  );
}