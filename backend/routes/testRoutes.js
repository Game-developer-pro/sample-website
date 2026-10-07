import express from "express";
import { getTests, createTest, getTestQuestions } from "../controllers/testController.js";
import { authenticateToken as protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/", protect, getTests);
router.post("/", protect, createTest);
router.get("/:id/questions", protect, getTestQuestions);
export default router;