import mongoose from "mongoose";
import dotenv from "dotenv";
import Result from "./models/Result.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const results = await Result.find().sort({ createdAt: -1 }).limit(3).lean();
    console.log(JSON.stringify(results.map(r => ({ 
      id: r._id, 
      createdAt: r.createdAt, 
      hasBreakdown: !!r.breakdown, 
      hasCorrections: !!r.corrections,
      jambScore: r.jambScore,
      score: r.score
    })), null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
