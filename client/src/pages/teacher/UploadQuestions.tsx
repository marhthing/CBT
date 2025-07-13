import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
// Using custom API endpoints instead of Supabase
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
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

const UploadQuestions = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    term: "",
    class: "",
    subject: "",
    session: ""
  });
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", options: ["", "", "", ""], correctAnswer: 0 }
  ]);
  const [isLoading, setIsLoading] = useState(false);
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
      const [assignmentsRes, termsRes, sessionsRes] = await Promise.all([
        fetch('/api/my-assignments', { credentials: 'include' }),
        fetch('/api/terms', { credentials: 'include' }),
        fetch('/api/sessions', { credentials: 'include' })
      ]);

      const assignments = assignmentsRes.ok ? await assignmentsRes.json() : [];
      const terms = termsRes.ok ? await termsRes.json() : [];
      const sessions = sessionsRes.ok ? await sessionsRes.json() : [];

      console.log('Teacher assignments:', assignments);

      // Extract unique subjects and classes from assignments
      const uniqueSubjects = [...new Set(assignments.map((a: any) => a.subject))].map(name => ({ id: name, name }));
      const uniqueClasses = [...new Set(assignments.map((a: any) => a.class))].map(name => ({ id: name, name }));

      setSubjects(uniqueSubjects);
      setClasses(uniqueClasses);
      setTerms(terms);
      setSessions(sessions);

      // Set current session as default
      const currentSession = sessions.find((s: any) => s.isCurrent);
      if (currentSession) {
        setFormData(prev => ({ ...prev, session: currentSession.name }));
      }

      // Show message if no assignments
      if (assignments.length === 0) {
        toast({
          title: "No Assignments",
          description: "You have no subject/class assignments. Please contact the administrator.",
          variant: "destructive"
        });
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

  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const newQuestions = [...questions];
    if (field === "question" && typeof value === "string") {
      newQuestions[index].question = value;
    } else if (field === "correctAnswer" && typeof value === "number") {
      newQuestions[index].correctAnswer = value;
    }
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.term || !formData.class  || !formData.subject || !formData.session) {
      toast({
        title: "Error",
        description: "Please fill in all form fields",
        variant: "destructive"
      });
      return;
    }

    const hasEmptyQuestions = questions.some(q => 
      !q.question.trim() || q.options.some(opt => !opt.trim())
    );

    if (hasEmptyQuestions) {
      toast({
        title: "Error",
        description: "Please fill in all questions and options",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload questions",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
        const questionsToInsert = questions.map(q => ({
            teacherId: user.id,
            term: formData.term,
            class: formData.class,
            section: formData.session,
            subject: formData.subject,
            question: q.question,
            optionA: q.options[0],
            optionB: q.options[1],
            optionC: q.options[2],
            optionD: q.options[3],
            correctAnswer: q.correctAnswer
        }));

        const response = await fetch('/api/questions/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ questions: questionsToInsert }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload questions');
        }

        toast({
            title: "Success",
            description: `${questions.length} questions uploaded successfully!`,
        });

        // Reset form
        setFormData(prev => ({ ...prev, term: "", class: "", subject: "" }));
        setQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }]);

        } catch (error: any) {
          console.error('Error uploading questions:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to upload questions",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
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
            <h1 className="text-3xl font-bold text-gray-900">Upload Questions</h1>
            <p className="text-gray-600 mt-1">Create and upload questions for SURE FOUNDATION COMPREHENSIVE SCHOOL</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              </div>
            </CardContent>
          </Card>

          {questions.map((question, questionIndex) => (
            <Card key={questionIndex}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Question {questionIndex + 1}</CardTitle>
                {questions.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`question-${questionIndex}`}>Question</Label>
                  <Textarea
                    id={`question-${questionIndex}`}
                    placeholder="Enter your question here..."
                    value={question.question}
                    onChange={(e) => updateQuestion(questionIndex, "question", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Options</Label>
                  <div className="space-y-2 mt-2">
                    {question.options.map((option, optionIndex) => (
                      <Input
                        key={optionIndex}
                        placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                        value={option}
                        onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Correct Answer</Label>
                  <RadioGroup
                    value={question.correctAnswer.toString()}
                    onValueChange={(value) => updateQuestion(questionIndex, "correctAnswer", parseInt(value))}
                    className="flex space-x-4 mt-2"
                  >
                    {question.options.map((_, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={optionIndex.toString()} id={`correct-${questionIndex}-${optionIndex}`} />
                        <Label htmlFor={`correct-${questionIndex}-${optionIndex}`}>
                          Option {String.fromCharCode(65 + optionIndex)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={addQuestion}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Uploading..." : "Upload Questions"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default UploadQuestions;