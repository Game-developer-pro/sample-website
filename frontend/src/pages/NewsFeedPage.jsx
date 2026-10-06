import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../context/AuthContext";

const NewsFeedPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // Comment state
  const [commentText, setCommentText] = useState({});

  // Active comment panel state
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);

  const [postToDelete, setPostToDelete] = useState(null);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    setUser(loggedInUser);
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/announcements");
      setAnnouncements(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(announcements.filter((a) => a._id !== id));
      if (activeCommentPostId === id) setActiveCommentPostId(null);
      setPostToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete post.");
    }
  };

  const handleCommentSubmit = async (id) => {
    const text = commentText[id];
    if (!text) return;
    try {
      const res = await api.post(`/announcements/${id}/comment`, { text });
      setAnnouncements(announcements.map((a) => (a._id === id ? res.data : a)));
      setCommentText({ ...commentText, [id]: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to post comment.");
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const res = await api.delete(`/announcements/${postId}/comment/${commentId}`);
      setAnnouncements(announcements.map((a) => (a._id === postId ? res.data : a)));
    } catch (err) {
      console.error(err);
      alert("Failed to delete comment.");
    }
  };

  const toggleComments = (id) => {
    setActiveCommentPostId(activeCommentPostId === id ? null : id);
  };

  const activeAnnouncement = announcements.find((a) => a._id === activeCommentPostId);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className={`news-feed-page ${activeCommentPostId ? "comments-active" : ""}`}>
      {postToDelete && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <h3>Delete Post</h3>
            <p className="text-muted">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex-between" style={{ marginTop: "1.5rem" }}>
              <button onClick={() => setPostToDelete(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(postToDelete)} className="btn btn-primary" style={{ background: "var(--color-danger)", border: "none" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="news-feed-main">
        {/* Feed Header */}
        <div className="feed-header">
          <h1>News Feed</h1>
          {user?.role === "admin" && (
            <Link to="/create-post" className="btn-create-post">
              <span>＋</span> Create Post
            </Link>
          )}
        </div>

        {loading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : error ? (
          <p className="text-center" style={{ color: "#e11d48" }}>
            {error}
          </p>
        ) : announcements.length === 0 ? (
          <div className="feed-empty-state">
            <h3>No posts yet</h3>
            <p>Check back soon for the latest updates and announcements.</p>
          </div>
        ) : (
          <div className="feed-list">
            {announcements.map((post) => (
              <article key={post._id} className="feed-card">
                {/* Post Header */}
                <div className="feed-card-header">
                  <div className="feed-author-avatar">
                    {post.author?.name ? post.author.name[0].toUpperCase() : "A"}
                  </div>
                  <div className="feed-author-info">
                    <span className="feed-author-name">{post.author?.name || "Admin"}</span>
                    <span className="feed-post-time">{timeAgo(post.createdAt)}</span>
                  </div>
                  {user?.role === "admin" && (
                    <button
                      onClick={() => setPostToDelete(post._id)}
                      className="feed-delete-btn"
                      title="Delete post"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {/* Post Image */}
                {post.image && (
                  <div className="feed-card-image">
                    <img src={post.image} alt={post.title} />
                  </div>
                )}

                {/* Post Body */}
                <div className="feed-card-body">
                  <h3 className="feed-card-title">{post.title}</h3>
                  <p className="feed-card-content">{post.content}</p>
                </div>

                {/* Post Footer */}
                <div className="feed-card-footer">
                  <button
                    onClick={() => toggleComments(post._id)}
                    className="feed-comment-btn"
                  >
                    💬 {post.comments?.length || 0} Comment{post.comments?.length !== 1 ? "s" : ""}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Comments Panel — right sidebar on desktop, bottom drawer on mobile/tablet */}
      <div className={`comments-panel ${activeCommentPostId ? "open" : ""}`}>
        <div className="comments-panel-header">
          <h3 className="font-bold">Comments</h3>
          <button
            onClick={() => setActiveCommentPostId(null)}
            className="btn-close-comments"
          >
            ✕
          </button>
        </div>

        {activeAnnouncement ? (
          <div className="comments-panel-body">
            <div className="comments-list">
              {activeAnnouncement.comments && activeAnnouncement.comments.length > 0 ? (
                activeAnnouncement.comments.map((comment, index) => (
                  <div key={index} className="comment-item">
                    <p className="comment-author">{comment.user?.name || "Student"}</p>
                    <p className="comment-text">{comment.text}</p>
                    {(user?.role === "admin" || (user && comment.user?._id === user.id)) && (
                      <button 
                        onClick={() => handleDeleteComment(activeAnnouncement._id, comment._id)} 
                        className="comment-delete-btn"
                        title="Delete comment"
                      >
                        
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted" style={{ marginTop: "2rem" }}>
                  No comments yet. Be the first!
                </p>
              )}
            </div>

            <div className="add-comment-box">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText[activeAnnouncement._id] || ""}
                onChange={(e) =>
                  setCommentText({
                    ...commentText,
                    [activeAnnouncement._id]: e.target.value,
                  })
                }
                className="input-field"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCommentSubmit(activeAnnouncement._id);
                }}
              />
              <button
                onClick={() => handleCommentSubmit(activeAnnouncement._id)}
                className="btn btn-primary"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="comments-panel-body" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="text-muted">Select a post to view comments.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeedPage;
