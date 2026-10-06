import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext, api } from "../context/AuthContext";
import "../custom-theme.css";
import { IconMedal1, IconMedal2, IconMedal3, IconTrophy, IconBulb, IconBarChart } from "../components/Icons";

const MEDAL = { 1: <IconMedal1 size="1.4em" />, 2: <IconMedal2 size="1.4em" />, 3: <IconMedal3 size="1.4em" /> };

const getRankColor = (rank) => {
  if (rank === 1) return { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.4)", text: "#fbbf24" };
  if (rank === 2) return { bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.35)", text: "#94a3b8" };
  if (rank === 3) return { bg: "rgba(180,120,60,0.1)",   border: "rgba(180,120,60,0.35)",  text: "#cd7f32" };
  return { bg: "transparent", border: "rgba(255,255,255,0.06)", text: "hsl(var(--text-muted))" };
};

const ScoreBadge = ({ score }) => {
  const color = score >= 250 ? "#10b981" : score >= 180 ? "#6366f1" : score >= 120 ? "#f59e0b" : "#f87171";
  return (
    <span style={{
      background: `${color}1a`, border: `1px solid ${color}55`, color,
      padding: "0.2rem 0.5rem", borderRadius: "6px", fontWeight: "700",
      fontSize: "0.85rem", fontVariantNumeric: "tabular-nums",
      display: "inline-block",
    }}>
      {score}
    </span>
  );
};

