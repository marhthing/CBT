
import { pgTable, text, serial, integer, boolean, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profiles table
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  role: text("role").notNull(), // 'student', 'teacher', 'admin'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subjects table
export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Classes table
export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Terms table
export const terms = pgTable("terms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sessions table
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher assignments table
export const teacherAssignments = pgTable("teacher_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  class: text("class").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  term: text("term").notNull(),
  class: text("class").notNull(),
  section: text("section").notNull(),
  subject: text("subject").notNull(),
  question: text("question").notNull(),
  questionType: text("question_type").notNull().default('multiple_choice'), // 'multiple_choice', 'true_false', 'fill_blank', 'essay', 'image_based'
  optionA: text("option_a"),
  optionB: text("option_b"),
  optionC: text("option_c"),
  optionD: text("option_d"),
  correctAnswer: text("correct_answer"), // Changed to text to support different answer types
  correctAnswerText: text("correct_answer_text"), // For fill-in-the-blank and essay questions
  imageUrl: text("image_url"), // For image-based questions
  scorePerQuestion: integer("score_per_question").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  editedBy: uuid("edited_by").references(() => users.id),
  editedAt: timestamp("edited_at"),
});

// Test code batches table
export const testCodeBatches = pgTable("test_code_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchName: text("batch_name").notNull(),
  adminId: uuid("admin_id").references(() => users.id).notNull(),
  term: text("term").notNull(),
  class: text("class").notNull(),
  section: text("section").notNull(),
  subject: text("subject").notNull(),
  session: text("session").notNull(),
  testType: text("test_type").notNull().default('CA'), // 'CA' or 'EXAM'
  numQuestions: integer("num_questions").notNull(),
  timeLimit: integer("time_limit").notNull(), // in minutes
  scorePerQuestion: integer("score_per_question").default(1),
  totalCodes: integer("total_codes").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Test codes table
export const testCodes = pgTable("test_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  batchId: uuid("batch_id").references(() => testCodeBatches.id).notNull(),
  adminId: uuid("admin_id").references(() => users.id).notNull(),
  term: text("term").notNull(),
  class: text("class").notNull(),
  section: text("section").notNull(),
  subject: text("subject").notNull(),
  session: text("session").notNull(),
  testType: text("test_type").notNull().default('CA'), // 'CA' or 'EXAM'
  numQuestions: integer("num_questions").notNull(),
  timeLimit: integer("time_limit").notNull(), // in minutes
  scorePerQuestion: integer("score_per_question").default(1),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  deletedAt: timestamp("deleted_at"),
});

// Test results table
export const testResults = pgTable("test_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  testCodeId: uuid("test_code_id").references(() => testCodes.id).notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  totalPossibleScore: integer("total_possible_score").notNull(),
  timeTaken: integer("time_taken"), // in seconds
  answers: jsonb("answers"), // store student answers
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  passwordHash: true,
});

export const insertProfileSchema = createInsertSchema(profiles).pick({
  userId: true,
  email: true,
  fullName: true,
  role: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).pick({
  name: true,
});

export const insertClassSchema = createInsertSchema(classes).pick({
  name: true,
});

export const insertTermSchema = createInsertSchema(terms).pick({
  name: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  name: true,
  isCurrent: true,
});

export const insertTeacherAssignmentSchema = createInsertSchema(teacherAssignments).pick({
  teacherId: true,
  subject: true,
  class: true,
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  teacherId: true,
  term: true,
  class: true,
  section: true,
  subject: true,
  question: true,
  questionType: true,
  optionA: true,
  optionB: true,
  optionC: true,
  optionD: true,
  correctAnswer: true,
  correctAnswerText: true,
  imageUrl: true,
  scorePerQuestion: true,
  editedBy: true,
  editedAt: true,
}).extend({
  correctAnswer: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (typeof val === 'number') {
      return val.toString();
    }
    return val;
  }),
});

export const insertTestCodeBatchSchema = createInsertSchema(testCodeBatches).pick({
  batchName: true,
  adminId: true,
  term: true,
  class: true,
  section: true,
  subject: true,
  session: true,
  testType: true,
  numQuestions: true,
  timeLimit: true,
  scorePerQuestion: true,
  totalCodes: true,
  isActive: true,
});

export const insertTestCodeSchema = createInsertSchema(testCodes).pick({
  code: true,
  batchId: true,
  adminId: true,
  term: true,
  class: true,
  section: true,
  subject: true,
  session: true,
  testType: true,
  numQuestions: true,
  timeLimit: true,
  scorePerQuestion: true,
  isActive: true,
  expiresAt: true,
});

export const insertTestResultSchema = createInsertSchema(testResults).pick({
  studentId: true,
  testCodeId: true,
  score: true,
  totalQuestions: true,
  totalPossibleScore: true,
  timeTaken: true,
  answers: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertTerm = z.infer<typeof insertTermSchema>;
export type Term = typeof terms.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertTeacherAssignment = z.infer<typeof insertTeacherAssignmentSchema>;
export type TeacherAssignment = typeof teacherAssignments.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertTestCodeBatch = z.infer<typeof insertTestCodeBatchSchema>;
export type TestCodeBatch = typeof testCodeBatches.$inferSelect;
export type InsertTestCode = z.infer<typeof insertTestCodeSchema>;
export type TestCode = typeof testCodes.$inferSelect;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResults.$inferSelect;
