import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    testName: {
      type: String,
    },
    examType: {
      type: String,
    },
    jambScore: {
      type: Number, // Only populated if examType === "JAMB"
    },
    breakdown: {
      type: Object
    },
    corrections: {
      type: Array
    },
  },
  {
    timestamps: true,
  }
);

const Result = mongoose.model("Result", resultSchema);

export default Result;
