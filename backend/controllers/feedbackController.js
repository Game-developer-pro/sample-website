import Feedback from "../models/Feedback.js";
import User from "../models/User.js";

// @desc    Create a new feedback ticket/thread
// @route   POST /api/feedback
// @access  Private (Student / User)
export const createFeedback = async (req, res) => {
  try {
    const { category, subject, message } = req.body;

    if (!subject || !subject.trim() || !message || !message.trim()) {
      return res.status(400).json({ message: "Subject and message are required." });
    }

    const user = await User.findById(req.user.id).select("name avatar role");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const initialMessage = {
      sender: user._id,
      senderRole: user.role === "admin" ? "admin" : "user",
      senderName: user.name,
      senderAvatar: user.avatar || "",
      text: message.trim(),
      createdAt: new Date(),
    };

    const feedback = new Feedback({
      user: user._id,
      category: category || "General Feedback",
      subject: subject.trim(),
      status: "open",
      unreadByAdmin: true,
      unreadByUser: false,
      messages: [initialMessage],
    });

    const saved = await feedback.save();
    const populated = await Feedback.findById(saved._id)
      .populate("user", "name email avatar role")
      .populate("messages.sender", "name avatar role");

    res.status(201).json(populated);
  } catch (err) {
    console.error("Error creating feedback:", err);
    res.status(500).json({ message: "Server error creating feedback." });
  }
};

// @desc    Get all feedback threads for the logged-in user
// @route   GET /api/feedback/my-feedback
// @access  Private
export const getMyFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .populate("user", "name email avatar role")
      .populate("messages.sender", "name avatar role");

    res.json(feedbacks);
  } catch (err) {
    console.error("Error fetching user feedbacks:", err);
    res.status(500).json({ message: "Server error fetching feedbacks." });
  }
};

// @desc    Get single feedback thread by ID
// @route   GET /api/feedback/:id
// @access  Private
export const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate("user", "name email avatar role")
      .populate("messages.sender", "name avatar role");

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found." });
    }

    // Ensure only the owner or an admin can access
    if (feedback.user._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this feedback." });
    }

    // Mark as read according to role
    if (req.user.role === "admin") {
      feedback.unreadByAdmin = false;
    } else {
      feedback.unreadByUser = false;
    }
    await feedback.save();

    res.json(feedback);
  } catch (err) {
    console.error("Error fetching feedback by ID:", err);
    res.status(500).json({ message: "Server error fetching feedback." });
  }
};

// @desc    Reply to a feedback thread (User or Admin)
// @route   POST /api/feedback/:id/reply
// @access  Private
export const replyFeedback = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required." });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback thread not found." });
    }

    const isAdmin = req.user.role === "admin";
    if (!isAdmin && feedback.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to reply to this thread." });
    }

    const senderUser = await User.findById(req.user.id).select("name avatar role");

    const replyMsg = {
      sender: senderUser._id,
      senderRole: isAdmin ? "admin" : "user",
      senderName: senderUser.name,
      senderAvatar: senderUser.avatar || "",
      text: text.trim(),
      createdAt: new Date(),
    };

    feedback.messages.push(replyMsg);

    // Update unread status and thread status
    if (isAdmin) {
      feedback.unreadByUser = true;
      feedback.unreadByAdmin = false;
      if (feedback.status === "open") {
        feedback.status = "in_progress";
      }
    } else {
      feedback.unreadByAdmin = true;
      feedback.unreadByUser = false;
      if (feedback.status === "resolved") {
        feedback.status = "open"; // Reopen if student replies
      }
    }

    await feedback.save();

    const updated = await Feedback.findById(feedback._id)
      .populate("user", "name email avatar role")
      .populate("messages.sender", "name avatar role");

    res.json(updated);
  } catch (err) {
    console.error("Error replying to feedback:", err);
    res.status(500).json({ message: "Server error replying to feedback." });
  }
};

// @desc    Admin: Get all feedback threads with filters & pagination
// @route   GET /api/feedback/admin/all
// @access  Private (Admin Only)
export const getAllFeedbacksAdmin = async (req, res) => {
  try {
    const { status, category, search } = req.query;

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (category && category !== "all") {
      query.category = category;
    }

    if (search && search.trim()) {
      query.$or = [
        { subject: { $regex: search.trim(), $options: "i" } },
        { "messages.text": { $regex: search.trim(), $options: "i" } },
      ];
    }

    const feedbacks = await Feedback.find(query)
      .sort({ updatedAt: -1 })
      .populate("user", "name email avatar role")
      .populate("messages.sender", "name avatar role");

    res.json(feedbacks);
  } catch (err) {
    console.error("Error fetching admin feedbacks:", err);
    res.status(500).json({ message: "Server error fetching feedbacks." });
  }
};

// @desc    Admin: Update feedback thread status (open, in_progress, resolved)
// @route   PATCH /api/feedback/admin/:id/status
// @access  Private (Admin Only)
export const updateFeedbackStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["open", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("user", "name email avatar role")
      .populate("messages.sender", "name avatar role");

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found." });
    }

    res.json(feedback);
  } catch (err) {
    console.error("Error updating feedback status:", err);
    res.status(500).json({ message: "Server error updating status." });
  }
};

// @desc    Admin: Delete feedback thread
// @route   DELETE /api/feedback/admin/:id
// @access  Private (Admin Only)
export const deleteFeedbackAdmin = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found." });
    }
    res.json({ message: "Feedback thread deleted successfully." });
  } catch (err) {
    console.error("Error deleting feedback:", err);
    res.status(500).json({ message: "Server error deleting feedback." });
  }
};
