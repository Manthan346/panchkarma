import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Calendar, Activity, DollarSign, Clock } from 'lucide-react';
import { mockPatients, mockTherapySessions, mockProgressData } from './mockData';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AdminAnalytics() {
  // Calculate analytics data
  const totalPatients = mockPatients.length;
  const activeTreatments = mockPatients.filter(p => p.currentTherapies.length > 0).length;
  const completedSessions = mockTherapySessions.filter(s => s.status === 'completed').length;
  const averageSatisfaction = mockProgressData.reduce((acc, p) => acc + p.energyLevel, 0) / mockProgressData.length;

  // Monthly session data
  const monthlyData = [
    { month: 'Jan', sessions: 45, patients: 12, revenue: 4500 },
    { month: 'Feb', sessions: 52, patients: 15, revenue: 5200 },
    { month: 'Mar', sessions: 48, patients: 14, revenue: 4800 },
    { month: 'Apr', sessions: 61, patients: 18, revenue: 6100 },
    { month: 'May', sessions: 55, patients: 16, revenue: 5500 },
    { month: 'Jun', sessions: 67, patients: 20, revenue: 6700 },
  ];

  // Therapy type distribution
  const therapyDistribution = [
    { name: 'Abhyanga', value: 35, sessions: 35 },
    { name: 'Swedana', value: 25, sessions: 25 },
    { name: 'Shirodhara', value: 20, sessions: 20 },
    { name: 'Panchakarma', value: 15, sessions: 15 },
    { name: 'Nasya', value: 5, sessions: 5 },
  ];

  // Patient progress trends
  const progressTrends = [
    { week: 'Week 1', symptomScore: 8, energyLevel: 4, sleepQuality: 5 },
    { week: 'Week 2', symptomScore: 7, energyLevel: 5, sleepQuality: 6 },
    { week: 'Week 3', symptomScore: 6, energyLevel: 6, sleepQuality: 6 },
    { week: 'Week 4', symptomScore: 5, energyLevel: 7, sleepQuality: 7 },
    { week: 'Week 5', symptomScore: 4, energyLevel: 8, sleepQuality: 8 },
    { week: 'Week 6', symptomScore: 3, energyLevel: 8, sleepQuality: 8 },
  ];

  // Practitioner performance
  const practitionerData = [
    { name: 'Dr. Sharma', sessions: 28, satisfaction: 9.2, revenue: 2800 },
    { name: 'Dr. Patel', sessions: 25, satisfaction: 8.8, revenue: 2500 },
    { name: 'Dr. Kumar', sessions: 22, satisfaction: 9.0, revenue: 2200 },
    { name: 'Dr. Gupta', sessions: 20, satisfaction: 8.5, revenue: 2000 },
    { name: 'Dr. Singh', sessions: 18, satisfaction: 8.7, revenue: 1800 },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Treatments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTreatments}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSessions}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSatisfaction.toFixed(1)}/10</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.3</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sessions & Revenue</CardTitle>
            <CardDescription>
              Track session volume and revenue trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="sessions"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Therapy Type Distribution</CardTitle>
            <CardDescription>
              Popular therapy types by session count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={therapyDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {therapyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Progress Trends</CardTitle>
            <CardDescription>
              Average improvement metrics across all patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="symptomScore"
                  stroke="#ff7c7c"
                  strokeWidth={2}
                  name="Symptom Score"
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
            <CardTitle>Practitioner Performance</CardTitle>
            <CardDescription>
              Sessions completed and satisfaction ratings by practitioner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={practitionerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="sessions" fill="#8884d8" name="Sessions" />
                <Bar yAxisId="right" dataKey="satisfaction" fill="#82ca9d" name="Satisfaction (x10)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            Key insights and recommendations based on current data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">High Performance</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Patient satisfaction increased by 15%</li>
                <li>• Abhyanga therapy showing best results</li>
                <li>• Dr. Sharma leading in patient outcomes</li>
              </ul>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium">Areas for Improvement</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Increase Nasya therapy adoption</li>
                <li>• Optimize session scheduling efficiency</li>
                <li>• Improve post-treatment follow-up</li>
              </ul>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Recommendations</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Add more Abhyanga time slots</li>
                <li>• Implement automated reminders</li>
                <li>• Expand practitioner training</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}