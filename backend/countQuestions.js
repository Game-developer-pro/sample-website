import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "./models/Question.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const stats = await Question.aggregate([
      {
        $group: {
          _id: {
            examType: "$examType",
            subject: "$subject",
            difficulty: "$difficulty",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.examType": 1,
          "_id.subject": 1,
          "_id.difficulty": 1,
        },
      },
    ]);

    const subjectTotals = await Question.aggregate([
      {
        $group: {
          _id: {
            examType: "$examType",
            subject: "$subject",
          },
          total: { $sum: 1 },
          easy: {
            $sum: { $cond: [{ $eq: ["$difficulty", "easy"] }, 1, 0] },
          },
          medium: {
            $sum: { $cond: [{ $eq: ["$difficulty", "medium"] }, 1, 0] },
          },
          hard: {
            $sum: { $cond: [{ $eq: ["$difficulty", "hard"] }, 1, 0] },
          },
        },
      },
      {
        $sort: {
          "_id.examType": 1,
          "_id.subject": 1,
        },
      },
    ]);

    console.log("\n=================== SUBJECT BREAKDOWN ===================");
    console.log(JSON.stringify(subjectTotals, null, 2));

    const totalQuestions = await Question.countDocuments();
    console.log("\nTOTAL QUESTIONS IN DATABASE:", totalQuestions);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error analyzing questions:", err);
    process.exit(1);
  }
}

run();
