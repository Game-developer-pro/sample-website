import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext, api } from "../context/AuthContext";
import { IconTrophy } from "../components/Icons";

const DashboardPage = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    averageJambScore: 0,
  });
  const [recentResults, setRecentResults] = useState([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);
  const [fetchingStats, setFetchingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        const res = await api.get("/results");
        const results = res.data || [];
        setRecentResults(results.slice(0, 3)); // dynamic list of recent 3 attempts

        if (results.length > 0) {
          const total = results.length;
          let sumPercentage = 0;
          let jambTotal = 0;
          let jambCount = 0;

          results.forEach((item) => {
            const percentage = (item.score / item.totalQuestions) * 100;
            sumPercentage += percentage;
            
            if (item.jambScore != null) {
              jambTotal += item.jambScore;
              jambCount += 1;
            }
          });

          setStats({
            totalAttempts: total,
            averageScore: Math.round(sumPercentage / total),
            averageJambScore: jambCount > 0 ? Math.round(jambTotal / jambCount) : 0,
          });
        }
      } catch (err) {
        console.error("Failed to load results stats", err);
      } finally {
        setFetchingStats(false);
      }
    };

    const fetchLatestAnnouncement = async () => {
      if (!user) return;
      try {
        const res = await api.get("/announcements");
        if (res.data && res.data.length > 0) {
          setLatestAnnouncement(res.data[0]);
        }
      } catch (err) {
        console.error("Failed to load announcements", err);
      }
    };

    fetchDashboardData();
    fetchLatestAnnouncement();
  }, [user]);

  if (loading || !user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        {/* Welcome Section */}
        <header className="welcome-banner">
          <div className="welcome-text">
            <h1>Welcome, {user.name?.split(" ")[0]}!</h1>
            <p>Select an option below to start your Computer Based Test or view statistics.</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div className="user-role-tag">{user.role} Account</div>
            {user.isPaid ? (
              <div
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  padding: "0.35rem 0.85rem",
                  borderRadius: "50px",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                Lifetime Access
              </div>
            ) : (
              <Link
                to="/payment"
                title="Click to upgrade to Lifetime Access"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#fff",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  padding: "0.35rem 0.95rem",
                  borderRadius: "50px",
                  boxShadow: "0 2px 8px rgba(245, 158, 11, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(245, 158, 11, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(245, 158, 11, 0.35)";
                }}
              >
                Trial • Unlock Lifetime
              </Link>
            )}
          </div>
        </header>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-details">
              <h3>{stats.totalAttempts}</h3>
              <p>Total Attempts</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-details">
              <h3>{stats.averageScore}%</h3>
              <p>Average Overall Score</p>
            </div>
          </div>
          <Link
            to="/leaderboard"
            className="stat-card"
            style={{
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
              position: "relative",
              transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.borderColor = "hsla(var(--primary), 0.6)";
              e.currentTarget.style.boxShadow = "0 8px 24px hsla(var(--primary), 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "";
              e.currentTarget.style.boxShadow = "";
            }}
            title="Click to view JAMB Leaderboard"
          >
            <div className="stat-details">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <h3>{stats.averageJambScore}</h3>
                <span style={{
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  letterSpacing: "0.04em",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "20px",
                  background: "hsla(var(--primary), 0.15)",
                  color: "hsl(var(--primary))",
                  border: "1px solid hsla(var(--primary), 0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}>
                  <IconTrophy size="1em" color="hsl(var(--primary))" style={{ marginRight: "0.25rem" }} /> Leaderboard &rarr;
                </span>
              </div>
              <p>Average JAMB Score</p>
            </div>
          </Link>
        </section>

        {/* Latest Announcement Widget */}
        {latestAnnouncement && (
          <section className="latest-announcement-widget" style={{ marginBottom: "2rem", padding: "1.5rem", background: "var(--bg-tertiary)", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.25rem", color: "var(--accent)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Latest Update
              </h2>
              <Link to="/news-feed" style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "underline" }}>View All</Link>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{latestAnnouncement.title}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
              {latestAnnouncement.content.length > 150 ? `${latestAnnouncement.content.substring(0, 150)}...` : latestAnnouncement.content}
            </p>
          </section>
        )}

        {/* Action Panel */}
        <div className="main-dashboard-grid">
          <div className="action-card glass-glow-card" style={{borderRadius: "0.2rem", paddingLeft: "2rem", paddingBottom: "2rem", paddingTop: "2rem" }}>
            <h2>CBT Assessment</h2>
            <p>
              Test your knowledge with our computer-based testing portal. Once started, you'll have
              to answer the questions within the given time limits.
            </p>
            <div className="action-buttons">
              <Link to="/questions" className="btn-dashboard-primary">
                Start New Exam
              </Link>
              <Link to="/results" className="btn-dashboard-secondary">
                View Past Results
              </Link>
            </div>
          </div>

          {user.role === "admin" && (
            <div className="action-card admin-action-card">
              <h2>Instructor Controls</h2>
              <p>
                As an admin, you have permission to manage and add questions to the testing pool. Keep
                the evaluation material up to date!
              </p>
              <div className="action-buttons">
                <Link to="/add-question" className="btn-dashboard-admin">
                  Add New Question
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent Attempts Table */}
        <section className="recent-attempts-section">
          <h2>Recent Test Attempts</h2>
          {fetchingStats ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
              Loading recent attempts...
            </div>
          ) : recentResults.length > 0 ? (
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Exam Name</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Date Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {recentResults.map((result) => {
                    const percentage = Math.round((result.score / result.totalQuestions) * 100);
                    return (
                      <tr key={result._id}>
                        <td>{result.testName || "General CBT"}</td>
                        <td>{result.score} / {result.totalQuestions}</td>
                        <td className={percentage >= 50 ? "pass-text" : "fail-text"}>
                          {percentage}%
                        </td>
                        <td>{new Date(result.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data-msg">No tests taken yet. Start a new exam to see your history!</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
