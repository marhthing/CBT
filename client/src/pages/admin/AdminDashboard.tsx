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
  GraduationCap,
  Download,
  Upload,
  Database
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DashboardStats {
  totalStudents: number;
  testsTaken: number;
  activeTestCodes: number;
  totalTestCodes: number;
  totalQuestions: number;
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

  useEffect(() => {
    fetchStats();
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

  const handleBulkExport = async (type: 'questions' | 'students' | 'results') => {
    try {
      let endpoint = '';
      let filename = '';

      switch (type) {
        case 'questions':
          endpoint = '/api/questions/export';
          filename = 'questions_export.csv';
          break;
        case 'students':
          endpoint = '/api/students/export';
          filename = 'students_export.csv';
          break;
        case 'results':
          endpoint = '/api/test-results/export-csv';
          filename = 'test_results_export.csv';
          break;
      }

      const response = await fetch(endpoint, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to export ${type}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully`,
      });
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to export ${type}`,
        variant: "destructive"
      });
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

        {/* Bulk Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Bulk Data Operations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => handleBulkExport('questions')}
                className="flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Questions</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleBulkExport('students')}
                className="flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Students</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleBulkExport('results')}
                className="flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Results</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span>Question Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Upload, edit, and manage questions across all subjects and classes.</p>
              <div className="flex space-x-2">
                <Badge variant="secondary">Multiple Choice</Badge>
                <Badge variant="secondary">True/False</Badge>
                <Badge variant="secondary">Essay</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span>Teacher Assignments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Assign teachers to subjects and classes for organized question management.</p>
              <Badge variant="secondary">Subject Assignment</Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <span>Test Code Generation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Generate secure test codes for students with randomized questions.</p>
              <div className="flex space-x-2">
                <Badge variant="secondary">Batch Generation</Badge>
                <Badge variant="secondary">Randomized</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;