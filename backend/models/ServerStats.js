import mongoose from "mongoose";

// A simple key-value store for singleton server statistics
const serverStatsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

const ServerStats = mongoose.model("ServerStats", serverStatsSchema);

export default ServerStats;
