import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Star, MessageSquare, Plus, Send, AlertTriangle, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { databaseService } from '../utils/database-smart';
import { TherapySession, Feedback } from '../App';
import { toast } from 'sonner';

interface PatientFeedbackProps {
  userId: string;
  userName: string;
}

export function PatientFeedback({ userId, userName }: PatientFeedbackProps) {
  const [feedbackEntries, setFeedbackEntries] = useState<Feedback[]>([]);
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    sessionId: '',
    rating: 5,
    effectivenessRating: 5,
    comfortRating: 5,
    feedback: '',
    sideEffects: '',
    improvements: '',
    wouldRecommend: true
  });

  // Load data from database
  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const sessionsData = await databaseService.therapySessions.getPatientTherapySessions(userId);
      setSessions(sessionsData);
      
      const feedbackData = await databaseService.feedback.getPatientFeedback(userId);
      setFeedbackEntries(feedbackData);
    } catch (error) {
      console.error('Failed to load feedback data:', error);
      toast.error('Failed to load feedback data');
    } finally {
      setIsLoading(false);
    }
  };

  // Get completed sessions that need feedback
  const completedSessions = sessions.filter(
    session => session.patient_id === userId && session.status === 'completed'
  );

  const sessionsNeedingFeedback = completedSessions.filter(
    session => !feedbackEntries.some(feedback => feedback.session_id === session.id)
  );

  // Handle feedback submission
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackForm.sessionId || !feedbackForm.feedback) {
      toast.error('Please select a session and provide feedback');
      return;
    }

    try {
      const session = sessions.find(s => s.id === feedbackForm.sessionId);
      
      const newFeedback = await databaseService.feedback.createFeedback({
        patient_id: userId,
        session_id: feedbackForm.sessionId,
        patient_name: userName,
        therapy_type: session?.therapy_type || '',
        date: new Date().toISOString().split('T')[0],
        rating: feedbackForm.rating,
        effectiveness_rating: feedbackForm.effectivenessRating,
        comfort_rating: feedbackForm.comfortRating,
        feedback: feedbackForm.feedback,
        side_effects: feedbackForm.sideEffects || 'None reported',
        improvements: feedbackForm.improvements,
        would_recommend: feedbackForm.wouldRecommend
      });

      setFeedbackEntries(prev => [...prev, newFeedback]);
      
      // Reset form
      setFeedbackForm({
        sessionId: '',
        rating: 5,
        effectivenessRating: 5,
        comfortRating: 5,
        feedback: '',
        sideEffects: '',
        improvements: '',
        wouldRecommend: true
      });
      
      setIsSubmittingFeedback(false);
      toast.success('Feedback submitted successfully! Thank you for sharing your experience.');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading feedback data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Submitted</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackEntries.length}</div>
            <p className="text-xs text-muted-foreground">
              Total sessions reviewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedbackEntries.length > 0 
                ? (feedbackEntries.reduce((acc, f) => acc + f.rating, 0) / feedbackEntries.length).toFixed(1)
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionsNeedingFeedback.length}</div>
            <p className="text-xs text-muted-foreground">
              Sessions awaiting feedback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Feedback */}
      {sessionsNeedingFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Pending Feedback</CardTitle>
                <CardDescription>
                  Share your experience with completed therapy sessions
                </CardDescription>
              </div>
              <Dialog open={isSubmittingFeedback} onOpenChange={setIsSubmittingFeedback}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Session Feedback</DialogTitle>
                    <DialogDescription>
                      Help us improve by sharing your therapy experience
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitFeedback} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="session">Select Session *</Label>
                      <Select 
                        value={feedbackForm.sessionId} 
                        onValueChange={(value) => setFeedbackForm({...feedbackForm, sessionId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a completed session" />
                        </SelectTrigger>
                        <SelectContent>
                          {sessionsNeedingFeedback.filter(s => s.id && s.id.trim() !== '').map(session => (
                            <SelectItem key={session.id} value={session.id}>
                              {session.therapy_type} - {new Date(session.date).toLocaleDateString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Overall Satisfaction: {feedbackForm.rating}/10
                        </Label>
                        <div className="grid grid-cols-10 gap-2 mt-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <button
                              key={num}
                              type="button"
                              className={`h-10 rounded-md border-2 transition-all ${
                                num <= feedbackForm.rating
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'border-muted hover:border-primary/50'
                              }`}
                              onClick={() => setFeedbackForm({...feedbackForm, rating: num})}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Treatment Effectiveness: {feedbackForm.effectivenessRating}/10
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          How effective was the treatment for your condition?
                        </p>
                        <div className="grid grid-cols-10 gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <button
                              key={num}
                              type="button"
                              className={`h-10 rounded-md border-2 transition-all ${
                                num <= feedbackForm.effectivenessRating
                                  ? 'bg-green-600 text-white border-green-600'
                                  : 'border-muted hover:border-green-600/50'
                              }`}
                              onClick={() => setFeedbackForm({...feedbackForm, effectivenessRating: num})}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Comfort Level: {feedbackForm.comfortRating}/10
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          How comfortable were you during the treatment?
                        </p>
                        <div className="grid grid-cols-10 gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <button
                              key={num}
                              type="button"
                              className={`h-10 rounded-md border-2 transition-all ${
                                num <= feedbackForm.comfortRating
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-muted hover:border-blue-600/50'
                              }`}
                              onClick={() => setFeedbackForm({...feedbackForm, comfortRating: num})}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feedback">Overall Experience *</Label>
                      <Textarea
                        id="feedback"
                        placeholder="Please describe your overall experience with this treatment session..."
                        value={feedbackForm.feedback}
                        onChange={(e) => setFeedbackForm({...feedbackForm, feedback: e.target.value})}
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="improvements">Improvements Noticed</Label>
                      <Textarea
                        id="improvements"
                        placeholder="What improvements have you noticed since the treatment?"
                        value={feedbackForm.improvements}
                        onChange={(e) => setFeedbackForm({...feedbackForm, improvements: e.target.value})}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sideEffects">Side Effects or Concerns</Label>
                      <Textarea
                        id="sideEffects"
                        placeholder="Did you experience any side effects or have concerns? (Optional)"
                        value={feedbackForm.sideEffects}
                        onChange={(e) => setFeedbackForm({...feedbackForm, sideEffects: e.target.value})}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Would you recommend this treatment to others?</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className={`flex items-center space-x-2 cursor-pointer p-3 rounded-lg border-2 transition-all ${
                            feedbackForm.wouldRecommend ? 'bg-green-50 border-green-500' : 'border-muted hover:border-green-500/50'
                          }`}
                          onClick={() => setFeedbackForm({...feedbackForm, wouldRecommend: true})}
                        >
                          <ThumbsUp className="w-5 h-5 text-green-600" />
                          <span className="text-sm">Yes, I would recommend</span>
                        </div>
                        <div
                          className={`flex items-center space-x-2 cursor-pointer p-3 rounded-lg border-2 transition-all ${
                            !feedbackForm.wouldRecommend ? 'bg-red-50 border-red-500' : 'border-muted hover:border-red-500/50'
                          }`}
                          onClick={() => setFeedbackForm({...feedbackForm, wouldRecommend: false})}
                        >
                          <ThumbsDown className="w-5 h-5 text-red-600" />
                          <span className="text-sm">No, I would not recommend</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" type="button" onClick={() => {
                        setIsSubmittingFeedback(false);
                        setFeedbackForm({
                          sessionId: '',
                          rating: 5,
                          effectivenessRating: 5,
                          comfortRating: 5,
                          feedback: '',
                          sideEffects: '',
                          improvements: '',
                          wouldRecommend: true
                        });
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Send className="w-4 h-4 mr-2" />
                        Submit Feedback
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionsNeedingFeedback.map((session) => (
                <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg bg-yellow-50 gap-3">
                  <div>
                    <p className="font-medium">{session.therapy_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.date).toLocaleDateString()} with {session.practitioner}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    setFeedbackForm({...feedbackForm, sessionId: session.id});
                    setIsSubmittingFeedback(true);
                  }}>
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Give Feedback
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submitted Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Your Feedback History</CardTitle>
          <CardDescription>
            Previously submitted reviews and responses from practitioners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {feedbackEntries.length > 0 ? (
              feedbackEntries.map((feedback) => {
                const session = sessions.find(s => s.id === feedback.session_id);
                return (
                  <div key={feedback.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{feedback.therapy_type}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(feedback.date).toLocaleDateString()} 
                          {session && ` with ${session.practitioner}`}
                        </p>
                      </div>
                      <Badge variant={
                        feedback.status === 'responded' ? 'default' : 
                        feedback.status === 'reviewed' ? 'secondary' : 'outline'
                      }>
                        {feedback.status}
                      </Badge>
                    </div>

                    {/* Ratings */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Overall Rating</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1 font-medium">{feedback.rating}/10</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Effectiveness</Label>
                        <p className="font-medium mt-1">{feedback.effectiveness_rating}/10</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Comfort</Label>
                        <p className="font-medium mt-1">{feedback.comfort_rating}/10</p>
                      </div>
                    </div>

                    {/* Feedback Content */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Your Experience</Label>
                        <p className="text-sm text-muted-foreground mt-1">{feedback.feedback}</p>
                      </div>
                      
                      {feedback.improvements && (
                        <div>
                          <Label className="text-sm font-medium">Improvements Noticed</Label>
                          <p className="text-sm text-muted-foreground mt-1">{feedback.improvements}</p>
                        </div>
                      )}
                      
                      {feedback.side_effects && feedback.side_effects !== 'None reported' && (
                        <div>
                          <Label className="text-sm font-medium">Side Effects/Concerns</Label>
                          <p className="text-sm text-muted-foreground mt-1">{feedback.side_effects}</p>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Label className="text-sm font-medium">Would Recommend:</Label>
                        {feedback.would_recommend ? (
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

                    {/* Practitioner Response */}
                    {feedback.status === 'responded' && feedback.admin_response && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800">
                              Response from {feedback.admin_name}
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              {feedback.admin_response}
                            </p>
                            {feedback.admin_response_date && (
                              <p className="text-xs text-blue-600 mt-1">
                                {new Date(feedback.admin_response_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No feedback submitted yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete a therapy session to share your experience
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Guidelines</CardTitle>
          <CardDescription>
            How to provide helpful and constructive feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">What to Include</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Specific improvements you noticed</li>
                <li>• How you felt during and after treatment</li>
                <li>• Any side effects or discomfort</li>
                <li>• Practitioner's communication and care</li>
                <li>• Overall satisfaction with results</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Tips for Helpful Feedback</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Be honest and specific</li>
                <li>• Include both positive and areas for improvement</li>
                <li>• Mention timing of when effects were noticed</li>
                <li>• Compare to your baseline symptoms</li>
                <li>• Share what worked best for you</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
