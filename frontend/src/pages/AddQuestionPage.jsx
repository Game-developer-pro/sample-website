import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext, api } from "../context/AuthContext";

const AddQuestionPage = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [subject, setSubject] = useState("General");
  const [examType, setExamType] = useState("JAMB");
  const [difficulty, setDifficulty] = useState("easy");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Guard routing - admin only
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/");
      } else if (user.role !== "admin") {
        navigate("/dashboard");
      }
    }
  }, [user, authLoading, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!questionText.trim()) return setError("Question text is required.");
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      return setError("All 4 option fields must be filled.");
    }
    if (!correctAnswer) {
      return setError("Please select the correct answer.");
    }

    const options = [optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim()];
    const answer = correctAnswer === "A"
      ? optionA.trim()
      : correctAnswer === "B"
        ? optionB.trim()
        : correctAnswer === "C"
          ? optionC.trim()
          : optionD.trim();

    // Build FormData to support file upload
    const formData = new FormData();
    formData.append("question", questionText.trim());
    formData.append("options", JSON.stringify(options));
    formData.append("answer", answer);
    formData.append("subject", subject);
    formData.append("examType", examType);
    formData.append("difficulty", difficulty);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    setSubmitting(true);
    try {
      await api.post("/questions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Question successfully added to pool!");
      // Reset inputs
      setQuestionText("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
      setCorrectAnswer("");
      setSubject("General");
      setDifficulty("easy");
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error("Failed to add question:", err);
      setError(err.response?.data?.message || "Failed to save the question. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="loader-container min-h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  return (
      <div className="admin-wrapper">
        <div className="admin-container">

          <div className="glass-card admin-form-card">
            <div className="admin-form-header">
              <h2>Add Evaluation Question</h2>
              <p>Define multiple-choice questions for the assessment repository.</p>
            </div>

            {error && <div className="error-alert">{error}</div>}
            {success && <div className="success-alert">{success}</div>}

            <form onSubmit={handleSubmit} className="admin-question-form">
              <div className="form-group">
                <label>Question Prompt / Text</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="What is the runtime complexity of binary search?"
                  rows={4}
                  required
                ></textarea>
              </div>

              <div className="options-grid-form">
                <div className="form-group">
                  <label>Option A</label>
                  <input
                    type="text"
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    placeholder="Option A text"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Option B</label>
                  <input
                    type="text"
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    placeholder="Option B text"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Option C</label>
                  <input
                    type="text"
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    placeholder="Option C text"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Option D</label>
                  <input
                    type="text"
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    placeholder="Option D text"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Mathematics, History, Geography"
                  required
                />
                <label>Exam Type</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  required
                >
                  <option value="">-- Choose Exam Type --</option>
                  <option value="JAMB">JAMB</option>
                  <option value="WAEC_NECO">WAEC & NECO</option>
                </select>
                <label>Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  required
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label>Question Image <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.85rem" }}>(optional)</span></label>
                <div
                  style={{
                    border: "2px dashed var(--border)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "var(--bg-tertiary)",
                    position: "relative",
                  }}
                  onClick={() => document.getElementById('imageUploadInput').click()}
                >
                  <input
                    id="imageUploadInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                  {imagePreview ? (
                    <div>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px", objectFit: "contain" }}
                      />
                      <p style={{ marginTop: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {imageFile?.name} — Click to change
                      </p>
                    </div>
                  ) : (
                    <div style={{ color: "var(--text-muted)" }}>
                      {/* <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🖼️</div> */}
                      <p style={{ margin: 0, fontWeight: 500 }}>Click to upload an image</p>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem" }}>PNG, JPG, GIF, WEBP supported</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Correct Answer Label</label>
                <select
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  required
                >
                  <option value="">-- Choose Option --</option>
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <div className="admin-actions-row">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-admin-submit"
                  >
                    {submitting ? "Adding..." : "Add Question"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="btn-admin-cancel"
                  >
                    Back to Dashboard
                  </button>
                </div>

            </form>
          </div>

        </div>
      </div>
  );
};
export default AddQuestionPage;
