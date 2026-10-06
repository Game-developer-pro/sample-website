import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "./models/Question.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB.");

    const subjectTotals = await Question.aggregate([
      {
        $group: {
          _id: {
            examType: "$examType",
            subject: "$subject",
          },
          total: { $sum: 1 },
          easy: { $sum: { $cond: [{ $eq: ["$difficulty", "easy"] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ["$difficulty", "medium"] }, 1, 0] } },
          hard: { $sum: { $cond: [{ $eq: ["$difficulty", "hard"] }, 1, 0] } },
        },
      },
      {
        $sort: { "_id.examType": 1, "_id.subject": 1 },
      },
    ]);

    console.log("SUBJECT_BREAKDOWN:" + JSON.stringify(subjectTotals));
    const total = await Question.countDocuments();
    console.log("TOTAL_QUESTIONS:" + total);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("DB Error:", err.message);
    process.exit(1);
  }
}

run();
