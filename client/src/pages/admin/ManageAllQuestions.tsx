import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
// Using custom API endpoints instead of Supabase
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Search, User, GraduationCap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
  teacher: string;
  questionType?: string;
  correctAnswerText?: string;
  imageUrl?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  createdByName: string;
  createdByRole: string;
  editedByName: string | null;
  editedByRole: string | null;
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

const ManageAllQuestions = () => {
  const { profile, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

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
      // Fetch questions from API
      const questionsRes = await fetch('/api/questions', { credentials: 'include' });
      const questionsData = questionsRes.ok ? await questionsRes.json() : [];

      const formattedQuestions: Question[] = questionsData.map((q: any) => ({
        id: q.id,
        question: q.question,
        subject: q.subject,
        class: q.class,
        term: q.term,
        section: q.section,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
        correctAnswer: q.correctAnswer,
        createdAt: q.createdAt,
        teacher: 'Teacher', // For now - we'll need to add teacher name lookup later
        createdByName: q.createdByName || 'Unknown',
        createdByRole: q.createdByRole || 'Unknown',
        editedByName: q.editedByName || null,
        editedByRole: q.editedByRole || null,
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
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !filterSubject || filterSubject === "all" || question.subject === filterSubject;
    const matchesClass = !filterClass || filterClass === "all" || question.class === filterClass;
    const matchesTerm = !filterTerm || filterTerm === "all" || question.term === filterTerm;
    const matchesTeacher = !filterTeacher || question.teacher.toLowerCase().includes(filterTeacher.toLowerCase());
    return matchesSearch && matchesSubject && matchesClass && matchesTerm && matchesTeacher;
  });

  const handleEdit = (id: string) => {
    toast({
      title: "Edit Question",
      description: "Edit functionality would be implemented here",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setQuestions(questions.filter(q => q.id !== id));

      toast({
        title: "Question Deleted",
        description: "Question has been removed successfully",
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    }
  };

  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      Mathematics: "bg-blue-100 text-blue-800",
      Physics: "bg-green-100 text-green-800",
      Chemistry: "bg-purple-100 text-purple-800",
      Biology: "bg-yellow-100 text-yellow-800",
      English: "bg-red-100 text-red-800"
    };
    return colors[subject] || "bg-gray-100 text-gray-800";
  };

  const getCorrectAnswerText = (question: Question) => {
    const answers = ['A', 'B', 'C', 'D'];
    return answers[question.correctAnswer];
  };

  const handleEditQuestion = async (updatedQuestion: Question) => {
    try {
      const response = await fetch(`/api/questions/${updatedQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          question: updatedQuestion.question,
          subject: updatedQuestion.subject,
          class: updatedQuestion.class,
          term: updatedQuestion.term,
          section: updatedQuestion.section,
          questionType: updatedQuestion.questionType,
          optionA: updatedQuestion.questionType === 'multiple_choice' || updatedQuestion.questionType === 'image_based' ? updatedQuestion.options[0] : null,
          optionB: updatedQuestion.questionType === 'multiple_choice' || updatedQuestion.questionType === 'image_based' ? updatedQuestion.options[1] : null,
          optionC: updatedQuestion.questionType === 'multiple_choice' || updatedQuestion.questionType === 'image_based' ? updatedQuestion.options[2] : null,
          optionD: updatedQuestion.questionType === 'multiple_choice' || updatedQuestion.questionType === 'image_based' ? updatedQuestion.options[3] : null,
          correctAnswer: updatedQuestion.correctAnswer,
          correctAnswerText: updatedQuestion.correctAnswerText,
          imageUrl: updatedQuestion.imageUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update question');
      }

      // Close the edit dialog and clear state
      setShowEditDialog(false);
      setSelectedQuestion(null);

      // Refresh questions list
      fetchQuestions();

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

      // Refresh questions list
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
            <h1 className="text-3xl font-bold text-gray-900">Manage All Questions</h1>
            <p className="text-gray-600 mt-1">View, edit, or delete questions from all teachers at SURE FOUNDATION COMPREHENSIVE SCHOOL</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
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

              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Filter by teacher..."
                  value={filterTeacher}
                  onChange={(e) => setFilterTeacher(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px] sm:w-[200px] md:w-[300px]">Question</TableHead>
              <TableHead className="w-[80px] sm:w-[100px]">Subject</TableHead>
              <TableHead className="w-[60px] sm:w-[80px]">Class</TableHead>
              <TableHead className="w-[70px] sm:w-[80px] hidden sm:table-cell">Term</TableHead>
              <TableHead className="w-[80px] sm:w-[100px] hidden md:table-cell">Session</TableHead>
              <TableHead className="w-[80px] sm:w-[100px] hidden lg:table-cell">Created By</TableHead>
              <TableHead className="w-[80px] sm:w-[100px] hidden xl:table-cell">Created</TableHead>
              <TableHead className="w-[80px] sm:w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions.map((question) => (
              <TableRow key={question.id}>
                <TableCell className="max-w-xs truncate">{question.question}</TableCell>
                <TableCell>{question.subject}</TableCell>
                <TableCell>{question.class}</TableCell>
                <TableCell>{question.term}</TableCell>
                <TableCell className="text-sm">
                  <div>
                    <span className="text-gray-900">
                      {question.createdByName}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({question.createdByRole})
                    </span>
                  </div>
                  {question.editedByName && (
                    <div className="mt-1">
                      <span className="text-orange-600 text-xs">
                        Edited by {question.editedByName}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({question.editedByRole})
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(question.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedQuestion(question);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredQuestions.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-500">
                No questions match your current search criteria. Try adjusting your filters.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="text-center py-6">
            <p className="text-sm text-gray-500">
              Showing {filteredQuestions.length} of {questions.length} questions
            </p>
          </CardContent>
        </Card>
      </div>

      {selectedQuestion && (
        <EditQuestionDialog
          question={selectedQuestion}
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedQuestion(null);
          }}
          onSave={handleEditQuestion}
        />
      )}
    </DashboardLayout>
  );
};

// Edit Question Dialog Component
const EditQuestionDialog = ({
  question,
  isOpen,
  onClose,
  onSave
}: {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Question) => void;
}) => {
  const [editData, setEditData] = useState({
    question: question.question,
    questionType: question.questionType || 'multiple_choice',
    options: [...question.options],
    correctAnswer: question.correctAnswer,
    correctAnswerText: question.correctAnswerText || '',
    imageUrl: question.imageUrl || ''
  });

  useEffect(() => {
    setEditData({
      question: question.question,
      questionType: question.questionType || 'multiple_choice',
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      correctAnswerText: question.correctAnswerText || '',
      imageUrl: question.imageUrl || ''
    });
  }, [question]);

  const handleQuestionTypeChange = (newType: string) => {
    setEditData(prev => ({
      ...prev,
      questionType: newType,
      correctAnswer: newType === "true_false" ? "true" : newType === "multiple_choice" ? 0 : "",
      options: newType === "multiple_choice" || newType === "image_based" ? [...prev.options] : ["", "", "", ""]
    }));
  };

  const renderQuestionTypeFields = () => {
    switch (editData.questionType) {
      case 'multiple_choice':
      case 'image_based':
        return (
          <>
            {editData.questionType === 'image_based' && (
              <div className="space-y-2">
                <Label htmlFor="edit-imageUrl">Image URL</Label>
                <Input
                  id="edit-imageUrl"
                  value={editData.imageUrl}
                  onChange={(e) => setEditData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Enter image URL..."
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="edit-optionA">Option A</Label>
              <Input
                id="edit-optionA"
                value={editData.options[0]}
                onChange={(e) => {
                  const newOptions = [...editData.options];
                  newOptions[0] = e.target.value;
                  setEditData(prev => ({ ...prev, options: newOptions }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-optionB">Option B</Label>
              <Input
                id="edit-optionB"
                value={editData.options[1]}
                onChange={(e) => {
                  const newOptions = [...editData.options];
                  newOptions[1] = e.target.value;
                  setEditData(prev => ({ ...prev, options: newOptions }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-optionC">Option C</Label>
              <Input
                id="edit-optionC"
                value={editData.options[2]}
                onChange={(e) => {
                  const newOptions = [...editData.options];
                  newOptions[2] = e.target.value;
                  setEditData(prev => ({ ...prev, options: newOptions }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-optionD">Option D</Label>
              <Input
                id="edit-optionD"
                value={editData.options[3]}
                onChange={(e) => {
                  const newOptions = [...editData.options];
                  newOptions[3] = e.target.value;
                  setEditData(prev => ({ ...prev, options: newOptions }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <RadioGroup 
                value={String(editData.correctAnswer)} 
                onValueChange={(value) => setEditData(prev => ({ ...prev, correctAnswer: parseInt(value) }))}
                className="flex flex-row space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="edit-correct-a" />
                  <Label htmlFor="edit-correct-a">A</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="edit-correct-b" />
                  <Label htmlFor="edit-correct-b">B</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="edit-correct-c" />
                  <Label htmlFor="edit-correct-c">C</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="edit-correct-d" />
                  <Label htmlFor="edit-correct-d">D</Label>
                </div>
              </RadioGroup>
            </div>
          </>
        );

      case 'true_false':
        return (
          <div className="space-y-2">
            <Label>Correct Answer</Label>
            <RadioGroup
              value={editData.correctAnswer.toString()}
              onValueChange={(value) => setEditData(prev => ({ ...prev, correctAnswer: value }))}
              className="flex gap-4"
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
          <div className="space-y-2">
            <Label htmlFor="edit-correctAnswerText">Correct Answer / Sample Answer</Label>
            <Textarea
              id="edit-correctAnswerText"
              value={editData.correctAnswerText}
              onChange={(e) => setEditData(prev => ({ ...prev, correctAnswerText: e.target.value }))}
              placeholder="Enter the correct answer or sample answer..."
              rows={editData.questionType === 'essay' ? 4 : 2}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const handleSave = () => {
    const updatedQuestion = {
      ...question,
      question: editData.question,
      questionType: editData.questionType,
      options: editData.options,
      correctAnswer: editData.correctAnswer,
      correctAnswerText: editData.correctAnswerText,
      imageUrl: editData.imageUrl,
      optionA: editData.options[0],
      optionB: editData.options[1],
      optionC: editData.options[2],
      optionD: editData.options[3]
    };
    onSave(updatedQuestion);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-questionType">Question Type</Label>
            <Select value={editData.questionType} onValueChange={handleQuestionTypeChange}>
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

          <div className="space-y-2">
            <Label htmlFor="edit-question">Question</Label>
            <Textarea
              id="edit-question"
              value={editData.question}
              onChange={(e) => setEditData(prev => ({ ...prev, question: e.target.value }))}
              className="resize-none"
              rows={3}
            />
          </div>

          {renderQuestionTypeFields()}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageAllQuestions;