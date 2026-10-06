import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "./models/Question.js";
import questions from "./addMediumDifficultyQuestions.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database. Inserting questions...");

    // Add difficulty to questions if not present
    const questionsWithDifficulty = questions.map(q => ({
      ...q,
      difficulty: "medium"
    }));

    // Insert questions, ignoring duplicates based on question text if we can't do insertMany directly, but insertMany will fail completely on duplicate key error if not unordered.
    // Let's use unordered bulk insert to skip duplicates.
    const result = await Question.insertMany(questionsWithDifficulty, { ordered: false }).catch(err => {
      console.log(`Some questions failed to insert (possibly duplicates). Inserted ${err.insertedDocs?.length || 0} questions.`);
      return err.insertedDocs;
    });
    
    if (result && !result.insertedDocs) {
      console.log(`Successfully inserted ${result.length} questions.`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error inserting questions:", err);
    process.exit(1);
  }
})();
