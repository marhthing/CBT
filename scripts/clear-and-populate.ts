
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
      {
        question: "What is the present continuous form of 'eat'?",
        questionType: "multiple_choice",
        optionA: "Ate",
        optionB: "Eaten",
        optionC: "Eating",
        optionD: "Eats",
        correctAnswer: "C"
      },
      {
        question: "Choose the correct preposition: 'The book is ___ the table'",
        questionType: "multiple_choice",
        optionA: "In",
        optionB: "On",
        optionC: "At",
        optionD: "By",
        correctAnswer: "B"
      },
      {
        question: "What is the female of 'king'?",
        questionType: "multiple_choice",
        optionA: "Kingness",
        optionB: "Queen",
        optionC: "Princess",
        optionD: "Lady",
        correctAnswer: "B"
      },
      {
        question: "Which is a proper noun?",
        questionType: "multiple_choice",
        optionA: "boy",
        optionB: "school",
        optionC: "Nigeria",
        optionD: "book",
        correctAnswer: "C"
      },
      {
        question: "What do we call words that sound the same but have different meanings?",
        questionType: "multiple_choice",
        optionA: "Synonyms",
        optionB: "Antonyms",
        optionC: "Homophones",
        optionD: "Adjectives",
        correctAnswer: "C"
      },
      {
        question: "Choose the correct form: 'There ___ many books on the shelf'",
        questionType: "multiple_choice",
        optionA: "Is",
        optionB: "Are",
        optionC: "Was",
        optionD: "Been",
        correctAnswer: "B"
      },
      {
        question: "What is the past tense of 'write'?",
        questionType: "multiple_choice",
        optionA: "Writed",
        optionB: "Written",
        optionC: "Wrote",
        optionD: "Writing",
        correctAnswer: "C"
      },
      {
        question: "Which word is spelled correctly?",
        questionType: "multiple_choice",
        optionA: "Seperate",
        optionB: "Separate",
        optionC: "Seperete",
        optionD: "Separete",
        correctAnswer: "B"
      },
      {
        question: "What is a common noun?",
        questionType: "multiple_choice",
        optionA: "A specific name of a person",
        optionB: "A general name for things",
        optionC: "A describing word",
        optionD: "An action word",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct sentence:",
        questionType: "multiple_choice",
        optionA: "Me and John are friends",
        optionB: "John and me are friends",
        optionC: "John and I are friends",
        optionD: "I and John are friends",
        correctAnswer: "C"
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
        optionA: questionData.optionA,
        optionB: questionData.optionB,
        optionC: questionData.optionC,
        optionD: questionData.optionD,
        correctAnswer: questionData.correctAnswer,
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
