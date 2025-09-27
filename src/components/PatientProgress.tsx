import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Plus, TrendingUp, Activity, Heart, Moon, Smile } from 'lucide-react';
import { mockProgressData } from './mockData';

interface PatientProgressProps {
  userId: string;
}

export function PatientProgress({ userId }: PatientProgressProps) {
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const [progressForm, setProgressForm] = useState({
    symptomScore: [5],
    energyLevel: [5],
    sleepQuality: [5],
    notes: '',
    feedback: ''
  });

  // Calculate trends
  const latestProgress = mockProgressData[mockProgressData.length - 1];
  const previousProgress = mockProgressData[mockProgressData.length - 2];
  
  const trends = {
    symptom: latestProgress && previousProgress ? 
      ((previousProgress.symptomScore - latestProgress.symptomScore) > 0 ? 'improving' : 'declining') : 'stable',
    energy: latestProgress && previousProgress ? 
      ((latestProgress.energyLevel - previousProgress.energyLevel) > 0 ? 'improving' : 'declining') : 'stable',
    sleep: latestProgress && previousProgress ? 
      ((latestProgress.sleepQuality - previousProgress.sleepQuality) > 0 ? 'improving' : 'declining') : 'stable'
  };

  const AddProgressDialog = () => (
    <Dialog open={isAddingProgress} onOpenChange={setIsAddingProgress}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Progress Update
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Daily Progress Update</DialogTitle>
          <DialogDescription>
            Track your daily wellness metrics and provide feedback
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                Symptom Level: {progressForm.symptomScore[0]}/10
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                How would you rate your symptoms today? (1 = severe, 10 = none)
              </p>
              <Slider
                value={progressForm.symptomScore}
                onValueChange={(value) => setProgressForm({...progressForm, symptomScore: value})}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">
                Energy Level: {progressForm.energyLevel[0]}/10
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                How energetic do you feel today?
              </p>
              <Slider
                value={progressForm.energyLevel}
                onValueChange={(value) => setProgressForm({...progressForm, energyLevel: value})}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">
                Sleep Quality: {progressForm.sleepQuality[0]}/10
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                How well did you sleep last night?
              </p>
              <Slider
                value={progressForm.sleepQuality}
                onValueChange={(value) => setProgressForm({...progressForm, sleepQuality: value})}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Daily Notes</Label>
            <Textarea
              id="notes"
              placeholder="How are you feeling today? Any observations about your health..."
              value={progressForm.notes}
              onChange={(e) => setProgressForm({...progressForm, notes: e.target.value})}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Treatment Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="How are the treatments helping? Any side effects or improvements..."
              value={progressForm.feedback}
              onChange={(e) => setProgressForm({...progressForm, feedback: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => setIsAddingProgress(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Progress</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Symptom Level</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestProgress ? latestProgress.symptomScore : 'N/A'}/10
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className={`w-3 h-3 mr-1 ${
                trends.symptom === 'improving' ? 'text-green-600' : 
                trends.symptom === 'declining' ? 'text-red-600' : 'text-gray-400'
              }`} />
              {trends.symptom === 'improving' ? 'Improving' : 
               trends.symptom === 'declining' ? 'Needs attention' : 'Stable'}
            </div>
            <Progress 
              value={latestProgress ? (10 - latestProgress.symptomScore) * 10 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Level</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestProgress ? latestProgress.energyLevel : 'N/A'}/10
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className={`w-3 h-3 mr-1 ${
                trends.energy === 'improving' ? 'text-green-600' : 
                trends.energy === 'declining' ? 'text-red-600' : 'text-gray-400'
              }`} />
              {trends.energy === 'improving' ? 'Increasing' : 
               trends.energy === 'declining' ? 'Decreasing' : 'Stable'}
            </div>
            <Progress 
              value={latestProgress ? latestProgress.energyLevel * 10 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep Quality</CardTitle>
            <Moon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestProgress ? latestProgress.sleepQuality : 'N/A'}/10
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className={`w-3 h-3 mr-1 ${
                trends.sleep === 'improving' ? 'text-green-600' : 
                trends.sleep === 'declining' ? 'text-red-600' : 'text-gray-400'
              }`} />
              {trends.sleep === 'improving' ? 'Improving' : 
               trends.sleep === 'declining' ? 'Declining' : 'Stable'}
            </div>
            <Progress 
              value={latestProgress ? latestProgress.sleepQuality * 10 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Progress Trends</CardTitle>
                <CardDescription>
                  Track your wellness metrics over time
                </CardDescription>
              </div>
              <AddProgressDialog />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="symptomScore"
                  stroke="#ff7c7c"
                  strokeWidth={2}
                  name="Symptom Level"
                />
                <Line
                  type="monotone"
                  dataKey="energyLevel"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Energy Level"
                />
                <Line
                  type="monotone"
                  dataKey="sleepQuality"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Sleep Quality"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wellness Overview</CardTitle>
            <CardDescription>
              Combined wellness score and treatment milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="energyLevel"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="sleepQuality"
                  stackId="2"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Progress Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Progress Entries</CardTitle>
          <CardDescription>
            Your latest wellness updates and feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockProgressData.slice().reverse().map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{new Date(entry.date).toLocaleDateString()}</p>
                    <div className="flex space-x-4 mt-2">
                      <div class="flex items-center space-x-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Symptoms: {entry.symptomScore}/10</span>
                      </div>
                      <div class="flex items-center space-x-1">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Energy: {entry.energyLevel}/10</span>
                      </div>
                      <div class="flex items-center space-x-1">
                        <Moon className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Sleep: {entry.sleepQuality}/10</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    <Smile className="w-3 h-3 mr-1" />
                    Day {mockProgressData.indexOf(entry) + 1}
                  </Badge>
                </div>
                
                {entry.notes && (
                  <div>
                    <Label className="text-sm font-medium">Daily Notes:</Label>
                    <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                  </div>
                )}
                
                {entry.feedback && (
                  <div>
                    <Label className="text-sm font-medium">Treatment Feedback:</Label>
                    <p className="text-sm text-muted-foreground mt-1">{entry.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Milestones and Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment Milestones</CardTitle>
          <CardDescription>
            Track your progress towards wellness goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Symptom Reduction</p>
                <p className="text-sm text-muted-foreground">Target: Reduce symptoms to 3/10</p>
              </div>
              <div className="text-right">
                <Badge variant={latestProgress?.symptomScore <= 3 ? 'default' : 'secondary'}>
                  {latestProgress?.symptomScore <= 3 ? 'Achieved' : 'In Progress'}
                </Badge>
                <Progress 
                  value={latestProgress ? Math.max(0, (10 - latestProgress.symptomScore) / 7 * 100) : 0} 
                  className="w-20 mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Energy Improvement</p>
                <p className="text-sm text-muted-foreground">Target: Maintain energy above 7/10</p>
              </div>
              <div className="text-right">
                <Badge variant={latestProgress?.energyLevel >= 7 ? 'default' : 'secondary'}>
                  {latestProgress?.energyLevel >= 7 ? 'Achieved' : 'In Progress'}
                </Badge>
                <Progress 
                  value={latestProgress ? Math.min(100, latestProgress.energyLevel / 7 * 100) : 0} 
                  className="w-20 mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Sleep Quality</p>
                <p className="text-sm text-muted-foreground">Target: Achieve quality sleep (8/10)</p>
              </div>
              <div className="text-right">
                <Badge variant={latestProgress?.sleepQuality >= 8 ? 'default' : 'secondary'}>
                  {latestProgress?.sleepQuality >= 8 ? 'Achieved' : 'In Progress'}
                </Badge>
                <Progress 
                  value={latestProgress ? Math.min(100, latestProgress.sleepQuality / 8 * 100) : 0} 
                  className="w-20 mt-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}