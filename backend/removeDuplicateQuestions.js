import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "./models/Question.js";

dotenv.config();

const removeDuplicateQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Aggregate duplicates by question text
    const duplicates = await Question.aggregate([
      { $group: { _id: "$question", ids: { $push: "$_id" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicates.length === 0) {
      console.log("✅ No duplicate questions found.");
    } else {
      let totalRemoved = 0;
      for (const dup of duplicates) {
        // Keep the first id, remove the rest
        const [keepId, ...removeIds] = dup.ids;
        const result = await Question.deleteMany({ _id: { $in: removeIds } });
        totalRemoved += result.deletedCount || 0;
        console.log(`Removed ${removeIds.length} duplicate(s) for question: "${dup._id}"`);
      }
      console.log(`✅ Completed. Total duplicates removed: ${totalRemoved}`);
    }
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during duplicate removal:", err);
    process.exit(1);
  }
};

removeDuplicateQuestions();
