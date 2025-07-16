
import { db } from "../server/db";
import { questions, testCodeBatches, testCodes, testResults, teacherAssignments, users, profiles } from "../shared/schema";

async function clearAndPopulateDatabase() {
  console.log("Clearing database (preserving terms, sessions, classes, subjects)...");

  try {
    // Clear tables in order (respecting foreign key constraints)
    await db.delete(testResults);
    console.log("Cleared test results");
    
    await db.delete(testCodes);
    console.log("Cleared test codes");
    
    await db.delete(testCodeBatches);
    console.log("Cleared test code batches");
    
    await db.delete(questions);
    console.log("Cleared questions");
    
    await db.delete(teacherAssignments);
    console.log("Cleared teacher assignments");
    
    await db.delete(profiles);
    console.log("Cleared profiles");
    
    await db.delete(users);
    console.log("Cleared users");

    console.log("Database cleared successfully!");

    // Create an admin user first
    console.log("Creating admin user...");
    const [adminUser] = await db.insert(users).values({
      email: "admin@sfcs.edu.ng",
      passwordHash: "$2b$10$CwTycUXWue0Thq9StjUM0uehufrkK9Te4GkK5rMHLCdJ7GvC/dB.a" // password: admin123
    }).returning();

    await db.insert(profiles).values({
      userId: adminUser.id,
      email: "admin@sfcs.edu.ng",
      fullName: "System Administrator",
      role: "admin"
    });

    console.log("Admin user created with email: admin@sfcs.edu.ng, password: admin123");

    // Populate with JSS1 English Language questions
    console.log("Populating with JSS1 English Language questions...");

    const jss1EnglishQuestions = [
      // Multiple Choice Questions
      {
        question: "What is a noun?",
        questionType: "multiple_choice",
        optionA: "A word that describes an action",
        optionB: "A word that names a person, place, or thing",
        optionC: "A word that describes a noun",
        optionD: "A word that connects sentences",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct spelling:",
        questionType: "multiple_choice",
        optionA: "Recieve",
        optionB: "Receive",
        optionC: "Receve",
        optionD: "Receave",
        correctAnswer: "B"
      },
      {
        question: "What is the plural of 'child'?",
        questionType: "multiple_choice",
        optionA: "Childs",
        optionB: "Childes",
        optionC: "Children",
        optionD: "Childer",
        correctAnswer: "C"
      },
      {
        question: "A verb is a word that shows:",
        questionType: "multiple_choice",
        optionA: "Action or state of being",
        optionB: "Description of a noun",
        optionC: "Position or place",
        optionD: "Number or quantity",
        correctAnswer: "A"
      },
      {
        question: "Which of these is an adjective?",
        questionType: "multiple_choice",
        optionA: "Run",
        optionB: "Beautiful",
        optionC: "Table",
        optionD: "Quickly",
        correctAnswer: "B"
      },
      {
        question: "What is the past tense of 'go'?",
        questionType: "multiple_choice",
        optionA: "Goed",
        optionB: "Gone",
        optionC: "Went",
        optionD: "Going",
        correctAnswer: "C"
      },
      {
        question: "A sentence must have:",
        questionType: "multiple_choice",
        optionA: "Only a noun",
        optionB: "Only a verb",
        optionC: "A subject and a predicate",
        optionD: "Only adjectives",
        correctAnswer: "C"
      },
      {
        question: "Which word is a pronoun?",
        questionType: "multiple_choice",
        optionA: "Book",
        optionB: "Happy",
        optionC: "She",
        optionD: "Slowly",
        correctAnswer: "C"
      },
      {
        question: "What punctuation mark ends a question?",
        questionType: "multiple_choice",
        optionA: "Period (.)",
        optionB: "Exclamation mark (!)",
        optionC: "Question mark (?)",
        optionD: "Comma (,)",
        correctAnswer: "C"
      },
      {
        question: "Choose the correct article: '___ apple'",
        questionType: "multiple_choice",
        optionA: "A",
        optionB: "An",
        optionC: "The",
        optionD: "No article needed",
        correctAnswer: "B"
      },
      {
        question: "What is an antonym of 'hot'?",
        questionType: "multiple_choice",
        optionA: "Warm",
        optionB: "Cold",
        optionC: "Fire",
        optionD: "Heat",
        correctAnswer: "B"
      },
      {
        question: "Which is a compound word?",
        questionType: "multiple_choice",
        optionA: "Running",
        optionB: "Classroom",
        optionC: "Happy",
        optionD: "Jumped",
        correctAnswer: "B"
      },
      {
        question: "What is a synonym of 'big'?",
        questionType: "multiple_choice",
        optionA: "Small",
        optionB: "Tiny",
        optionC: "Large",
        optionD: "Little",
        correctAnswer: "C"
      },
      {
        question: "Choose the correct form: 'I ___ to school every day'",
        questionType: "multiple_choice",
        optionA: "Goes",
        optionB: "Go",
        optionC: "Going",
        optionD: "Gone",
        correctAnswer: "B"
      },
      {
        question: "What type of word is 'quickly'?",
        questionType: "multiple_choice",
        optionA: "Noun",
        optionB: "Verb",
        optionC: "Adjective",
        optionD: "Adverb",
        correctAnswer: "D"
      },
      {
        question: "Which sentence is correct?",
        questionType: "multiple_choice",
        optionA: "She don't like apples",
        optionB: "She doesn't like apples",
        optionC: "She not like apples",
        optionD: "She no like apples",
        correctAnswer: "B"
      },
      {
        question: "What is the opposite of 'up'?",
        questionType: "multiple_choice",
        optionA: "Over",
        optionB: "Down",
        optionC: "Above",
        optionD: "High",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct spelling:",
        questionType: "multiple_choice",
        optionA: "Frend",
        optionB: "Friend",
        optionC: "Freind",
        optionD: "Friand",
        correctAnswer: "B"
      },
      {
        question: "What comes at the beginning of a sentence?",
        questionType: "multiple_choice",
        optionA: "A small letter",
        optionB: "A capital letter",
        optionC: "A number",
        optionD: "A punctuation mark",
        correctAnswer: "B"
      },
      {
        question: "Which word rhymes with 'cat'?",
        questionType: "multiple_choice",
        optionA: "Dog",
        optionB: "Hat",
        optionC: "Car",
        optionD: "Cup",
        correctAnswer: "B"
      },
      // True/False Questions
      {
        question: "A noun is a word that names a person, place, or thing.",
        questionType: "true_false",
        correctAnswer: "true"
      },
      {
        question: "The word 'quickly' is a noun.",
        questionType: "true_false",
        correctAnswer: "false"
      },
      {
        question: "Every sentence must end with a period.",
        questionType: "true_false",
        correctAnswer: "false"
      },
      {
        question: "The word 'beautiful' is an adjective.",
        questionType: "true_false",
        correctAnswer: "true"
      },
      {
        question: "Verbs show action or state of being.",
        questionType: "true_false",
        correctAnswer: "true"
      },
      // Fill in the Blank Questions
      {
        question: "Complete the sentence: The _____ is shining brightly today.",
        questionType: "fill_blank",
        correctAnswerText: "sun"
      },
      {
        question: "Fill in the blank: I _____ my homework every day.",
        questionType: "fill_blank",
        correctAnswerText: "do"
      },
      {
        question: "Complete: She _____ to school by bus.",
        questionType: "fill_blank",
        correctAnswerText: "goes"
      },
      // Essay Questions
      {
        question: "Write a short paragraph (3-4 sentences) about your favorite animal.",
        questionType: "essay",
        correctAnswerText: "Sample answer: My favorite animal is a dog. Dogs are loyal and friendly pets. They love to play and protect their families. I enjoy playing with dogs because they are fun and loving companions."
      },
      // Image-based Questions
      {
        question: "Look at the image and identify the part of speech for the word 'run':",
        questionType: "image_based",
        imageUrl: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop",
        optionA: "Noun",
        optionB: "Verb",
        optionC: "Adjective",
        optionD: "Adverb",
        correctAnswer: "B"
      }
    ];

    // Use the admin user ID for questions
    const teacherId = adminUser.id;

    for (const questionData of jss1EnglishQuestions) {
      await db.insert(questions).values({
        teacherId: teacherId,
        term: "First Term",
        class: "JSS1",
        section: "A", // Default section
        subject: "English Language",
        session: "2024/2025",
        question: questionData.question,
        questionType: questionData.questionType,
        optionA: questionData.optionA || null,
        optionB: questionData.optionB || null,
        optionC: questionData.optionC || null,
        optionD: questionData.optionD || null,
        correctAnswer: questionData.correctAnswer || null,
        correctAnswerText: questionData.correctAnswerText || null,
        imageUrl: questionData.imageUrl || null,
        scorePerQuestion: 1
      });
    }

    console.log("Successfully added 30 JSS1 English Language questions!");
    console.log("Questions added for:");
    console.log("- Class: JSS1");
    console.log("- Term: First Term");
    console.log("- Session: 2024/2025");
    console.log("- Subject: English Language");
    console.log("- Section: A");

  } catch (error) {
    console.error("Error clearing and populating database:", error);
  }
}

clearAndPopulateDatabase();
