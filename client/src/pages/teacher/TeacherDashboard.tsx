import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
// Using custom API endpoints instead of Supabase
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Edit, BookOpen, Users } from "lucide-react";

const TeacherDashboard = () => {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    activeTests: 0,
    studentsTested: 0,
    subjects: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch teacher's questions and test data
      const [questionsRes, testCodesRes, testResultsRes] = await Promise.all([
        fetch('/api/questions', { credentials: 'include' }),
        fetch('/api/test-codes', { credentials: 'include' }),
        fetch('/api/test-results', { credentials: 'include' })
      ]);

      const questions = questionsRes.ok ? await questionsRes.json() : [];
      const testCodes = testCodesRes.ok ? await testCodesRes.json() : [];
      const testResults = testResultsRes.ok ? await testResultsRes.json() : [];

      // Calculate stats
      const totalQuestions = questions.length;
      const subjects = new Set(questions.map((q: any) => q.subject)).size;
      const activeTests = testCodes.filter((code: any) => code.isActive).length;
      const uniqueStudents = new Set(testResults.map((r: any) => r.studentId)).size;

      setStats({
        totalQuestions,
        activeTests,
        studentsTested: uniqueStudents,
        subjects
      });

      // Set recent activity (last 3 questions uploaded)
      const recentQuestions = questions
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

      setRecentActivity(recentQuestions);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || 'Teacher'}!
          </h1>
          <p className="text-gray-600 mt-2">Manage your questions and track student progress</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions}</div>
              <p className="text-xs text-muted-foreground">Across all subjects</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
              <Edit className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTests}</div>
              <p className="text-xs text-muted-foreground">Currently available</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Tested</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.studentsTested}</div>
              <p className="text-xs text-muted-foreground">This semester</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.subjects}</div>
              <p className="text-xs text-muted-foreground">Different subjects</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-6 w-6 text-blue-600 mr-2" />
                Upload Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Add new test questions for your students. Select term, class, section, and subject.
              </p>
              <Link to="/teacher/upload-questions">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Upload New Questions
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="h-6 w-6 text-green-600 mr-2" />
                Manage Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View, edit, or delete your previously uploaded questions.
              </p>
              <Link to="/teacher/manage-questions">
                <Button className="w-full bg-green-600 hover:bg-green-700" variant="outline">
                  Manage Questions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{activity.subject} Question</p>
                      <p className="text-sm text-gray-500">Question uploaded</p>
                    </div>
                    <span className="text-blue-600 text-sm">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent activity. Start by uploading some questions!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;