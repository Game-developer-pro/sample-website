import express from "express";
import { explainQuestion, explainQuestionStream, chatWithAssistant } from "../controllers/aiController.js";
import { authenticateToken as protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Streaming endpoint — returns Server-Sent Events (text appears token-by-token)
router.get("/explain-stream", protect, explainQuestionStream);

// Non-streaming fallback (kept for backwards compatibility)
router.post("/explain", protect, explainQuestion);

// General help-chat endpoint (used by the ChatWidget)
router.post("/chat", protect, chatWithAssistant);

export default router;

