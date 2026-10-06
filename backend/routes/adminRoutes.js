import express from "express";
import User from "../models/User.js";
import { authenticateToken, authorizeAdmin } from "../middleware/authMiddleware.js";
import { getOnlineCount, getPeakOnlineCount } from "../server.js";

const router = express.Router();

// GET /api/admin/stats — returns total users, today's registrations
router.get("/stats", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    // Today's registrations: from midnight UTC of today
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const todayRegistrations = await User.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    res.json({ totalUsers, todayRegistrations, onlineCount: getOnlineCount(), peakOnlineCount: getPeakOnlineCount() });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
