import { db } from "../server/db";
import { users, profiles, subjects, classes, terms, sessions, questions, testCodes, testResults, teacherAssignments, testCodeBatches } from "../shared/schema";

async function checkDatabase() {
  console.log("🔍 Checking database status...\n");

  try {
    // Quick check of each table
    const usersCount = await db.select().from(users).then(r => r.length);
    const profilesCount = await db.select().from(profiles).then(r => r.length);
    const subjectsCount = await db.select().from(subjects).then(r => r.length);
    const classesCount = await db.select().from(classes).then(r => r.length);
    const termsCount = await db.select().from(terms).then(r => r.length);
    const sessionsCount = await db.select().from(sessions).then(r => r.length);
    const questionsCount = await db.select().from(questions).then(r => r.length);
    const testCodesCount = await db.select().from(testCodes).then(r => r.length);
    const testResultsCount = await db.select().from(testResults).then(r => r.length);
    const assignmentsCount = await db.select().from(teacherAssignments).then(r => r.length);
    const batchesCount = await db.select().from(testCodeBatches).then(r => r.length);

    console.log("📊 Database Summary:");
    console.log(`Users: ${usersCount}`);
    console.log(`Profiles: ${profilesCount}`);
    console.log(`Subjects: ${subjectsCount}`);
    console.log(`Classes: ${classesCount}`);
    console.log(`Terms: ${termsCount}`);
    console.log(`Sessions: ${sessionsCount}`);
    console.log(`Questions: ${questionsCount}`);
    console.log(`Test Codes: ${testCodesCount}`);
    console.log(`Test Results: ${testResultsCount}`);
    console.log(`Teacher Assignments: ${assignmentsCount}`);
    console.log(`Test Code Batches: ${batchesCount}`);

    console.log("\n✅ Database check completed!");

  } catch (error) {
    console.error("❌ Database error:", error.message);
    console.error("This might indicate the database needs to be set up.");
  }
}

checkDatabase();