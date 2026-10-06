import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import { authenticateToken as protect, authorizeAdmin as admin } from "../middleware/authMiddleware.js";
import {
  getPracticals,
  getPractical,
  createPractical,
  deletePractical,
  addComment,
  deleteComment,
  toggleLike,
} from "../controllers/practicalController.js";

// Dedicated Cloudinary storage for video files
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "exam-quest/practicals",
    resource_type: "video",
    allowed_formats: ["mp4", "webm", "mov", "avi"],
  },
});

const uploadVideo = multer({ storage: videoStorage });

const router = express.Router();

router.get("/", protect, getPracticals);
router.get("/:id", protect, getPractical);
router.post("/", protect, admin, uploadVideo.single("video"), createPractical);
router.delete("/:id", protect, admin, deletePractical);
router.post("/:id/comment", protect, addComment);
router.delete("/:id/comment/:commentId", protect, deleteComment);
router.post("/:id/like", protect, toggleLike);

export default router;

