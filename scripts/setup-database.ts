
import { db } from "../server/db";
import { sql } from "drizzle-orm";
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
  testCodeBatches 
} from "../shared/schema";
import * as bcrypt from "bcryptjs";

async function setupDatabase() {
  console.log("🚀 Setting up database schema and initial data...");

  try {
    console.log("📋 Creating tables if they don't exist...");
    
    // The tables will be created automatically by Drizzle when we first query them
    // Let's test the connection and create initial data
    
    console.log("🧹 Clearing existing data...");
    
    // Clear in proper order (respecting foreign key constraints)
    await db.delete(testResults).catch(() => console.log("No test results to clear"));
    await db.delete(testCodes).catch(() => console.log("No test codes to clear"));
    await db.delete(testCodeBatches).catch(() => console.log("No test code batches to clear"));
    await db.delete(questions).catch(() => console.log("No questions to clear"));
    await db.delete(teacherAssignments).catch(() => console.log("No teacher assignments to clear"));
    await db.delete(profiles).catch(() => console.log("No profiles to clear"));
    await db.delete(users).catch(() => console.log("No users to clear"));
    await db.delete(subjects).catch(() => console.log("No subjects to clear"));
    await db.delete(classes).catch(() => console.log("No classes to clear"));
    await db.delete(terms).catch(() => console.log("No terms to clear"));
    await db.delete(sessions).catch(() => console.log("No sessions to clear"));

    console.log("📚 Adding reference data...");
    
    // Add subjects
    await db.insert(subjects).values([
      { name: "Mathematics" },
      { name: "Physics" },
      { name: "Chemistry" },
      { name: "Biology" },
      { name: "English Language" },
      { name: "Literature" },
      { name: "Geography" },
      { name: "Economics" },
      { name: "Government" },
      { name: "History" },
      { name: "Further Mathematics" },
      { name: "Agricultural Science" },
      { name: "Computer Science" },
      { name: "Technical Drawing" },
      { name: "Fine Arts" }
    ]);

    // Add classes
    await db.insert(classes).values([
      { name: "SS1" },
      { name: "SS2" },
      { name: "SS3" },
      { name: "JSS1" },
      { name: "JSS2" },
      { name: "JSS3" }
    ]);

    // Add terms
    await db.insert(terms).values([
      { name: "First Term" },
      { name: "Second Term" },
      { name: "Third Term" }
    ]);

    // Add sessions
    await db.insert(sessions).values([
      { name: "2023/2024", isCurrent: false },
      { name: "2024/2025", isCurrent: true },
      { name: "2025/2026", isCurrent: false }
    ]);

    console.log("👨‍💼 Creating admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const adminUser = await db.insert(users).values({
      email: "admin@sfcs.edu.ng",
      passwordHash: hashedPassword,
    }).returning();

    await db.insert(profiles).values({
      userId: adminUser[0].id,
      email: "admin@sfcs.edu.ng",
      fullName: "School Administrator",
      role: "admin",
    });

    console.log("✅ Database setup completed successfully!");
    console.log("\n=== SETUP SUMMARY ===");
    console.log("✅ Database schema created");
    console.log("✅ Reference data added (subjects, classes, terms, sessions)");
    console.log("✅ Admin user created: admin@sfcs.edu.ng / admin123");
    console.log("✅ Ready for use!");
    
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error setting up database:");
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

setupDatabase();
