import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "./models/Question.js";

dotenv.config();

const seedQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Retrieve existing questions to avoid duplicates
    const existing = await Question.find().select('question').lean();
    const existingSet = new Set(existing.map((q) => q.question));

    const questions = [
      {
        question: "What is the capital of France?",
        options: ["Paris", "London", "Berlin", "Rome"],
        answer: "Paris",
        subject: "General"
      },
      {
        question: "Which planet is known as the Red Planet?",
        options: ["Earth", "Venus", "Mars", "Jupiter"],
        answer: "Mars",
        subject: "General"
      },
      {
        question: "What is the value of Pi to two decimal places?",
        options: ["3.12", "3.14", "3.16", "3.18"],
        answer: "3.14",
        subject: "Mathematics"
      },
      {
        question: "Solve for x: 2x + 7 = 15",
        options: ["3", "4", "5", "6"],
        answer: "4",
        subject: "Mathematics"
      },
      {
        question: "What is the chemical symbol for Water?",
        options: ["CO2", "H2O", "NaCl", "O2"],
        answer: "H2O",
        subject: "Chemistry"
      },
      {
        question: "What is the primary power source of the Solar System?",
        options: ["The Earth", "The Moon", "The Sun", "Jupiter"],
        answer: "The Sun",
        subject: "Physics"
      },
      {
        question: "Which of the following is an operating system?",
        options: ["Python", "Linux", "HTML", "MySQL"],
        answer: "Linux",
        subject: "Computer Science"
      },
      {
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Tech Modern Language",
          "Hyperlink Text Management Language",
          "Home Tool Markup Language"
        ],
        answer: "Hyper Text Markup Language",
        subject: "Computer Science"
      },
      {
        question: "Identify the noun in the sentence: 'She ran to the store quickly.'",
        options: ["ran", "quickly", "store", "to"],
        answer: "store",
        subject: "English"
      },
      {
        question: "What is the powerhouse of the cell?",
        options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
        answer: "Mitochondria",
        subject: "Biology"
      }
    ].filter((q) => !existingSet.has(q.question));

    if (questions.length === 0) {
      console.log("✅ No new questions to insert; all are duplicates.");
    } else {
      await Question.insertMany(questions);
      console.log(`✅ Inserted ${questions.length} new question(s) successfully!`);
    }
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding questions:", err);
    process.exit(1);
  }
};

seedQuestions();
