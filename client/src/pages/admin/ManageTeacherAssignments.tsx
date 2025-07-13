import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Plus, Check, Trash2, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  teacherId: string;
  subject: string;
  class: string;
  teacherName: string;
  createdAt: string;
}

interface NewAssignment {
  subject: string;
  class: string;
}

const ManageTeacherAssignments = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [newAssignments, setNewAssignments] = useState<NewAssignment[]>([{ subject: "", class: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, subjectsRes, classesRes, assignmentsRes] = await Promise.all([
        fetch('/api/teachers', { credentials: 'include' }),
        fetch('/api/subjects', { credentials: 'include' }),
        fetch('/api/classes', { credentials: 'include' }),
        fetch('/api/teacher-assignments', { credentials: 'include' })
      ]);

      const teachers = teachersRes.ok ? await teachersRes.json() : [];
      const subjects = subjectsRes.ok ? await subjectsRes.json() : [];
      const classes = classesRes.ok ? await classesRes.json() : [];
      const assignments = assignmentsRes.ok ? await assignmentsRes.json() : [];

      setTeachers(teachers);
      setSubjects(subjects);
      setClasses(classes);
      setAssignments(assignments);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const addNewAssignment = () => {
    setNewAssignments([...newAssignments, { subject: "", class: "" }]);
  };

  const removeAssignment = (index: number) => {
    if (newAssignments.length > 1) {
      setNewAssignments(newAssignments.filter((_, i) => i !== index));
    }
  };

  const updateAssignment = (index: number, field: keyof NewAssignment, value: string) => {
    const updated = [...newAssignments];
    updated[index][field] = value;
    setNewAssignments(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeacher) {
      toast({
        title: "Error",
        description: "Please select a teacher",
        variant: "destructive"
      });
      return;
    }

    const validAssignments = newAssignments.filter(a => a.subject && a.class);

    if (validAssignments.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one complete assignment",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/teacher-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          teacherId: selectedTeacher,
          assignments: validAssignments
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save assignments');
      }

      toast({
        title: "Success",
        description: "Teacher assignments updated successfully!",
      });

      // Reset form and refresh data
      setSelectedTeacher("");
      setNewAssignments([{ subject: "", class: "" }]);
      fetchData();

    } catch (error: any) {
      console.error('Error saving assignments:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save assignments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTeacherAssignments = (teacherId: string) => {
    return assignments.filter(a => a.teacherId === teacherId);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/teacher-assignments/${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }

      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });

      // Refresh assignments
      fetchData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to delete assignment. Please try again.",
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
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Teacher Assignments</h1>
            <p className="text-gray-600 mt-1">Assign subjects and classes to teachers</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Assignment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Assign Subjects & Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="teacher">Select Teacher</Label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name} ({teacher.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Assignments</Label>
                  {newAssignments.map((assignment, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label htmlFor={`subject-${index}`}>Subject</Label>
                        <Select 
                          value={assignment.subject} 
                          onValueChange={(value) => updateAssignment(index, "subject", value)}
                        >
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

                      <div className="flex-1">
                        <Label htmlFor={`class-${index}`}>Class</Label>
                        <Select 
                          value={assignment.class} 
                          onValueChange={(value) => updateAssignment(index, "class", value)}
                        >
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

                      {newAssignments.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeAssignment(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addNewAssignment}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Assignment
                  </Button>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Saving..." : "Save Assignments"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Current Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Current Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teachers.map(teacher => {
                  const teacherAssignments = getTeacherAssignments(teacher.id);
                  return (
                    <div key={teacher.id} className="border rounded-lg p-4">
                      <div className="font-medium text-lg mb-2">{teacher.name}</div>
                      <div className="text-sm text-gray-600 mb-2">{teacher.email}</div>
                      <div className="space-y-2">
                        {teacherAssignments.length > 0 ? (
                          teacherAssignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <Badge variant="secondary">
                                {assignment.subject} - {assignment.class}
                              </Badge>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedTeacher(teacher.id);
                                    setNewAssignments([{
                                      subject: assignment.subject,
                                      class: assignment.class
                                    }]);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete the assignment "{assignment.subject} - {assignment.class}" for {teacher.name}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteAssignment(assignment.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500 italic">No assignments</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageTeacherAssignments;