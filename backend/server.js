import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import practicalRoutes from "./routes/practicalRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import ServerStats from "./models/ServerStats.js";

dotenv.config();
const app = express();
const server = http.createServer(app);

// WebSocket Server (shared so controllers can broadcast)
export const wss = new WebSocketServer({ server });

// Track online users: Map<userId, WebSocket>
// Multiple tabs from same user share the same slot (last one wins is fine)
const onlineUsers = new Map(); // userId -> ws
let peakOnlineCount = 0;       // in-memory cache, loaded from MongoDB on startup
let isPeakLoaded = false;      // guard to prevent race conditions during startup

// Load persisted peak from MongoDB once DB is ready
export async function loadPersistedPeak() {
  try {
    const doc = await ServerStats.findOne({ key: "peakOnlineCount" });
    if (doc) {
      peakOnlineCount = doc.value;
      console.log(`✅ Loaded peak online count from DB: ${peakOnlineCount}`);
    }
  } catch (err) {
    console.error("⚠️  Could not load peak online count:", err.message);
  } finally {
    isPeakLoaded = true;
  }
}

// Debounce handle so rapid connect/disconnect storms don't spam DB writes
let peakSaveTimer = null;
async function persistPeak(newPeak) {
  clearTimeout(peakSaveTimer);
  peakSaveTimer = setTimeout(async () => {
    try {
      await ServerStats.findOneAndUpdate(
        { key: "peakOnlineCount" },
        { value: newPeak, updatedAt: new Date() },
        { upsert: true }
      );
    } catch (err) {
      console.error("⚠️  Could not persist peak online count:", err.message);
    }
  }, 2000); // wait 2s before writing — batches rapid changes
}

// Helper: count unique online users and broadcast to all admin clients
function broadcastOnlineCount() {
  if (!isPeakLoaded) return;
  const count = onlineUsers.size;
  if (count > peakOnlineCount) {
    peakOnlineCount = count;
    persistPeak(peakOnlineCount); // fire-and-forget, debounced
  }
  const msg = JSON.stringify({ type: "ONLINE_COUNT", count, peak: peakOnlineCount });
  wss.clients.forEach((client) => {
    if (client.readyState === 1 /* OPEN */ && client._isAdmin) {
      client.send(msg);
    }
  });
}

wss.on("connection", (ws) => {
  ws._userId = null;
  ws._isAdmin = false;

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw);

      // Client sends { type: "IDENTIFY", userId, isAdmin }
      if (data.type === "IDENTIFY") {
        ws._userId = data.userId || null;
        ws._isAdmin = data.isAdmin === true;

        if (ws._userId) {
          onlineUsers.set(ws._userId, ws);
          broadcastOnlineCount();
        }
      }
    } catch (e) {
      // Ignore malformed messages
    }
  });

  ws.on("close", () => {
    if (ws._userId) {
      // Only remove if this socket is the current one for that user
      if (onlineUsers.get(ws._userId) === ws) {
        onlineUsers.delete(ws._userId);
        broadcastOnlineCount();
      }
    }
  });

  ws.on("error", () => {
    if (ws._userId && onlineUsers.get(ws._userId) === ws) {
      onlineUsers.delete(ws._userId);
      broadcastOnlineCount();
    }
  });
});

// Broadcast helper — sends a JSON message to every connected client
export function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1 /* OPEN */) {
      client.send(msg);
    }
  });
}

// Keep connections alive with a ping every 30s
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.ping();
  });
}, 30000);

// Expose stats for admin REST endpoint
export function getOnlineCount() {
  return onlineUsers.size;
}
export function getPeakOnlineCount() {
  return peakOnlineCount;
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/practicals", practicalRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/payment", paymentRoutes);

const PORT = process.env.PORT || 5000;

// Connect DB, load the persisted peak, then start listening
connectDB()
  .then(loadPersistedPeak)
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Failed to initialize server:", err.message);
  });
