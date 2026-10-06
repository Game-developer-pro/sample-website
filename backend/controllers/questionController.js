// backend/controllers/questionController.js
import Question from "../models/Question.js";

export const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    console.error("❌ Error fetching questions:", err.message);
    res.status(500).json({ message: "Server error fetching questions" });
  }
};
