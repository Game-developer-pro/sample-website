import express from "express";
import Question from "../models/Question.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Get all unique subjects
router.get("/subjects", async (req, res) => {
  try {
    const subjects = await Question.distinct("subject");
    res.json(subjects.filter(Boolean)); // remove null/undefined
  } catch (err) {
    console.error("Error fetching subjects:", err);
    res.status(500).json({ message: "Error fetching subjects" });
  }
});

// Get all questions
router.get("/", async (req, res) => {
  try {
    const { subject, examType } = req.query;
    const filter = {};

    if (req.query.subjects) {
      const subjArray = req.query.subjects.split(',').map(s => s.trim());
      filter.subject = { $in: subjArray };
    } else if (subject && subject !== "All" && subject !== "All Subjects") {
      filter.subject = subject;
    }
    if (examType && examType !== "All") {
      filter.examType = (examType === "WEAC_NECO" || examType === "WAEC_NECO") ? "WAEC_NECO" : examType;
    }
    const questions = await Question.find(filter);
    res.json(questions);
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ message: "Error fetching questions" });
  }
});

// Add a question (with optional image upload via Cloudinary)
router.post("/", (req, res, next) => {
  upload.single("image")(req, res, function (err) {
    if (err) {
      console.error("Multer/Cloudinary Error:", err);
      return res.status(500).json({ message: "Image upload failed: " + (err.message || JSON.stringify(err)) });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { question, options, answer, subject, examType } = req.body;
    const parsedOptions = typeof options === "string" ? JSON.parse(options) : options;
    const imageUrl = req.file ? req.file.path : null;
    const newQuestion = await Question.create({
      question,
      options: parsedOptions,
      answer,
      subject,
      examType,
      image: imageUrl,
    });
    res.json(newQuestion);
  } catch (err) {
    console.error("Error adding question:", err);
    res.status(500).json({ message: err.message || "Error adding question" });
  }
});

export default router;
