import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "./models/Question.js";
import questions from "./addHardDifficultyQuestions.js";

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Retrieve existing questions to avoid duplicates in the DB
    const existing = await Question.find().select("question").lean();
    const existingSet = new Set(existing.map((q) => q.question));

    const toInsert = questions.filter((q) => !existingSet.has(q.question));

    if (toInsert.length === 0) {
      console.log("✅ No new questions to insert; all are duplicates in the DB.");
    } else {
      await Question.insertMany(toInsert);
      console.log(`✅ Successfully inserted ${toInsert.length} new hard difficulty physics questions!`);
    }
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding questions:", err);
    process.exit(1);
  }
};

seed();
