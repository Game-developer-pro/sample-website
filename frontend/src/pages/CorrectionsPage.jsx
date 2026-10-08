import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext, api } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import "../custom-theme.css";

const CorrectionsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [aiExplanations, setAiExplanations] = useState({}); // keyed by question index — final text
  const [aiStreaming, setAiStreaming] = useState({});        // keyed by index — live streaming text
  const [aiLoading, setAiLoading] = useState({});
  const streamAbortRef = useRef({});                         // abort controllers keyed by index

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/results/${id}`);
        setResult(res.data);
      } catch (err) {
        console.error("Error fetching result corrections:", err);
        navigate("/results");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="loader-container min-h-screen" style={{ flexDirection: "column" }}>
        <div className="loader"></div>
        <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>Loading corrections...</p>
      </div>
    );
  }

  if (!result || !result.corrections || result.corrections.length === 0) {
    return (
      <div className="exam-wrapper min-h-screen">
        <div className="glass-card text-center" style={{ padding: "3rem", margin: "2rem auto", maxWidth: "600px" }}>
          <h2>No Corrections Found</h2>
          <p>This test might be from an older version that didn't save corrections.</p>
          <Link to="/results" className="btn-results-primary mt-4">Back to Results</Link>
        </div>
      </div>
    );
  }

  const corrections = result.corrections;
  
  // Assign a global index to each correction so we can map them back easily from the grid
  corrections.forEach((c, i) => { c.globalIdx = i; });

  // Group by subject for the right sidebar grid
  const questionsBySubject = corrections.reduce((acc, q) => {
    if (!acc[q.subject]) acc[q.subject] = [];
    acc[q.subject].push(q);
    return acc;
  }, {});

  const currentCorr = corrections[currentIndex];
  // Determine the active subject tab based on current question
  const activeSubjectTab = currentCorr.subject;

  const handleNext = () => {
    if (currentIndex < corrections.length - 1) setCurrentIndex(prev => prev + 1);
  };
  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleAiExplain = async (idx) => {
    if (aiExplanations[idx] || aiLoading[idx]) return;
    const corr = corrections[idx];

    setAiLoading(prev => ({ ...prev, [idx]: true }));
    setAiStreaming(prev => ({ ...prev, [idx]: "" }));

    // Abort any previous stream for this slot
    if (streamAbortRef.current[idx]) streamAbortRef.current[idx].abort();
    const controller = new AbortController();
    streamAbortRef.current[idx] = controller;

    const params = new URLSearchParams({
      question: corr.questionText,
      options: JSON.stringify(corr.options),
      correctAnswer: corr.correctAnswer,
      selectedAnswer: corr.selectedAnswer || "",
      subject: corr.subject || "",
    });

    const rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
    const BASE_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

    try {
      const res = await fetch(`${BASE_URL}/ai/explain-stream?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Stream request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep the incomplete line in the buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.error) {
              fullText = payload.error;
              setAiStreaming(prev => ({ ...prev, [idx]: payload.error }));
            } else if (payload.done) {
              // Stream finished — move to permanent store
              setAiExplanations(prev => ({ ...prev, [idx]: fullText }));
              setAiStreaming(prev => { const n = { ...prev }; delete n[idx]; return n; });
            } else if (payload.chunk) {
              // For cache hits the whole text comes in one chunk
              if (payload.cached) {
                fullText = payload.chunk;
              } else {
                fullText += payload.chunk;
              }
              setAiStreaming(prev => ({ ...prev, [idx]: fullText }));
            }
          } catch {
            // skip malformed SSE line
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setAiExplanations(prev => ({ ...prev, [idx]: "Failed to load explanation. Please check your connection and try again." }));
        setAiStreaming(prev => { const n = { ...prev }; delete n[idx]; return n; });
      }
    } finally {
      setAiLoading(prev => ({ ...prev, [idx]: false }));
    }
  };

  return (
    <div 
      className="exam-layout-wrapper min-h-screen"
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="exam-grid-container">
        
        {/* Left Side: Question Display */}
        <div className="exam-main-panel">
          <div className="exam-card glass-glow-card">
            <div className="exam-card-header">
              <span style={{ 
                fontWeight: "bold", 
                padding: "0.4rem 0.8rem", 
                borderRadius: "50px", 
                fontSize: "0.85rem",
                background: currentCorr.isCorrect ? "#10b981" : "#ef4444",
                color: "#fff",
                whiteSpace: "nowrap"
              }}>
                {currentCorr.isCorrect ? "✓ You got this right" : "✗ You got this wrong"}
              </span>
              <span className="badge-category">{currentCorr.subject}</span>
            </div>

          <div className="exam-progress-bar-container">
            <div 
              className="exam-progress-bar"
              style={{ width: `${((currentIndex + 1) / corrections.length) * 100}%`, background: "var(--color-primary)" }}
            ></div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 className="question-text" style={{ margin: 0 }}>{currentCorr.questionText}</h2>
          </div>

          {currentCorr.image && (
            <div style={{ margin: "1rem 0", textAlign: "center" }}>
              <img
                src={currentCorr.image}
                alt="Question diagram"
                style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "10px", objectFit: "contain", border: "1px solid var(--border)" }}
              />
            </div>
          )}

          <div className="options-container">
            {currentCorr.options.map((option, idx) => {
              const isSelected = currentCorr.selectedAnswer === option;
              const isActualCorrect = currentCorr.correctAnswer === option;
              
              let styleObj = {};
              
              if (isSelected && currentCorr.isCorrect) {
                // Student chose this and it's correct — solid deep green
                styleObj = { border: "2px solid #10b981", background: "#10b981", color: "#fff" };
              } else if (isSelected && !currentCorr.isCorrect) {
                // Student chose this and it's wrong — solid deep red
                styleObj = { border: "2px solid #ef4444", background: "#ef4444", color: "#fff" };
              } else if (isActualCorrect && !currentCorr.isCorrect) {
                // Student didn't choose this, but it is the right answer — solid deep green
                styleObj = { border: "2px solid #10b981", background: "#10b981", color: "#fff" };
              }

              return (
                <div
                  key={idx}
                  className="option-btn"
                  style={{ ...styleObj, cursor: "default" }}
                >
                  <span className="option-letter" style={(isActualCorrect || isSelected) ? { color: "#fff", borderRight: "1px solid rgba(255,255,255,0.3)" } : {}}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="option-val">{option}</span>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="exam-card-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem" }}>
            <button onClick={handlePrev} className="btn-action-prev" disabled={currentIndex === 0}>
              ← Previous
            </button>
            <button onClick={handleNext} className="btn-action-next" disabled={currentIndex === corrections.length - 1}>
              Next →
            </button>
          </div>

          {/* AI Explanation Panel */}
          <div className="ai-explanation-container">
            {/* Not yet started */}
            {!aiExplanations[currentIndex] && !aiStreaming[currentIndex] && (
              <button
                className="btn-ai-explain"
                onClick={() => handleAiExplain(currentIndex)}
                disabled={aiLoading[currentIndex]}
              >
                {aiLoading[currentIndex] ? (
                  <><span className="ai-spinner"></span> Connecting to AI...</>
                ) : (
                  <>&#x1F916; Explain This with AI</>
                )}
              </button>
            )}

            {/* Streaming in progress — show live text */}
            {aiStreaming[currentIndex] !== undefined && !aiExplanations[currentIndex] && (
              <div className="ai-explanation-panel">
                <div className="ai-explanation-header">
                  <span>&#x1F916; AI Explanation <span className="ai-stream-cursor">▌</span></span>
                </div>
                <div className="ai-explanation-body markdown-body" style={{ whiteSpace: "pre-wrap" }}>
                  {aiStreaming[currentIndex]}
                </div>
              </div>
            )}

            {/* Fully complete — render markdown */}
            {aiExplanations[currentIndex] && (
              <div className="ai-explanation-panel">
                <div className="ai-explanation-header">
                  <span>&#x1F916; AI Explanation</span>
                  <button
                    className="ai-regen-btn"
                    onClick={() => {
                      setAiExplanations(prev => { const n = {...prev}; delete n[currentIndex]; return n; });
                      setAiStreaming(prev => { const n = {...prev}; delete n[currentIndex]; return n; });
                    }}
                  >
                    ↺ Regenerate
                  </button>
                </div>
                <div className="ai-explanation-body markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {aiExplanations[currentIndex]}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          </div>
        </div>

        {/* Right Side: Status Widgets */}
        <div className="exam-sidebar-panel">
          
          <div className="glass-card" style={{ padding: "1rem", textAlign: "center" }}>
             <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>Review Mode</h3>
             <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>Reviewing your answers against the correct solutions.</p>
             <Link to="/results" className="btn-results-secondary" style={{ display: "block", marginTop: "1rem", textAlign: "center" }}>
               Back to Results
             </Link>
          </div>

          {/* Grid Question Map */}
          <div className="question-grid-card glass-card">
            <h3>Question Map</h3>

            {/* Subject Navigation Tabs */}
            {Object.keys(questionsBySubject).length > 1 && (
              <div className="subject-tabs" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {Object.keys(questionsBySubject).map(subj => {
                  const subjectQuestions = questionsBySubject[subj];
                  return (
                    <button
                      key={subj}
                      onClick={() => setCurrentIndex(subjectQuestions[0].globalIdx)}
                      className={`custom-btn ${activeSubjectTab === subj ? "active" : ""}`}
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", flex: "1 1 auto" }}
                    >
                      {subj}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="question-numbers-grid" style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "5px", paddingLeft: "10px" }}>
              {(questionsBySubject[activeSubjectTab] || []).map((q, localIdx) => {
                const isCurrent = q.globalIdx === currentIndex;
                const isCorrect = q.isCorrect;
                
                // Color the grid button based on whether they got it right or wrong
                let gridClass = "grid-num-btn";
                if (isCurrent) gridClass += " current";
                
                let bgStyle = {};
                if (!isCurrent) {
                  bgStyle = isCorrect 
                    ? { background: "#10b981", color: "#fff", fontWeight: "bold" } 
                    : { background: "#ef4444", color: "#fff", fontWeight: "bold" };
                } else {
                  bgStyle = { fontWeight: "bold" };
                }

                return (
                  <button
                    key={q.globalIdx}
                    onClick={() => setCurrentIndex(q.globalIdx)}
                    className={gridClass}
                    style={bgStyle}
                  >
                    {localIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CorrectionsPage;
