import { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext, api } from "../context/AuthContext";

const CreatePostPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await api.post("/announcements", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/news-feed");
    } catch (err) {
      console.error(err);
      alert("Failed to create post.");
    } finally {
      setPosting(false);
    }
  };

  // Only admins can access this page
  if (!user || user.role !== "admin") {
    return (
      <div className="create-post-wrapper">
        <div className="create-post-card">
          <h2>Access Denied</h2>
          <p>Only admins can create posts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-post-wrapper">
      <div className="create-post-card">
        <div className="create-post-header">
          <div className="create-post-avatar">
            {user.name ? user.name[0].toUpperCase() : "A"}
          </div>
          <div>
            <h2>Create a Post</h2>
            <p className="create-post-subtitle">Share an update with all students</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="create-post-form">
          <input
            type="text"
            placeholder="Give your post a catchy title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="create-post-title-input"
            required
          />

          <textarea
            placeholder="What's on your mind? Write your announcement..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="create-post-content-input"
            rows="6"
            required
          ></textarea>

          {/* Image Preview */}
          {imagePreview && (
            <div className="create-post-image-preview">
              <img src={imagePreview} alt="Preview" />
              <button type="button" className="remove-image-btn" onClick={removeImage}>
                ✕
              </button>
            </div>
          )}

          {/* Actions Bar */}
          <div className="create-post-actions">
            <div className="create-post-media-actions">
              <button
                type="button"
                className="media-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="media-icon"></span> Photo
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>

            <div className="create-post-submit-actions">
              <button
                type="button"
                className="btn-cancel-post"
                onClick={() => navigate("/news-feed")}
              >
                Cancel
              </button>
              <button type="submit" className="btn-publish-post" disabled={posting}>
                {posting ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;
