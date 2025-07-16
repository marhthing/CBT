import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GraduationCap, Upload, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Question {
  question: string;
  questionType: string;
  options: string[];
  correctAnswer: number | string;
  correctAnswerText?: string;
  imageUrl?: string;
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

const TeacherUploadQuestions = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    term: "",
    class: "",
    subject: "",
    session: ""
  });
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", questionType: "multiple_choice", options: ["", "", "", ""], correctAnswer: 0 }
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

  const addQuestion = () => {
    setQuestions([...questions, { question: "", questionType: "multiple_choice", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const newQuestions = [...questions];
    if (field === "questionType") {
      // Reset answers when question type changes
      newQuestions[index] = {
        ...newQuestions[index],
        questionType: value as string,
        correctAnswer: value === "true_false" ? "true" : value === "multiple_choice" ? 0 : "",
        options: value === "multiple_choice" ? ["", "", "", ""] : []
      };
    } else {
      (newQuestions[index] as any)[field] = value;
    }
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const exportQuestionsTemplate = () => {
    const headers = [
      'Question',
      'Question Type',
      'Option A',
      'Option B', 
      'Option C',
      'Option D',
      'Correct Answer',
      'Correct Answer Text',
      'Image URL',
      'Score Per Question'
    ];

    const csvContent = [
      headers.join(','),
      // Example rows
      '"What is 2+2?","multiple_choice","2","3","4","5","2","","","1"',
      '"Is the sky blue?","true_false","","","","","true","","","1"',
      '"Complete: The capital of France is ___","fill_blank","","","","","","Paris","","1"',
      '"Explain photosynthesis","essay","","","","","","Sample answer about photosynthesis","","5"'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');

        const importedQuestions: Question[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split('","').map(val => val.replace(/^"|"$/g, ''));

          if (values.length >= 7) {
            const question: Question = {
              question: values[0],
              questionType: values[1] || 'multiple_choice',
              options: values[1] === 'multiple_choice' ? [values[2], values[3], values[4], values[5]] : [],
              correctAnswer: values[1] === 'multiple_choice' ? parseInt(values[6]) : values[6],
              correctAnswerText: values[7] || undefined,
              imageUrl: values[8] || undefined
            };
            importedQuestions.push(question);
          }
        }

        if (importedQuestions.length > 0) {
          setQuestions(importedQuestions);
          toast({
            title: "Success",
            description: `Imported ${importedQuestions.length} questions`,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.term || !formData.class || !formData.subject || !formData.session) {
      toast({
        title: "Error",
        description: "Please fill in all form fields",
        variant: "destructive"
      });
      return;
    }

    const hasEmptyQuestions = questions.some(q => {
      if (!q.question.trim()) return true;
      if (q.questionType === 'multiple_choice' && q.options.some(opt => !opt.trim())) return true;
      if ((q.questionType === 'fill_blank' || q.questionType === 'essay') && !q.correctAnswerText?.trim()) return true;
      return false;
    });

    if (hasEmptyQuestions) {
      toast({
        title: "Error",
        description: "Please fill in all required fields for each question",
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
        questionType: q.questionType,
        optionA: q.questionType === 'multiple_choice' || q.questionType === 'image_based' ? q.options[0] : null,
        optionB: q.questionType === 'multiple_choice' || q.questionType === 'image_based' ? q.options[1] : null,
        optionC: q.questionType === 'multiple_choice' || q.questionType === 'image_based' ? q.options[2] : null,
        optionD: q.questionType === 'multiple_choice' || q.questionType === 'image_based' ? q.options[3] : null,
        correctAnswer: q.questionType === 'multiple_choice' || q.questionType === 'image_based' ? q.correctAnswer.toString() : q.correctAnswer,
        correctAnswerText: q.correctAnswerText || null,
        imageUrl: q.imageUrl || null
      }));

      const response = await fetch('/api/questions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ questions: questionsToInsert })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload questions');
      }

      toast({
        title: "Success",
        description: `${questions.length} questions uploaded successfully!`,
      });

      // Reset form
      setFormData(prev => ({ ...prev, term: "", class: "", subject: "" }));
      setQuestions([{ question: "", questionType: "multiple_choice", options: ["", "", "", ""], correctAnswer: 0 }]);

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

  const renderQuestionTypeFields = (question: Question, questionIndex: number) => {
    switch (question.questionType) {
      case 'multiple_choice':
        return (
          <>
            <div>
              <Label>Options</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
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
                className="flex flex-wrap gap-4 mt-2"
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
          </>
        );

      case 'true_false':
        return (
          <div>
            <Label>Correct Answer</Label>
            <RadioGroup
              value={question.correctAnswer.toString()}
              onValueChange={(value) => updateQuestion(questionIndex, "correctAnswer", value)}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`true-${questionIndex}`} />
                <Label htmlFor={`true-${questionIndex}`}>True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`false-${questionIndex}`} />
                <Label htmlFor={`false-${questionIndex}`}>False</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'fill_blank':
      case 'essay':
        return (
          <div>
            <Label>Correct Answer / Sample Answer</Label>
            <Textarea
              placeholder="Enter the correct answer or sample answer..."
              value={question.correctAnswerText || ""}
              onChange={(e) => updateQuestion(questionIndex, "correctAnswerText", e.target.value)}
              className="mt-1"
              rows={question.questionType === 'essay' ? 4 : 2}
            />
          </div>
        );

      case 'image_based':
        return (
          <>
            <div>
              <Label>Image URL</Label>
              <Input
                placeholder="Enter image URL..."
                value={question.imageUrl || ""}
                onChange={(e) => updateQuestion(questionIndex, "imageUrl", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Options</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
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
                className="flex flex-wrap gap-4 mt-2"
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
          </>
        );

      default:
        return null;
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

        {/* Bulk Operations */}
        <Card>
          <CardHeader>
            <CardTitle>Bulk Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={exportQuestionsTemplate}
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>

              <div className="flex items-center">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleBulkImport}
                  className="hidden"
                  id="bulk-import"
                />
                <Label htmlFor="bulk-import" className="cursor-pointer">
                  <Button type="button" variant="outline" className="flex items-center" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Questions (CSV)
                    </span>
                  </Button>
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Information</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <Label htmlFor={`question-type-${questionIndex}`}>Question Type</Label>
                  <Select 
                    value={question.questionType} 
                    onValueChange={(value) => updateQuestion(questionIndex, "questionType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="image_based">Image-Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`question-${questionIndex}`}>Question</Label>
                  <Textarea
                    id={`question-${questionIndex}`}
                    placeholder="Enter your question here..."
                    value={question.question}
                    onChange={(e) => updateQuestion(questionIndex, "question", e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {renderQuestionTypeFields(question, questionIndex)}
              </CardContent>
            </Card>
          ))}

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={addQuestion}
              className="flex items-center w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>

            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Uploading..." : "Upload Questions"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default TeacherUploadQuestions;