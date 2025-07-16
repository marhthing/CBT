import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
// Using custom API endpoints instead of Supabase
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Search, GraduationCap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Question {
  id: string;
  question: string;
  subject: string;
  class: string;
  term: string;
  section: string;
  options: string[];
  correctAnswer: number | string;
  createdAt: string;
  teacherId: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionType?: string;
  correctAnswerText?: string;
  imageUrl?: string;
  createdByName?: string;
  editedByName?: string;
  editedByRole?: string;
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

const ManageQuestions = () => {
  const { profile, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter data from database
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  useEffect(() => {
    if (user) {
      fetchQuestions();
      fetchFilterData();
    }
  }, [user]);

  const fetchFilterData = async () => {
    try {
      const [subjectsRes, classesRes, termsRes] = await Promise.all([
        fetch('/api/subjects', { credentials: 'include' }),
        fetch('/api/classes', { credentials: 'include' }),
        fetch('/api/terms', { credentials: 'include' })
      ]);

      const subjects = subjectsRes.ok ? await subjectsRes.json() : [];
      const classes = classesRes.ok ? await classesRes.json() : [];
      const terms = termsRes.ok ? await termsRes.json() : [];

      setSubjects(subjects);
      setClasses(classes);
      setTerms(terms);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions', { credentials: 'include' });
      const data = response.ok ? await response.json() : [];

      const formattedQuestions: Question[] = data.map((q: any) => ({
        id: q.id,
        question: q.question,
        subject: q.subject,
        class: q.class,
        term: q.term,
        section: q.section,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
        correctAnswer: q.correctAnswer,
        createdAt: q.createdAt,
        teacherId: q.teacherId,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        createdByName: q.createdByName,
        editedByName: q.editedByName,
        editedByRole: q.editedByRole,
      }));

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(question => {
    // Only show questions created by the current teacher
    const isOwnQuestion = question.teacherId === user?.id;
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !filterSubject || filterSubject === "all" || question.subject === filterSubject;
    const matchesClass = !filterClass || filterClass === "all" || question.class === filterClass;
    const matchesTerm = !filterTerm || filterTerm === "all" || question.term === filterTerm;
    return isOwnQuestion && matchesSearch && matchesSubject && matchesClass && matchesTerm;
  });

  const handleEditQuestion = async (updatedQuestion: Question) => {
    try {
      const response = await fetch(`/api/questions/${updatedQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          teacherId: updatedQuestion.teacherId,
          term: updatedQuestion.term,
          class: updatedQuestion.class,
          section: updatedQuestion.section,
          subject: updatedQuestion.subject,
          question: updatedQuestion.question,
          questionType: updatedQuestion.questionType,
          optionA: updatedQuestion.questionType === 'multiple_choice' || updatedQuestion.questionType === 'image_based' ? updatedQuestion.optionA : null,
          optionB: updatedQuestion.questionType === 'multiple_choice' || updatedQuestion.questionType === 'image_based' ? updatedQuestion.optionB : null,
          optionC: updatedQuestion.questionType === 'multiple_choice' || updatedQuestion.questionType === 'image_based' ? updatedQuestion.optionC : null,
          optionD: updatedQuestion.questionType === 'multiple_choice' || updatedQuestion.questionType === 'image_based' ? updatedQuestion.optionD : null,
          correctAnswer: updatedQuestion.correctAnswer,
          correctAnswerText: updatedQuestion.correctAnswerText,
          imageUrl: updatedQuestion.imageUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update question');
      }

      fetchQuestions();
      setIsEditDialogOpen(false);
      setEditingQuestion(null);

      toast({
        title: "Success",
        description: "Question updated successfully!",
      });
    } catch (error: any) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update question",
        variant: "destructive"
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      fetchQuestions();

      toast({
        title: "Success",
        description: "Question deleted successfully!",
      });
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete question",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getCorrectAnswerText = (question: Question) => {
    const answers = ['A', 'B', 'C', 'D'];
    return answers[question.correctAnswer];
  };

  if (loading || loadingFilters) {
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
            <h1 className="text-3xl font-bold text-gray-900">Manage Questions</h1>
            <p className="text-gray-600 mt-1">View, edit, or delete your questions for SURE FOUNDATION COMPREHENSIVE SCHOOL</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Filter Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTerm} onValueChange={setFilterTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {terms.map(term => (
                    <SelectItem key={term.id} value={term.name}>
                      {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 break-words">{question.question}</CardTitle>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      <span className="bg-blue-100 px-2 py-1 rounded">{question.subject}</span>
                      <span className="bg-green-100 px-2 py-1 rounded">{question.class}</span>
                      <span className="bg-purple-100 px-2 py-1 rounded">{question.term}</span>
                      <span className="bg-yellow-100 px-2 py-1 rounded">Section {question.section}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingQuestion(question);
                        setIsEditDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">Options:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {question.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded border text-sm ${
                          index === question.correctAnswer
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        {index === question.correctAnswer && "✓ "}
                        <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Created: {new Date(question.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredQuestions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No questions found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
        {/* Edit Question Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
            </DialogHeader>
            {editingQuestion && (
              <EditQuestionForm
                question={editingQuestion}
                onSave={handleEditQuestion}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setEditingQuestion(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

// Edit Question Form Component
const EditQuestionForm = ({
  question,
  onSave,
  onCancel
}: {
  question: Question;
  onSave: (question: Question) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    ...question,
    questionType: question.questionType || 'multiple_choice',
    correctAnswerText: question.correctAnswerText || '',
    imageUrl: question.imageUrl || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleQuestionTypeChange = (newType: string) => {
    setFormData(prev => ({
      ...prev,
      questionType: newType,
      correctAnswer: newType === "true_false" ? "true" : newType === "multiple_choice" ? 0 : "",
      options: newType === "multiple_choice" || newType === "image_based" ? [prev.optionA, prev.optionB, prev.optionC, prev.optionD] : []
    }));
  };

  const renderQuestionTypeFields = () => {
    switch (formData.questionType) {
      case 'multiple_choice':
      case 'image_based':
        return (
          <>
            {formData.questionType === 'image_based' && (
              <div>
                <Label>Image URL</Label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Enter image URL..."
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Option A</Label>
                <Input
                  value={formData.optionA}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    optionA: e.target.value,
                    options: [e.target.value, prev.optionB, prev.optionC, prev.optionD]
                  }))}
                  required
                />
              </div>
              <div>
                <Label>Option B</Label>
                <Input
                  value={formData.optionB}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    optionB: e.target.value,
                    options: [prev.optionA, e.target.value, prev.optionC, prev.optionD]
                  }))}
                  required
                />
              </div>
              <div>
                <Label>Option C</Label>
                <Input
                  value={formData.optionC}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    optionC: e.target.value,
                    options: [prev.optionA, prev.optionB, e.target.value, prev.optionD]
                  }))}
                  required
                />
              </div>
              <div>
                <Label>Option D</Label>
                <Input
                  value={formData.optionD}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    optionD: e.target.value,
                    options: [prev.optionA, prev.optionB, prev.optionC, e.target.value]
                  }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Correct Answer</Label>
              <RadioGroup
                value={formData.correctAnswer.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, correctAnswer: parseInt(value) }))}
                className="flex flex-wrap gap-4 mt-2"
              >
                {['A', 'B', 'C', 'D'].map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`correct-${index}`} />
                    <Label htmlFor={`correct-${index}`}>Option {option}</Label>
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
              value={formData.correctAnswer.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, correctAnswer: value }))}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="edit-true" />
                <Label htmlFor="edit-true">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="edit-false" />
                <Label htmlFor="edit-false">False</Label>
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
              value={formData.correctAnswerText}
              onChange={(e) => setFormData(prev => ({ ...prev, correctAnswerText: e.target.value }))}
              placeholder="Enter the correct answer or sample answer..."
              rows={formData.questionType === 'essay' ? 4 : 2}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Question Type</Label>
        <Select value={formData.questionType} onValueChange={handleQuestionTypeChange}>
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
        <Label>Question</Label>
        <Textarea
          value={formData.question}
          onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
          required
          rows={3}
        />
      </div>

      {renderQuestionTypeFields()}

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto">
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default ManageQuestions;