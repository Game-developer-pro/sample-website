import ExamSession from "../models/ExamSession.js";

// @desc    Create or update an active exam session
// @route   POST /api/sessions/sync
// @access  Private
export const syncSession = async (req, res, next) => {
  try {
    const { examType, subjects, questions, selectedAnswers, examEndTime, currentIndex } = req.body;
    
    // Find an existing active session for this user
    let session = await ExamSession.findOne({ userId: req.user.id, status: "in-progress" });

    if (session) {
      // Update ALL mutable fields so a fresh test fully replaces old data
      if (questions && questions.length > 0) session.questions = questions;
      if (subjects && subjects.length > 0) session.subjects = subjects;
      if (examType) session.examType = examType;
      // Only update examEndTime if it's actually being set (don't allow shortening)
      if (examEndTime && (!session.examEndTime || examEndTime > session.examEndTime)) {
        session.examEndTime = examEndTime;
      }
      session.selectedAnswers = selectedAnswers ?? {};
      session.currentIndex = currentIndex ?? 0;
      await session.save();
      res.json(session);
    } else {
      // Create new session
      session = await ExamSession.create({
        userId: req.user.id,
        examType,
        subjects,
        questions,
        selectedAnswers: selectedAnswers ?? {},
        examEndTime,
        currentIndex: currentIndex ?? 0,
        status: "in-progress"
      });
      res.json(session);
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get active session for user
// @route   GET /api/sessions/active
// @access  Private
export const getActiveSession = async (req, res, next) => {
  try {
    const session = await ExamSession.findOne({ userId: req.user.id, status: "in-progress" });
    if (session) {
      res.json(session);
    } else {
      res.json(null);
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Delete the active session on submit (cleans up DB completely)
// @route   POST /api/sessions/complete
// @access  Private
export const completeSession = async (req, res, next) => {
  try {
    // Physically delete — no need to keep "completed" records
    await ExamSession.findOneAndDelete({ userId: req.user.id, status: "in-progress" });
    res.json({ message: "Session cleared" });
  } catch (err) {
    next(err);
  }
};
