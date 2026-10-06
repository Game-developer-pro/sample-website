import Test from "../models/Test.js";
import Question from "../models/Question.js";

export const getTests = async (req, res, next) => {
  try {
    const tests = await Test.find();
    res.json(tests);
  } catch (err) {
    next(err);
  }
};

export const createTest = async (req, res, next) => {
  try {
    const { title, examType, subjects } = req.body;
    // Validate exam type
    if (!['JAMB', 'WEAC_NECO'].includes(examType)) {
      return res.status(400).json({ message: 'Invalid exam type' });
    }
    let totalQuestions = 0;
    let duration = 0; // in minutes
    let finalSubjects = [];
    if (examType === 'JAMB') {
      // English mandatory, plus up to 3 other subjects chosen by student
      const otherSubjects = subjects?.filter(s => s.toLowerCase() !== 'english') || [];
      if (otherSubjects.length !== 3) {
        return res.status(400).json({ message: 'JAMB requires exactly 3 non‑English subjects' });
      }
      finalSubjects = ['English', ...otherSubjects];
      totalQuestions = 60 + 3 * 40; // 180
      duration = 120; // 2 hours
    } else {
      // WEAC_NECO: single subject selected by student
      if (!subjects || subjects.length !== 1) {
        return res.status(400).json({ message: 'WEAC/NECO requires exactly one subject' });
      }
      finalSubjects = subjects;
      totalQuestions = 50;
      duration = 90; // 1h30m
    }
    const test = await Test.create({ title, examType, totalQuestions, duration, subjects: finalSubjects });
    res.json(test);
  } catch (err) {
    next(err);
  }
};

export const getTestQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const questions = await Question.find({ testId: id });
    res.json(questions);
  } catch (err) {
    next(err);
  }
};
