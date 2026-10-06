import express from "express";
import Announcement from "../models/Announcement.js";
import { authenticateToken as protect, authorizeAdmin as admin } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private (All logged-in users)
router.get("/", protect, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("author", "name email")
      .populate("comments.user", "name")
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ message: "Error fetching announcements" });
  }
});

// @desc    Create a new announcement (with optional image)
// @route   POST /api/announcements
// @access  Private/Admin
router.post("/", protect, admin, upload.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Please provide a title and content" });
    }

    const announcementData = {
      title,
      content,
      author: req.user.id,
    };

    // If an image was uploaded via Cloudinary/multer, attach its URL
    if (req.file && req.file.path) {
      announcementData.image = req.file.path;
    }

    const announcement = await Announcement.create(announcementData);

    const populatedAnnouncement = await Announcement.findById(announcement._id).populate("author", "name email");
    res.status(201).json(populatedAnnouncement);
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({ message: "Error creating announcement" });
  }
});

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    await announcement.deleteOne();
    res.json({ message: "Announcement removed" });
  } catch (err) {
    console.error("Error deleting announcement:", err);
    res.status(500).json({ message: "Error deleting announcement" });
  }
});

// @desc    Add a comment to an announcement
// @route   POST /api/announcements/:id/comment
// @access  Private (All logged-in users)
router.post("/:id/comment", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const newComment = {
      text,
      user: req.user.id,
    };

    announcement.comments.push(newComment);
    await announcement.save();

    const updatedAnnouncement = await Announcement.findById(req.params.id)
      .populate("author", "name email")
      .populate("comments.user", "name");

    res.status(201).json(updatedAnnouncement);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Error adding comment" });
  }
});

// @desc    Delete a comment
// @route   DELETE /api/announcements/:id/comment/:commentId
// @access  Private (Comment author or Admin)
router.delete("/:id/comment/:commentId", protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const comment = announcement.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check authorization: must be comment author or admin
    if (comment.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    announcement.comments.pull(req.params.commentId);
    await announcement.save();

    const updatedAnnouncement = await Announcement.findById(req.params.id)
      .populate("author", "name email")
      .populate("comments.user", "name");

    res.json(updatedAnnouncement);
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Error deleting comment" });
  }
});

export default router;
