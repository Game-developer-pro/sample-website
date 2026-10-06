import express from "express";
import { syncSession, getActiveSession, completeSession } from "../controllers/sessionController.js";
import { authenticateToken as protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/sync", protect, syncSession);
router.get("/active", protect, getActiveSession);
router.post("/complete", protect, completeSession);

export default router;
