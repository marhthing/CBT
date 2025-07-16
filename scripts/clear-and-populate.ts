
import { db } from "../server/db";
import { questions, testCodeBatches, testCodes, testResults, teacherAssignments, users, profiles, subjects, classes, terms, sessions } from "../shared/schema";
import bcrypt from "bcryptjs";

async function clearAndPopulate() {
  console.log("Clearing database and populating with fresh data...");

  try {
    // Clear tables in proper order (respecting foreign key constraints)
    console.log("Clearing existing data...");
    
    await db.delete(testResults).catch(() => console.log("No test results to clear"));
    console.log("Cleared test results");

    await db.delete(testCodes).catch(() => console.log("No test codes to clear"));
    console.log("Cleared test codes");

    await db.delete(testCodeBatches).catch(() => console.log("No test code batches to clear"));
    console.log("Cleared test code batches");

    await db.delete(questions).catch(() => console.log("No questions to clear"));
    console.log("Cleared questions");

    await db.delete(teacherAssignments).catch(() => console.log("No teacher assignments to clear"));
    console.log("Cleared teacher assignments");

    await db.delete(profiles).catch(() => console.log("No profiles to clear"));
    console.log("Cleared profiles");

    await db.delete(users).catch(() => console.log("No users to clear"));
    console.log("Cleared users");

    // Clear reference data
    await db.delete(subjects).catch(() => console.log("No subjects to clear"));
    await db.delete(classes).catch(() => console.log("No classes to clear"));
    await db.delete(terms).catch(() => console.log("No terms to clear"));
    await db.delete(sessions).catch(() => console.log("No sessions to clear"));

    console.log("Database cleared successfully!");

    // Add essential data first
    console.log("Adding essential data...");
    
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

    console.log("Essential data added successfully!");

    // Create admin user
    console.log("Creating admin user...");
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

    console.log("Admin user created with email: admin@sfcs.edu.ng, password: admin123");

    // Create JSS1 English Language questions
    console.log("Populating with JSS1 English Language questions...");
    
    const jss1Questions = [
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "What is the plural form of 'child'?",
        questionType: "multiple_choice",
        optionA: "childs",
        optionB: "children",
        optionC: "childrens",
        optionD: "child",
        correctAnswer: "1",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Choose the correct sentence:",
        questionType: "multiple_choice",
        optionA: "She go to school daily",
        optionB: "She goes to school daily",
        optionC: "She going to school daily",
        optionD: "She gone to school daily",
        correctAnswer: "1",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "The sun rises in the _____",
        questionType: "fill_blank",
        correctAnswerText: "east",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "English is spoken in Nigeria.",
        questionType: "true_false",
        correctAnswer: "true",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "What do you see in this picture?",
        questionType: "image_based",
        imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop",
        optionA: "A cat",
        optionB: "A dog",
        optionC: "A book",
        optionD: "A house",
        correctAnswer: "2",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Which word is a noun?",
        questionType: "multiple_choice",
        optionA: "run",
        optionB: "beautiful",
        optionC: "table",
        optionD: "quickly",
        correctAnswer: "2",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Write a short sentence using the word 'happy'.",
        questionType: "essay",
        correctAnswerText: "Any sentence using 'happy' correctly",
        scorePerQuestion: 2,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "What is the opposite of 'hot'?",
        questionType: "multiple_choice",
        optionA: "warm",
        optionB: "cold",
        optionC: "cool",
        optionD: "freezing",
        correctAnswer: "1",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "The cat is sleeping on the _____",
        questionType: "fill_blank",
        correctAnswerText: "mat",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Books are made of paper.",
        questionType: "true_false",
        correctAnswer: "true",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Identify the object in this image:",
        questionType: "image_based",
        imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
        optionA: "Computer",
        optionB: "Television",
        optionC: "Radio",
        optionD: "Phone",
        correctAnswer: "0",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Which is the correct spelling?",
        questionType: "multiple_choice",
        optionA: "recieve",
        optionB: "receive",
        optionC: "receve",
        optionD: "receiv",
        correctAnswer: "1",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "My name _____ John.",
        questionType: "fill_blank",
        correctAnswerText: "is",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Water boils at 100 degrees Celsius.",
        questionType: "true_false",
        correctAnswer: "true",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "What animal is shown in the picture?",
        questionType: "image_based",
        imageUrl: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop",
        optionA: "Dog",
        optionB: "Cat",
        optionC: "Bird",
        optionD: "Fish",
        correctAnswer: "1",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Choose the correct verb form: 'She _____ to school every day.'",
        questionType: "multiple_choice",
        optionA: "go",
        optionB: "goes",
        optionC: "going",
        optionD: "gone",
        correctAnswer: "1",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Write a sentence about your favorite food.",
        questionType: "essay",
        correctAnswerText: "Any complete sentence about favorite food",
        scorePerQuestion: 2,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "The past tense of 'go' is _____",
        questionType: "fill_blank",
        correctAnswerText: "went",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "There are 26 letters in the English alphabet.",
        questionType: "true_false",
        correctAnswer: "true",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "What is the main subject of this picture?",
        questionType: "image_based",
        imageUrl: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=400&h=300&fit=crop",
        optionA: "School",
        optionB: "Library",
        optionC: "Hospital",
        optionD: "Market",
        correctAnswer: "0",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Which word is an adjective?",
        questionType: "multiple_choice",
        optionA: "run",
        optionB: "big",
        optionC: "eat",
        optionD: "sleep",
        correctAnswer: "1",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "I _____ a student.",
        questionType: "fill_blank",
        correctAnswerText: "am",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Fish live in water.",
        questionType: "true_false",
        correctAnswer: "true",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "What color is the object in this image?",
        questionType: "image_based",
        imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
        optionA: "Red",
        optionB: "Blue",
        optionC: "Green",
        optionD: "Yellow",
        correctAnswer: "0",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Choose the correct article: '_____ apple is red.'",
        questionType: "multiple_choice",
        optionA: "A",
        optionB: "An",
        optionC: "The",
        optionD: "This",
        correctAnswer: "1",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Describe your best friend in three sentences.",
        questionType: "essay",
        correctAnswerText: "Any three complete sentences describing a friend",
        scorePerQuestion: 3,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "She _____ her homework yesterday.",
        questionType: "fill_blank",
        correctAnswerText: "did",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "Birds can fly.",
        questionType: "true_false",
        correctAnswer: "true",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "What type of building is shown in this picture?",
        questionType: "image_based",
        imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
        optionA: "House",
        optionB: "School",
        optionC: "Office",
        optionD: "Shop",
        correctAnswer: "0",
        scorePerQuestion: 1,
      },
      {
        teacherId: adminUser[0].id,
        term: "First Term",
        class: "JSS1",
        section: "A",
        subject: "English Language",
        question: "What is the singular form of 'books'?",
        questionType: "multiple_choice",
        optionA: "book",
        optionB: "bookes",
        optionC: "booking",
        optionD: "bookies",
        correctAnswer: "0",
        scorePerQuestion: 1,
      }
    ];

    await db.insert(questions).values(jss1Questions);

    console.log("Successfully added 30 JSS1 English Language questions!");
    console.log("Questions added for:");
    console.log("- Class: JSS1");
    console.log("- Term: First Term");
    console.log("- Session: 2024/2025");
    console.log("- Subject: English Language");
    console.log("- Section: A");
    console.log("");
    console.log("Database population completed successfully!");

  } catch (error) {
    console.error("Error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

clearAndPopulate();
