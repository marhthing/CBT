
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Filter, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Subject {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

interface Term {
  id: string;
  name: string;
}

interface Session {
  id: string;
  name: string;
}

interface TestResult {
  id: string;
  score: number;
  totalPossibleScore: number;
  timeTaken: number;
  createdAt: string;
  studentName: string;
  testCodes: {
    subject: string;
    term: string;
    class: string;
    session: string;
    testType: string;
  };
}

const ExportResults = () => {
  const [filters, setFilters] = useState({
    subject: '',
    class: '',
    term: '',
    session: ''
  });
  const [filteredResults, setFilteredResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Form data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const [subjectsRes, classesRes, termsRes, sessionsRes] = await Promise.all([
        fetch('/api/subjects', { credentials: 'include' }),
        fetch('/api/classes', { credentials: 'include' }),
        fetch('/api/terms', { credentials: 'include' }),
        fetch('/api/sessions', { credentials: 'include' })
      ]);

      const subjects = subjectsRes.ok ? await subjectsRes.json() : [];
      const classes = classesRes.ok ? await classesRes.json() : [];
      const terms = termsRes.ok ? await termsRes.json() : [];
      const sessions = sessionsRes.ok ? await sessionsRes.json() : [];

      setSubjects(subjects);
      setClasses(classes);
      setTerms(terms);
      setSessions(sessions);
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleFilter = async () => {
    if (!filters.subject || !filters.class || !filters.term || !filters.session) {
      toast({
        title: "Error",
        description: "Please select all filters",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/test-results/filtered?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch filtered results');
      }

      const results = await response.json();
      setFilteredResults(results);
    } catch (error) {
      console.error('Error fetching filtered results:', error);
      toast({
        title: "Error",
        description: "Failed to fetch test results",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (filteredResults.length === 0) {
      toast({
        title: "Error",
        description: "No results to export. Please filter results first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/test-results/export-csv?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `test_results_${filters.subject}_${filters.class}_${filters.term}_${filters.session}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "CSV exported successfully",
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Error",
        description: "Failed to export CSV",
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = async () => {
    if (filteredResults.length === 0) {
      toast({
        title: "Error",
        description: "No results to export. Please filter results first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/test-results/export-pdf?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `test_results_${filters.subject}_${filters.class}_${filters.term}_${filters.session}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "PDF exported successfully",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive"
      });
    }
  };

  if (loadingData) {
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
          <h1 className="text-3xl font-bold text-gray-900">Export Test Results</h1>
          <p className="text-gray-600 mt-2">Filter and export test results to CSV</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-6 w-6 text-blue-600 mr-2" />
              Filter Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="session">Session</Label>
                <Select value={filters.session} onValueChange={(value) => setFilters(prev => ({ ...prev, session: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map(session => (
                      <SelectItem key={session.id} value={session.name}>
                        {session.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="term">Term</Label>
                <Select value={filters.term} onValueChange={(value) => setFilters(prev => ({ ...prev, term: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map(term => (
                      <SelectItem key={term.id} value={term.name}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="class">Class</Label>
                <Select value={filters.class} onValueChange={(value) => setFilters(prev => ({ ...prev, class: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.name}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={filters.subject} onValueChange={(value) => setFilters(prev => ({ ...prev, subject: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button onClick={handleFilter} disabled={loading}>
                {loading ? "Filtering..." : "Filter Results"}
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleExportCSV} 
                  variant="outline"
                  disabled={filteredResults.length === 0}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
                
                <Button 
                  onClick={handleExportPDF} 
                  variant="outline"
                  disabled={filteredResults.length === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Filtered Results ({filteredResults.length} records)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredResults.map((result) => {
                  const percentage = Math.round((result.score / result.totalPossibleScore) * 100);
                  return (
                    <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{result.studentName}</h4>
                        <p className="text-sm text-gray-500">
                          {result.testCodes.testType} • {new Date(result.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {result.score}/{result.totalPossibleScore}
                        </div>
                        <div className="text-sm text-gray-500">
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExportResults;
