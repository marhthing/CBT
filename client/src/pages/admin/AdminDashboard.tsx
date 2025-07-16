import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  BarChart3, 
  GraduationCap
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DashboardStats {
  totalStudents: number;
  testsTaken: number;
  activeTestCodes: number;
  totalTestCodes: number;
  totalQuestions: number;
}

interface TestAnalysis {
  totalTests: number;
  passRate: number;
  failRate: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  subjectBreakdown: { [key: string]: number };
  classBreakdown: { [key: string]: number };
}

interface TestAnalyticsByGroup {
  testKey: string;
  subject: string;
  class: string;
  term: string;
  session: string;
  totalParticipation: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
  failPercentage: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  lastTestDate: string;
}

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    testsTaken: 0,
    activeTestCodes: 0,
    totalTestCodes: 0,
    totalQuestions: 0
  });
  const [loading, setLoading] = useState(true);
  const [testAnalyticsByGroup, setTestAnalyticsByGroup] = useState<TestAnalyticsByGroup[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [testAnalysis, setTestAnalysis] = useState<TestAnalysis>({
    totalTests: 0,
    passRate: 0,
    failRate: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    subjectBreakdown: {},
    classBreakdown: {}
  });

  useEffect(() => {
    fetchStats();
    fetchTestAnalytics();
  }, []);

  const fetchStats = async () => {
    try {
      const [adminStatsRes, dashboardStatsRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/dashboard/stats', { credentials: 'include' })
      ]);

      if (adminStatsRes.ok && dashboardStatsRes.ok) {
        const adminStats = await adminStatsRes.json();
        const dashboardStats = await dashboardStatsRes.json();

        setStats({
          totalStudents: adminStats.totalStudents,
          testsTaken: dashboardStats.testsTaken,
          activeTestCodes: dashboardStats.activeTestCodes,
          totalTestCodes: dashboardStats.totalTestCodes,
          totalQuestions: dashboardStats.totalQuestions
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTestAnalytics = async () => {
    try {
      // Fetch all test results for admin analysis
      const response = await fetch('/api/test-results', {
        credentials: 'include'
      });

      if (response.ok) {
        const tests = await response.json();
        console.log('Fetched test results:', tests.length);
        
        // Group tests by class + session + term + subject combination
        const testGroups: { [key: string]: any[] } = {};
        
        tests.forEach((test: any) => {
          if (test.testCodes && test.totalPossibleScore > 0) {
            const key = `${test.testCodes.class}_${test.testCodes.session}_${test.testCodes.term}_${test.testCodes.subject}`;
            if (!testGroups[key]) {
              testGroups[key] = [];
            }
            testGroups[key].push(test);
          }
        });

        // Calculate analytics for each group
        const analytics: TestAnalyticsByGroup[] = Object.entries(testGroups).map(([key, groupTests]) => {
          const firstTest = groupTests[0];
          const passThreshold = 50; // 50% pass rate
          
          const scores = groupTests.map((test: any) => (test.score / test.totalPossibleScore) * 100);
          const passCount = scores.filter(score => score >= passThreshold).length;
          const failCount = groupTests.length - passCount;
          
          // Get the most recent test date
          const latestDate = Math.max(...groupTests.map((test: any) => new Date(test.createdAt).getTime()));
          
          return {
            testKey: key,
            subject: firstTest.testCodes.subject,
            class: firstTest.testCodes.class,
            term: firstTest.testCodes.term,
            session: firstTest.testCodes.session,
            totalParticipation: groupTests.length,
            passCount,
            failCount,
            passPercentage: groupTests.length > 0 ? Math.round((passCount / groupTests.length) * 100) : 0,
            failPercentage: groupTests.length > 0 ? Math.round((failCount / groupTests.length) * 100) : 0,
            averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
            highestScore: scores.length > 0 ? Math.round(Math.max(...scores)) : 0,
            lowestScore: scores.length > 0 ? Math.round(Math.min(...scores)) : 0,
            lastTestDate: new Date(latestDate).toLocaleDateString()
          };
        });

        // Sort by most recent test date and total participation
        analytics.sort((a, b) => {
          const dateA = new Date(a.lastTestDate).getTime();
          const dateB = new Date(b.lastTestDate).getTime();
          if (dateB !== dateA) return dateB - dateA;
          return b.totalParticipation - a.totalParticipation;
        });

        setTestAnalyticsByGroup(analytics);

        // Calculate overall analysis for all tests
        if (tests.length > 0) {
          const validTests = tests.filter((test: any) => test.testCodes && test.totalPossibleScore > 0);
          
          const scores = validTests.map((test: any) => (test.score / test.totalPossibleScore) * 100);
          const passThreshold = 50; // 50% pass rate
          const passCount = scores.filter(score => score >= passThreshold).length;
          
          const subjectBreakdown: { [key: string]: number } = {};
          const classBreakdown: { [key: string]: number } = {};
          
          validTests.forEach((test: any) => {
            const subject = test.testCodes?.subject || 'Unknown';
            const className = test.testCodes?.class || 'Unknown';
            
            subjectBreakdown[subject] = (subjectBreakdown[subject] || 0) + 1;
            classBreakdown[className] = (classBreakdown[className] || 0) + 1;
          });

          setTestAnalysis({
            totalTests: validTests.length,
            passRate: validTests.length > 0 ? Math.round((passCount / validTests.length) * 100) : 0,
            failRate: validTests.length > 0 ? Math.round(((validTests.length - passCount) / validTests.length) * 100) : 0,
            averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
            highestScore: scores.length > 0 ? Math.round(Math.max(...scores)) : 0,
            lowestScore: scores.length > 0 ? Math.round(Math.min(...scores)) : 0,
            subjectBreakdown,
            classBreakdown
          });
        }
      }
    } catch (error) {
      console.error('Error fetching test analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load test analytics",
        variant: "destructive"
      });
    } finally {
      setLoadingTests(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {profile?.fullName || profile?.email}</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Registered students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests Taken</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.testsTaken}</div>
              <p className="text-xs text-muted-foreground">Completed assessments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Test Codes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTestCodes}</div>
              <p className="text-xs text-muted-foreground">Currently available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Test Codes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTestCodes}</div>
              <p className="text-xs text-muted-foreground">All time generated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions}</div>
              <p className="text-xs text-muted-foreground">All subjects & teachers</p>
            </CardContent>
          </Card>
        </div>

        

        {/* Test Analytics by Group */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Test Analytics by Class/Subject/Term/Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTests ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : testAnalyticsByGroup.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No test analytics available
              </div>
            ) : (
              <div className="space-y-4">
                {testAnalyticsByGroup.slice(0, 10).map((analytics) => (
                  <div key={analytics.testKey} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {analytics.subject}
                          </h3>
                          <Badge variant="outline" className="text-xs w-fit">
                            {analytics.class}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {analytics.session} • {analytics.term}
                        </p>
                        <p className="text-xs text-gray-500">
                          Last test: {analytics.lastTestDate}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-xl md:text-2xl font-bold text-blue-600">
                            {analytics.totalParticipation}
                          </div>
                          <div className="text-xs text-gray-600">Total Participation</div>
                        </div>
                        
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-xl font-bold text-green-600">
                            {analytics.passCount}
                          </div>
                          <div className="text-xs text-gray-600">
                            Pass ({analytics.passPercentage}%)
                          </div>
                        </div>
                        
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="text-xl font-bold text-red-600">
                            {analytics.failCount}
                          </div>
                          <div className="text-xs text-gray-600">
                            Fail ({analytics.failPercentage}%)
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xl font-bold text-gray-600">
                            {analytics.averageScore}%
                          </div>
                          <div className="text-xs text-gray-600">Average Score</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {analytics.lowestScore}% - {analytics.highestScore}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {testAnalyticsByGroup.length > 10 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-500">
                      Showing top 10 results. Go to Export Results for complete data.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              <Button 
                variant="outline" 
                className="h-16 md:h-20 flex flex-col items-center justify-center space-y-1 md:space-y-2"
                onClick={() => window.location.href = '/admin/generate-test-code'}
              >
                <FileText className="h-4 w-4 md:h-6 md:w-6" />
                <span className="text-xs md:text-sm text-center">Generate Test Codes</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 md:h-20 flex flex-col items-center justify-center space-y-1 md:space-y-2"
                onClick={() => window.location.href = '/admin/upload-questions'}
              >
                <BookOpen className="h-4 w-4 md:h-6 md:w-6" />
                <span className="text-xs md:text-sm text-center">Upload Questions</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 md:h-20 flex flex-col items-center justify-center space-y-1 md:space-y-2"
                onClick={() => window.location.href = '/admin/export-results'}
              >
                <BarChart3 className="h-4 w-4 md:h-6 md:w-6" />
                <span className="text-xs md:text-sm text-center">Export Results</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 md:h-20 flex flex-col items-center justify-center space-y-1 md:space-y-2"
                onClick={() => window.location.href = '/admin/manage-all-questions'}
              >
                <Users className="h-4 w-4 md:h-6 md:w-6" />
                <span className="text-xs md:text-sm text-center">Manage Questions</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 md:h-20 flex flex-col items-center justify-center space-y-1 md:space-y-2"
                onClick={() => window.location.href = '/admin/manage-test-batches'}
              >
                <TrendingUp className="h-4 w-4 md:h-6 md:w-6" />
                <span className="text-xs md:text-sm text-center">Manage Test Batches</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 md:h-20 flex flex-col items-center justify-center space-y-1 md:space-y-2"
                onClick={() => window.location.href = '/admin/manage-teacher-assignments'}
              >
                <GraduationCap className="h-4 w-4 md:h-6 md:w-6" />
                <span className="text-xs md:text-sm text-center">Teacher Assignments</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Test Activity Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Test Codes</span>
                  <Badge variant={stats.activeTestCodes > 0 ? "default" : "secondary"}>
                    {stats.activeTestCodes}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Test Codes Generated</span>
                  <Badge variant="outline">{stats.totalTestCodes}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tests Completed</span>
                  <Badge variant="outline">{stats.testsTaken}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Question Bank Size</span>
                  <Badge variant="outline">{stats.totalQuestions}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Student Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Students</span>
                  <Badge variant="outline">{stats.totalStudents}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Tests per Student</span>
                  <Badge variant="outline">
                    {stats.totalStudents > 0 ? Math.round((stats.testsTaken / stats.totalStudents) * 10) / 10 : 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">System Status</span>
                  <Badge variant="default" className="bg-green-600">
                    Online
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;