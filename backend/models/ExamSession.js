import mongoose from "mongoose";

const examSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    examType: {
      type: String,
      required: true,
    },
    subjects: {
      type: [String],
      required: true,
    },
    questions: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
    },
    selectedAnswers: {
      type: Map,
      of: String,
      default: {},
    },
    examEndTime: {
      type: Number,
      required: true,
    },
    currentIndex: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
  },
  {
    timestamps: true,
  }
);

const ExamSession = mongoose.model("ExamSession", examSessionSchema);

export default ExamSession;
