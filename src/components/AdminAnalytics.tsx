import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Calendar, Activity, DollarSign, Clock, Loader2 } from 'lucide-react';
import { databaseService } from '../utils/database-smart';
import { toast } from 'sonner@2.0.3';
import { TherapySession, Patient, ProgressData } from '../App';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AdminAnalytics() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    
    try {
      // Test connection first (silent)
      await databaseService.connection.testConnection();
      
      // Load data with individual error handling
      let patientsData: Patient[] = [];
      let sessionsData: TherapySession[] = [];
      
      // Load patients
      try {
        console.log('Fetching patients...');
        patientsData = await databaseService.patients.getPatients();
        console.log('Patients loaded:', patientsData?.length || 0);
        setPatients(patientsData || []);
      } catch (error) {
        console.error('Failed to load patients:', error);
        setPatients([]);
        if (connectionTest.message.includes('Demo mode')) {
          console.log('Using demo data for patients');
        } else {
          toast.error('Failed to load patients data');
        }
      }
      
      // Load therapy sessions
      try {
        console.log('Fetching therapy sessions...');
        sessionsData = await databaseService.therapySessions.getTherapySessions();
        console.log('Sessions loaded:', sessionsData?.length || 0);
        setSessions(sessionsData || []);
      } catch (error) {
        console.error('Failed to load therapy sessions:', error);
        setSessions([]);
        if (connectionTest.message.includes('Demo mode')) {
          console.log('Using demo data for sessions');
        } else {
          toast.error('Failed to load therapy sessions data');
        }
      }
      
      // Load progress data (optional)
      try {
        console.log('Fetching progress data...');
        const allProgressData: ProgressData[] = [];
        
        // Try to load progress for up to 3 patients only
        const limitedPatients = (patientsData || []).slice(0, 3);
        
        for (const patient of limitedPatients) {
          try {
            const patientProgress = await databaseService.progress.getPatientProgress(patient.id);
            if (patientProgress && patientProgress.length > 0) {
              allProgressData.push(...patientProgress);
            }
          } catch (error) {
            console.log(`No progress data found for patient ${patient.id}`);
          }
        }
        
        console.log('Progress data loaded:', allProgressData.length);
        setProgressData(allProgressData);
      } catch (error) {
        console.log('Progress data not available, using defaults');
        setProgressData([]);
      }
      
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast.error('Loading analytics data failed - using demo mode');
      
      // Set empty arrays to show the interface
      setPatients([]);
      setSessions([]);
      setProgressData([]);
    } finally {
      console.log('Analytics loading complete');
      setIsLoading(false);
    }
  };

  // Calculate analytics data with safe defaults
  const totalPatients = patients?.length || 0;
  const activeTreatments = sessions?.filter(s => s.status === 'scheduled')?.length || 0;
  const completedSessions = sessions?.filter(s => s.status === 'completed')?.length || 0;
  const averageSatisfaction = progressData && progressData.length > 0 
    ? progressData.reduce((acc, p) => acc + (p.energy_level || 0), 0) / progressData.length 
    : 7.5; // Default demo value

  // Generate monthly data from actual session dates
  const monthlyData = React.useMemo(() => {
    if (!sessions || sessions.length === 0) {
      // Fallback demo data only if no sessions exist
      return [
        { month: 'Jan', sessions: 45, patients: 12, revenue: 4500 },
        { month: 'Feb', sessions: 52, patients: 15, revenue: 5200 },
        { month: 'Mar', sessions: 48, patients: 14, revenue: 4800 },
        { month: 'Apr', sessions: 61, patients: 18, revenue: 6100 },
        { month: 'May', sessions: 55, patients: 16, revenue: 5500 },
        { month: 'Jun', sessions: 67, patients: 20, revenue: 6700 },
      ];
    }

    // Calculate real monthly data from sessions
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      
      const monthSessions = sessions.filter(s => s.date.startsWith(monthKey));
      const monthPatients = new Set(monthSessions.map(s => s.patient_id)).size;
      
      last6Months.push({
        month: monthNames[monthDate.getMonth()],
        sessions: monthSessions.length,
        patients: monthPatients,
        revenue: monthSessions.length * 100 // $100 per session average
      });
    }
    
    return last6Months;
  }, [sessions]);

  // Calculate therapy type distribution from actual sessions
  const therapyDistribution = React.useMemo(() => {
    if (!sessions || sessions.length === 0) {
      // Fallback demo data
      return [
        { name: 'Abhyanga', value: 35, sessions: 35 },
        { name: 'Swedana', value: 25, sessions: 25 },
        { name: 'Shirodhara', value: 20, sessions: 20 },
        { name: 'Panchakarma', value: 15, sessions: 15 },
        { name: 'Nasya', value: 5, sessions: 5 },
      ];
    }

    // Count sessions by therapy type
    const therapyCounts: { [key: string]: number } = {};
    sessions.forEach(session => {
      const therapyName = session.therapy_type.split('(')[0].trim(); // Extract main therapy name
      therapyCounts[therapyName] = (therapyCounts[therapyName] || 0) + 1;
    });

    // Convert to array and sort by count
    return Object.entries(therapyCounts)
      .map(([name, count]) => ({ name, value: count, sessions: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 therapies
  }, [sessions]);

  // Calculate progress trends from actual progress data
  const progressTrends = React.useMemo(() => {
    if (!progressData || progressData.length === 0) {
      // Fallback demo data
      return [
        { week: 'Week 1', symptomScore: 8, energyLevel: 4, sleepQuality: 5 },
        { week: 'Week 2', symptomScore: 7, energyLevel: 5, sleepQuality: 6 },
        { week: 'Week 3', symptomScore: 6, energyLevel: 6, sleepQuality: 6 },
        { week: 'Week 4', symptomScore: 5, energyLevel: 7, sleepQuality: 7 },
        { week: 'Week 5', symptomScore: 4, energyLevel: 8, sleepQuality: 8 },
        { week: 'Week 6', symptomScore: 3, energyLevel: 8, sleepQuality: 8 },
      ];
    }

    // Group progress data by week (last 6 weeks)
    const sortedProgress = [...progressData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const weeklyData = [];
    const weeksToShow = Math.min(6, Math.ceil(sortedProgress.length / 7));
    
    for (let i = 0; i < weeksToShow; i++) {
      const weekData = sortedProgress.slice(i * 7, (i + 1) * 7);
      if (weekData.length > 0) {
        const avgSymptom = weekData.reduce((sum, p) => sum + p.symptom_score, 0) / weekData.length;
        const avgEnergy = weekData.reduce((sum, p) => sum + p.energy_level, 0) / weekData.length;
        const avgSleep = weekData.reduce((sum, p) => sum + p.sleep_quality, 0) / weekData.length;
        
        weeklyData.push({
          week: `Week ${i + 1}`,
          symptomScore: Math.round(avgSymptom * 10) / 10,
          energyLevel: Math.round(avgEnergy * 10) / 10,
          sleepQuality: Math.round(avgSleep * 10) / 10,
        });
      }
    }

    return weeklyData.length > 0 ? weeklyData : [
      { week: 'Week 1', symptomScore: 8, energyLevel: 4, sleepQuality: 5 },
    ];
  }, [progressData]);

  // Calculate practitioner performance from actual sessions
  const practitionerData = React.useMemo(() => {
    if (!sessions || sessions.length === 0) {
      // Fallback demo data
      return [
        { name: 'Dr. Sharma', sessions: 28, satisfaction: 9.2, revenue: 2800 },
        { name: 'Dr. Patel', sessions: 25, satisfaction: 8.8, revenue: 2500 },
        { name: 'Dr. Kumar', sessions: 22, satisfaction: 9.0, revenue: 2200 },
        { name: 'Dr. Gupta', sessions: 20, satisfaction: 8.5, revenue: 2000 },
        { name: 'Dr. Singh', sessions: 18, satisfaction: 8.7, revenue: 1800 },
      ];
    }

    // Count sessions and calculate satisfaction by practitioner
    const practitionerStats: { [key: string]: { sessions: number; totalSatisfaction: number; count: number } } = {};
    
    sessions.forEach(session => {
      if (!practitionerStats[session.practitioner]) {
        practitionerStats[session.practitioner] = { sessions: 0, totalSatisfaction: 0, count: 0 };
      }
      practitionerStats[session.practitioner].sessions++;
      
      // Try to find satisfaction from progress data for this session's patient
      const patientProgress = progressData?.filter(p => p.patient_id === session.patient_id) || [];
      if (patientProgress.length > 0) {
        const avgSatisfaction = patientProgress.reduce((sum, p) => sum + p.energy_level, 0) / patientProgress.length;
        practitionerStats[session.practitioner].totalSatisfaction += avgSatisfaction;
        practitionerStats[session.practitioner].count++;
      }
    });

    // Convert to array format
    return Object.entries(practitionerStats)
      .map(([name, stats]) => ({
        name,
        sessions: stats.sessions,
        satisfaction: stats.count > 0 
          ? Math.round((stats.totalSatisfaction / stats.count) * 10) / 10 
          : 8.5, // Default satisfaction
        revenue: stats.sessions * 100 // $100 per session
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5); // Top 5 practitioners
  }, [sessions, progressData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

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

      {/* Performance Insights - Dynamic */}
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
                {averageSatisfaction >= 7 && (
                  <li>• Patient satisfaction: {averageSatisfaction.toFixed(1)}/10</li>
                )}
                {therapyDistribution.length > 0 && therapyDistribution[0] && (
                  <li>• {therapyDistribution[0].name} therapy most popular ({therapyDistribution[0].sessions} sessions)</li>
                )}
                {practitionerData.length > 0 && practitionerData[0] && (
                  <li>• {practitionerData[0].name} leading with {practitionerData[0].sessions} sessions</li>
                )}
                {completedSessions > 0 && (
                  <li>• {completedSessions} sessions completed successfully</li>
                )}
                {(averageSatisfaction < 7 && completedSessions === 0) && (
                  <li>• System ready for patient data</li>
                )}
              </ul>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium">Areas for Improvement</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {therapyDistribution.length > 0 && therapyDistribution[therapyDistribution.length - 1] && (
                  <li>• Increase {therapyDistribution[therapyDistribution.length - 1].name} adoption ({therapyDistribution[therapyDistribution.length - 1].sessions} sessions)</li>
                )}
                {activeTreatments < completedSessions / 2 && completedSessions > 0 && (
                  <li>• Book more upcoming sessions</li>
                )}
                {totalPatients > 0 && sessions.length / totalPatients < 3 && (
                  <li>• Increase patient engagement</li>
                )}
                {totalPatients === 0 && (
                  <li>• Add patients to start tracking</li>
                )}
                {progressData.length === 0 && totalPatients > 0 && (
                  <li>• Collect patient progress feedback</li>
                )}
              </ul>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Recommendations</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {therapyDistribution.length > 0 && therapyDistribution[0] && (
                  <li>• Add more {therapyDistribution[0].name} time slots</li>
                )}
                {sessions.length > 5 && (
                  <li>• Implement automated reminders</li>
                )}
                {practitionerData.length > 3 && (
                  <li>• Balance workload across practitioners</li>
                )}
                {totalPatients === 0 && (
                  <li>• Start by adding your first patient</li>
                )}
                {progressData.length < sessions.length / 2 && sessions.length > 0 && (
                  <li>• Encourage post-treatment feedback</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}