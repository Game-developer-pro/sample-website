import express from "express";
import { submitAttempt } from "../controllers/attemptController.js";
import { authenticateToken as protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/", protect, submitAttempt);
export default router;
