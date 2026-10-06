import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import Result from "../models/Result.js";
import User from "../models/User.js";

const router = express.Router();

// ✅ Save test result
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { testName, score, totalQuestions, examType, jambScore, breakdown, corrections } = req.body;

    const newResult = await Result.create({
      userId: req.user.id,
      testName,
      score,
      totalQuestions,
      examType,
      jambScore,
      breakdown,
      corrections
    });

    res.status(201).json(newResult);
  } catch (err) {
    console.error("Error saving result:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all results for the logged-in user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    console.error("Error fetching results:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET /api/results/leaderboard — public, top 50 users ranked by avg JAMB score
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Result.aggregate([
      // Only count completed JAMB exams with a valid jambScore
      { $match: { examType: "JAMB", jambScore: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$userId",
          avgJambScore: { $avg: "$jambScore" },
          totalTests: { $sum: 1 },
          bestScore: { $max: "$jambScore" },
          lastTested: { $max: "$createdAt" },
        },
      },
      // Require at least 1 completed JAMB test
      { $match: { totalTests: { $gte: 1 } } },
      // Sort: primary = avgJambScore desc, secondary = totalTests desc (tiebreak)
      { $sort: { avgJambScore: -1, totalTests: -1 } },
      { $limit: 50 },
      // Join with users collection
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          username: "$user.username",
          name: "$user.name",
          avatar: "$user.avatar",
          avgJambScore: { $round: ["$avgJambScore", 1] },
          totalTests: 1,
          bestScore: 1,
          lastTested: 1,
        },
      },
    ]);

    res.json(leaderboard);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get a specific result by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await Result.findOne({ _id: req.params.id, userId: req.user.id });
    if (!result) return res.status(404).json({ message: "Result not found" });
    res.json(result);
  } catch (err) {
    console.error("Error fetching specific result:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
