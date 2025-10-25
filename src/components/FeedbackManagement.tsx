import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Star, MessageSquare, Send, ThumbsUp, ThumbsDown, Loader2, Search, Filter } from 'lucide-react';
import { databaseService } from '../utils/database-smart';
import { Feedback } from '../App';
import { toast } from 'sonner';

interface FeedbackManagementProps {
  userRole: 'admin' | 'doctor';
  userName: string;
  userId?: string;
}

export function FeedbackManagement({ userRole, userName, userId }: FeedbackManagementProps) {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isRespondingTo, setIsRespondingTo] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'reviewed' | 'responded'>('all');

  useEffect(() => {
    loadFeedback();
  }, []);

  useEffect(() => {
    filterFeedback();
  }, [feedbackList, searchTerm, statusFilter]);

  const loadFeedback = async () => {
    try {
      setIsLoading(true);
      const allFeedback = await databaseService.feedback.getAllFeedback();
      setFeedbackList(allFeedback);
    } catch (error) {
      console.error('Failed to load feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const filterFeedback = () => {
    let filtered = [...feedbackList];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.therapy_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.feedback.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredFeedback(filtered);
  };

  const handleRespondToFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFeedback || !responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      const updatedFeedback = await databaseService.feedback.respondToFeedback(
        selectedFeedback.id,
        responseText,
        userName
      );

      setFeedbackList(prev => prev.map(f => f.id === updatedFeedback.id ? updatedFeedback : f));
      setSelectedFeedback(null);
      setResponseText('');
      setIsRespondingTo(false);
      toast.success('Response sent successfully!');
    } catch (error) {
      console.error('Failed to respond to feedback:', error);
      toast.error('Failed to send response');
    }
  };

  const openResponseDialog = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResponseText(feedback.admin_response || '');
    setIsRespondingTo(true);
  };

  const getAverageRating = () => {
    if (feedbackList.length === 0) return 0;
    return (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1);
  };

  const getRecommendationRate = () => {
    if (feedbackList.length === 0) return 0;
    const recommendCount = feedbackList.filter(f => f.would_recommend).length;
    return Math.round((recommendCount / feedbackList.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackList.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating()}/10</div>
            <p className="text-xs text-muted-foreground">Overall satisfaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendation Rate</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getRecommendationRate()}%</div>
            <p className="text-xs text-muted-foreground">Would recommend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Responses</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedbackList.filter(f => f.status === 'submitted').length}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Feedback</CardTitle>
          <CardDescription>
            View and respond to patient feedback and reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient, therapy type, or feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'submitted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('submitted')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'responded' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('responded')}
              >
                Responded
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Therapy</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden md:table-cell">Rating</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedback.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'No feedback found matching your criteria.' 
                          : 'No feedback submitted yet.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFeedback.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>
                        <div className="font-medium">{feedback.patient_name}</div>
                        <div className="text-sm text-muted-foreground hidden sm:block">
                          {feedback.would_recommend ? (
                            <span className="text-green-600 flex items-center">
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Recommends
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              Not recommended
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{feedback.therapy_type}</TableCell>
                      <TableCell>{new Date(feedback.date).toLocaleDateString()}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="font-medium">{feedback.rating}/10</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={
                          feedback.status === 'responded' ? 'default' : 
                          feedback.status === 'reviewed' ? 'secondary' : 'outline'
                        }>
                          {feedback.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openResponseDialog(feedback)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {feedback.status === 'responded' ? 'View' : 'Respond'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={isRespondingTo} onOpenChange={setIsRespondingTo}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Feedback</DialogTitle>
            <DialogDescription>
              View feedback details and send a response
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Patient</Label>
                  <p className="text-sm mt-1">{selectedFeedback.patient_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Therapy</Label>
                  <p className="text-sm mt-1">{selectedFeedback.therapy_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm mt-1">{new Date(selectedFeedback.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={
                    selectedFeedback.status === 'responded' ? 'default' : 
                    selectedFeedback.status === 'reviewed' ? 'secondary' : 'outline'
                  } className="mt-1">
                    {selectedFeedback.status}
                  </Badge>
                </div>
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <Label className="text-sm font-medium">Overall</Label>
                  <div className="text-2xl font-bold mt-1">{selectedFeedback.rating}/10</div>
                </div>
                <div className="text-center">
                  <Label className="text-sm font-medium">Effectiveness</Label>
                  <div className="text-2xl font-bold mt-1">{selectedFeedback.effectiveness_rating}/10</div>
                </div>
                <div className="text-center">
                  <Label className="text-sm font-medium">Comfort</Label>
                  <div className="text-2xl font-bold mt-1">{selectedFeedback.comfort_rating}/10</div>
                </div>
              </div>

              {/* Feedback Content */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Overall Experience</Label>
                  <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-lg">
                    {selectedFeedback.feedback}
                  </p>
                </div>

                {selectedFeedback.improvements && (
                  <div>
                    <Label className="text-sm font-medium">Improvements Noticed</Label>
                    <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-lg">
                      {selectedFeedback.improvements}
                    </p>
                  </div>
                )}

                {selectedFeedback.side_effects && selectedFeedback.side_effects !== 'None reported' && (
                  <div>
                    <Label className="text-sm font-medium">Side Effects/Concerns</Label>
                    <p className="text-sm text-muted-foreground mt-1 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      {selectedFeedback.side_effects}
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Would Recommend</Label>
                  <div className="mt-1">
                    {selectedFeedback.would_recommend ? (
                      <Badge variant="secondary" className="text-green-700 bg-green-100">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-red-700 bg-red-100">
                        <ThumbsDown className="w-3 h-3 mr-1" />
                        No
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Response Form */}
              <form onSubmit={handleRespondToFeedback} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="response">
                    {selectedFeedback.status === 'responded' ? 'Your Response' : 'Send Response'}
                  </Label>
                  <Textarea
                    id="response"
                    placeholder="Write your response to the patient..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={4}
                    disabled={selectedFeedback.status === 'responded'}
                    className={selectedFeedback.status === 'responded' ? 'bg-blue-50' : ''}
                  />
                  {selectedFeedback.status === 'responded' && selectedFeedback.admin_response_date && (
                    <p className="text-xs text-muted-foreground">
                      Responded by {selectedFeedback.admin_name} on {new Date(selectedFeedback.admin_response_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => {
                      setIsRespondingTo(false);
                      setSelectedFeedback(null);
                      setResponseText('');
                    }}
                  >
                    Close
                  </Button>
                  {selectedFeedback.status !== 'responded' && (
                    <Button type="submit">
                      <Send className="w-4 h-4 mr-2" />
                      Send Response
                    </Button>
                  )}
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
