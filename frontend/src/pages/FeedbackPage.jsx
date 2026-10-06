import React, { useState, useEffect, useContext, useRef } from "react";
import { AuthContext, api } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "../custom-theme.css";

const CATEGORIES = [
  "General Feedback",
  "Question Error / Correction",
  "Bug Report",
  "Feature Suggestion",
  "Exam / CBT Experience",
  "Account & Profile",
];

const FeedbackPage = () => {
  const { user } = useContext(AuthContext);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // New feedback modal state
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState("General Feedback");
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const messagesEndRef = useRef(null);

  const fetchFeedbacks = async (autoSelectId = null) => {
    try {
      const res = await api.get("/feedback/my-feedback");
      setFeedbacks(res.data);
      if (res.data.length > 0) {
        if (autoSelectId) {
          const matched = res.data.find((f) => f._id === autoSelectId);
          setSelectedFeedback(matched || res.data[0]);
        } else if (!selectedFeedback) {
          setSelectedFeedback(res.data[0]);
        } else {
          // Update selected thread in place
          const updatedSelected = res.data.find((f) => f._id === selectedFeedback._id);
          if (updatedSelected) setSelectedFeedback(updatedSelected);
        }
      }
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    const interval = setInterval(fetchFeedbacks, 8000); // Polling for live replies
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedFeedback?.messages]);

  const handleSelectFeedback = async (item) => {
    setSelectedFeedback(item);
    try {
      // Mark as read on backend
      await api.get(`/feedback/${item._id}`);
      // Update locally
      setFeedbacks((prev) =>
        prev.map((f) => (f._id === item._id ? { ...f, unreadByUser: false } : f))
      );
    } catch (e) {
      // ignore
    }
  };

  const handleCreateFeedback = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      setErrorMsg("Please fill out both the subject and message.");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await api.post("/feedback", {
        category: newCategory,
        subject: newSubject.trim(),
        message: newMessage.trim(),
      });
      setSuccessMsg("Feedback submitted! An admin will review and reply shortly.");
      setNewSubject("");
      setNewMessage("");
      setShowModal(false);
      await fetchFeedbacks(res.data._id);
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedFeedback) return;
    setSendingReply(true);
    try {
      const res = await api.post(`/feedback/${selectedFeedback._id}/reply`, {
        text: replyText.trim(),
      });
      setSelectedFeedback(res.data);
      setFeedbacks((prev) =>
        prev.map((f) => (f._id === res.data._id ? res.data : f))
      );
      setReplyText("");
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return <span className="feedback-status-badge badge-resolved"> Resolved</span>;
      case "in_progress":
        return <span className="feedback-status-badge badge-progress"> In Review</span>;
      default:
        return <span className="feedback-status-badge badge-open">
           Open</span>;
    }
  };

  return (
    <div className="feedback-container">
      {/* Header Banner */}
      <div className="feedback-header">
        <div>
          <h1 className="feedback-title">Feedback & Support Center</h1>
          <p className="feedback-subtitle">
            Have questions, caught a question error, or want to suggest improvements? Send us a message and our team will respond directly below!
          </p>
        </div>
        <button
          className="btn-new-feedback"
          onClick={() => {
            setErrorMsg("");
            setShowModal(true);
          }}
        >
           New Feedback
        </button>
      </div>

      {successMsg && (
        <div className="feedback-alert alert-success">
           {successMsg}
        </div>
      )}

      {/* Main 2-Pane Chat & Ticket Layout */}
      <div className="feedback-layout">
        {/* Left Sidebar: Threads List */}
        <div className="feedback-sidebar">
          <div className="sidebar-header">
            <h3>Your Messages ({feedbacks.length})</h3>
          </div>

          {loading ? (
            <div className="feedback-loading">Loading conversations...</div>
          ) : feedbacks.length === 0 ? (
            <div className="feedback-empty-sidebar">
              <p>No feedback sent yet.</p>
              <button
                className="btn-link-create"
                onClick={() => setShowModal(true)}
              >
                Send your first message
              </button>
            </div>
          ) : (
            <div className="threads-list">
              {feedbacks.map((item) => {
                const isSelected = selectedFeedback?._id === item._id;
                const lastMsg = item.messages?.[item.messages.length - 1];
                return (
                  <div
                    key={item._id}
                    className={`thread-item ${isSelected ? "active" : ""} ${
                      item.unreadByUser ? "unread" : ""
                    }`}
                    onClick={() => handleSelectFeedback(item)}
                  >
                    <div className="thread-item-top">
                      <span className="thread-category">{item.category}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <h4 className="thread-subject">{item.subject}</h4>
                    <p className="thread-preview">
                      {lastMsg ? (
                        <>
                          <strong>{lastMsg.senderRole === "admin" ? "Admin: " : "You: "}</strong>
                          {lastMsg.text}
                        </>
                      ) : (
                        "No messages yet"
                      )}
                    </p>
                    <div className="thread-footer">
                      <span className="thread-date">
                        {new Date(item.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {item.unreadByUser && <span className="unread-dot">New Reply!</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane: Active Message Thread */}
        <div className="feedback-chat-pane">
          {selectedFeedback ? (
            <>
              {/* Thread Info Bar */}
              <div className="chat-thread-info">
                <div>
                  <div className="chat-meta-row">
                    <span className="chat-category-pill">{selectedFeedback.category}</span>
                    {getStatusBadge(selectedFeedback.status)}
                    <span className="chat-id">Ticket #{selectedFeedback._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <h2 className="chat-subject">{selectedFeedback.subject}</h2>
                </div>
              </div>

              {/* Message Bubbles History */}
              <div className="chat-messages-container">
                {selectedFeedback.messages?.map((msg, index) => {
                  const isAdmin = msg.senderRole === "admin";
                  return (
                    <div
                      key={index}
                      className={`chat-bubble-row ${isAdmin ? "row-admin" : "row-user"}`}
                    >
                      <div className="chat-avatar">
                        {isAdmin ? "ExamQuest Support (Admin)" : (msg.senderName?.[0] || "U")}
                      </div>
                      <div className={`chat-bubble ${isAdmin ? "bubble-admin" : "bubble-user"}`}>
                        <div className="bubble-sender-name">
                          {isAdmin ? "ExamQuest Support (Admin)" : "You"}
                          <span className="bubble-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="bubble-text">{msg.text}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Box */}
              <form onSubmit={handleSendReply} className="chat-reply-bar">
                <input
                  type="text"
                  placeholder="Type your reply here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={sendingReply}
                  className="chat-input"
                />
                <button
                  type="submit"
                  className="btn-send-reply"
                  disabled={sendingReply || !replyText.trim()}
                >
                  {sendingReply ? "Sending..." : "Send Reply"}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">
              <div className="empty-state-icon"></div>
              <h3>Select a conversation or send new feedback</h3>
              <p>Your suggestions, reports, and questions help us make the platform better for everyone!</p>
              <button
                className="btn-new-feedback"
                style={{ marginTop: "1rem" }}
                onClick={() => setShowModal(true)}
              >
                Send New Feedback
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Creating New Feedback */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="feedback-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Feedback or Report</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            {errorMsg && <div className="feedback-alert alert-danger">{errorMsg}</div>}

            <form onSubmit={handleCreateFeedback}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="modal-select"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subject / Brief Summary</label>
                <input
                  type="text"
                  placeholder="e.g. Typo in Chemistry WAEC question #42 or Suggestion for dark mode"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="modal-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Detailed Message</label>
                <textarea
                  rows="5"
                  placeholder="Describe your question, issue, or feedback in detail..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="modal-textarea"
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit-feedback"
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline styles for Feedback Center */}
      <style>{`
        .feedback-container {
          max-width: 1200px;
          margin: 1.5rem auto 3rem auto;
          padding: 0 1rem;
          font-family: var(--font-body, inherit);
        }
        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--secondary) / 0.08));
          padding: 1.5rem 2rem;
          border-radius: var(--radius-lg, 16px);
          border: 1px solid hsl(var(--primary) / 0.25);
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .feedback-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text-main, #1a1a2e);
          margin: 0;
        }
        .feedback-subtitle {
          color: var(--text-muted, #555);
          margin: 0.35rem 0 0 0;
          font-size: 0.95rem;
          max-width: 750px;
        }
        .btn-new-feedback {
          background: var(--color-primary, #2F9E9D);
          color: #fff;
          border: none;
          padding: 0.75rem 1.4rem;
          border-radius: var(--radius-md, 12px);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-new-feedback:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(47, 158, 157, 0.35);
        }
        .feedback-alert {
          padding: 0.85rem 1.2rem;
          border-radius: var(--radius-md, 12px);
          margin-bottom: 1rem;
          font-size: 0.95rem;
        }
        .alert-success {
          background: rgba(40, 160, 96, 0.12);
          color: #28a060;
          border: 1px solid rgba(40, 160, 96, 0.3);
        }
        .alert-danger {
          background: rgba(217, 64, 64, 0.12);
          color: #d94040;
          border: 1px solid rgba(217, 64, 64, 0.3);
        }
        .feedback-layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 1.25rem;
          min-height: 580px;
          background: hsl(var(--bg-primary, 0, 0%, 100%));
          border-radius: var(--radius-lg, 16px);
          border: 1px solid hsl(var(--border, 215, 20%, 87%));
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
          overflow: hidden;
        }
        @media (max-width: 850px) {
          .feedback-layout {
            grid-template-columns: 1fr;
          }
        }
        .feedback-sidebar {
          border-right: 1px solid hsl(var(--border, 215, 20%, 87%));
          display: flex;
          flex-direction: column;
          background: hsl(var(--bg-secondary, 210, 20%, 97%));
        }
        .sidebar-header {
          padding: 1.2rem 1.25rem;
          border-bottom: 1px solid hsl(var(--border, 215, 20%, 87%));
        }
        .sidebar-header h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 600;
        }
        .threads-list {
          flex: 1;
          overflow-y: auto;
        }
        .thread-item {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid hsl(var(--border, 215, 20%, 87%));
          cursor: pointer;
          transition: background 0.15s ease;
          background: transparent;
        }
        .thread-item:hover {
          background: hsl(var(--bg-tertiary, 210, 16%, 93%));
        }
        .thread-item.active {
          background: #fff;
          border-left: 4px solid var(--color-primary, #2F9E9D);
        }
        .thread-item.unread {
          background: hsl(var(--primary) / 0.08);
        }
        .thread-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }
        .thread-category {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-primary, #2F9E9D);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .thread-subject {
          margin: 0 0 0.35rem 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-main, #1a1a2e);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .thread-preview {
          margin: 0 0 0.5rem 0;
          font-size: 0.85rem;
          color: var(--text-muted, #666);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .thread-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.78rem;
          color: var(--text-muted, #888);
        }
        .unread-dot {
          background: #d94040;
          color: #fff;
          padding: 2px 7px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.7rem;
        }
        .feedback-status-badge {
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
        }
        .badge-open {
          background: rgba(232, 160, 32, 0.15);
          color: #d88e14;
        }
        .badge-progress {
          background: rgba(47, 158, 157, 0.15);
          color: #2F9E9D;
        }
        .badge-resolved {
          background: rgba(40, 160, 96, 0.15);
          color: #28a060;
        }
        .feedback-chat-pane {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #fff;
        }
        .chat-thread-info {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid hsl(var(--border, 215, 20%, 87%));
          background: hsl(var(--bg-secondary, 210, 20%, 97%));
        }
        .chat-meta-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.35rem;
        }
        .chat-category-pill {
          background: hsl(var(--primary) / 0.12);
          color: var(--color-primary, #2F9E9D);
          padding: 3px 10px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .chat-id {
          font-size: 0.8rem;
          color: var(--text-muted, #888);
        }
        .chat-subject {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-main, #1a1a2e);
        }
        .chat-messages-container {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          background: #fafbfc;
        }
        .chat-bubble-row {
          display: flex;
          gap: 0.75rem;
          max-width: 80%;
        }
        .row-user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .row-admin {
          align-self: flex-start;
        }
        .chat-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.95rem;
          background: hsl(var(--primary) / 0.15);
          color: var(--color-primary, #2F9E9D);
          flex-shrink: 0;
        }
        .chat-bubble {
          padding: 0.9rem 1.15rem;
          border-radius: 16px;
          font-size: 0.93rem;
          line-height: 1.5;
          position: relative;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }
        .bubble-user {
          background: var(--color-primary, #2F9E9D);
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .bubble-admin {
          background: #ffffff;
          color: var(--text-main, #1a1a2e);
          border: 1px solid hsl(var(--border, 215, 20%, 87%));
          border-bottom-left-radius: 4px;
        }
        .bubble-sender-name {
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.35rem;
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          opacity: 0.9;
        }
        .bubble-time {
          font-weight: normal;
          font-size: 0.7rem;
        }
        .bubble-text {
          white-space: pre-wrap;
          word-break: break-word;
        }
        .chat-reply-bar {
          display: flex;
          padding: 1rem 1.5rem;
          gap: 0.75rem;
          background: #fff;
          border-top: 1px solid hsl(var(--border, 215, 20%, 87%));
        }
        .chat-input {
          flex: 1;
          padding: 0.85rem 1.2rem;
          border-radius: 25px;
          border: 1px solid hsl(var(--border, 215, 20%, 87%));
          outline: none;
          font-size: 0.95rem;
          transition: border-color 0.2s ease;
        }
        .chat-input:focus {
          border-color: var(--color-primary, #2F9E9D);
        }
        .btn-send-reply {
          background: var(--color-primary, #2F9E9D);
          color: #fff;
          border: none;
          padding: 0.85rem 1.4rem;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-send-reply:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .chat-empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
          color: var(--text-muted, #777);
        }
        .empty-state-icon {
          font-size: 3.5rem;
          margin-bottom: 1rem;
        }
        /* Modal Styles */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 1rem;
        }
        .feedback-modal-content {
          background: #fff;
          border-radius: var(--radius-lg, 16px);
          max-width: 580px;
          width: 100%;
          padding: 2rem;
          box-shadow: 0 12px 36px rgba(0,0,0,0.2);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 1.35rem;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #888;
        }
        .feedback-modal-content label {
          display: block;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-main, #333);
          margin-bottom: 0.45rem;
          letter-spacing: 0.01em;
        }
        .feedback-modal-content .form-group {
          margin-bottom: 1.25rem;
        }
        .modal-select, .modal-input, .modal-textarea {
          width: 100%;
          padding: 0.8rem 1.1rem;
          border-radius: var(--radius-md, 12px);
          border: 1px solid hsl(var(--border, 215, 20%, 87%));
          font-family: inherit;
          font-size: 0.95rem;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          outline: none;
        }
        .modal-select:focus, .modal-input:focus, .modal-textarea:focus {
          border-color: var(--color-primary, #2F9E9D);
          box-shadow: 0 0 0 3px rgba(47, 158, 157, 0.12);
        }
        .modal-textarea {
          resize: vertical;
          min-height: 130px;
          line-height: 1.6;
          padding: 1rem 1.1rem;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        .btn-cancel {
          background: hsl(var(--bg-tertiary, 210, 16%, 93%));
          color: var(--text-main, #333);
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-md, 12px);
          font-weight: 600;
          cursor: pointer;
        }
        .btn-submit-feedback {
          background: var(--color-primary, #2F9E9D);
          color: #fff;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-md, 12px);
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default FeedbackPage;
