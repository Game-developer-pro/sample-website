import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    const questionsCol = db.collection("questions");

    const countBefore = await questionsCol.countDocuments({ examType: "WEAC_NECO" });
    console.log(`Questions with WEAC_NECO: ${countBefore}`);

    if (countBefore > 0) {
      const res = await questionsCol.updateMany(
        { examType: "WEAC_NECO" },
        { $set: { examType: "WAEC_NECO" } }
      );
      console.log(`Updated ${res.modifiedCount} questions to WAEC_NECO.`);
    }

    const distinct = await questionsCol.distinct("examType");
    console.log("Distinct examTypes now:", distinct);

    await mongoose.disconnect();
    console.log("Done.");
    process.exit(0);
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }
}

run();
