import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
// Using custom API endpoints instead of Supabase
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Code, GraduationCap, History, Circle, Play, Square } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/dialog";

interface TestCode {
  code: string;
  term: string;
  class: string;
  section: string;
  subject: string;
  questions: number;
  timeLimit: number;
  createdAt: string;
  isActive?: boolean;
}

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
  is_current: boolean;
}

const GenerateTestCode = () => {
  const { profile, user } = useAuth();
  const [formData, setFormData] = useState({
    subject: '',
    class: '',
    term: '',
    section: '',
    numQuestions: '',
    timeLimit: '',
    scorePerQuestion: '1',
    session: '',
    numCodes: '1',
    testType: ''
  });
  const [generatedCodes, setGeneratedCodes] = useState<TestCode[]>([]);
  const [allTestCodes, setAllTestCodes] = useState<TestCode[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Data from database
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const [subjectsRes, classesRes, termsRes, sessionsRes, batchesRes] = await Promise.all([
        fetch('/api/subjects', { credentials: 'include' }),
        fetch('/api/classes', { credentials: 'include' }),
        fetch('/api/terms', { credentials: 'include' }),
        fetch('/api/sessions', { credentials: 'include' }),
        fetch('/api/test-code-batches', { credentials: 'include' })
      ]);

      const subjects = subjectsRes.ok ? await subjectsRes.json() : [];
      const classes = classesRes.ok ? await classesRes.json() : [];
      const terms = termsRes.ok ? await termsRes.json() : [];
      const sessions = sessionsRes.ok ? await sessionsRes.json() : [];
      const batches = batchesRes.ok ? await batchesRes.json() : [];

      setSubjects(subjects);
      setClasses(classes);
      setTerms(terms);
      setSessions(sessions);

      // Get all test codes from all batches
      const allTestCodes: TestCode[] = [];
      for (const batch of batches) {
        try {
          const codesRes = await fetch(`/api/test-code-batches/${batch.id}/codes`, { credentials: 'include' });
          if (codesRes.ok) {
            const codes = await codesRes.json();
            const formattedCodes = codes.map((code: any) => ({
              code: code.code,
              term: batch.term,
              class: batch.class,
              section: batch.section || '',
              subject: batch.subject,
              questions: batch.numQuestions,
              timeLimit: batch.timeLimit,
              createdAt: code.createdAt,
              isActive: code.isActive
            }));
            allTestCodes.push(...formattedCodes);
          }
        } catch (error) {
          console.error(`Error fetching codes for batch ${batch.id}:`, error);
        }
      }
      setAllTestCodes(allTestCodes);

      // Set current session as default
      const currentSession = sessions.find((s: any) => s.isCurrent);
      if (currentSession) {
        setFormData(prev => ({ ...prev, session: currentSession.name }));
      }
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

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || !formData.class || !formData.term || !formData.section || 
        !formData.numQuestions || !formData.timeLimit || !formData.scorePerQuestion || !formData.session || !formData.numCodes || !formData.testType) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to generate test codes",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const numCodesToGenerate = parseInt(formData.numCodes);
      
      // Generate batch name
      const batchName = `${formData.subject}-${formData.class}-${formData.term}-${new Date().toLocaleDateString().replace(/\//g, '-')}`;

      const response = await fetch('/api/test-code-batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          batchName,
          term: formData.term,
          class: formData.class,
          section: formData.section,
          subject: formData.subject,
          session: formData.session,
          numQuestions: parseInt(formData.numQuestions),
          timeLimit: parseInt(formData.timeLimit),
          scorePerQuestion: parseInt(formData.scorePerQuestion),
          testType: formData.testType,
          numCodes: numCodesToGenerate
        })
      });

      if (!response.ok) throw new Error('Failed to create test code batch');
      const result = await response.json();

      const newCodes: TestCode[] = result.codes.map((code: any) => ({
        code: code.code,
        term: code.term,
        class: code.class,
        section: code.section,
        subject: code.subject,
        questions: code.numQuestions,
        timeLimit: code.timeLimit,
        createdAt: code.createdAt,
        isActive: code.isActive
      }));

      setGeneratedCodes([...generatedCodes, ...newCodes]);

      // Reset form
      setFormData({
        subject: '',
        class: '',
        term: '',
        section: '',
        numQuestions: '',
        timeLimit: '',
        scorePerQuestion: '1',
        session: '',
        numCodes: '1',
        testType: ''
      });

      toast({
        title: "Success",
        description: `Batch "${batchName}" with ${numCodesToGenerate} test codes generated successfully!`,
      });
    } catch (error) {
      console.error('Error generating test code batch:', error);
      toast({
        title: "Error",
        description: "Failed to generate test code batch. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Test code copied to clipboard",
    });
  };

  const handleActivateTestCode = async (code: string) => {
    try {
      // Find the batch that contains this code
      const batchesRes = await fetch('/api/test-code-batches', { credentials: 'include' });
      if (!batchesRes.ok) throw new Error('Failed to fetch batches');
      
      const batches = await batchesRes.json();
      let targetCodeId = null;
      
      for (const batch of batches) {
        const codesRes = await fetch(`/api/test-code-batches/${batch.id}/codes`, { credentials: 'include' });
        if (codesRes.ok) {
          const codes = await codesRes.json();
          const foundCode = codes.find((c: any) => c.code === code);
          if (foundCode) {
            targetCodeId = foundCode.id;
            break;
          }
        }
      }

      if (!targetCodeId) {
        throw new Error('Test code not found');
      }

      const response = await fetch(`/api/test-codes/${targetCodeId}/activate`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to activate test code');
      }

      toast({
        title: "Success",
        description: "Test code activated successfully",
      });

      // Refresh test codes
      fetchFormData();
    } catch (error) {
      console.error('Error activating test code:', error);
      toast({
        title: "Error",
        description: "Failed to activate test code. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeactivateAllTestCodes = async () => {
    try {
      // Get all batches and deactivate them
      const batchesRes = await fetch('/api/test-code-batches', { credentials: 'include' });
      if (!batchesRes.ok) throw new Error('Failed to fetch batches');
      
      const batches = await batchesRes.json();
      
      // Deactivate all active batches
      const deactivatePromises = batches
        .filter((batch: any) => batch.isActive)
        .map((batch: any) => 
          fetch(`/api/test-code-batches/${batch.id}/deactivate`, {
            method: 'PUT',
            credentials: 'include'
          })
        );

      await Promise.all(deactivatePromises);

      toast({
        title: "Success",
        description: "All test codes deactivated successfully",
      });

      // Refresh test codes
      fetchFormData();
    } catch (error) {
      console.error('Error deactivating all test codes:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate all test codes. Please try again.",
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
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Generate Test Codes</h1>
            <p className="text-gray-600 mt-1">Create new test codes for SURE FOUNDATION COMPREHENSIVE SCHOOL</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center">
                <Code className="h-6 w-6 text-purple-600 mr-2" />
                <span className="text-lg sm:text-xl">Generate New Test Codes</span>
              </div>
              <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <span>Test Code History</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeactivateAllTestCodes}
                        className="w-full sm:w-auto"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Deactivate All
                      </Button>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-4 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[80px]">Status</TableHead>
                          <TableHead className="min-w-[80px]">Code</TableHead>
                          <TableHead className="min-w-[100px]">Subject</TableHead>
                          <TableHead className="min-w-[60px]">Class</TableHead>
                          <TableHead className="min-w-[100px] hidden sm:table-cell">Session</TableHead>
                          <TableHead className="min-w-[80px]">Questions</TableHead>
                          <TableHead className="min-w-[80px] hidden md:table-cell">Time Limit</TableHead>
                          <TableHead className="min-w-[80px] hidden lg:table-cell">Created</TableHead>
                          <TableHead className="min-w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTestCodes.map((testCode, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex items-center">
                                <Circle 
                                  className={`h-3 w-3 ${testCode.isActive ? 'text-green-500 fill-green-500' : 'text-red-500 fill-red-500'}`}
                                />
                                <span className="ml-2 text-sm hidden sm:inline">
                                  {testCode.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono font-bold text-sm">{testCode.code}</TableCell>
                            <TableCell className="capitalize text-sm">{testCode.subject}</TableCell>
                            <TableCell className="uppercase text-sm">{testCode.class}</TableCell>
                            <TableCell className="text-sm hidden sm:table-cell">{formData.session}</TableCell>
                            <TableCell className="text-sm">{testCode.questions}</TableCell>
                            <TableCell className="text-sm hidden md:table-cell">{testCode.timeLimit} min</TableCell>
                            <TableCell className="text-sm hidden lg:table-cell">{new Date(testCode.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(testCode.code)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                {!testCode.isActive && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleActivateTestCode(testCode.code)}
                                    className="text-green-600 hover:text-green-700 h-8 w-8 p-0"
                                  >
                                    <Play className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="session">Session</Label>
                  <Select value={formData.session} onValueChange={(value) => setFormData(prev => ({ ...prev, session: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map(session => (
                        <SelectItem key={session.id} value={session.name}>
                          {session.name} {session.is_current && "(Current)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Select value={formData.section} onValueChange={(value) => setFormData(prev => ({ ...prev, section: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Section A</SelectItem>
                      <SelectItem value="B">Section B</SelectItem>
                      <SelectItem value="C">Section C</SelectItem>
                      <SelectItem value="D">Section D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="term">Term</Label>
                  <Select value={formData.term} onValueChange={(value) => setFormData(prev => ({ ...prev, term: value }))}>
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
                  <Select value={formData.class} onValueChange={(value) => setFormData(prev => ({ ...prev, class: value }))}>
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
                  <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}>
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

                <div>
                  <Label htmlFor="numQuestions">Number of Questions</Label>
                  <Input
                    id="numQuestions"
                    type="number"
                    placeholder="e.g., 20"
                    value={formData.numQuestions}
                    onChange={(e) => setFormData(prev => ({ ...prev, numQuestions: e.target.value }))}
                    min="1"
                    max="100"
                  />
                </div>

                <div>
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    placeholder="e.g., 30"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: e.target.value }))}
                    min="1"
                    max="180"
                  />
                </div>

                <div>
                  <Label htmlFor="scorePerQuestion">Score Per Question</Label>
                  <Input
                    id="scorePerQuestion"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.scorePerQuestion}
                    onChange={(e) => setFormData(prev => ({ ...prev, scorePerQuestion: e.target.value }))}
                    placeholder="e.g., 1"
                  />
                </div>

                <div>
                  <Label htmlFor="testType">Test Type</Label>
                  <Select value={formData.testType} onValueChange={(value) => setFormData(prev => ({ ...prev, testType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">Continuous Assessment (CA)</SelectItem>
                      <SelectItem value="EXAM">Examination</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <Label htmlFor="numCodes">Number of Codes to Generate</Label>
                  <Input
                    id="numCodes"
                    type="number"
                    placeholder="1"
                    value={formData.numCodes}
                    onChange={(e) => setFormData(prev => ({ ...prev, numCodes: e.target.value }))}
                    min="1"
                    max="50"
                  />
                </div>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto" disabled={loading}>
                  {loading ? "Generating..." : "Generate Codes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {generatedCodes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Test Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px]">Code</TableHead>
                      <TableHead className="min-w-[100px]">Subject</TableHead>
                      <TableHead className="min-w-[60px]">Class</TableHead>
                      <TableHead className="min-w-[80px] hidden sm:table-cell">Questions</TableHead>
                      <TableHead className="min-w-[80px] hidden md:table-cell">Time Limit</TableHead>
                      <TableHead className="min-w-[80px] hidden lg:table-cell">Created</TableHead>
                      <TableHead className="min-w-[60px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedCodes.map((testCode, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono font-bold text-sm">{testCode.code}</TableCell>
                        <TableCell className="capitalize text-sm">{testCode.subject}</TableCell>
                        <TableCell className="uppercase text-sm">{testCode.class}</TableCell>
                        <TableCell className="text-sm hidden sm:table-cell">{testCode.questions}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{testCode.timeLimit} min</TableCell>
                        <TableCell className="text-sm hidden lg:table-cell">{new Date(testCode.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(testCode.code)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GenerateTestCode;