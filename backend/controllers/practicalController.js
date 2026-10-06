import Practical from "../models/Practical.js";
import cloudinary from "../config/cloudinary.js";
import { broadcast } from "../server.js";

// @desc    Get all practicals
// @route   GET /api/practicals
// @access  Private
export const getPracticals = async (req, res) => {
  try {
    const practicals = await Practical.find()
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 })
      .select("-comments"); // don't send comments in list view
    res.json(practicals);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch practicals" });
  }
};

// @desc    Get single practical (increments view count)
// @route   GET /api/practicals/:id
// @access  Private
export const getPractical = async (req, res) => {
  try {
    const practical = await Practical.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("uploadedBy", "name")
      .populate("comments.user", "name");

    if (!practical) return res.status(404).json({ message: "Practical not found" });
    res.json(practical);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch practical" });
  }
};

// @desc    Create a practical (admin only)
// @route   POST /api/practicals
// @access  Private/Admin
export const createPractical = async (req, res) => {
  try {
    const { title, description, subject } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "A video file is required" });
    }

    const practical = await Practical.create({
      title,
      description,
      subject: subject || "General",
      videoUrl: req.file.path,
      publicId: req.file.filename,
      uploadedBy: req.user.id,
    });

    const populated = await Practical.findById(practical._id).populate("uploadedBy", "name");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Create practical error:", err);
    res.status(500).json({ message: "Failed to create practical" });
  }
};

// @desc    Delete a practical (admin only)
// @route   DELETE /api/practicals/:id
// @access  Private/Admin
export const deletePractical = async (req, res) => {
  try {
    const practical = await Practical.findById(req.params.id);
    if (!practical) return res.status(404).json({ message: "Practical not found" });

    // Delete from Cloudinary
    if (practical.publicId) {
      await cloudinary.uploader.destroy(practical.publicId, { resource_type: "video" });
    }

    await practical.deleteOne();
    res.json({ message: "Practical deleted" });
  } catch (err) {
    console.error("Delete practical error:", err);
    res.status(500).json({ message: "Failed to delete practical" });
  }
};

// @desc    Add a comment to a practical
// @route   POST /api/practicals/:id/comment
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const practical = await Practical.findById(req.params.id);
    if (!practical) return res.status(404).json({ message: "Practical not found" });

    practical.comments.push({
      user: req.user.id,
      userName: req.user.name || "Student",
      text: text.trim(),
    });

    await practical.save();

    const updated = await Practical.findById(req.params.id)
      .populate("uploadedBy", "name")
      .populate("comments.user", "name");

    res.status(201).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to add comment" });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/practicals/:id/comment/:commentId
// @access  Private (comment author or admin)
export const deleteComment = async (req, res) => {
  try {
    const practical = await Practical.findById(req.params.id);
    if (!practical) return res.status(404).json({ message: "Practical not found" });

    const comment = practical.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    practical.comments.pull(req.params.commentId);
    await practical.save();

    const updated = await Practical.findById(req.params.id)
      .populate("uploadedBy", "name")
      .populate("comments.user", "name");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

// @desc    Toggle like on a practical
// @route   POST /api/practicals/:id/like
// @access  Private
export const toggleLike = async (req, res) => {
  try {
    const practical = await Practical.findById(req.params.id);
    if (!practical) return res.status(404).json({ message: "Practical not found" });

    const userId = req.user.id;
    const alreadyLiked = practical.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      await Practical.findByIdAndUpdate(req.params.id, { $pull: { likes: userId } });
    } else {
      await Practical.findByIdAndUpdate(req.params.id, { $addToSet: { likes: userId } });
    }

    const updated = await Practical.findById(req.params.id).select("likes");
    const likesCount = updated.likes.length;
    const liked = !alreadyLiked;

    // Broadcast real-time like update to all WebSocket clients
    broadcast({
      type: "practical:like",
      practicalId: req.params.id,
      likesCount,
      likes: updated.likes.map(String),
    });

    res.json({ likesCount, liked, likes: updated.likes.map(String) });
  } catch (err) {
    console.error("Toggle like error:", err);
    res.status(500).json({ message: "Failed to toggle like" });
  }
};
