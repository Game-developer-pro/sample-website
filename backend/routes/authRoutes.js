import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// REGISTER USER
router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate and check username uniqueness if provided
    if (username) {
      const trimmed = username.trim();
      if (trimmed.length < 3 || trimmed.length > 24) {
        return res.status(400).json({ message: "Username must be between 3 and 24 characters." });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores." });
      }
      const existingUsername = await User.findOne({ username: trimmed });
      if (existingUsername) {
        return res.status(400).json({ message: "That username is already taken." });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      name,
      username: username ? username.trim() : undefined,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// LOGIN USER
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const identifier = (email || "").trim();

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // If account was created with Google and has no password set
    if (!user.password && user.googleId) {
      return res.status(400).json({
        message: "This account was registered using Google. Please click 'Continue with Google' to sign in."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "14d" }
    );

    res.json({ message: "Login successful", token, user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// GOOGLE OAUTH — Register / Login with Google
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential" });
    }

    // Verify the ID token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatar } = payload;

    // Find existing user or create one
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // New user — create account (no password needed)
      user = await User.create({ name, email, googleId, avatar, role: "user" });
    } else if (!user.googleId) {
      // Existing email/password account — link Google ID
      user.googleId = googleId;
      if (!user.avatar) user.avatar = avatar;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "14d" }
    );

    res.json({ message: "Google auth successful", token, user });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({ message: "Invalid Google token", error: error.message });
  }
});

// UPDATE USER PROFILE
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    // Handle username update
    if (username !== undefined) {
      const trimmed = username.trim();
      if (trimmed === "") {
        // allow clearing username
        user.username = undefined;
      } else {
        if (trimmed.length < 3 || trimmed.length > 24) {
          return res.status(400).json({ message: "Username must be between 3 and 24 characters." });
        }
        if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
          return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores." });
        }
        const existingUsername = await User.findOne({ username: trimmed, _id: { $ne: user._id } });
        if (existingUsername) {
          return res.status(400).json({ message: "That username is already taken." });
        }
        user.username = trimmed;
      }
    }

    if (name) user.name = name;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();
    const userResponse = {
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      isPaid: updatedUser.isPaid,
      avatar: updatedUser.avatar,
    };

    res.json({ message: "Profile updated successfully", user: userResponse });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
