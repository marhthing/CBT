import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StudentDashboard from "./pages/student/StudentDashboard";
import TakeTest from "./pages/student/TakeTest";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import UploadQuestions from "./pages/teacher/UploadQuestions";
import ManageQuestions from "./pages/teacher/ManageQuestions";
import AdminDashboard from "./pages/admin/AdminDashboard";
import GenerateTestCode from "@/pages/admin/GenerateTestCode";
import ManageTestCodeBatches from "@/pages/admin/ManageTestCodeBatches";
import ManageAllQuestions from "@/pages/admin/ManageAllQuestions";
import AdminUploadQuestions from "@/pages/admin/UploadQuestions";
import ManageTeacherAssignments from "@/pages/admin/ManageTeacherAssignments";
import ExportResults from './pages/admin/ExportResults';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/take-test"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <TakeTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Teacher Routes */}
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/upload-questions"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <UploadQuestions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/manage-questions"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <ManageQuestions />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/generate-test-code"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <GenerateTestCode />
                </ProtectedRoute>
              }
            />
              <Route path="/admin/manage-test-batches" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageTestCodeBatches />
                </ProtectedRoute>
              } />
            <Route
              path="/admin/manage-all-questions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageAllQuestions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/upload-questions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUploadQuestions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-teacher-assignments"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageTeacherAssignments />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/export-results" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExportResults />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;