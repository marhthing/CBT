
import { db } from "../server/db";
import { questions, users, profiles } from "../shared/schema";
import { eq } from "drizzle-orm";

async function populateQuestions() {
  console.log("🚀 Populating database with 50 JSS1 English Language questions...");

  try {
    // Get admin user to assign as teacher
    const adminUser = await db.select().from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(profiles.role, 'admin'))
      .limit(1);

    if (!adminUser.length) {
      console.error("❌ No admin user found. Please run setup-database.ts first.");
      process.exit(1);
    }

    const teacherId = adminUser[0].users.id;

    // Clear existing questions for this specific combination
    await db.delete(questions).where(
      eq(questions.class, 'JSS1')
    );

    // Sample questions for JSS1 English Language
    const sampleQuestions = [
      {
        question: "What is the plural form of 'child'?",
        optionA: "childs",
        optionB: "children",
        optionC: "childes",
        optionD: "child",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct spelling:",
        optionA: "recieve",
        optionB: "receive",
        optionC: "receve",
        optionD: "receeve",
        correctAnswer: "B"
      },
      {
        question: "What is the opposite of 'hot'?",
        optionA: "warm",
        optionB: "cool",
        optionC: "cold",
        optionD: "freezing",
        correctAnswer: "C"
      },
      {
        question: "Which is a proper noun?",
        optionA: "school",
        optionB: "Lagos",
        optionC: "book",
        optionD: "chair",
        correctAnswer: "B"
      },
      {
        question: "What type of word is 'quickly'?",
        optionA: "noun",
        optionB: "verb",
        optionC: "adjective",
        optionD: "adverb",
        correctAnswer: "D"
      },
      {
        question: "Choose the correct sentence:",
        optionA: "He don't like apples",
        optionB: "He doesn't like apples",
        optionC: "He not like apples",
        optionD: "He no like apples",
        correctAnswer: "B"
      },
      {
        question: "What is the past tense of 'go'?",
        optionA: "goed",
        optionB: "gone",
        optionC: "went",
        optionD: "going",
        correctAnswer: "C"
      },
      {
        question: "Which word is a verb?",
        optionA: "beautiful",
        optionB: "happiness",
        optionC: "running",
        optionD: "quickly",
        correctAnswer: "C"
      },
      {
        question: "What is the meaning of 'enormous'?",
        optionA: "very small",
        optionB: "very large",
        optionC: "very fast",
        optionD: "very slow",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct article: '___ apple'",
        optionA: "a",
        optionB: "an",
        optionC: "the",
        optionD: "no article",
        correctAnswer: "B"
      },
      {
        question: "What is the comparative form of 'good'?",
        optionA: "gooder",
        optionB: "more good",
        optionC: "better",
        optionD: "best",
        correctAnswer: "C"
      },
      {
        question: "Which sentence is in future tense?",
        optionA: "I am eating",
        optionB: "I ate",
        optionC: "I will eat",
        optionD: "I eat",
        correctAnswer: "C"
      },
      {
        question: "What is the plural of 'mouse'?",
        optionA: "mouses",
        optionB: "mice",
        optionC: "mouse",
        optionD: "mices",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct pronoun: 'Mary and ___ are friends'",
        optionA: "me",
        optionB: "I",
        optionC: "myself",
        optionD: "mine",
        correctAnswer: "B"
      },
      {
        question: "What is the superlative form of 'tall'?",
        optionA: "taller",
        optionB: "more tall",
        optionC: "tallest",
        optionD: "most tall",
        correctAnswer: "C"
      },
      {
        question: "Which word rhymes with 'cat'?",
        optionA: "cut",
        optionB: "bat",
        optionC: "car",
        optionD: "cup",
        correctAnswer: "B"
      },
      {
        question: "What is the past participle of 'write'?",
        optionA: "wrote",
        optionB: "writing",
        optionC: "written",
        optionD: "writes",
        correctAnswer: "C"
      },
      {
        question: "Choose the correct preposition: 'The book is ___ the table'",
        optionA: "in",
        optionB: "on",
        optionC: "at",
        optionD: "by",
        correctAnswer: "B"
      },
      {
        question: "What is the feminine form of 'actor'?",
        optionA: "actrice",
        optionB: "actress",
        optionC: "actoress",
        optionD: "actess",
        correctAnswer: "B"
      },
      {
        question: "Which is a compound word?",
        optionA: "running",
        optionB: "beautiful",
        optionC: "classroom",
        optionD: "quickly",
        correctAnswer: "C"
      },
      {
        question: "What is the meaning of 'swift'?",
        optionA: "slow",
        optionB: "fast",
        optionC: "heavy",
        optionD: "light",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct sentence:",
        optionA: "There are many books",
        optionB: "Their are many books",
        optionC: "They're are many books",
        optionD: "There is many books",
        correctAnswer: "A"
      },
      {
        question: "What is the abbreviation for 'Doctor'?",
        optionA: "Doc",
        optionB: "Dr.",
        optionC: "Doct",
        optionD: "D.R.",
        correctAnswer: "B"
      },
      {
        question: "Which word is an adjective?",
        optionA: "run",
        optionB: "happy",
        optionC: "quickly",
        optionD: "house",
        correctAnswer: "B"
      },
      {
        question: "What is the plural of 'foot'?",
        optionA: "foots",
        optionB: "feet",
        optionC: "feets",
        optionD: "foot",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct conjunction: 'I like tea ___ coffee'",
        optionA: "but",
        optionB: "and",
        optionC: "or",
        optionD: "so",
        correctAnswer: "B"
      },
      {
        question: "What is the past tense of 'sing'?",
        optionA: "singed",
        optionB: "sung",
        optionC: "sang",
        optionD: "singing",
        correctAnswer: "C"
      },
      {
        question: "Which sentence has correct punctuation?",
        optionA: "What is your name",
        optionB: "What is your name.",
        optionC: "What is your name?",
        optionD: "What is your name!",
        correctAnswer: "C"
      },
      {
        question: "What is the meaning of 'ancient'?",
        optionA: "new",
        optionB: "old",
        optionC: "modern",
        optionD: "recent",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct spelling:",
        optionA: "seperate",
        optionB: "separate",
        optionC: "seprate",
        optionD: "separete",
        correctAnswer: "B"
      },
      {
        question: "What is the present continuous form of 'eat'?",
        optionA: "eating",
        optionB: "eats",
        optionC: "ate",
        optionD: "eaten",
        correctAnswer: "A"
      },
      {
        question: "Which is a common noun?",
        optionA: "Nigeria",
        optionB: "John",
        optionC: "table",
        optionD: "Christmas",
        correctAnswer: "C"
      },
      {
        question: "What is the opposite of 'empty'?",
        optionA: "vacant",
        optionB: "full",
        optionC: "hollow",
        optionD: "void",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct sentence:",
        optionA: "I have went to school",
        optionB: "I have gone to school",
        optionC: "I have go to school",
        optionD: "I have going to school",
        correctAnswer: "B"
      },
      {
        question: "What is the possessive form of 'children'?",
        optionA: "childrens",
        optionB: "children's",
        optionC: "childrens'",
        optionD: "childern's",
        correctAnswer: "B"
      },
      {
        question: "Which word has the same meaning as 'big'?",
        optionA: "small",
        optionB: "tiny",
        optionC: "large",
        optionD: "little",
        correctAnswer: "C"
      },
      {
        question: "What is the past tense of 'buy'?",
        optionA: "buyed",
        optionB: "bought",
        optionC: "buying",
        optionD: "buys",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct article: '___ university'",
        optionA: "a",
        optionB: "an",
        optionC: "the",
        optionD: "no article",
        correctAnswer: "A"
      },
      {
        question: "What is the meaning of 'transparent'?",
        optionA: "opaque",
        optionB: "clear",
        optionC: "dark",
        optionD: "thick",
        correctAnswer: "B"
      },
      {
        question: "Which is the correct plural of 'sheep'?",
        optionA: "sheeps",
        optionB: "sheep",
        optionC: "sheepes",
        optionD: "sheepies",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct sentence:",
        optionA: "She can sings well",
        optionB: "She can sing well",
        optionC: "She can singing well",
        optionD: "She can sang well",
        correctAnswer: "B"
      },
      {
        question: "What is the comparative form of 'bad'?",
        optionA: "badder",
        optionB: "more bad",
        optionC: "worse",
        optionD: "worst",
        correctAnswer: "C"
      },
      {
        question: "Which word is a noun?",
        optionA: "run",
        optionB: "quickly",
        optionC: "beautiful",
        optionD: "happiness",
        correctAnswer: "D"
      },
      {
        question: "What is the past tense of 'teach'?",
        optionA: "teached",
        optionB: "taught",
        optionC: "teaching",
        optionD: "teaches",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct preposition: 'I am interested ___ music'",
        optionA: "in",
        optionB: "on",
        optionC: "at",
        optionD: "by",
        correctAnswer: "A"
      },
      {
        question: "What is the meaning of 'fragile'?",
        optionA: "strong",
        optionB: "weak",
        optionC: "easily broken",
        optionD: "heavy",
        correctAnswer: "C"
      },
      {
        question: "Which sentence is grammatically correct?",
        optionA: "Me and John are friends",
        optionB: "John and I are friends",
        optionC: "I and John are friends",
        optionD: "John and me are friends",
        correctAnswer: "B"
      },
      {
        question: "What is the opposite of 'difficult'?",
        optionA: "hard",
        optionB: "easy",
        optionC: "tough",
        optionD: "complex",
        correctAnswer: "B"
      },
      {
        question: "Choose the correct spelling:",
        optionA: "necessary",
        optionB: "neccessary",
        optionC: "necesary",
        optionD: "neccesary",
        correctAnswer: "A"
      },
      {
        question: "What is the present tense of 'went'?",
        optionA: "go",
        optionB: "goes",
        optionC: "going",
        optionD: "gone",
        correctAnswer: "A"
      },
      {
        question: "Which word is an interjection?",
        optionA: "quickly",
        optionB: "beautiful",
        optionC: "wow",
        optionD: "running",
        correctAnswer: "C"
      }
    ];

    // Insert all questions
    const questionsToInsert = sampleQuestions.map(q => ({
      teacherId,
      term: "First Term",
      class: "JSS1",
      section: "A", // Default section
      subject: "English Language",
      question: q.question,
      questionType: "multiple_choice",
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      scorePerQuestion: 1
    }));

    await db.insert(questions).values(questionsToInsert);

    console.log("✅ Database populated successfully!");
    console.log("\n=== POPULATION SUMMARY ===");
    console.log(`✅ ${sampleQuestions.length} questions added`);
    console.log("✅ Subject: English Language");
    console.log("✅ Class: JSS1");
    console.log("✅ Term: First Term");
    console.log("✅ Session: 2024/2025");
    console.log("✅ All questions are multiple choice type");
    
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error populating database:");
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

populateQuestions();
