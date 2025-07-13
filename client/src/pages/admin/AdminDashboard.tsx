import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
// Using custom API endpoints instead of Supabase
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users2, Code, Settings, GraduationCap, Users, UserCheck } from "lucide-react";

const AdminDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    testsTaken: 0,
    activeTestCodes: 0,
    totalTestCodes: 0,
    totalQuestions: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [questionsRes, testResultsRes, testCodesRes, dashboardStatsRes, adminStatsRes] = await Promise.all([
        fetch('/api/questions', { credentials: 'include' }),
        fetch('/api/test-results', { credentials: 'include' }),
        fetch('/api/test-codes', { credentials: 'include' }),
        fetch('/api/dashboard/stats', { credentials: 'include' }),
        fetch('/api/admin/stats', { credentials: 'include' })
      ]);

      const questions = questionsRes.ok ? await questionsRes.json() : [];
      const testResults = testResultsRes.ok ? await testResultsRes.json() : [];
      const testCodes = testCodesRes.ok ? await testCodesRes.json() : [];
      const dashboardStats = dashboardStatsRes.ok ? await dashboardStatsRes.json() : { testsTaken: 0, activeTestCodes: 0 };
      const adminStats = adminStatsRes.ok ? await adminStatsRes.json() : { totalStudents: 0 };

      console.log('Admin Dashboard - Questions:', questions);
      console.log('Admin Dashboard - Test Results:', testResults);
      console.log('Admin Dashboard - Test Codes:', testCodes);
      console.log('Admin Dashboard - Dashboard Stats:', dashboardStats);
      console.log('Admin Dashboard - Admin Stats:', adminStats);

      // Count active and total test codes from test codes array as fallback
      const activeTestCodesFromArray = Array.isArray(testCodes) ? testCodes.filter((code: any) => code.isActive).length : 0;
      const totalTestCodesFromArray = Array.isArray(testCodes) ? testCodes.length : 0;

      setStats({
        totalStudents: adminStats.totalStudents || 0,
        testsTaken: dashboardStats.testsTaken || (Array.isArray(testResults) ? testResults.length : 0),
        activeTestCodes: dashboardStats.activeTestCodes !== undefined ? dashboardStats.activeTestCodes : activeTestCodesFromArray,
        totalTestCodes: dashboardStats.totalTestCodes !== undefined ? dashboardStats.totalTestCodes : totalTestCodesFromArray,
        totalQuestions: Array.isArray(questions) ? questions.length : 0
      });

      // Set recent activity - group by date and show summary
      const today = new Date();
      const recentDays = 7; // Show last 7 days of activity

      // Ensure testResults is an array and filter recent results
      const validTestResults = Array.isArray(testResults) ? testResults : [];

      // Filter recent results and use correct property names
      const recentResults = validTestResults.filter((result: any) => {
        if (!result.createdAt) return false;
        const resultDate = new Date(result.createdAt);
        const daysDiff = Math.floor((today.getTime() - resultDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= recentDays;
      });

      console.log('Recent Results:', recentResults);

      // Group by subject and date for cleaner display
      const activitySummary = recentResults.reduce((acc: any, result: any) => {
        const date = new Date(result.createdAt).toDateString();
        const subject = result.testCodes?.subject || 'Unknown Subject';
        const testClass = result.testCodes?.class || 'Unknown Class';
        const key = `${subject}-${testClass}-${date}`;

        if (!acc[key]) {
          acc[key] = {
            subject,
            class: testClass,
            date,
            count: 0,
            averageScore: 0,
            totalScore: 0,
            created_at: result.createdAt,
            students: new Set()
          };
        }

        acc[key].count += 1;
        acc[key].students.add(result.studentId);
        const totalPossible = result.totalPossibleScore || 1;
        acc[key].totalScore += (result.score / totalPossible) * 100;
        acc[key].averageScore = Math.round(acc[key].totalScore / acc[key].count);

        return acc;
      }, {});

      console.log('Activity Summary:', activitySummary);

      // Convert to array and add unique student count
      const summaryArray = Object.values(activitySummary)
        .map((activity: any) => ({
          ...activity,
          uniqueStudents: activity.students.size
        }))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8); // Show more recent activities

      console.log('Summary Array:', summaryArray);
      setRecentActivity(summaryArray);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchDashboardData();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || 'Admin'}!
          </h1>
          <p className="text-gray-600 mt-2">Manage the entire CBT system and monitor performance</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Taken</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.testsTaken}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Test Codes</CardTitle>
            <Code className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTestCodes}</div>
            <p className="text-xs text-muted-foreground">{stats.activeTestCodes} active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <Settings className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">In question bank</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Teacher Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Assign teachers to subjects and classes
            </p>
            <Button
              onClick={() => navigate('/admin/manage-teacher-assignments')}
              className="w-full"
            >
              Manage Teacher Assignments
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Test Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Generate test codes for students
            </p>
            <Button
              onClick={() => navigate('/admin/generate-test-code')}
              className="w-full"
            >
              Generate Test Codes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View and manage all questions
            </p>
            <Button
              onClick={() => navigate('/admin/manage-all-questions')}
              className="w-full"
            >
              Manage Questions
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity: any, index: number) => (
                  <div key={`${activity.subject}-${activity.class}-${activity.date}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">
                        {activity.subject} - {activity.class}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {activity.uniqueStudents} student{activity.uniqueStudents > 1 ? 's' : ''} • {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        Avg: {activity.averageScore}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {activity.count} attempt{activity.count > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent test activity to display</p>
                <p className="text-sm">Test activity will appear here when students take tests</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Test Codes</span>
                <span className="font-bold text-green-600">{stats.totalTestCodes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Test Codes</span>
                <span className="font-bold text-emerald-600">{stats.activeTestCodes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions</span>
                <span className="font-bold text-blue-600">{stats.totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tests Completed</span>
                <span className="font-bold text-purple-600">{stats.testsTaken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Registered Students</span>
                <span className="font-bold text-yellow-600">{stats.totalStudents}</span>
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