const LeaderboardPage = () => {
  const { user } = useContext(AuthContext);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get("/results/leaderboard");
        setEntries(res.data || []);
        if (user) {
          const idx = res.data.findIndex((e) => String(e.userId) === String(user._id));
          if (idx !== -1) setMyRank(idx + 1);
        }
      } catch (err) {
        setError("Failed to load leaderboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const isMe = (entry) => user && String(entry.userId) === String(user._id);
  const displayName = (entry) => entry.username ? `@${entry.username}` : entry.name || "Anonymous";

  return (
    <div className="leaderboard-page-container">
      <style>{`
        .leaderboard-page-container {
          min-height: 100vh;
          padding: 1.5rem 1rem 4rem;
          max-width: 860px;
          margin: 0 auto;
        }
        .leaderboard-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .leaderboard-header h1 {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0;
        }
        .leaderboard-header p {
          color: hsl(var(--text-muted));
          margin-top: 0.35rem;
          font-size: 0.9rem;
        }
        .podium-container {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .podium-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          flex: 1;
          max-width: 110px;
        }
        .podium-pillar {
          width: 100%;
          border-radius: 8px 8px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.15rem;
        }
        .leaderboard-table-grid {
          display: grid;
          grid-template-columns: 44px 1fr 90px 75px 75px;
          gap: 0.5rem;
          align-items: center;
          padding: 0.85rem 1rem;
        }
        @media (max-width: 640px) {
          .leaderboard-page-container {
            padding: 1rem 0.75rem 3rem;
          }
          .leaderboard-header h1 {
            font-size: 1.5rem;
          }
          .leaderboard-header p {
            font-size: 0.82rem;
          }
          .podium-container {
            gap: 0.4rem;
            margin-bottom: 1.5rem;
          }
          .podium-step {
            max-width: 95px;
          }
          .podium-pillar {
            font-size: 0.95rem;
          }
          /* On mobile, simplify columns to: Rank | Student | Avg Score | Tests */
          .leaderboard-table-grid {
            grid-template-columns: 36px 1fr 75px 55px;
            padding: 0.75rem 0.75rem;
            gap: 0.35rem;
          }
          .col-hide-mobile {
            display: none !important;
          }
          .user-standing-card {
            padding: 0.85rem 1rem !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="leaderboard-header">
        <div style={{ fontSize: "2.5rem", marginBottom: "0.2rem", color: "#fbbf24" }}><IconTrophy size="2.5rem" color="#fbbf24" /></div>
        <h1>JAMB Leaderboard</h1>
        <p>Ranked by average JAMB score across all completed tests</p>
      </div>

      {/* Current user rank card */}
      {user && (
        <div className="user-standing-card" style={{
          background: "hsl(var(--bg-secondary))",
          border: "1px solid hsl(var(--primary) / 0.35)",
          borderRadius: "14px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}>
          <div>
            <div style={{ fontSize: "0.74rem", color: "hsl(var(--text-muted))", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Standing</div>
            <div style={{ fontWeight: "800", fontSize: "1.08rem", color: "var(--text-main)", marginTop: "0.15rem" }}>
              {user.username ? `@${user.username}` : user.name || "You"}&nbsp;
              {myRank
                ? <span style={{ color: "hsl(var(--primary))" }}>— #{myRank}</span>
                : <span style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", fontWeight: "500" }}>not ranked yet</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            {!user.username && (
              <Link to="/profile" style={{
                fontSize: "0.8rem", background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))",
                border: "1px solid hsl(var(--primary) / 0.35)", padding: "0.4rem 0.8rem",
                borderRadius: "8px", textDecoration: "none", fontWeight: "600",
              }}>Set username →</Link>
            )}
            <Link to="/dashboard" style={{ fontSize: "0.82rem", color: "hsl(var(--text-muted))", textDecoration: "none" }}>← Dashboard</Link>
          </div>
        </div>
      )}

      {/* No username notice */}
      {user && !user.username && (
        <div style={{
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: "10px", padding: "0.8rem 1rem", marginBottom: "1.5rem",
          fontSize: "0.85rem", color: "#d97706", lineHeight: "1.5",
        }}>
          <strong style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><IconBulb size="1em" color="#d97706" /> Tip:</strong> You won't appear on the public leaderboard until you{" "}
          <Link to="/profile" style={{ color: "#d97706", fontWeight: "700" }}>set a username in your profile</Link>.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "hsl(var(--text-muted))" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid hsla(var(--primary),0.2)", borderTopColor: "hsl(var(--primary))", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
          Loading rankings...
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#f87171", background: "rgba(248,113,113,0.08)", borderRadius: "12px", border: "1px solid rgba(248,113,113,0.2)" }}>
          <p style={{ margin: "0 0 1rem 0" }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "hsl(var(--primary))", color: "#fff", border: "none",
              padding: "0.45rem 1rem", borderRadius: "6px", cursor: "pointer", fontWeight: "600",
            }}
          >
            Retry
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3.5rem 1rem", color: "hsl(var(--text-muted))" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", color: "hsl(var(--text-muted))" }}><IconBarChart size="2.5rem" color="hsl(var(--text-muted))" /></div>
          <p style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--text-main)" }}>No ranked students yet.</p>
          <p style={{ fontSize: "0.88rem" }}>Complete a JAMB practice test to appear here!</p>
          <Link to="/questions" style={{ display: "inline-block", marginTop: "1rem", color: "hsl(var(--primary))", fontWeight: "600", textDecoration: "underline" }}>Start a test →</Link>
        </div>
      ) : (
        <>
          {/* Podium — top 3 */}
          <div className="podium-container">
            {[entries[1], entries[0], entries[2]].map((entry, i) => {
              if (!entry) return null;
              const ranks = [2, 1, 3];
              const rank = ranks[i];
              const podiumHeights = ["70px", "95px", "55px"];
              const avatarSizes = ["48px", "58px", "44px"];
              const c = getRankColor(rank);
              return (
                <div key={entry.userId} className="podium-step">
                  <div style={{
                    width: avatarSizes[i], height: avatarSizes[i], borderRadius: "50%",
                    background: `linear-gradient(135deg, ${c.text}33, ${c.text}11)`,
                    border: `2px solid ${c.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: rank === 1 ? "1.4rem" : "1.1rem",
                    boxShadow: isMe(entry) ? `0 0 0 3px hsl(var(--primary))` : "none",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}>
                    {entry.avatar
                      ? <img src={entry.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : MEDAL[rank]
                    }
                  </div>
                  <div style={{ fontWeight: "700", fontSize: rank === 1 ? "0.86rem" : "0.78rem", color: "var(--text-main)", width: "100%", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayName(entry)}
                  </div>
                  <ScoreBadge score={entry.avgJambScore} />
                  <div className="podium-pillar" style={{
                    height: podiumHeights[i],
                    background: `linear-gradient(180deg, ${c.text}22, ${c.text}08)`,
                    border: `1px solid ${c.border}`,
                    color: c.text,
                  }}>
                    #{rank}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full ranked table */}
          <div style={{ background: "hsl(var(--bg-secondary))", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="leaderboard-table-grid" style={{
              background: "hsl(var(--bg-tertiary))",
              fontSize: "0.72rem", fontWeight: "700", color: "hsl(var(--text-muted))",
              textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              <span>#</span>
              <span>Student</span>
              <span style={{ textAlign: "right" }}>Avg Score</span>
              <span style={{ textAlign: "right" }}>Tests</span>
              <span className="col-hide-mobile" style={{ textAlign: "right" }}>Best</span>
            </div>

            {entries.map((entry, idx) => {
              const rank = idx + 1;
              const c = getRankColor(rank);
              const me = isMe(entry);
              return (
                <div key={entry.userId} className="leaderboard-table-grid" style={{
                  background: me ? "hsl(var(--primary) / 0.08)" : c.bg,
                  borderLeft: me ? "3px solid hsl(var(--primary))" : "3px solid transparent",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  transition: "background 0.2s",
                }}>
                  <span style={{ fontWeight: "800", fontSize: "0.88rem", color: c.text }}>
                    {MEDAL[rank] || <span style={{ color: "hsl(var(--text-muted))" }}>{rank}</span>}
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                      background: "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.1))",
                      border: me ? "2px solid hsl(var(--primary))" : "2px solid rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.7rem", fontWeight: "700", color: "hsl(var(--primary))",
                    }}>
                      {entry.avatar
                        ? <img src={entry.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : displayName(entry).replace("@", "").slice(0, 2).toUpperCase()
                      }
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: "700", fontSize: "0.86rem", color: me ? "hsl(var(--primary))" : "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {displayName(entry)}{me ? " (You)" : ""}
                      </div>
                      {entry.lastTested && (
                        <div style={{ fontSize: "0.68rem", color: "hsl(var(--text-muted))" }}>
                          {new Date(entry.lastTested).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}><ScoreBadge score={entry.avgJambScore} /></div>
                  <div style={{ textAlign: "right", fontWeight: "600", color: "hsl(var(--text-muted))", fontSize: "0.82rem" }}>
                    {entry.totalTests}×
                  </div>
                  <div className="col-hide-mobile" style={{ textAlign: "right", fontWeight: "600", color: "hsl(var(--text-muted))", fontSize: "0.82rem" }}>
                    {entry.bestScore}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ textAlign: "center", marginTop: "1.2rem", fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>
            Top {entries.length} students · JAMB exams only
          </p>
        </>
      )}
    </div>
  );
};

export default LeaderboardPage;
