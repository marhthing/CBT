
import { db } from "../server/db";
import { subjects, classes, terms, sessions } from "../shared/schema";

async function populateDatabase() {
  console.log("Populating database with sample data...");

  try {
    // Check if data already exists
    const existingSubjects = await db.select().from(subjects);
    if (existingSubjects.length > 0) {
      console.log("Database already has data. Skipping population.");
      return;
    }

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

    console.log("Database populated successfully!");
    console.log("Added:");
    console.log("- 15 subjects");
    console.log("- 6 classes (SS1-SS3, JSS1-JSS3)");
    console.log("- 3 terms");
    console.log("- 3 sessions (2024/2025 is current)");
  } catch (error) {
    console.error("Error populating database:", error);
  }
}

populateDatabase();
