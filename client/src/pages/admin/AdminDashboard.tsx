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

interface RecentTestResult {
  id: string;
  score: number;
  totalQuestions: number;
  totalPossibleScore: number;
  timeTaken: number;
  createdAt: string;
  testCodes: {
    code: string;
    subject: string;
    class: string;
    term: string;
    session: string;
  };
  users: {
    fullName: string;
    email: string;
  };
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
  const [recentTests, setRecentTests] = useState<RecentTestResult[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentTests();
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

  const fetchRecentTests = async () => {
    try {
      const response = await fetch('/api/test-results?limit=10&includeUser=true', {
        credentials: 'include'
      });

      if (response.ok) {
        const tests = await response.json();
        // Filter out tests without proper user or testCode data
        const validTests = tests.filter((test: RecentTestResult) => 
          test && 
          test.users && 
          test.testCodes && 
          test.users.fullName && 
          test.users.email &&
          test.testCodes.code &&
          test.testCodes.subject &&
          test.testCodes.class &&
          test.testCodes.term
        );
        setRecentTests(validTests);
        console.log('Filtered tests:', validTests.length, 'from', tests.length);
      }
    } catch (error) {
      console.error('Error fetching recent tests:', error);
      toast({
        title: "Error",
        description: "Failed to load recent test results",
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

        {/* Recent Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTests ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : recentTests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No test results available
              </div>
            ) : (
              <div className="space-y-4">
                {recentTests.map((test) => (
                  <div key={test.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-sm">{test.users?.fullName || 'Unknown User'}</h3>
                          <Badge variant="outline" className="text-xs">
                            {test.testCodes?.code || 'N/A'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {test.testCodes?.subject || 'N/A'} • {test.testCodes?.class || 'N/A'} • {test.testCodes?.term || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">{test.users?.email || 'No email'}</p>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-lg ${getScoreColor(test.score, test.totalPossibleScore)}`}>
                          {test.score}/{test.totalPossibleScore}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round((test.score / test.totalPossibleScore) * 100)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Time: {formatTime(test.timeTaken)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(test.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => window.location.href = '/admin/generate-test-code'}
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm">Generate Test Codes</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => window.location.href = '/admin/upload-questions'}
              >
                <BookOpen className="h-6 w-6" />
                <span className="text-sm">Upload Questions</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => window.location.href = '/admin/export-results'}
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Export Results</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => window.location.href = '/admin/manage-all-questions'}
              >
                <Users className="h-6 w-6" />
                <span className="text-sm">Manage Questions</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => window.location.href = '/admin/manage-test-batches'}
              >
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Manage Test Batches</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => window.location.href = '/admin/manage-teacher-assignments'}
              >
                <GraduationCap className="h-6 w-6" />
                <span className="text-sm">Teacher Assignments</span>
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