import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { AuthContext, api } from "../context/AuthContext";
import "../custom-theme.css";

// Derive a Cloudinary thumbnail from a video URL
// Uses so_0 (start of video) as the frame, converts to image/jpeg
const getCloudinaryThumbnail = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes("cloudinary.com")) return null;
  try {
    // Replace /video/upload/ with /video/upload/so_0,w_640/ for a thumbnail at second 0
    return videoUrl
      .replace("/video/upload/", "/video/upload/so_0,w_640/")
      .replace(/\.(mp4|webm|mov|avi)$/i, ".jpg");
  } catch {
    return null;
  }
};

// Derive WebSocket URL from API base URL
const getWsUrl = () => {
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const base = apiBase.replace(/\/api$/, "");
  return base.replace(/^http/, "ws");
};

const PracticalsPage = () => {
  const { user } = useContext(AuthContext);
  const [practicals, setPracticals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPractical, setSelectedPractical] = useState(null);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", description: "", subject: "" });
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [likingId, setLikingId] = useState(null); // track in-flight like request
  const fileInputRef = useRef(null);
  const commentsEndRef = useRef(null);
  const wsRef = useRef(null);

  // Fetch practicals — tied to user so it fires after auth token is ready
  const fetchPracticals = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get("/practicals");
      setPracticals(res.data || []);
    } catch (err) {
      console.error("Failed to fetch practicals:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPracticals();
  }, [fetchPracticals]);

  // WebSocket — real-time likes
  useEffect(() => {
    if (!user) return;
    const wsUrl = getWsUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "practical:like") {
          const { practicalId, likesCount, likes } = data;
          // Update list view
          setPracticals((prev) =>
            prev.map((p) =>
              p._id === practicalId ? { ...p, likes, likesCount } : p
            )
          );
          // Update detail view if open
          setSelectedPractical((prev) =>
            prev && prev._id === practicalId ? { ...prev, likes, likesCount } : prev
          );
        }
      } catch (e) {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {}; // silent — don't crash the page if WS fails
    ws.onclose = () => {};

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [user]);

  const openPractical = async (practical) => {
    try {
      const res = await api.get(`/practicals/${practical._id}`);
      setSelectedPractical(res.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Failed to fetch practical:", err);
    }
  };

  const handleToggleLike = async (practicalId, e) => {
    if (e) e.stopPropagation();
    if (likingId) return; // debounce
    setLikingId(practicalId);
    try {
      const res = await api.post(`/practicals/${practicalId}/like`);
      const { likes, likesCount } = res.data;
      // Optimistic update — WebSocket will also confirm
      setPracticals((prev) =>
        prev.map((p) => (p._id === practicalId ? { ...p, likes, likesCount } : p))
      );
      setSelectedPractical((prev) =>
        prev && prev._id === practicalId ? { ...prev, likes, likesCount } : prev
      );
    } catch (err) {
      console.error("Failed to toggle like:", err);
    } finally {
      setLikingId(null);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !selectedPractical) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/practicals/${selectedPractical._id}/comment`, { text: comment.trim() });
      setSelectedPractical(res.data);
      setComment("");
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      alert("Failed to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await api.delete(`/practicals/${selectedPractical._id}/comment/${commentId}`);
      setSelectedPractical(res.data);
    } catch (err) {
      alert("Failed to delete comment.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile || !uploadForm.title || !uploadForm.description) {
      alert("Please fill in all fields and select a video.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("title", uploadForm.title);
    formData.append("description", uploadForm.description);
    formData.append("subject", uploadForm.subject);
    try {
      await api.post("/practicals", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(pct);
        },
      });
      setShowUploadModal(false);
      setUploadForm({ title: "", description: "", subject: "" });
      setVideoFile(null);
      // Re-fetch so the URL is settled and playable immediately
      await fetchPracticals();
      alert("Practical uploaded successfully!");
    } catch (err) {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeletePractical = async (id) => {
    if (!window.confirm("Delete this practical? This cannot be undone.")) return;
    try {
      await api.delete(`/practicals/${id}`);
      setPracticals((prev) => prev.filter((p) => p._id !== id));
      if (selectedPractical?._id === id) setSelectedPractical(null);
    } catch (err) {
      alert("Failed to delete practical.");
    }
  };

  const formatViews = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n;
  };

  const formatDate = (d) => {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  };

  const isLiked = (practical) => {
    if (!user || !practical?.likes) return false;
    return practical.likes.some((id) => id === user._id || id?.toString() === user._id);
  };

  const getLikesCount = (practical) => {
    if (practical?.likesCount !== undefined) return practical.likesCount;
    return practical?.likes?.length || 0;
  };

  const filteredPracticals = practicals.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subject || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loader-container min-h-screen" style={{ flexDirection: "column" }}>
        <div className="loader"></div>
        <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>Loading practicals...</p>
      </div>
    );
  }

  // ── VIDEO DETAIL VIEW ──────────────────────────────────────────────────────
  if (selectedPractical) {
    const thumbnail = getCloudinaryThumbnail(selectedPractical.videoUrl);
    const liked = isLiked(selectedPractical);
    const likesCount = getLikesCount(selectedPractical);

    return (
      <div className="practicals-detail-wrapper">
        <div className="practicals-detail-grid">
          {/* Left: Video Player + Info */}
          <div className="practicals-main-col">
            <div className="video-player-container">
              <video
                key={selectedPractical._id}
                controls
                preload="metadata"
                className="video-player"
                poster={thumbnail || undefined}
                crossOrigin="anonymous"
              >
                <source src={selectedPractical.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="video-info-card glass-card">
              <div className="video-meta-row">
                <span className="video-subject-badge">{selectedPractical.subject || "General"}</span>
                <span className="video-views">{formatViews(selectedPractical.views)} views · {formatDate(selectedPractical.createdAt)}</span>
              </div>
              <h1 className="video-title-main">{selectedPractical.title}</h1>
              <div className="video-uploader-row">
                <div className="uploader-avatar">
                  {(selectedPractical.uploadedBy?.name || "A")[0].toUpperCase()}
                </div>
                <span className="uploader-name">{selectedPractical.uploadedBy?.name || "Admin"}</span>

                {/* Like button in detail view */}
                <button
                  className={`practical-like-btn${liked ? " liked" : ""}`}
                  onClick={(e) => handleToggleLike(selectedPractical._id, e)}
                  disabled={likingId === selectedPractical._id}
                  style={{ marginLeft: "auto" }}
                >
                  <span className="like-heart">{liked ? "❤️" : "🤍"}</span>
                  <span className="like-count">{likesCount}</span>
                </button>
              </div>
              <div className="video-description">
                <h3>Description</h3>
                <p>{selectedPractical.description}</p>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <button className="btn-action-prev" onClick={() => setSelectedPractical(null)}>
                  ← Back to Practicals
                </button>
                {user?.role === "admin" && (
                  <button
                    className="btn-modal-cancel"
                    style={{ background: "#ef4444", color: "#fff", border: "none" }}
                    onClick={() => handleDeletePractical(selectedPractical._id)}
                  >
                    🗑 Delete
                  </button>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="comments-section glass-card">
              <h3 className="comments-title">{selectedPractical.comments?.length || 0} Comments</h3>

              {/* Comment Input */}
              <form onSubmit={handleCommentSubmit} className="comment-form">
                <div className="comment-avatar-col">
                  <div className="comment-user-avatar">
                    {(user?.name || "U")[0].toUpperCase()}
                  </div>
                </div>
                <div className="comment-input-col">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="comment-textarea"
                    rows={2}
                  />
                  <div className="comment-form-actions">
                    <button
                      type="button"
                      className="btn-comment-cancel"
                      onClick={() => setComment("")}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-comment-submit"
                      disabled={!comment.trim() || submittingComment}
                    >
                      {submittingComment ? "Posting..." : "Comment"}
                    </button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="comments-list">
                {(selectedPractical.comments || []).length === 0 && (
                  <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>
                    No comments yet. Be the first to comment!
                  </p>
                )}
                {[...(selectedPractical.comments || [])].reverse().map((c) => (
                  <div key={c._id} className="comment-item">
                    <div className="comment-avatar">
                      {(c.userName || "U")[0].toUpperCase()}
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-author">{c.userName || "Student"}</span>
                        <span className="comment-time">{formatTime(c.createdAt)}</span>
                      </div>
                      <p className="comment-text">{c.text}</p>
                    </div>
                    {(user?.role === "admin" || c.user === user?._id) && (
                      <button
                        className="comment-delete-btn"
                        onClick={() => handleDeleteComment(c._id)}
                        title="Delete comment"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            </div>
          </div>

          {/* Right: Related Videos Sidebar */}
          <div className="practicals-sidebar-col">
            <h3 style={{ marginBottom: "1rem", fontWeight: "700" }}>More Practicals</h3>
            {practicals.filter((p) => p._id !== selectedPractical._id).map((p) => {
              const thumb = getCloudinaryThumbnail(p.videoUrl);
              return (
                <div
                  key={p._id}
                  className="related-video-card"
                  onClick={() => openPractical(p)}
                >
                  <div
                    className="related-video-thumb"
                    style={thumb ? { backgroundImage: `url(${thumb})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                  >
                    {!thumb && <span className="related-play-icon">▶</span>}
                    <span className="related-subject-chip">{p.subject || "General"}</span>
                  </div>
                  <div className="related-video-info">
                    <p className="related-video-title">{p.title}</p>
                    <span className="related-video-meta">{formatViews(p.views)} views · {formatDate(p.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            {practicals.filter((p) => p._id !== selectedPractical._id).length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No other practicals yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── GRID LIST VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="practicals-wrapper">
      {/* Header */}
      <div className="practicals-header">
        <div>
          <h1 className="practicals-heading">Practicals</h1>
          <p className="practicals-subheading">Watch video lessons and engage with your classmates</p>
        </div>
        {user?.role === "admin" && (
          <button className="btn-upload-practical" onClick={() => setShowUploadModal(true)}>
            + Upload Practical
          </button>
        )}
      </div>

      {/* Search */}
      <div className="practicals-search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search practicals by title or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="practicals-search-input"
        />
      </div>

      {/* Grid */}
      {filteredPracticals.length === 0 ? (
        <div className="practicals-empty glass-card">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎬</div>
          <h3>No practicals available yet</h3>
          <p style={{ color: "var(--text-muted)" }}>
            {user?.role === "admin"
              ? "Upload your first practical video using the button above."
              : "Check back later — your teacher will upload practical videos here."}
          </p>
        </div>
      ) : (
        <div className="practicals-grid">
          {filteredPracticals.map((p) => {
            const thumb = getCloudinaryThumbnail(p.videoUrl);
            const liked = isLiked(p);
            const likesCount = getLikesCount(p);

            return (
              <div key={p._id} className="practical-card" onClick={() => openPractical(p)}>
                <div
                  className="practical-card-thumb"
                  style={
                    thumb
                      ? { backgroundImage: `url(${thumb})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : {}
                  }
                >
                  <div className="practical-play-btn">▶</div>
                  <span className="practical-subject-tag">{p.subject || "General"}</span>
                </div>
                <div className="practical-card-body">
                  <h3 className="practical-card-title">{p.title}</h3>
                  <p className="practical-card-desc">
                    {p.description.slice(0, 80)}{p.description.length > 80 ? "..." : ""}
                  </p>
                  <div className="practical-card-meta">
                    <span>👁 {formatViews(p.views)} views</span>
                    <button
                      className={`practical-like-btn-sm${liked ? " liked" : ""}`}
                      onClick={(e) => handleToggleLike(p._id, e)}
                      disabled={likingId === p._id}
                    >
                      {liked ? "❤️" : "🤍"} {likesCount}
                    </button>
                    <span>{formatDate(p.createdAt)}</span>
                  </div>
                </div>
                {user?.role === "admin" && (
                  <button
                    className="practical-delete-btn"
                    onClick={(e) => { e.stopPropagation(); handleDeletePractical(p._id); }}
                    title="Delete"
                  >
                    🗑
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal-card glass-glow practicals-upload-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Upload Practical Video</h2>
            <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="upload-form-label">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Introduction to Organic Chemistry"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
                  className="custom-input"
                  required
                />
              </div>
              <div>
                <label className="upload-form-label">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Chemistry, Biology, Mathematics..."
                  value={uploadForm.subject}
                  onChange={(e) => setUploadForm((f) => ({ ...f, subject: e.target.value }))}
                  className="custom-input"
                />
              </div>
              <div>
                <label className="upload-form-label">Description *</label>
                <textarea
                  placeholder="Describe what students will learn from this video..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}
                  className="custom-input comment-textarea"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="upload-form-label">Video File *</label>
                <div
                  className="video-drop-zone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {videoFile ? (
                    <div>
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎬</div>
                      <p style={{ fontWeight: "600" }}>{videoFile.name}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📤</div>
                      <p style={{ fontWeight: "600" }}>Click to select video</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>MP4, WebM, MOV supported</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/mov,video/avi"
                  style={{ display: "none" }}
                  onChange={(e) => setVideoFile(e.target.files[0])}
                />
              </div>

              {uploading && (
                <div className="upload-progress-bar-wrap">
                  <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                  <span className="upload-progress-text">{uploadProgress}%</span>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-confirm"
                  disabled={uploading || !videoFile}
                >
                  {uploading ? `Uploading ${uploadProgress}%...` : "Upload Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticalsPage;
