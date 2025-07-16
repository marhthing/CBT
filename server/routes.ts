import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProfileSchema, insertQuestionSchema, insertTestCodeSchema, insertTestCodeBatchSchema, insertTestResultSchema, profiles, teacherAssignments, testResults, testCodes, testCodeBatches, questions } from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import { z } from "zod";
import { db } from "./db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Helper function for generating random codes
const generateRandomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  }));

  // Auth routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, fullName, role } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({ email, passwordHash });

      // Create profile
      const profile = await storage.createProfile({
        userId: user.id,
        email,
        fullName,
        role
      });

      res.json({ user: { id: user.id, email: user.email }, profile });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/auth/signin', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Get profile
      const profile = await storage.getProfile(user.id);
      if (!profile) {
        return res.status(401).json({ error: "Profile not found" });
      }

      // Set session
      req.session.user = { id: user.id, email: user.email };
      req.session.profile = profile;

      res.json({ user: { id: user.id, email: user.email }, profile });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/auth/signout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Signed out successfully" });
    });
  });

  app.get('/api/auth/session', (req, res) => {
    if (req.session?.user) {
      res.json({ user: req.session.user, profile: req.session.profile });
    } else {
      res.json({ user: null, profile: null });
    }
  });

  // Reference data routes
  app.get('/api/subjects', async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      console.error('Get subjects error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin stats endpoint
  app.get('/api/admin/stats', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Count students by getting all profiles with role 'student'
      const studentsCount = await db.select({ count: sql`count(*)` }).from(profiles).where(eq(profiles.role, 'student'));

      res.json({
        totalStudents: Number(studentsCount[0]?.count || 0)
      });
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get('/api/classes', async (req, res) => {
    try {
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error) {
      console.error('Get classes error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get('/api/terms', async (req, res) => {
    try {
      const terms = await storage.getTerms();
      res.json(terms);
    } catch (error) {
      console.error('Get terms error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get('/api/sessions', async (req, res) => {
    try {
      const sessions = await storage.getSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Question routes
  app.get('/api/questions', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;
      let questions;

      if (profile.role === 'admin') {
        questions = await storage.getQuestions();
      } else if (profile.role === 'teacher') {
        questions = await storage.getQuestionsByTeacher(req.session.user.id);
      } else {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(questions);
    } catch (error) {
      console.error('Get questions error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/questions', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'teacher' && profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      // If teacher, check if they have assignment for this subject and class
      if (profile.role === 'teacher') {
        const assignments = await storage.getTeacherAssignmentsByTeacher(req.session.user.id);
        const hasAssignment = assignments.some(assignment => 
          assignment.subject === req.body.subject && assignment.class === req.body.class
        );

        if (!hasAssignment) {
          return res.status(403).json({ error: "You are not assigned to this subject and class" });
        }
      }

      // Transform correctAnswer to string if it's a number
      const requestBody = { ...req.body };
      if (typeof requestBody.correctAnswer === 'number') {
        requestBody.correctAnswer = requestBody.correctAnswer.toString();
      }

      const validatedData = insertQuestionSchema.parse({
        ...requestBody,
        teacherId: req.session.user.id
      });

      const question = await storage.createQuestion(validatedData);
      res.json(question);
    } catch (error) {
      console.error('Create question error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/questions/bulk', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'teacher' && profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { questions } = req.body;

      // If teacher, check assignments for the first question (all should be same subject/class)
      if (profile.role === 'teacher' && questions.length > 0) {
        const assignments = await storage.getTeacherAssignmentsByTeacher(req.session.user.id);
        const hasAssignment = assignments.some(assignment => 
          assignment.subject === questions[0].subject && assignment.class === questions[0].class
        );

        if (!hasAssignment) {
          return res.status(403).json({ error: "You are not assigned to this subject and class" });
        }
      }

      const createdQuestions = [];

      for (const questionData of questions) {
        // Transform correctAnswer to string if it's a number
        const processedQuestionData = { ...questionData };
        if (typeof processedQuestionData.correctAnswer === 'number') {
          processedQuestionData.correctAnswer = processedQuestionData.correctAnswer.toString();
        }

        const validatedData = insertQuestionSchema.parse({
          ...processedQuestionData,
          teacherId: req.session.user.id
        });

        const question = await storage.createQuestion(validatedData);
        createdQuestions.push(question);
      }

      res.json(createdQuestions);
    } catch (error) {
      console.error('Bulk create questions error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put('/api/questions/:id', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;
      const { id } = req.params;

      if (profile.role !== 'teacher' && profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Check if question exists and user has permission
      const existingQuestion = await storage.getQuestion(id);
      if (!existingQuestion) {
        return res.status(404).json({ error: "Question not found" });
      }

      if (profile.role === 'teacher' && existingQuestion.teacherId !== req.session.user.id) {
        return res.status(403).json({ error: "You can only edit your own questions" });
      }

      // Transform correctAnswer to string if it's a number
      const requestBody = { ...req.body };
      if (typeof requestBody.correctAnswer === 'number') {
        requestBody.correctAnswer = requestBody.correctAnswer.toString();
      }

      const validatedData = insertQuestionSchema.parse({
        ...requestBody,
        teacherId: existingQuestion.teacherId
      });

      const updatedQuestion = await storage.updateQuestion(id, validatedData, req.session.user.id);
      res.json(updatedQuestion);
    } catch (error) {
      console.error('Update question error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete('/api/questions/:id', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;
      const { id } = req.params;

      if (profile.role !== 'teacher' && profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Check if question exists and user has permission
      const existingQuestion = await storage.getQuestion(id);
      if (!existingQuestion) {
        return res.status(404).json({ error: "Question not found" });
      }

      if (profile.role === 'teacher' && existingQuestion.teacherId !== req.session.user.id) {
        return res.status(403).json({ error: "You can only delete your own questions" });
      }

      await storage.deleteQuestion(id);
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error('Delete question error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Questions for test endpoint
  app.get('/api/questions/for-test', async (req, res) => {
    try {
      const { subject, class: className, term, limit } = req.query;

      if (!subject || !className || !term || !limit) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      console.log('Fetching questions for:', { subject, className, term, limit });

      const questions = await storage.getQuestionsForTest(
        subject as string,
        className as string,
        term as string,
        parseInt(limit as string)
      );

      console.log(`Found ${questions.length} questions for test`);

      if (questions.length === 0) {
        console.log('No questions found for the specified criteria');
        return res.status(404).json({ 
          error: `No questions found for ${subject}, ${className}, ${term}` 
        });
      }

      res.json(questions);
    } catch (error) {
      console.error('Get questions for test error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Test code validation route (for students)
  app.get('/api/test-codes/validate/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const testCode = await storage.getTestCodeByCode(code);

      if (!testCode) {
        return res.status(404).json({ error: "Test code not found" });
      }

      if (!testCode.isActive) {
        return res.status(400).json({ error: "Test code is not active" });
      }

      res.json(testCode);
    } catch (error) {
      console.error('Validate test code error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/test-code-batches', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { numCodes, ...batchData } = req.body;

      // Validate the batch data
      const validatedBatchData = insertTestCodeBatchSchema.parse({
        ...batchData,
        adminId: req.session.user.id,
        totalCodes: numCodes
      });

      // Create batch
      const batch = await storage.createTestCodeBatch(validatedBatchData);

      // Generate codes for this batch
      const createdCodes = [];
      for (let i = 0; i < numCodes; i++) {
        const code = generateRandomCode();

        const testCode = await storage.createTestCode({
          code,
          batchId: batch.id,
          adminId: req.session.user.id,
          term: batchData.term,
          class: batchData.class,
          section: batchData.section,
          subject: batchData.subject,
          session: batchData.session,
          testType: batchData.testType,
          numQuestions: batchData.numQuestions,
          timeLimit: batchData.timeLimit,
          scorePerQuestion: batchData.scorePerQuestion,
          isActive: false
        });

        createdCodes.push(testCode);
      }

      res.json({ batch, codes: createdCodes });
    } catch (error) {
      console.error('Create test code batch error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get('/api/test-code-batches', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const batches = await storage.getTestCodeBatches();
      res.json(batches);
    } catch (error) {
      console.error('Get test code batches error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get('/api/test-code-batches/:id/codes', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { id } = req.params;
      const codes = await storage.getTestCodesByBatch(id);
      res.json(codes);
    } catch (error) {
      console.error('Get batch codes error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put('/api/test-code-batches/:id/activate', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { id } = req.params;
      await storage.activateTestCodeBatch(id);
      res.json({ message: "Batch activated successfully" });
    } catch (error) {
      console.error('Activate batch error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put('/api/test-code-batches/:id/deactivate', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { id } = req.params;
      await storage.deactivateTestCodeBatch(id);
      res.json({ message: "Batch deactivated successfully" });
    } catch (error) {
      console.error('Deactivate batch error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete('/api/test-code-batches/:id', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { id } = req.params;
      await storage.deleteTestCodeBatch(id);
      res.json({ message: "Batch deleted successfully" });
    } catch (error) {
      console.error('Delete batch error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/test-codes', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const validatedData = insertTestCodeSchema.parse({
        ...req.body,
        adminId: req.session.user.id
      });

      const testCode = await storage.createTestCode(validatedData);
      res.json(testCode);
    } catch (error) {
      console.error('Create test code error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get('/api/test-codes/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const testCode = await storage.getTestCodeByCode(code);

      if (!testCode) {
        return res.status(404).json({ error: "Test code not found" });
      }

      if (!testCode.isActive) {
        return res.status(400).json({ error: "Test code is not active" });
      }

      res.json(testCode);
    } catch (error) {
      console.error('Get test code error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put('/api/test-codes/:code/deactivate', requireAuth, async (req, res) => {
    try {
      const { code } = req.params;
      const profile = req.session.profile;

      if (profile.role !== 'student') {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deactivateTestCode(code);
      res.json({ message: "Test code deactivated successfully" });
    } catch (error) {
      console.error('Deactivate test code error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put('/api/test-codes/:code/activate', requireAuth, async (req, res) => {
    try {
      const { code } = req.params;
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      await db
        .update(testCodes)
        .set({ isActive: true })
        .where(eq(testCodes.code, code));

      res.json({ message: "Test code activated successfully" });
    } catch (error) {
      console.error('Activate test code error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put('/api/test-codes/deactivate-all', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      await db
        .update(testCodes)
        .set({ isActive: false })
        .where(eq(testCodes.isActive, true));

      res.json({ message: "All test codes deactivated successfully" });
    } catch (error) {
      console.error('Deactivate all test codes error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Teacher assignment routes
  app.get('/api/teacher-assignments', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Get all assignments with teacher names
      const assignments = await db
        .select({
          id: teacherAssignments.id,
          teacherId: teacherAssignments.teacherId,
          subject: teacherAssignments.subject,
          class: teacherAssignments.class,
          createdAt: teacherAssignments.createdAt,
          teacherName: sql<string>`COALESCE(profiles.full_name, profiles.email)`,
        })
        .from(teacherAssignments)
        .leftJoin(profiles, eq(teacherAssignments.teacherId, profiles.userId));

      res.json(assignments);
    } catch (error) {
      console.error('Get teacher assignments error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/teacher-assignments', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { teacherId, assignments } = req.body;

      // Delete existing assignments for this teacher
      await db.delete(teacherAssignments).where(eq(teacherAssignments.teacherId, teacherId));

      // Insert new assignments
      const createdAssignments = [];
      for (const assignment of assignments) {
        const [created] = await db.insert(teacherAssignments).values({
          teacherId,
          subject: assignment.subject,
          class: assignment.class,
        }).returning();
        createdAssignments.push(created);
      }

      res.json(createdAssignments);
    } catch (error) {
      console.error('Create teacher assignments error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get('/api/teachers', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const teachers = await db
        .select({
          id: profiles.userId,
          name: sql<string>`COALESCE(profiles.full_name, profiles.email)`,
          email: profiles.email,
        })
        .from(profiles)
        .where(eq(profiles.role, 'teacher'));

      res.json(teachers);
    } catch (error) {
      console.error('Get teachers error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get('/api/my-assignments', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'teacher') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const assignments = await storage.getTeacherAssignmentsByTeacher(req.session.user.id);
      res.json(assignments);
    } catch (error) {
      console.error('Get my assignments error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete('/api/teacher-assignments/:id', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { id } = req.params;

      await db.delete(teacherAssignments).where(eq(teacherAssignments.id, id));

      res.json({ message: "Assignment deleted successfully" });
    } catch (error) {
      console.error('Delete teacher assignment error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Test result routes
  app.get('/api/test-results', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;
      let testResults = [];

      if (profile.role === 'admin') {
        testResults = await storage.getTestResultsWithTestCodes();
      } else if (profile.role === 'student') {
        testResults = await storage.getTestResultsByStudentWithTestCodes(req.session.user.id);
      } else {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Ensure we always return an array
      res.json(testResults || []);
    } catch (error) {
      console.error('Get test results error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/test-results', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'student') {
        return res.status(403).json({ error: "Forbidden" });
      }

      // First verify the test code exists
      const testCode = await storage.getTestCodeById(req.body.testCodeId);
      if (!testCode) {
        return res.status(400).json({ error: "Invalid test code" });
      }

      const validatedData = insertTestResultSchema.parse({
        ...req.body,
        studentId: req.session.user.id
      });

      const testResult = await storage.createTestResult(validatedData);
      res.json(testResult);
    } catch (error) {
      console.error('Create test result error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Filtered test results endpoint for admin export
  app.get('/api/test-results/filtered', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { subject, class: className, term, session: sessionName } = req.query;

      let query = db
        .select({
          id: testResults.id,
          score: testResults.score,
          totalPossibleScore: testResults.totalPossibleScore,
          timeTaken: testResults.timeTaken,
          createdAt: testResults.createdAt,
          studentName: sql<string>`COALESCE(profiles.full_name, profiles.email)`,
          testCodes: {
            subject: testCodes.subject,
            term: testCodes.term,
            class: testCodes.class,
            session: testCodes.session,
            testType: testCodes.testType
          }
        })
        .from(testResults)
        .leftJoin(testCodes, eq(testResults.testCodeId, testCodes.id))
        .leftJoin(profiles, eq(testResults.studentId, profiles.userId));

      const conditions = [];
      if (subject) conditions.push(eq(testCodes.subject, subject as string));
      if (className) conditions.push(eq(testCodes.class, className as string));
      if (term) conditions.push(eq(testCodes.term, term as string));
      if (sessionName) conditions.push(eq(testCodes.session, sessionName as string));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query;
      res.json(results);
    } catch (error) {
      console.error('Get filtered test results error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // CSV export endpoint for test results
  app.get('/api/test-results/export-csv', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { subject, class: className, term, session: sessionName } = req.query;

      // Get the filtered results
      let query = db
        .select({
          id: testResults.id,
          score: testResults.score,
          totalPossibleScore: testResults.totalPossibleScore,
          timeTaken: testResults.timeTaken,
          createdAt: testResults.createdAt,
          studentName: sql<string>`COALESCE(profiles.full_name, profiles.email)`,
          testCodes: {
            subject: testCodes.subject,
            term: testCodes.term,
            class: testCodes.class,
            session: testCodes.session,
            testType: testCodes.testType
          }
        })
        .from(testResults)
        .leftJoin(testCodes, eq(testResults.testCodeId, testCodes.id))
        .leftJoin(profiles, eq(testResults.studentId, profiles.userId));

      const conditions = [];
      if (subject) conditions.push(eq(testCodes.subject, subject as string));
      if (className) conditions.push(eq(testCodes.class, className as string));
      if (term) conditions.push(eq(testCodes.term, term as string));
      if (sessionName) conditions.push(eq(testCodes.session, sessionName as string));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query;

      if (results.length === 0) {
        return res.status(400).json({ error: "No results found for the selected filters" });
      }

      // Generate CSV content
      const csvHeaders = ['Student Name', 'Subject', 'Class', 'Term', 'Session', 'Test Type', 'Score', 'Total Possible Score', 'Percentage', 'Time Taken', 'Date'];
      const csvRows = results.map(result => {
        const percentage = Math.round((result.score / result.totalPossibleScore) * 100);
        const timeTaken = result.timeTaken ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s` : 'N/A';
        const date = new Date(result.createdAt).toLocaleDateString();

        return [
          result.studentName,
          result.testCodes.subject,
          result.testCodes.class,
          result.testCodes.term,
          result.testCodes.session,
          result.testCodes.testType,
          result.score.toString(),
          result.totalPossibleScore.toString(),
          `${percentage}%`,
          timeTaken,
          date
        ].map(field => `"${field}"`).join(',');
      });

      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="test_results_${subject}_${className}_${term}_${sessionName}.csv"`);

      res.send(csvContent);
    } catch (error) {
      console.error('Export CSV error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // PDF export endpoint for test results
  app.get('/api/test-results/export-pdf', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { subject, class: className, term, session: sessionName } = req.query;

      // Get the filtered results
      let query = db
        .select({
          id: testResults.id,
          score: testResults.score,
          totalPossibleScore: testResults.totalPossibleScore,
          timeTaken: testResults.timeTaken,
          createdAt: testResults.createdAt,
          studentName: sql<string>`COALESCE(profiles.full_name, profiles.email)`,
          testCodes: {
            subject: testCodes.subject,
            term: testCodes.term,
            class: testCodes.class,
            session: testCodes.session,
            testType: testCodes.testType
          }
        })
        .from(testResults)
        .leftJoin(testCodes, eq(testResults.testCodeId, testCodes.id))
        .leftJoin(profiles, eq(testResults.studentId, profiles.userId));

      const conditions = [];
      if (subject) conditions.push(eq(testCodes.subject, subject as string));
      if (className) conditions.push(eq(testCodes.class, className as string));
      if (term) conditions.push(eq(testCodes.term, term as string));
      if (sessionName) conditions.push(eq(testCodes.session, sessionName as string));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query;

      if (results.length === 0) {
        return res.status(400).json({ error: "No results found for the selected filters" });
      }

      // Generate PDF using html-pdf-node
      const pdf = require('html-pdf-node');

      // Create HTML content for the PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Test Results Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            .header-info { margin: 20px 0; }
            .header-info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #428bca; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Test Results Report</h1>
          <div class="header-info">
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Class:</strong> ${className}</p>
            <p><strong>Term:</strong> ${term}</p>
            <p><strong>Session:</strong> ${sessionName}</p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Test Type</th>
                <th>Score</th>
                <th>Total</th>
                <th>Percentage</th>
                <th>Time Taken</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${results.map(result => {
                const percentage = Math.round((result.score / result.totalPossibleScore) * 100);
                const timeTaken = result.timeTaken ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s` : 'N/A';
                const date = new Date(result.createdAt).toLocaleDateString();

                return `
                  <tr>
                    <td>${result.studentName}</td>
                    <td>${result.testCodes.testType}</td>
                    <td>${result.score}</td>
                    <td>${result.totalPossibleScore}</td>
                    <td>${percentage}%</td>
                    <td>${timeTaken}</td>
                    <td>${date}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const options = { format: 'A4' };
      const file = { content: htmlContent };

      // Generate PDF buffer
      const pdfBuffer = await pdf.generatePdf(file, options);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="test_results_${subject}_${className}_${term}_${sessionName}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Export PDF error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

// Get all test codes with batch info
app.get("/api/test-codes", requireAuth, async (req, res) => {
  try {
    const profile = req.session.profile;

    if (profile.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }

    const codes = await db
      .select({
        id: testCodes.id,
        code: testCodes.code,
        batchName: testCodeBatches.batchName,
        subject: testCodes.subject,
        class: testCodes.class,
        section: testCodes.section,
        term: testCodes.term,
        session: testCodes.session,
        testType: testCodes.testType,
        numQuestions: testCodes.numQuestions,
        timeLimit: testCodes.timeLimit,
        isActive: testCodes.isActive,
        createdAt: testCodes.createdAt,
        expiresAt: testCodes.expiresAt,
      })
      .from(testCodes)
      .leftJoin(testCodeBatches, eq(testCodes.batchId, testCodeBatches.id))
      .orderBy(desc(testCodes.createdAt));

    res.json(codes);
  } catch (error) {
    console.error("Error fetching test codes:", error);
    res.status(500).json({ error: "Failed to fetch test codes" });
  }
});

// Get all test code batches
app.get("/api/test-code-batches", async (req, res) => {
  try {
    const batches = await db
      .select()
      .from(testCodeBatches)
      .orderBy(desc(testCodeBatches.createdAt));

    res.json(batches);
  } catch (error) {
    console.error("Error fetching test code batches:", error);
    res.status(500).json({ error: "Failed to fetch test code batches" });
  }
});

// Get codes by batch ID
app.get("/api/test-code-batches/:batchId/codes", async (req, res) => {
  try {
    const { batchId } = req.params;
    const codes = await db
      .select()
      .from(testCodes)
      .where(eq(testCodes.batchId, batchId))
      .orderBy(desc(testCodes.createdAt));

    res.json(codes);
  } catch (error) {
    console.error("Error fetching codes for batch:", error);
    res.status(500).json({ error: "Failed to fetch codes for batch" });
  }
});

// Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Get total test results count (tests taken)
      const testsTakenResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(testResults);

      // Get total active test codes
      const activeCodesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(testCodes)
        .where(eq(testCodes.isActive, true));

      // Get total test codes (including inactive)
      const totalCodesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(testCodes);

      // Get total questions count
      const totalQuestionsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(questions);

      res.json({
        testsTaken: Number(testsTakenResult[0]?.count || 0),
        activeTestCodes: Number(activeCodesResult[0]?.count || 0),
        totalTestCodes: Number(totalCodesResult[0]?.count || 0),
        totalQuestions: Number(totalQuestionsResult[0]?.count || 0)
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Bulk export questions
  app.get('/api/questions/export', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { subject, class: className, term } = req.query;

      let query = db
        .select({
          id: questions.id,
          question: questions.question,
          questionType: questions.questionType,
          optionA: questions.optionA,
          optionB: questions.optionB,
          optionC: questions.optionC,
          optionD: questions.optionD,
          correctAnswer: questions.correctAnswer,
          correctAnswerText: questions.correctAnswerText,
          imageUrl: questions.imageUrl,
          subject: questions.subject,
          class: questions.class,
          term: questions.term,
          scorePerQuestion: questions.scorePerQuestion,
          teacherName: sql<string>`COALESCE(profiles.full_name, profiles.email)`,
        })
        .from(questions)
        .leftJoin(profiles, eq(questions.teacherId, profiles.userId));

      const conditions = [];
      if (subject) conditions.push(eq(questions.subject, subject as string));
      if (className) conditions.push(eq(questions.class, className as string));
      if (term) conditions.push(eq(questions.term, term as string));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const questionsData = await query;

      // Generate CSV content
      const csvHeaders = ['ID', 'Question', 'Question Type', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Correct Answer Text', 'Image URL', 'Subject', 'Class', 'Term', 'Score', 'Teacher'];
      const csvRows = questionsData.map(q => [
        q.id,
        q.question,
        q.questionType,
        q.optionA || '',
        q.optionB || '',
        q.optionC || '',
        q.optionD || '',
        q.correctAnswer || '',
        q.correctAnswerText || '',
        q.imageUrl || '',
        q.subject,
        q.class,
        q.term,
        q.scorePerQuestion?.toString() || '1',
        q.teacherName
      ].map(field => `"${field}"`).join(','));

      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="questions_export_${Date.now()}.csv"`);

      res.send(csvContent);
    } catch (error) {
      console.error('Export questions error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Bulk export students
  app.get('/api/students/export', requireAuth, async (req, res) => {
    try {
      const profile = req.session.profile;

      if (profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { search } = req.query;

      let query = db
        .select({
          id: profiles.userId,
          email: profiles.email,
          fullName: profiles.fullName,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .where(eq(profiles.role, 'student'));

      // Add search filter if provided
      if (search) {
        query = query.where(
          and(
            eq(profiles.role, 'student'),
            sql`(${profiles.fullName} ILIKE ${`%${search}%`} OR ${profiles.email} ILIKE ${`%${search}%`})`
          )
        );
      }

      const students = await query;

      // Generate CSV content
      const csvHeaders = ['ID', 'Email', 'Full Name', 'Registration Date'];
      const csvRows = students.map(student => [
        student.id,
        student.email,
        student.fullName || '',
        new Date(student.createdAt!).toLocaleDateString()
      ].map(field => `"${field}"`).join(','));

      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="students_export_${Date.now()}.csv"`);

      res.send(csvContent);
    } catch (error) {
      console.error('Export students error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const server = createServer(app);
  return server;
}