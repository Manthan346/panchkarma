import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Search, Eye, Edit, Phone, Mail, MapPin } from 'lucide-react';
import { mockPatients } from './mockData';

export function PatientManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isAddingPatient, setIsAddingPatient] = useState(false);

  const filteredPatients = mockPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PatientDetailsDialog = ({ patient }) => (
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
                  <Badge variant="secondary">{patient.currentTherapies.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progress Entries:</span>
                  <Badge variant="outline">{patient.progressData.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notifications:</span>
                  <Badge variant="destructive">{patient.notifications.filter(n => !n.read).length} unread</Badge>
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

          {/* Current Therapies */}
          <div>
            <Label className="text-sm font-medium">Current Therapies</Label>
            <div className="mt-2 space-y-2">
              {patient.currentTherapies.length > 0 ? (
                patient.currentTherapies.map((therapy) => (
                  <div key={therapy.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium text-sm">{therapy.therapyType}</p>
                      <p className="text-xs text-muted-foreground">
                        {therapy.date} at {therapy.time} with {therapy.practitioner}
                      </p>
                    </div>
                    <Badge variant={therapy.status === 'completed' ? 'default' : 'secondary'}>
                      {therapy.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No active therapies</p>
              )}
            </div>
          </div>
        </div>
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
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Enter full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" placeholder="Age" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" placeholder="Enter phone number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" placeholder="Enter full address" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="history">Medical History</Label>
            <Textarea id="history" placeholder="Enter medical history and conditions" />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => setIsAddingPatient(false)}>
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
                {filteredPatients.map((patient) => (
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
                        {patient.currentTherapies.length} active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.currentTherapies.length > 0 ? 'default' : 'outline'}>
                        {patient.currentTherapies.length > 0 ? 'In Treatment' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <PatientDetailsDialog patient={patient} />
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPatients.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No patients found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}