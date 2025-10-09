import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Bell, Send, Settings, Plus, Mail, MessageSquare, Smartphone, Clock, Loader2 } from 'lucide-react';
import { Notification } from '../App';
import { databaseService } from '../utils/database-smart';
import { toast } from 'sonner@2.0.3';

export function NotificationCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from database
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [notificationsData, patientsData] = await Promise.all([
        // For now, get notifications for the first patient as a demo
        databaseService.notifications.getPatientNotifications('2'),
        databaseService.patients.getPatients()
      ]);
      setNotifications(notificationsData);
      setPatients(patientsData);
    } catch (error) {
      console.error('Failed to load notification data:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };
  const [notificationForm, setNotificationForm] = useState({
    type: 'reminder',
    title: '',
    message: '',
    recipients: 'all',
    urgent: false,
    channels: {
      inApp: true,
      email: false,
      sms: false
    }
  });

  const notificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    urgent: notifications.filter(n => n.urgent).length,
    today: notifications.filter(n => 
      new Date(n.date).toDateString() === new Date().toDateString()
    ).length
  };

  // Handle notification creation
  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notificationForm.title || !notificationForm.message) {
      toast.error('Please fill in title and message');
      return;
    }

    if (!notificationForm.channels.inApp && !notificationForm.channels.email && !notificationForm.channels.sms) {
      toast.error('Please select at least one delivery channel');
      return;
    }

    try {
      // For demo purposes, send to patient with ID '2'
      const notificationData = {
        patient_id: '2',
        type: notificationForm.type,
        title: notificationForm.title,
        message: notificationForm.message,
        date: new Date().toISOString().split('T')[0],
        read: false,
        urgent: notificationForm.urgent
      };

      const newNotification = await databaseService.notifications.createNotification(notificationData);
      setNotifications(prev => [newNotification, ...prev]);
      
      // Reset form
      setNotificationForm({
        type: 'reminder',
        title: '',
        message: '',
        recipients: 'all',
        urgent: false,
        channels: {
          inApp: true,
          email: false,
          sms: false
        }
      });
      
      setIsCreatingNotification(false);
      
      const channels = [];
      if (notificationForm.channels.inApp) channels.push('In-App');
      if (notificationForm.channels.email) channels.push('Email');
      if (notificationForm.channels.sms) channels.push('SMS');
      
      toast.success(`Notification sent via ${channels.join(', ')} to ${notificationForm.recipients === 'all' ? 'all patients' : notificationForm.recipients + ' patients'}`);
    } catch (error) {
      console.error('Failed to create notification:', error);
      toast.error('Failed to send notification');
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await databaseService.notifications.updateNotification(notificationId, { read: true });
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const CreateNotificationDialog = () => (
    <Dialog open={isCreatingNotification} onOpenChange={setIsCreatingNotification}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Notification</DialogTitle>
          <DialogDescription>
            Send notifications to patients about appointments, reminders, or updates
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateNotification} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Notification Type</Label>
            <Select 
              value={notificationForm.type} 
              onValueChange={(value) => setNotificationForm({...notificationForm, type: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre-procedure">Pre-Procedure</SelectItem>
                <SelectItem value="post-procedure">Post-Procedure</SelectItem>
                <SelectItem value="appointment">Appointment</SelectItem>
                <SelectItem value="reminder">General Reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter notification title"
              value={notificationForm.title}
              onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Enter notification message"
              value={notificationForm.message}
              onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipients">Recipients</Label>
            <Select 
              value={notificationForm.recipients} 
              onValueChange={(value) => setNotificationForm({...notificationForm, recipients: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                <SelectItem value="active">Active Patients Only</SelectItem>
                <SelectItem value="specific">Specific Patient</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Delivery Channels *</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">In-App Notification</span>
                </div>
                <Switch
                  checked={notificationForm.channels.inApp}
                  onCheckedChange={(checked) => 
                    setNotificationForm({
                      ...notificationForm, 
                      channels: {...notificationForm.channels, inApp: checked}
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Email</span>
                </div>
                <Switch
                  checked={notificationForm.channels.email}
                  onCheckedChange={(checked) => 
                    setNotificationForm({
                      ...notificationForm, 
                      channels: {...notificationForm.channels, email: checked}
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">SMS</span>
                </div>
                <Switch
                  checked={notificationForm.channels.sms}
                  onCheckedChange={(checked) => 
                    setNotificationForm({
                      ...notificationForm, 
                      channels: {...notificationForm.channels, sms: checked}
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={notificationForm.urgent}
              onCheckedChange={(checked) => setNotificationForm({...notificationForm, urgent: checked})}
            />
            <Label htmlFor="urgent">Mark as Urgent</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => {
              setIsCreatingNotification(false);
              setNotificationForm({
                type: 'reminder',
                title: '',
                message: '',
                recipients: 'all',
                urgent: false,
                channels: {
                  inApp: true,
                  email: false,
                  sms: false
                }
              });
            }}>
              Cancel
            </Button>
            <Button type="submit">
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationStats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationStats.unread}</div>
            <p className="text-xs text-muted-foreground">Pending attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationStats.urgent}</div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationStats.today}</div>
            <p className="text-xs text-muted-foreground">Sent today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Notification Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Notification Management</CardTitle>
              <CardDescription>
                Manage patient notifications and automated alerts
              </CardDescription>
            </div>
            <CreateNotificationDialog />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Recent Notifications */}
            <div>
              <h3 className="font-medium mb-4">Recent Notifications</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {notification.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {notification.message}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">All patients</span>
                        </TableCell>
                        <TableCell>
                          {new Date(notification.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {notification.urgent && (
                              <Badge variant="destructive" className="text-xs">
                                Urgent
                              </Badge>
                            )}
                            <Badge variant={notification.read ? 'default' : 'secondary'}>
                              {notification.read ? 'Read' : 'Unread'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {!notification.read && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Mark Read
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toast.success('Notification resent successfully')}
                            >
                              Resend
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automated Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Notification Settings</CardTitle>
          <CardDescription>
            Configure automatic notifications for different therapy stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Pre-Procedure Notifications</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">24 hours before</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">2 hours before</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">30 minutes before</span>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Post-Procedure Notifications</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Immediately after</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">2 hours after</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Next day follow-up</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Progress Tracking Reminders</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Daily progress update</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weekly assessment</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly review</span>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">General Reminders</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Medication reminders</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Lifestyle guidelines</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Seasonal wellness tips</span>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-sm font-medium">Notification Templates</Label>
                  <p className="text-xs text-muted-foreground">
                    Manage pre-defined message templates for different notification types
                  </p>
                </div>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Templates
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => toast.success('Notification settings saved successfully!')}>
                Save Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}