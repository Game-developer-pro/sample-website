import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "./models/Question.js";
import rawQuestions from "./addMediumDifficultyQuestions.js";

dotenv.config();

function mapExamType(rawType) {
  const map = {
    "UTME": "JAMB",
    "WAEC/NECO": "WEAC_NECO",
    "JAMB": "JAMB",
    "WEAC_NECO": "WEAC_NECO",
  };
  return map[rawType] || "WEAC_NECO";
}

const seedMediumQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const inputTexts = new Map();
    const internalDupes = [];
    rawQuestions.forEach((q, idx) => {
      const key = q.question.trim().toLowerCase();
      if (inputTexts.has(key)) {
        internalDupes.push({ idx, original: inputTexts.get(key) });
      } else {
        inputTexts.set(key, idx);
      }
    });

    if (internalDupes.length > 0) {
      console.log("Found " + internalDupes.length + " internal duplicates in input file:");
      internalDupes.forEach(d => console.log("  Q[" + d.idx + "] is a duplicate of Q[" + d.original + "]"));
    } else {
      console.log("No internal duplicates found in input file.");
    }

    const existing = await Question.find({}).select("question").lean();
    const existingSet = new Set(existing.map((q) => q.question.trim().toLowerCase()));
    console.log("Database currently has " + existing.length + " question(s).");

    const dedupedKeys = new Set();
    const toInsert = [];
    let skippedDB = 0;
    let skippedInternal = 0;

    for (const q of rawQuestions) {
      const key = q.question.trim().toLowerCase();
      if (dedupedKeys.has(key)) { skippedInternal++; continue; }
      dedupedKeys.add(key);
      if (existingSet.has(key)) {
        skippedDB++;
        console.log("Already in DB: " + q.question.substring(0, 70));
        continue;
      }
      toInsert.push({
        question: q.question.trim(),
        options: q.options.map(o => o.trim()),
        answer: q.answer.trim(),
        subject: q.subject || "Mathematics",
        examType: mapExamType(q.examType),
        difficulty: "medium",
      });
    }

    console.log("\nSummary:");
    console.log("  Input questions:         " + rawQuestions.length);
    console.log("  Skipped (file dupes):    " + skippedInternal);
    console.log("  Skipped (already in DB): " + skippedDB);
    console.log("  Ready to insert:         " + toInsert.length);

    if (toInsert.length === 0) {
      console.log("Nothing new to insert.");
      process.exit(0);
    }

    const result = await Question.insertMany(toInsert, { ordered: false });
    console.log("Successfully inserted " + result.length + " new medium difficulty question(s)!");
    process.exit(0);
  } catch (err) {
    if (err.writeErrors) {
      console.error("Partial insert: " + (err.insertedDocs && err.insertedDocs.length || 0) + " inserted, " + err.writeErrors.length + " failed.");
      err.writeErrors.slice(0, 5).forEach(we => console.error("  Failed: " + (we.err && we.err.op && we.err.op.question || "unknown")));
    } else {
      console.error("Error seeding questions:", err.message);
    }
    process.exit(1);
  }
};

seedMediumQuestions();
