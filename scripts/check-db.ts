
import { db } from "../server/db";
import { users, profiles, subjects, classes, terms, sessions, questions, testCodes, testResults, teacherAssignments, testCodeBatches } from "@shared/schema";

async function checkDatabase() {
  console.log("🔍 Checking current database contents...\n");

  try {
    // Check each table
    console.log("=== USERS ===");
    const usersData = await db.select().from(users);
    console.log(`Found ${usersData.length} users:`);
    usersData.forEach(user => console.log(`- ${user.email} (ID: ${user.id})`));
    console.log();

    console.log("=== PROFILES ===");
    const profilesData = await db.select().from(profiles);
    console.log(`Found ${profilesData.length} profiles:`);
    profilesData.forEach(profile => console.log(`- ${profile.email} (${profile.role}) - User ID: ${profile.userId}`));
    console.log();

    console.log("=== SUBJECTS ===");
    const subjectsData = await db.select().from(subjects);
    console.log(`Found ${subjectsData.length} subjects:`);
    subjectsData.forEach(subject => console.log(`- ${subject.name}`));
    console.log();

    console.log("=== CLASSES ===");
    const classesData = await db.select().from(classes);
    console.log(`Found ${classesData.length} classes:`);
    classesData.forEach(cls => console.log(`- ${cls.name}`));
    console.log();

    console.log("=== TERMS ===");
    const termsData = await db.select().from(terms);
    console.log(`Found ${termsData.length} terms:`);
    termsData.forEach(term => console.log(`- ${term.name}`));
    console.log();

    console.log("=== SESSIONS ===");
    const sessionsData = await db.select().from(sessions);
    console.log(`Found ${sessionsData.length} sessions:`);
    sessionsData.forEach(session => console.log(`- ${session.name} (Current: ${session.isCurrent})`));
    console.log();

    console.log("=== TEACHER ASSIGNMENTS ===");
    const assignmentsData = await db.select().from(teacherAssignments);
    console.log(`Found ${assignmentsData.length} teacher assignments:`);
    assignmentsData.forEach(assignment => console.log(`- Teacher ID: ${assignment.teacherId}, Subject: ${assignment.subject}, Class: ${assignment.class}`));
    console.log();

    console.log("=== QUESTIONS ===");
    const questionsData = await db.select().from(questions);
    console.log(`Found ${questionsData.length} questions:`);
    questionsData.forEach(question => console.log(`- ${question.question.substring(0, 50)}... (Type: ${question.questionType}, Subject: ${question.subject}, Class: ${question.class})`));
    console.log();

    console.log("=== TEST CODE BATCHES ===");
    const batchesData = await db.select().from(testCodeBatches);
    console.log(`Found ${batchesData.length} test code batches:`);
    batchesData.forEach(batch => console.log(`- ${batch.batchName} (Active: ${batch.isActive}, Subject: ${batch.subject}, Class: ${batch.class})`));
    console.log();

    console.log("=== TEST CODES ===");
    const codesData = await db.select().from(testCodes);
    console.log(`Found ${codesData.length} test codes:`);
    codesData.forEach(code => console.log(`- ${code.code} (Active: ${code.isActive}, Subject: ${code.subject})`));
    console.log();

    console.log("=== TEST RESULTS ===");
    const resultsData = await db.select().from(testResults);
    console.log(`Found ${resultsData.length} test results:`);
    resultsData.forEach(result => console.log(`- Student ID: ${result.studentId}, Score: ${result.score}/${result.totalPossibleScore}`));
    console.log();

    console.log("✅ Database check completed successfully!");

  } catch (error) {
    console.error("❌ Error checking database:");
    console.error("Error message:", error.message);
    
    if (error.code) {
      console.error("Error code:", error.code);
    }
    
    if (error.detail) {
      console.error("Error detail:", error.detail);
    }
    
    console.error("\nThis might indicate that tables don't exist yet or there's a connection issue.");
    console.error("Full error:", error);
  }
}

checkDatabase();
