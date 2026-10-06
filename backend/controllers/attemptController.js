import Attempt from "../models/Attempt.js";
import Answer from "../models/Answer.js";
import Question from "../models/Question.js";
import { calculateScore } from "../utils/grader.js";

export const submitAttempt = async (req, res, next) => {
  try {
    const { testId, answers } = req.body;
    const questions = await Question.find({ testId });
    const score = calculateScore(answers, questions);

    const attempt = await Attempt.create({
      userId: req.user.id,
      testId,
      score,
    });

    await Promise.all(
      answers.map((a) =>
        Answer.create({
          attemptId: attempt._id,
          questionId: a.questionId,
          selectedOption: a.selectedOption,
        })
      )
    );

    res.json({ attemptId: attempt._id, score });
  } catch (err) {
    next(err);
  }
};
