import { 
  users, 
  profiles, 
  subjects, 
  classes, 
  terms, 
  sessions, 
  questions, 
  testCodes, 
  testResults,
  teacherAssignments,
  testCodeBatches,
  type User, 
  type InsertUser, 
  type Profile,
  type InsertProfile,
  type Subject,
  type InsertSubject,
  type Class,
  type InsertClass,
  type Term,
  type InsertTerm,
  type Session,
  type InsertSession,
  type Question,
  type InsertQuestion,
  type TestCode,
  type InsertTestCode,
  type TestResult,
  type InsertTestResult,
  type InsertTeacherAssignment,
  type TestCodeBatch,
  type InsertTestCodeBatch
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, getTableColumns, and, inArray, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Profile operations
  getProfile(userId: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;

  // Subject operations
  getSubjects(): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;

  // Class operations
  getClasses(): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;

  // Term operations
  getTerms(): Promise<Term[]>;
  createTerm(term: InsertTerm): Promise<Term>;

  // Session operations
  getSessions(): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;

  // Question operations
  getQuestions(): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionsByTeacher(teacherId: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, question: InsertQuestion, editedBy?: string): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;

  // Test code operations
  getTestCodes(): Promise<TestCode[]>;
  getTestCodeByCode(code: string): Promise<TestCode | undefined>;
  getTestCodeById(id: string): Promise<TestCode | undefined>;
  createTestCode(testCode: InsertTestCode): Promise<TestCode>;

  // Test code batch operations
  createTestCodeBatch(data: InsertTestCodeBatch): Promise<TestCodeBatch>;
  getTestCodeBatches(): Promise<TestCodeBatch[]>;
  getTestCodesByBatch(batchId: string): Promise<TestCode[]>;
  activateTestCodeBatch(batchId: string): Promise<void>;
  deactivateTestCodeBatch(batchId: string): Promise<void>;
  deleteTestCodeBatch(batchId: string): Promise<void>;

  // Test result operations
  getTestResults(): Promise<TestResult[]>;
  getTestResultsByStudent(studentId: string): Promise<TestResult[]>;
  getTestResultsWithTestCodes(): Promise<any[]>;
  getTestResultsByStudentWithTestCodes(studentId: string): Promise<any[]>;
  createTestResult(testResult: InsertTestResult): Promise<TestResult>;

  getQuestionsForTest(subject: string, className: string, term: string, limit: number): Promise<Question[]>;
  deactivateTestCode(code: string): Promise<void>;

    // Teacher Assignment operations
  getTeacherAssignments(teacherId: string): Promise<any[]>;
  createTeacherAssignment(data: InsertTeacherAssignment): Promise<any>;
  deleteTeacherAssignment(id: string): Promise<void>;
  getTeacherAssignmentsByTeacher(teacherId: string): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private profiles: Map<string, Profile>;
  private subjects: Map<string, Subject>;
  private classes: Map<string, Class>;
  private terms: Map<string, Term>;
  private sessions: Map<string, Session>;
  private questions: Map<string, Question>;
  private testCodes: Map<string, TestCode>;
  private testResults: Map<string, TestResult>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.subjects = new Map();
    this.classes = new Map();
    this.terms = new Map();
    this.sessions = new Map();
    this.questions = new Map();
    this.testCodes = new Map();
    this.testResults = new Map();
    this.currentId = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSampleData() {
    // Create sample subjects
    const sampleSubjects = [
      { name: "Mathematics" },
      { name: "Physics" },
      { name: "Chemistry" },
      { name: "Biology" },
      { name: "English Language" },
      { name: "Literature" },
      { name: "Geography" },
      { name: "Economics" },
      { name: "Government" },
      { name: "History" }
    ];

    sampleSubjects.forEach(subject => {
      const id = this.generateId();
      const subjectData: Subject = {
        id,
        name: subject.name,
        createdAt: new Date()
      };
      this.subjects.set(id, subjectData);
    });

    // Create sample classes
    const sampleClasses = [
      { name: "SS1" },
      { name: "SS2" },
      { name: "SS3" }
    ];

    sampleClasses.forEach(cls => {
      const id = this.generateId();
      const classData: Class = {
        id,
        name: cls.name,
        createdAt: new Date()
      };
      this.classes.set(id, classData);
    });

    // Create sample terms
    const sampleTerms = [
      { name: "First Term" },
      { name: "Second Term" },
      { name: "Third Term" }
    ];

    sampleTerms.forEach(term => {
      const id = this.generateId();
      const termData: Term = {
        id,
        name: term.name,
        createdAt: new Date()
      };
      this.terms.set(id, termData);
    });

    // Create sample sessions
    const sampleSessions = [
      { name: "2023/2024", isCurrent: false },
      { name: "2024/2025", isCurrent: true },
      { name: "2025/2026", isCurrent: false }
    ];

    sampleSessions.forEach(session => {
      const id = this.generateId();
      const sessionData: Session = {
        id,
        name: session.name,
        isCurrent: session.isCurrent,
        createdAt: new Date()
      };
      this.sessions.set(id, sessionData);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.generateId();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Profile operations
  async getProfile(userId: string): Promise<Profile | undefined> {
    return Array.from(this.profiles.values()).find(
      (profile) => profile.userId === userId,
    );
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    return Array.from(this.profiles.values()).find(
      (profile) => profile.email === email,
    );
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const id = this.generateId();
    const profile: Profile = { 
      ...insertProfile, 
      id,
      fullName: insertProfile.fullName ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.profiles.set(id, profile);
    return profile;
  }

  // Subject operations
  async getSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = this.generateId();
    const subject: Subject = { 
      ...insertSubject, 
      id,
      createdAt: new Date()
    };
    this.subjects.set(id, subject);
    return subject;
  }

  // Class operations
  async getClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const id = this.generateId();
    const classData: Class = { 
      ...insertClass, 
      id,
      createdAt: new Date()
    };
    this.classes.set(id, classData);
    return classData;
  }

  // Term operations
  async getTerms(): Promise<Term[]> {
    return Array.from(this.terms.values());
  }

  async createTerm(insertTerm: InsertTerm): Promise<Term> {
    const id = this.generateId();
    const term: Term = { 
      ...insertTerm, 
      id,
      createdAt: new Date()
    };
    this.terms.set(id, term);
    return term;
  }

  // Session operations
  async getSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.generateId();
    const session: Session = { 
      ...insertSession, 
      id,
      isCurrent: insertSession.isCurrent ?? false,
      createdAt: new Date()
    };
    this.sessions.set(id, session);
    return session;
  }

  // Question operations
  async getQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async getQuestionsByTeacher(teacherId: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      (question) => question.teacherId === teacherId,
    );
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.generateId();
    const question: Question = { 
      ...insertQuestion, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.questions.set(id, question);
    return question;
  }

  async updateQuestion(id: string, insertQuestion: InsertQuestion, editedBy?: string): Promise<Question> {
    const existingQuestion = this.questions.get(id);
    if (!existingQuestion) {
      throw new Error('Question not found');
    }

    const updatedQuestion: Question = {
      ...existingQuestion,
      ...insertQuestion,
      id,
      updatedAt: new Date()
    };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteQuestion(id: string): Promise<void> {
    this.questions.delete(id);
  }

  // Test code operations
  async getTestCodes(): Promise<TestCode[]> {
    return Array.from(this.testCodes.values());
  }

  async getTestCodeByCode(code: string): Promise<TestCode | undefined> {
    return Array.from(this.testCodes.values()).find(
      (testCode) => testCode.code === code,
    );
  }

  async getTestCodeById(id: string): Promise<TestCode | undefined> {
    return this.testCodes.get(id);
  }

  async createTestCode(insertTestCode: InsertTestCode): Promise<TestCode> {
    const id = this.generateId();
    const testCode: TestCode = { 
      ...insertTestCode, 
      id,
      isActive: insertTestCode.isActive ?? true,
      expiresAt: insertTestCode.expiresAt ?? null,
      createdAt: new Date()
    };
    this.testCodes.set(id, testCode);
    return testCode;
  }

  // Test result operations
  async getTestResults(): Promise<TestResult[]> {
    return Array.from(this.testResults.values());
  }

  async getTestResultsByStudent(studentId: string): Promise<TestResult[]> {
    return Array.from(this.testResults.values()).filter(
      (result) => result.studentId === studentId,
    );
  }

  async createTestResult(insertTestResult: InsertTestResult): Promise<TestResult> {
    const id = this.generateId();
    const testResult: TestResult = { 
      ...insertTestResult, 
      id,
      timeTaken: insertTestResult.timeTaken ?? null,
      answers: insertTestResult.answers ?? null,
      createdAt: new Date()
    };
    this.testResults.set(id, testResult);
    return testResult;
  }

  async getTestResultsWithTestCodes(): Promise<any[]> {
    const results = Array.from(this.testResults.values());
    return results.map(result => {
      const testCode = this.testCodes.get(result.testCodeId);
      return {
        ...result,
        test_codes: testCode ? {
          subject: testCode.subject,
          term: testCode.term,
          class: testCode.class
        } : null
      };
    });
  }

  async getTestResultsByStudentWithTestCodes(studentId: string): Promise<any[]> {
    const results = Array.from(this.testResults.values()).filter(
      (result) => result.studentId === studentId
    );
    return results.map(result => {
      const testCode = this.testCodes.get(result.testCodeId);
      return {
        ...result,
        test_codes: testCode ? {
          subject: testCode.subject,
          term: testCode.term,
          class: testCode.class
        } : null
      };
    });
  }

  async getQuestionsForTest(subject: string, className: string, term: string, limit: number): Promise<Question[]> {
    // In-memory implementation - adapt as necessary
    return Array.from(this.questions.values()).filter(
      (question) =>
        question.subject === subject &&
        question.class === className &&
        question.term === term
    ).slice(0, limit);
  }

  async deactivateTestCode(code: string): Promise<void> {
    // In-memory implementation - adapt as necessary
    const testCode = Array.from(this.testCodes.values()).find(
      (testCode) => testCode.code === code,
    );
    if (testCode) {
      testCode.isActive = false;
      this.testCodes.set(testCode.id, testCode);
    }
  }
  async getTeacherAssignments(teacherId: string): Promise<any[]> {
        throw new Error("Method not implemented.");
    }
    async createTeacherAssignment(data: InsertTeacherAssignment): Promise<any> {
        throw new Error("Method not implemented.");
    }
    async deleteTeacherAssignment(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async getTeacherAssignmentsByTeacher(teacherId: string): Promise<any[]> {
        throw new Error("Method not implemented.");
    }

    async createTestCodeBatch(data: InsertTestCodeBatch): Promise<TestCodeBatch> {
        throw new Error("Method not implemented.");
    }

    async getTestCodeBatches(): Promise<TestCodeBatch[]> {
        throw new Error("Method not implemented.");
    }

    async getTestCodesByBatch(batchId: string): Promise<TestCode[]> {
        throw new Error("Method not implemented.");
    }

    async activateTestCodeBatch(batchId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async deactivateTestCodeBatch(batchId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async deleteTestCodeBatch(batchId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.email, email));
    return result[0];
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values(profile).returning();
    return result[0];
  }

  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const result = await db.insert(subjects).values(subject).returning();
    return result[0];
  }

  async getClasses(): Promise<Class[]> {
    return await db.select().from(classes);
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const result = await db.insert(classes).values(classData).returning();
    return result[0];
  }

  async getTerms(): Promise<Term[]> {
    return await db.select().from(terms);
  }

  async createTerm(term: InsertTerm): Promise<Term> {
    const result = await db.insert(terms).values(term).returning();
    return result[0];
  }

  async getSessions(): Promise<Session[]> {
    return await db.select().from(sessions);
  }

  async createSession(session: InsertSession): Promise<Session> {
    const result = await db.insert(sessions).values(session).returning();
    return result[0];
  }

  async getQuestions(): Promise<Question[]> {
    const createdProfile = alias(profiles, 'created_profile');
    const editedProfile = alias(profiles, 'edited_profile');

    return await db
      .select({
        ...getTableColumns(questions),
        createdByName: sql<string>`COALESCE(${createdProfile.fullName}, ${createdProfile.email})`,
        createdByRole: sql<string>`${createdProfile.role}`,
        editedByName: sql<string>`COALESCE(${editedProfile.fullName}, ${editedProfile.email})`,
        editedByRole: sql<string>`${editedProfile.role}`,
      })
      .from(questions)
      .leftJoin(createdProfile, eq(questions.teacherId, createdProfile.userId))
      .leftJoin(editedProfile, eq(questions.editedBy, editedProfile.userId));
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const result = await db.select().from(questions).where(eq(questions.id, id));
    return result[0];
  }

  async getQuestionsByTeacher(teacherId: string) {
    const createdProfile = alias(profiles, 'created_profile');
    const editedProfile = alias(profiles, 'edited_profile');

    return await db
      .select({
        ...getTableColumns(questions),
        createdByName: sql<string>`COALESCE(${createdProfile.fullName}, ${createdProfile.email})`,
        createdByRole: sql<string>`${createdProfile.role}`,
        editedByName: sql<string>`COALESCE(${editedProfile.fullName}, ${editedProfile.email})`,
        editedByRole: sql<string>`${editedProfile.role}`,
      })
      .from(questions)
      .leftJoin(createdProfile, eq(questions.teacherId, createdProfile.userId))
      .leftJoin(editedProfile, eq(questions.editedBy, editedProfile.userId))
      .where(eq(questions.teacherId, teacherId));
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const result = await db.insert(questions).values(question).returning();
    return result[0];
  }

  async updateQuestion(id: string, data: Partial<InsertQuestion>, editedBy?: string) {
    const updateData = { ...data, updatedAt: new Date() };
    if (editedBy) {
      updateData.editedBy = editedBy;
      updateData.editedAt = new Date();
    }
    const [question] = await db.update(questions).set(updateData).where(eq(questions.id, id)).returning();
    return question;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  async getTestCodes(): Promise<TestCode[]> {
    return await db.select().from(testCodes);
  }

  async getTestCodeByCode(code: string): Promise<TestCode | undefined> {
    const result = await db.select().from(testCodes).where(eq(testCodes.code, code)).limit(1);
    return result[0] || null;
  }

  async getTestCodeById(id: string) {
    const result = await db.select().from(testCodes).where(eq(testCodes.id, id)).limit(1);
    return result[0] || null;
  }

  async createTestCode(testCode: InsertTestCode): Promise<TestCode> {
    const result = await db.insert(testCodes).values(testCode).returning();
    return result[0];
  }

  async getTestResults(): Promise<TestResult[]> {
    return await db.select().from(testResults);
  }

  async getTestResultsByStudent(studentId: string): Promise<TestResult[]> {
    return await db.select().from(testResults).where(eq(testResults.studentId, studentId));
  }

  async createTestResult(testResult: InsertTestResult): Promise<TestResult> {
    const result = await db.insert(testResults).values(testResult).returning();
    return result[0];
  }

  async getTestResultsWithTestCodes(): Promise<any[]> {
    const result = await db
      .select({
        id: testResults.id,
        score: testResults.score,
        totalQuestions: testResults.totalQuestions,
        totalPossibleScore: testResults.totalPossibleScore,
        timeTaken: testResults.timeTaken,
        createdAt: testResults.createdAt,
        studentId: testResults.studentId,
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

    return result;
  }

  async getTestResultsByStudentWithTestCodes(studentId: string): Promise<any[]> {
    const result = await db
      .select({
        id: testResults.id,
        score: testResults.score,
        totalQuestions: testResults.totalQuestions,
        totalPossibleScore: testResults.totalPossibleScore,
        timeTaken: testResults.timeTaken,
        createdAt: testResults.createdAt,
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
      .where(eq(testResults.studentId, studentId));

    return result;
  }

  async getQuestionsForTest(subject: string, className: string, term: string, limit: number) {
    const allQuestions = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.subject, subject),
          eq(questions.class, className),
          eq(questions.term, term)
        )
      );

    // Shuffle questions and return limited number
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(limit, shuffled.length));
  }

  async deactivateTestCode(code: string): Promise<void> {
    await db
      .update(testCodes)
      .set({ isActive: false })
      .where(eq(testCodes.code, code));
  }

  async createTestCodeBatch(data: any) {
    const [batch] = await db.insert(testCodeBatches).values(data).returning();
    return batch;
  }

  async getTestCodeBatches() {
    return db.select().from(testCodeBatches)
      .where(isNull(testCodeBatches.deletedAt))
      .orderBy(testCodeBatches.createdAt);
  }

  async getTestCodesByBatch(batchId: string) {
    return db.select().from(testCodes)
      .where(and(eq(testCodes.batchId, batchId), isNull(testCodes.deletedAt)));
  }

  async activateTestCodeBatch(batchId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Activate the batch
      await tx
        .update(testCodeBatches)
        .set({ isActive: true })
        .where(eq(testCodeBatches.id, batchId));

      // Activate all codes in the batch
      await tx
        .update(testCodes)
        .set({ isActive: true })
        .where(eq(testCodes.batchId, batchId));
    });
  }

  async deactivateTestCodeBatch(batchId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Deactivate the batch
      await tx
        .update(testCodeBatches)
        .set({ isActive: false })
        .where(eq(testCodeBatches.id, batchId));

      // Deactivate all codes in the batch
      await tx
        .update(testCodes)
        .set({ isActive: false })
        .where(eq(testCodes.batchId, batchId));
    });
  }

  async deleteTestCodeBatch(batchId: string) {
    return await db.transaction(async (tx) => {
      // Mark all test codes in this batch as deleted and inactive
      await tx
        .update(testCodes)
        .set({ 
          deletedAt: new Date(),
          isActive: false 
        })
        .where(eq(testCodes.batchId, batchId));

      // Mark the batch itself as deleted and inactive
      await tx
        .update(testCodeBatches)
        .set({ 
          deletedAt: new Date(),
          isActive: false 
        })
        .where(eq(testCodeBatches.id, batchId));
    });
  }
  async getTeacherAssignments(teacherId: string) {
    return await db.select().from(teacherAssignments).where(eq(teacherAssignments.teacherId, teacherId));
  }

  async createTeacherAssignment(data: InsertTeacherAssignment) {
    const [assignment] = await db.insert(teacherAssignments).values(data).returning();
    return assignment;
  }

  async deleteTeacherAssignment(id: string) {
    await db.delete(teacherAssignments).where(eq(teacherAssignments.id, id));
  }

  async getTeacherAssignmentsByTeacher(teacherId: string) {
    return await db.select().from(teacherAssignments).where(eq(teacherAssignments.teacherId, teacherId));
  }
}

export const storage = new DatabaseStorage();