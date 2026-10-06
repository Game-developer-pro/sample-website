import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext, api } from "../context/AuthContext";

const WS_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api")
  .replace(/^http/, "ws")
  .replace("/api", "");

// Animated count hook — animates FROM current value TO new target (no zero-reset)
function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(target);
  const raf = useRef(null);
  const fromRef = useRef(target); // tracks where the animation started from

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const from = fromRef.current; // start from whatever is currently displayed
    const diff = target - from;
    if (diff === 0) return;

    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Ease-out cubic: feels snappy but smooth
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + diff * eased);
      setValue(current);
      fromRef.current = current;
      if (progress < 1) raf.current = requestAnimationFrame(step);
      else {
        setValue(target);
        fromRef.current = target;
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}


// Sparkline mini-chart (SVG)
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 120;
  const h = 40;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} style={{ opacity: 0.7 }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(" ")}
      />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]}
        r="4" fill={color} />
    </svg>
  );
}

// Pulsing live dot
function LiveDot({ active }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <span style={{
        width: 10, height: 10, borderRadius: "50%",
        background: active ? "#22c55e" : "#6b7280",
        boxShadow: active ? "0 0 0 0 rgba(34,197,94,0.7)" : "none",
        animation: active ? "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" : "none",
        display: "inline-block",
      }} />
      <span style={{ fontSize: "0.75rem", color: active ? "#22c55e" : "#6b7280", fontWeight: 600 }}>
        {active ? "LIVE" : "DISCONNECTED"}
      </span>
    </span>
  );
}

