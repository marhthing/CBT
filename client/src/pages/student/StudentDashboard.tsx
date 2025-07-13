import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { BookOpen, Clock, Trophy, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

import { format } from 'date-fns';

interface TestResult {
  id: string;
  score: number;
  totalQuestions: number;
  totalPossibleScore: number;
  timeTaken: number;
  createdAt: string;
  testCodes: {
    subject: string;
    term: string;
    class: string;
    session: string;
    testType: string;
  };
}

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  const [stats, setStats] = useState({
    totalTests: 0,
    averageScore: 0,
    bestScore: 0,
    totalTimeSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
    const [results, setResults] = useState<TestResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/test-results', { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch test results: ${response.status} ${response.statusText}`);
      }

      const results = await response.json();
      console.log('Fetched test results:', results);

      // Ensure results is an array and handle null/undefined testCodes
      const testResults = Array.isArray(results) ? results.filter(result => result.testCodes) : [];

      // Sort results by date (most recent first) and take last 5
      const sortedResults = testResults.sort((a: TestResult, b: TestResult) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentResults(sortedResults.slice(0, 5));

      // Calculate statistics
      if (testResults.length > 0) {
        const totalTests = testResults.length;
        const totalScore = testResults.reduce((sum: number, result: TestResult) => sum + result.score, 0);
        const totalPossible = testResults.reduce((sum: number, result: TestResult) => sum + result.totalPossibleScore, 0);
        const totalTime = testResults.reduce((sum: number, result: TestResult) => sum + (result.timeTaken || 0), 0);
        const bestScore = Math.max(...testResults.map((result: TestResult) => 
          (result.score / result.totalPossibleScore) * 100
        ));

        setStats({
          totalTests,
          averageScore: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
          bestScore: Math.round(bestScore),
          totalTimeSpent: Math.round(totalTime / 60), // Convert to minutes
        });
      } else {
        setStats({
          totalTests: 0,
          averageScore: 0,
          bestScore: 0,
          totalTimeSpent: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      setRecentResults([]);
      setStats({ totalTests: 0, averageScore: 0, bestScore: 0, totalTimeSpent: 0 });
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/test-results', {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch results: ${response.status}`);
            }
            const data = await response.json();
            setResults(data);
        } catch (error: any) {
            console.error("Error fetching tests:", error);
            setError(error.message || "Failed to fetch tests");
        } finally {
            setIsLoading(false);
        }
    };


  const formatTimeTaken = (seconds: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getPercentage = (score: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((score / total) * 100);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

    


  if (loading) {
    return (
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold mb-2">Error Loading Dashboard</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={fetchDashboardData}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.fullName || profile?.email}!
          </h1>
          <p className="text-gray-600 mt-1">Here's your academic progress overview</p>
        </div>

          

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTests}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Best Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.bestScore}%</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Trophy className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Time Spent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTimeSpent}m</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Recent Results */}
        <Card>
            <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base lg:text-lg">Your Recent Results</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
                {isLoading ? (
                    <div className="text-center py-8 text-xs sm:text-sm">Loading results...</div>
                ) : results.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs sm:text-sm">
                        No test results yet. Take your first test!
                    </div>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {results.map((result) => (
                            <div key={result.id} className="border rounded-lg p-3 sm:p-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-sm sm:text-base truncate">{result.testCodes.subject}</h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            {result.testCodes.class} • {result.testCodes.term} • {result.testCodes.session}
                                        </p>
                                    </div>
                                    <Badge variant={result.score >= 70 ? "default" : "secondary"} className="text-xs flex-shrink-0">
                                        {Math.round((result.score / result.totalPossibleScore) * 100)}%
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Score</p>
                                        <p className="font-medium">{result.score}/{result.totalPossibleScore}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Questions</p>
                                        <p className="font-medium">{result.totalQuestions}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Time Taken</p>
                                        <p className="font-medium">{result.timeTaken} min</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Date</p>
                                        <p className="font-medium">{format(new Date(result.createdAt), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;