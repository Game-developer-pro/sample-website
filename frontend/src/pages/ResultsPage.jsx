import React, { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext, api } from "../context/AuthContext";

const ResultsPage = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0); // index of which result is shown at top
  const topRef = useRef(null);

  // Route protection
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      try {
        const res = await api.get("/results");
        setResults(res.data || []);
      } catch (err) {
        console.error("Error fetching results history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="loader-container min-h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="results-wrapper">
        <div className="results-container">
          <div className="glass-card text-center no-attempts-card">
            <h2>No Test Results Found</h2>
            <p>You haven't completed any assessments yet.</p>
            <Link to="/questions" className="btn-results-primary mt-4">
              Take Your First Test
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSelectResult = (index) => {
    setFeaturedIndex(index);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const featuredResult = results[featuredIndex];
  const isLatest = featuredIndex === 0;

  return (
    <div className="results-wrapper">
      <div className="results-container" ref={topRef}>

        {/* Featured Result Callout */}
        <div className="latest-result-card glass-glow-card">
          <span className="celebration-badge">
            {isLatest ? "✨ Latest Attempt Result ✨" : `📋 Result ${featuredIndex + 1} of ${results.length}`}
          </span>

          <div className="result-main-grid">

            {/* Score circle */}
            <div className="score-radial-progress">
              <div className="score-inner-content">
                <span className="big-percentage">
                  {featuredResult.examType === "JAMB" && featuredResult.jambScore != null ? (
                    <>{featuredResult.jambScore} <span style={{ fontSize: "0.5em" }}>/ 400</span></>
                  ) : (
                    <>{Math.round((featuredResult.score / featuredResult.totalQuestions) * 100)}%</>
                  )}
                </span>
                <span className="score-fraction">
                  {featuredResult.score} / {featuredResult.totalQuestions} Right
                  {featuredResult.examType === "JAMB" && ` (${Math.round((featuredResult.score / featuredResult.totalQuestions) * 100)}%)`}
                </span>
              </div>
            </div>

            {/* Score Details */}
            <div className="result-details-text">
              <h2>{featuredResult.testName || "CBT Assessment"}</h2>
              <p>Taken on {new Date(featuredResult.createdAt).toLocaleString()}</p>

              <div className="status-badge-container">
                {Math.round((featuredResult.score / featuredResult.totalQuestions) * 100) >= 50 ? (
                  <span className="badge-pass">PASS</span>
                ) : (
                  <span className="badge-fail">FAIL</span>
                )}
              </div>

              <div className="result-actions-row">
                <Link to="/questions" className="btn-results-primary">
                  Retake Exam
                </Link>
                <Link
                  to={`/corrections/${featuredResult._id}`}
                  className="btn-results-secondary"
                  style={{ background: "var(--color-primary)", color: "#fff", borderColor: "var(--color-primary)" }}
                >
                  Review Corrections
                </Link>
                <Link to="/dashboard" className="btn-results-secondary">
                  Back to Dashboard
                </Link>
              </div>
            </div>

          </div>

          {/* Subject Breakdown */}
          {featuredResult.breakdown && Object.keys(featuredResult.breakdown).length > 0 && (
            <div className="subject-breakdown-section" style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
              <h3>Subject Breakdown</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
                {Object.entries(featuredResult.breakdown).map(([subj, stats]) => (
                  <div key={subj} className="glass-card" style={{ padding: "1rem", borderRadius: "12px", background: "var(--bg-tertiary)" }}>
                    <h4 style={{ marginBottom: "0.5rem", color: "var(--text-main)" }}>{subj}</h4>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>Answered: {stats.answered} / {stats.total}</p>
                    <p style={{ margin: 0, color: "var(--success)", fontSize: "0.9rem" }}>Right: {stats.correct}</p>
                    <p style={{ margin: 0, color: "var(--error)", fontSize: "0.9rem" }}>Wrong: {stats.wrong}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History Table — all results are clickable */}
        {results.length > 1 && (
          <div className="results-history-section">
            <h2>Test History <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-muted)" }}>(click any row to view)</span></h2>
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Exam Name</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Status</th>
                    <th>Date &amp; Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => {
                    const percentage = Math.round((result.score / result.totalQuestions) * 100);
                    const isJamb = result.examType === "JAMB";
                    const scoreDisplay =
                      isJamb && result.jambScore != null
                        ? `${result.jambScore} / 400`
                        : `${result.score} / ${result.totalQuestions}`;
                    const isFeatured = index === featuredIndex;

                    return (
                      <tr
                        key={result._id}
                        onClick={() => handleSelectResult(index)}
                        className={`result-history-row${isFeatured ? " result-history-row--active" : ""}`}
                        title="Click to view this result"
                      >
                        <td>
                          {result.testName || "CBT Assessment"}{" "}
                          {isJamb && <span style={{ fontSize: "0.7em", color: "#aaa" }}>(JAMB)</span>}
                          {isFeatured && (
                            <span style={{ marginLeft: "0.5rem", fontSize: "0.7em", background: "var(--color-primary)", color: "#fff", padding: "0.15rem 0.4rem", borderRadius: "50px" }}>
                              Viewing
                            </span>
                          )}
                        </td>
                        <td>{scoreDisplay}</td>
                        <td>{percentage}%</td>
                        <td>
                          {percentage >= 50 ? (
                            <span className="status-dot-pass">● Pass</span>
                          ) : (
                            <span className="status-dot-fail">● Fail</span>
                          )}
                        </td>
                        <td>{new Date(result.createdAt).toLocaleString()}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <Link
                            to={`/corrections/${result._id}`}
                            className="btn-results-secondary"
                            style={{ fontSize: "0.8rem", padding: "0.3rem 0.7rem", whiteSpace: "nowrap" }}
                          >
                            Corrections
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ResultsPage;