export default function AdminDashboardPage() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats, setStats] = useState({ totalUsers: 0, todayRegistrations: 0, onlineCount: 0, peakOnlineCount: 0 });
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [onlineHistory, setOnlineHistory] = useState(Array(20).fill(0));
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== "admin") navigate("/dashboard");
  }, [user, navigate]);

  // Fetch initial stats via REST
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Poll every 60s as fallback
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // WebSocket connection for real-time online count
  const connectWS = useCallback(() => {
    if (!token) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      // Identify this admin client
      ws.send(JSON.stringify({
        type: "IDENTIFY",
        userId: user?._id || user?.id,
        isAdmin: true,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ONLINE_COUNT") {
          const count = data.count;
          const peak = data.peak ?? 0;
          setStats(prev => ({ ...prev, onlineCount: count, peakOnlineCount: Math.max(prev.peakOnlineCount, peak) }));
          setLastUpdated(new Date());
          setOnlineHistory(prev => [...prev.slice(1), count]);
        }
      } catch (e) { /* ignore */ }
    };

    ws.onclose = () => {
      setWsConnected(false);
      // Reconnect after 5s
      reconnectTimer.current = setTimeout(connectWS, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [token, user]);

  useEffect(() => {
    connectWS();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connectWS]);

  const displayOnline = useCountUp(stats.onlineCount, 800);
  const displayTotal = useCountUp(stats.totalUsers, 1200);
  const displayToday = useCountUp(stats.todayRegistrations, 800);
  const displayPeak  = useCountUp(stats.peakOnlineCount, 600);

  const cards = [
    {
      id: "online",
      label: "Currently Online",
      value: displayOnline,
      rawValue: stats.onlineCount,  
      color: "#22c55e",
      gradient: "linear-gradient(135deg, #052e16 0%, #14532d 100%)",
      border: "rgba(34,197,94,0.4)",
      glow: "rgba(34,197,94,0.15)",
      desc: "Active users right now",
      history: onlineHistory,
    },
    {
      id: "total",
      label: "Total Accounts",
      value: displayTotal,
      rawValue: stats.totalUsers,
      color: "#818cf8",
      gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
      border: "rgba(129,140,248,0.4)",
      glow: "rgba(129,140,248,0.15)",
      desc: "All registered users ever",
      history: null,
    },
    {
      id: "today",
      label: "New Today",
      value: displayToday,
      rawValue: stats.todayRegistrations,
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #1c1008 0%, #451a03 100%)",
      border: "rgba(245,158,11,0.4)",
      glow: "rgba(245,158,11,0.15)",
      desc: "Registered in the last 24 hours",
      history: null,
    },
    {
      id: "peak",
      label: "All-Time Peak",
      value: displayPeak,
      rawValue: stats.peakOnlineCount,
      color: "#f43f5e",
      gradient: "linear-gradient(135deg, #1a0010 0%, #4c0519 100%)",
      border: "rgba(244,63,94,0.4)",
      glow: "rgba(244,63,94,0.15)",
      desc: "Most users online at the same time",
      history: null,
    },
  ];

  return (
    <>
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .adm-page {
          min-height: 100vh;
          background: var(--bg-primary, #0f0f1a);
          padding: 2rem 1.5rem 4rem;
          font-family: 'Inter', 'Outfit', sans-serif;
        }
        .adm-header {
          max-width: 1100px;
          margin: 0 auto 2.5rem;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          animation: fadein 0.5s ease both;
        }
        .adm-title { font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 800; color: #fff; margin: 0; line-height: 1.1; }
        .adm-title span { background: linear-gradient(90deg, #818cf8, #c084fc, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .adm-subtitle { color: #94a3b8; margin: 0.3rem 0 0; font-size: 0.95rem; }
        .adm-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; }
        .adm-timestamp { font-size: 0.78rem; color: #64748b; }

        .adm-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .adm-card {
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid;
          position: relative;
          overflow: hidden;
          animation: fadein 0.6s ease both;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          cursor: default;
        }
        .adm-card:hover {
          transform: translateY(-4px) scale(1.01);
        }
        .adm-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          pointer-events: none;
        }

        .adm-card-icon { font-size: 2.2rem; margin-bottom: 0.75rem; display: block; }
        .adm-card-label {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.65;
          color: #fff;
          margin-bottom: 0.5rem;
        }
        .adm-card-value {
          font-size: clamp(3rem, 6vw, 4.5rem);
          font-weight: 900;
          line-height: 1;
          margin: 0.25rem 0 0.5rem;
        }
        .adm-card-desc { font-size: 0.82rem; color: rgba(255,255,255,0.45); margin-bottom: 1rem; }
        .adm-card-footer { display: flex; align-items: center; justify-content: space-between; }
        .adm-card-trend { font-size: 0.78rem; color: rgba(255,255,255,0.4); }

        .adm-refresh-btn {
          margin-top: 2rem;
          max-width: 1100px;
          margin-left: auto;
          margin-right: auto;
          display: flex;
          justify-content: flex-end;
        }
        .adm-btn {
          background: rgba(129,140,248,0.15);
          border: 1px solid rgba(129,140,248,0.3);
          color: #818cf8;
          padding: 0.55rem 1.3rem;
          border-radius: 50px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: background 0.2s, transform 0.15s;
        }
        .adm-btn:hover { background: rgba(129,140,248,0.28); transform: scale(1.04); }

        .adm-info-bar {
          max-width: 1100px;
          margin: 1.5rem auto 0;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 1.1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 0.82rem;
          color: #94a3b8;
          animation: fadein 0.7s ease both;
        }
        .adm-info-bar span { font-size: 1.1rem; }

        @media (max-width: 520px) {
          .adm-header { flex-direction: column; align-items: flex-start; }
          .adm-meta { align-items: flex-start; }
        }
      `}</style>

      <div className="adm-page">
        <div className="adm-header">
          <div>
            <h1 className="adm-title">Admin <span>Dashboard</span></h1>
            <p className="adm-subtitle">Real-time user monitoring &amp; platform stats</p>
          </div>
          <div className="adm-meta">
            <LiveDot active={wsConnected} />
            {lastUpdated && (
              <span className="adm-timestamp">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="adm-grid">
          {cards.map((card, i) => (
            <div
              key={card.id}
              className="adm-card"
              style={{
                background: card.gradient,
                borderColor: card.border,
                boxShadow: `0 0 40px ${card.glow}, 0 8px 32px rgba(0,0,0,0.4)`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <span className="adm-card-icon">{card.icon}</span>
              <div className="adm-card-label">{card.label}</div>
              <div className="adm-card-value" style={{ color: card.color }}>
                {card.value.toLocaleString()}
              </div>
              <div className="adm-card-desc">{card.desc}</div>
              <div className="adm-card-footer">
                <span className="adm-card-trend">
                  {card.id === "online" ? "Updates via WebSocket" :
                   card.id === "today"  ? "Resets at midnight UTC" :
                                          "Since app launch"}
                </span>
                {card.history && <Sparkline data={card.history} color={card.color} />}
              </div>
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 1100, margin: "1.5rem auto 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              className="adm-btn"
              style={{ background: "rgba(47,158,157,0.2)", borderColor: "rgba(47,158,157,0.4)", color: "#76C7C0" }}
              onClick={() => navigate("/admin/feedback")}
            >
              View User Feedback &amp; Messages
            </button>
            <button
              className="adm-btn"
              style={{ background: "rgba(168,85,247,0.2)", borderColor: "rgba(168,85,247,0.4)", color: "#c084fc" }}
              onClick={() => navigate("/add-question")}
            >
              Add New Question
            </button>
          </div>
          <button className="adm-btn" onClick={fetchStats}>
            Refresh Stats
          </button>
        </div>

        <div className="adm-info-bar">
          <span>
            <strong style={{ color: "#c084fc" }}>Online count</strong> updates instantly whenever a user connects or disconnects.{" "}
            <strong style={{ color: "#818cf8" }}>Total &amp; today's</strong> figures refresh every 60 seconds automatically.
          </span>
        </div>
      </div>
    </>
  );
}
