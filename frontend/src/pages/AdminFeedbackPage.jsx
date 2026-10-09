import React, { useState, useEffect, useContext, useRef } from "react";
import { AuthContext, api } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "../custom-theme.css";
import { IconZap } from "../components/Icons";

const AdminFeedbackPage = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const messagesEndRef = useRef(null);

  // Admin Guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/");
      } else if (user.role !== "admin") {
        navigate("/dashboard");
      }
    }
  }, [user, authLoading, navigate]);

  const fetchAdminFeedbacks = async (autoSelectId = null) => {
    try {
      const res = await api.get(
        `/feedback/admin/all?status=${statusFilter}&category=${categoryFilter}&search=${encodeURIComponent(
          searchQuery
        )}`
      );
      setFeedbacks(res.data);
      if (res.data.length > 0) {
        if (autoSelectId) {
          const matched = res.data.find((f) => f._id === autoSelectId);
          setSelectedFeedback(matched || res.data[0]);
        } else if (!selectedFeedback) {
          setSelectedFeedback(res.data[0]);
        } else {
          const updatedSelected = res.data.find((f) => f._id === selectedFeedback._id);
          if (updatedSelected) setSelectedFeedback(updatedSelected);
        }
      } else {
        setSelectedFeedback(null);
      }
    } catch (err) {
      console.error("Error fetching admin feedbacks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAdminFeedbacks();
      const interval = setInterval(fetchAdminFeedbacks, 8000);
      return () => clearInterval(interval);
    }
  }, [user, statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedFeedback?.messages]);

  const handleSelectFeedback = async (item) => {
    setSelectedFeedback(item);
    try {
      await api.get(`/feedback/${item._id}`);
      setFeedbacks((prev) =>
        prev.map((f) => (f._id === item._id ? { ...f, unreadByAdmin: false } : f))
      );
    } catch (e) {
      // ignore
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
      console.error("Failed to send admin reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedFeedback) return;
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/feedback/admin/${selectedFeedback._id}/status`, {
        status: newStatus,
      });
      setSelectedFeedback(res.data);
      setFeedbacks((prev) =>
        prev.map((f) => (f._id === res.data._id ? res.data : f))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteFeedback = async () => {
    if (!selectedFeedback) return;
    if (!window.confirm("Are you sure you want to delete this feedback thread?")) return;
    try {
      await api.delete(`/feedback/admin/${selectedFeedback._id}`);
      const remaining = feedbacks.filter((f) => f._id !== selectedFeedback._id);
      setFeedbacks(remaining);
      setSelectedFeedback(remaining[0] || null);
    } catch (err) {
      console.error("Failed to delete feedback:", err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return <span className="admin-status-badge badge-resolved">✓ Resolved</span>;
      case "in_progress":
        return <span className="admin-status-badge badge-progress"><IconZap size="0.85em" style={{ marginRight: "3px", verticalAlign: "middle" }} /> In Progress</span>;
      default:
        return <span className="admin-status-badge badge-open">● Open / Pending</span>;
    }
  };

  const unreadCount = feedbacks.filter((f) => f.unreadByAdmin).length;

  return (
    <div className="admin-feedback-page">
      {/* Header Bar */}
      <div className="admin-feedback-header">
        <div className="header-left">
          <Link to="/admin" className="back-link">← Back to Admin Console</Link>
          <h1 className="admin-title">
            📥 User Feedback & Support Inbox
            {unreadCount > 0 && <span className="unread-counter">{unreadCount} New</span>}
          </h1>
          <p className="admin-subtitle">
            View user feedback, reports, and questions, and reply directly to students in real-time.
          </p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="admin-filter-toolbar">
        <div className="status-tabs">
          {["all", "open", "in_progress", "resolved"].map((st) => (
            <button
              key={st}
              className={`status-tab-btn ${statusFilter === st ? "active" : ""}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === "all" ? "All Tickets" : st === "in_progress" ? "In Progress" : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>

        <div className="search-box-wrapper">
          <input
            type="text"
            placeholder="🔍 Search by subject, user or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Main 2-Column Dashboard */}
      <div className="admin-feedback-grid">
        {/* Left Pane: Tickets List */}
        <div className="admin-tickets-sidebar">
          <div className="sidebar-top">
            <span>Inbox ({feedbacks.length})</span>
          </div>

          {loading ? (
            <div className="admin-loading">Loading student messages...</div>
          ) : feedbacks.length === 0 ? (
            <div className="admin-empty-list">
              <p>No feedback found matching the selected filter.</p>
            </div>
          ) : (
            <div className="admin-thread-scroll">
              {feedbacks.map((item) => {
                const isSelected = selectedFeedback?._id === item._id;
                const lastMsg = item.messages?.[item.messages.length - 1];
                return (
                  <div
                    key={item._id}
                    className={`admin-ticket-item ${isSelected ? "selected" : ""} ${
                      item.unreadByAdmin ? "ticket-unread" : ""
                    }`}
                    onClick={() => handleSelectFeedback(item)}
                  >
                    <div className="ticket-item-top">
                      <span className="ticket-user-name">
                        👤 {item.user?.name || "Student"}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                    <h4 className="ticket-subject">{item.subject}</h4>
                    <span className="ticket-category-tag">{item.category}</span>
                    <p className="ticket-snippet">
                      {lastMsg ? (
                        <>
                          <strong>{lastMsg.senderRole === "admin" ? "You: " : "User: "}</strong>
                          {lastMsg.text}
                        </>
                      ) : (
                        "No messages"
                      )}
                    </p>
                    <div className="ticket-footer">
                      <span>
                        {new Date(item.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {item.unreadByAdmin && <span className="new-badge">Unread</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane: Active Ticket Chat & Management */}
        <div className="admin-chat-pane">
          {selectedFeedback ? (
            <>
              {/* Ticket Details & Action Header */}
              <div className="admin-chat-header">
                <div className="ticket-main-info">
                  <div className="ticket-meta-tags">
                    <span className="category-pill">{selectedFeedback.category}</span>
                    {getStatusBadge(selectedFeedback.status)}
                    <span className="ticket-user-email">📧 {selectedFeedback.user?.email}</span>
                  </div>
                  <h2 className="selected-subject">{selectedFeedback.subject}</h2>
                </div>

                <div className="ticket-actions">
                  <select
                    value={selectedFeedback.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    disabled={updatingStatus}
                    className="status-dropdown"
                  >
                    <option value="open">Set: Open</option>
                    <option value="in_progress">Set: In Progress</option>
                    <option value="resolved">Set: Resolved</option>
                  </select>
                  <button
                    onClick={handleDeleteFeedback}
                    className="btn-delete-ticket"
                    title="Delete Thread"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Messages History */}
              <div className="admin-messages-list">
                {selectedFeedback.messages?.map((msg, idx) => {
                  const isAdmin = msg.senderRole === "admin";
                  return (
                    <div
                      key={idx}
                      className={`admin-bubble-wrapper ${isAdmin ? "msg-admin" : "msg-user"}`}
                    >
                      <div className="bubble-avatar">
                        {isAdmin ? "🛡️" : (msg.senderName?.[0] || "U")}
                      </div>
                      <div className={`admin-msg-bubble ${isAdmin ? "admin-side" : "user-side"}`}>
                        <div className="msg-header">
                          <span className="msg-author">
                            {isAdmin ? "Admin (You)" : `${msg.senderName} (Student)`}
                          </span>
                          <span className="msg-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="msg-body">{msg.text}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="admin-reply-box">
                <input
                  type="text"
                  placeholder={`Reply to ${selectedFeedback.user?.name || "student"}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={sendingReply}
                  className="admin-reply-input"
                />
                <button
                  type="submit"
                  className="btn-admin-reply"
                  disabled={sendingReply || !replyText.trim()}
                >
                  {sendingReply ? "Sending..." : "Reply as Admin 💬"}
                </button>
              </form>
            </>
          ) : (
            <div className="admin-no-selection">
              <div className="no-selection-icon">📬</div>
              <h3>No Feedback Ticket Selected</h3>
              <p>Select a ticket from the inbox on the left to view messages and reply to students.</p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Feedback Styling */}
      <style>{`
        .admin-feedback-page {
          max-width: 1600px;
          margin: 1.5rem auto 3rem auto;
          padding: 0 1.5rem;
          font-family: var(--font-body, inherit);
        }
        .admin-feedback-header {
          background: linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--secondary) / 0.08));
          padding: 1.5rem 2rem;
          border-radius: var(--radius-lg, 16px);
          border: 1px solid hsl(var(--primary) / 0.25);
          margin-bottom: 1.5rem;
        }
        .back-link {
          color: var(--color-primary, #2F9E9D);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          display: inline-block;
          margin-bottom: 0.5rem;
        }
        .back-link:hover {
          text-decoration: underline;
        }
        .admin-title {
          font-size: 1.85rem;
          font-weight: 700;
          color: var(--text-main, #1a1a2e);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .unread-counter {
          background: #d94040;
          color: #fff;
          font-size: 0.8rem;
          padding: 2px 10px;
          border-radius: 12px;
          font-weight: 600;
        }
        .admin-subtitle {
          color: var(--text-muted, #555);
          margin: 0.35rem 0 0 0;
          font-size: 0.95rem;
        }
        .admin-filter-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .status-tabs {
          display: flex;
          gap: 0.5rem;
          background: hsl(var(--bg-secondary, 210, 20%, 97%));
          padding: 4px;
          border-radius: 12px;
          border: 1px solid hsl(var(--border, 215, 20%, 87%));
        }
        .status-tab-btn {
          background: transparent;
          border: none;
          padding: 0.5rem 1.1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-muted, #666);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .status-tab-btn.active {
          background: #fff;
          color: var(--color-primary, #2F9E9D);
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        }
        .admin-search-input {
          padding: 0.6rem 1.2rem;
          border-radius: 20px;
          border: 1px solid hsl(var(--border, 215, 20%, 87%));
          font-size: 0.9rem;
          width: 320px;
          outline: none;
        }
        .admin-search-input:focus {
          border-color: var(--color-primary, #2F9E9D);
        }
        .admin-feedback-grid {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 1.25rem;
          min-height: 680px;
          background: #fff;
          border-radius: var(--radius-lg, 16px);
          border: 1px solid hsl(var(--border, 215, 20%, 87%));
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
          overflow: hidden;
        }
        @media (max-width: 960px) {
          .admin-feedback-page {
            padding: 0 0.75rem;
          }
          .admin-feedback-grid {
            grid-template-columns: 1fr;
          }
          .admin-filter-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .status-tabs {
            flex-wrap: wrap;
          }
          .admin-search-input {
            width: 100%;
          }
          .admin-chat-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .ticket-actions {
            width: 100%;
            justify-content: flex-start;
          }
        }
        .admin-tickets-sidebar {
          background: hsl(var(--bg-secondary, 210, 20%, 97%));
          border-right: 1px solid hsl(var(--border, 215, 20%, 87%));
          display: flex;
          flex-direction: column;
        }
        .sidebar-top {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid hsl(var(--border, 215, 20%, 87%));
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-main, #333);
        }
        .admin-thread-scroll {
          flex: 1;
          overflow-y: auto;
        }
        .admin-ticket-item {
          padding: 1.1rem 1.25rem;
          border-bottom: 1px solid hsl(var(--border, 215, 20%, 87%));
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .admin-ticket-item:hover {
          background: hsl(var(--bg-tertiary, 210, 16%, 93%));
        }
        .admin-ticket-item.selected {
          background: #fff;
          border-left: 4px solid var(--color-primary, #2F9E9D);
        }
        .admin-ticket-item.ticket-unread {
          background: hsl(var(--primary) / 0.09);
        }
        .ticket-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }
        .ticket-user-name {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--text-main, #1a1a2e);
        }
        .ticket-subject {
          margin: 0 0 0.25rem 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-main, #1a1a2e);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ticket-category-tag {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--color-primary, #2F9E9D);
          margin-bottom: 0.35rem;
        }
        .ticket-snippet {
          margin: 0 0 0.5rem 0;
          font-size: 0.83rem;
          color: var(--text-muted, #666);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ticket-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: var(--text-muted, #888);
        }
        .new-badge {
          background: #d94040;
          color: #fff;
          padding: 2px 7px;
          border-radius: 10px;
          font-weight: 600;
        }
        .admin-status-badge {
          font-size: 0.72rem;
          padding: 2px 7px;
          border-radius: 10px;
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
        .admin-chat-pane {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #fff;
        }
        .admin-chat-header {
          padding: 1.25rem 1.75rem;
          border-bottom: 1px solid hsl(var(--border, 215, 20%, 87%));
          background: hsl(var(--bg-secondary, 210, 20%, 97%));
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .ticket-meta-tags {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.35rem;
        }
        .category-pill {
          background: hsl(var(--primary) / 0.12);
          color: var(--color-primary, #2F9E9D);
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .ticket-user-email {
          font-size: 0.8rem;
          color: var(--text-muted, #777);
        }
        .selected-subject {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main, #1a1a2e);
        }
        .ticket-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .status-dropdown {
          padding: 0.5rem 0.85rem;
          border-radius: 10px;
          border: 1px solid hsl(var(--border, 215, 20%, 87%));
          font-weight: 600;
          font-size: 0.85rem;
          background: #fff;
          cursor: pointer;
        }
        .btn-delete-ticket {
          background: rgba(217, 64, 64, 0.1);
          border: 1px solid rgba(217, 64, 64, 0.3);
          color: #d94040;
          padding: 0.45rem 0.75rem;
          border-radius: 10px;
          cursor: pointer;
        }
        .admin-messages-list {
          flex: 1;
          padding: 1.5rem 2rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          background: #fafbfc;
        }
        .admin-bubble-wrapper {
          display: flex;
          gap: 0.75rem;
          max-width: 72%;
          min-width: 260px;
        }
        @media (max-width: 600px) {
          .admin-bubble-wrapper {
            max-width: 92%;
            min-width: 0;
          }
          .admin-messages-list {
            padding: 1rem 0.75rem;
          }
          .admin-reply-box {
            padding: 0.75rem;
            flex-wrap: wrap;
          }
          .admin-reply-input {
            min-width: 0;
          }
          .btn-admin-reply {
            width: 100%;
          }
        }
        .msg-admin {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .msg-user {
          align-self: flex-start;
          padding-left: 0;
        }
        .bubble-avatar {
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
        .admin-msg-bubble {
          padding: 0.9rem 1.25rem;
          border-radius: 16px;
          font-size: 0.95rem;
          line-height: 1.65;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        .admin-side {
          background: var(--color-primary, #2F9E9D);
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .user-side {
          background: #ffffff;
          color: var(--text-main, #1a1a2e);
          border: 1px solid hsl(var(--border, 215, 20%, 87%));
          border-bottom-left-radius: 4px;
        }
        .msg-header {
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.35rem;
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          opacity: 0.9;
        }
        .msg-time {
          font-weight: normal;
          font-size: 0.7rem;
        }
        .msg-body {
          white-space: pre-wrap;
          word-break: break-word;
        }
        .admin-reply-box {
          display: flex;
          padding: 1rem 1.5rem;
          gap: 0.75rem;
          background: #fff;
          border-top: 1px solid hsl(var(--border, 215, 20%, 87%));
        }
        .admin-reply-input {
          flex: 1;
          padding: 0.85rem 1.2rem;
          border-radius: 25px;
          border: 1px solid hsl(var(--border, 215, 20%, 87%));
          outline: none;
          font-size: 0.95rem;
        }
        .admin-reply-input:focus {
          border-color: var(--color-primary, #2F9E9D);
        }
        .btn-admin-reply {
          background: var(--color-primary, #2F9E9D);
          color: #fff;
          border: none;
          padding: 0.85rem 1.5rem;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-admin-reply:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .admin-no-selection {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
          color: var(--text-muted, #777);
        }
        .no-selection-icon {
          font-size: 3.5rem;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default AdminFeedbackPage;
