// ChatWidget.jsx – fully-featured help & chat widget powered by Gemini AI (streaming SSE)
import React, { useState, useRef, useEffect, useContext } from "react";
import { AuthContext, api } from "../context/AuthContext";
import "./ChatWidget.css";

// --- Minimal markdown renderer (bold, code, bullets) ---
function renderMarkdown(text) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Bullet list
    if (/^[-*•]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s/, ""));
        i++;
      }
      out.push(
        <ul key={`ul-${i}`} style={{ margin: "0.4rem 0 0.4rem 1.1rem", padding: 0 }}>
          {items.map((it, j) => (
            <li key={j} style={{ marginBottom: "0.2rem" }} dangerouslySetInnerHTML={{ __html: inlineFormat(it) }} />
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      out.push(
        <ol key={`ol-${i}`} style={{ margin: "0.4rem 0 0.4rem 1.1rem", padding: 0 }}>
          {items.map((it, j) => (
            <li key={j} style={{ marginBottom: "0.2rem" }} dangerouslySetInnerHTML={{ __html: inlineFormat(it) }} />
          ))}
        </ol>
      );
      continue;
    }

    // Heading
    if (/^#{1,3}\s/.test(line)) {
      const text2 = line.replace(/^#{1,3}\s/, "");
      out.push(<p key={i} style={{ fontWeight: 700, margin: "0.5rem 0 0.2rem" }} dangerouslySetInnerHTML={{ __html: inlineFormat(text2) }} />);
      i++;
      continue;
    }

    // Empty line → spacing
    if (line.trim() === "") {
      out.push(<div key={i} style={{ height: "0.35rem" }} />);
      i++;
      continue;
    }

    out.push(<p key={i} style={{ margin: "0.25rem 0" }} dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />);
    i++;
  }

  return <>{out}</>;
}

function inlineFormat(text) {
  return text
    .replace(/`([^`]+)`/g, "<code style='background:rgba(0,0,0,0.08);border-radius:3px;padding:1px 4px;font-size:0.88em'>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

// Quick-action suggestion chips shown before first message
const QUICK_CHIPS = [
  "How do I start a practice test?",
  "How does the leaderboard work?",
  "How do I pay for my subscription?",
  "Tips for passing WAEC Mathematics",
  "What is the Corrections page?",
];

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

const ChatWidget = () => {
  const { user, token } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  // messages: { role: "user"|"model", parts: [{ text }], streaming?: bool }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  const toggle = () => {
    setOpen((v) => !v);
    setError("");
  };

  // Auto-scroll on new messages
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;
    setInput("");
    setError("");

    const userMsg = { role: "user", parts: [{ text: trimmed }] };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    // Add a placeholder streaming message
    const placeholderIndex = newHistory.length;
    setMessages((prev) => [...prev, { role: "model", parts: [{ text: "" }], streaming: true }]);

    try {
      // Derive the endpoint from the already-normalised axios base URL
      // (avoids re-parsing VITE_API_URL and missing the /api segment in prod)
      const chatUrl = `${api.defaults.baseURL}/ai/chat`;
      const response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: newHistory }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // keep incomplete chunk

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const payload = JSON.parse(line.slice(5).trim());
            if (payload.error) {
              setError(payload.error);
              break;
            }
            if (payload.chunk) {
              fullText += payload.chunk;
              setMessages((prev) => {
                const copy = [...prev];
                copy[placeholderIndex] = { role: "model", parts: [{ text: fullText }], streaming: true };
                return copy;
              });
            }
            if (payload.done) {
              setMessages((prev) => {
                const copy = [...prev];
                copy[placeholderIndex] = { role: "model", parts: [{ text: fullText }], streaming: false };
                return copy;
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      setError("Could not reach the server. Please check your connection.");
      // Remove the placeholder on error
      setMessages((prev) => prev.slice(0, placeholderIndex));
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        className={`cw-toggle ${open ? "cw-toggle--open" : ""}`}
        onClick={toggle}
        aria-label={open ? "Close help chat" : "Open help chat"}
        id="chat-widget-toggle"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
            </svg>
            <span className="cw-toggle-label">Help</span>
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="cw-panel" role="dialog" aria-modal="true" aria-label="Help and Chat">
          {/* Header */}
          <div className="cw-header">
            <div className="cw-header-info">
              <div>
                <div className="cw-header-title">Exam Quest Assistant</div>
                <div className="cw-header-sub">Always here to help</div>
              </div>
            </div>
            <div className="cw-header-actions">
              {messages.length > 0 && (
                <button className="cw-icon-btn" onClick={clearChat} title="Clear chat" aria-label="Clear chat">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                  </svg>
                </button>
              )}
              <button className="cw-icon-btn" onClick={toggle} aria-label="Close chat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages body */}
          <div className="cw-body" ref={bodyRef}>
            {messages.length === 0 ? (
              <div className="cw-welcome">
                <div className="cw-welcome-icon">✦</div>
                <h3>Hi{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋</h3>
                <p>I'm your Exam Quest assistant. Ask me anything about the platform or your studies.</p>
                <div className="cw-chips">
                  {QUICK_CHIPS.map((chip) => (
                    <button key={chip} className="cw-chip" onClick={() => sendMessage(chip)}>
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isUser = msg.role === "user";
                const text = msg.parts?.[0]?.text ?? "";
                return (
                  <div key={i} className={`cw-msg-row ${isUser ? "cw-msg-row--user" : "cw-msg-row--bot"}`}>
                    {!isUser && <div className="cw-bot-avatar">✦</div>}
                    <div className={`cw-bubble ${isUser ? "cw-bubble--user" : "cw-bubble--bot"}`}>
                      {isUser ? (
                        <span>{text}</span>
                      ) : msg.streaming && text === "" ? (
                        // Typing dots
                        <span className="cw-typing">
                          <span /><span /><span />
                        </span>
                      ) : (
                        <div className="cw-markdown">{renderMarkdown(text)}</div>
                      )}
                      {msg.streaming && text !== "" && (
                        <span className="cw-cursor" aria-hidden="true">▋</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {error && (
              <div className="cw-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}
          </div>

          {/* Input footer */}
          <div className="cw-footer">
            <div className="cw-input-wrap">
              <textarea
                ref={inputRef}
                id="chat-widget-input"
                rows={1}
                className="cw-input"
                placeholder={user ? "Ask a question…" : "Please log in to use the chat"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={loading || !user}
              />
              <button
                id="chat-widget-send"
                className={`cw-send ${input.trim() && !loading ? "cw-send--active" : ""}`}
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading || !user}
                aria-label="Send message"
              >
                {loading ? (
                  <span className="cw-spinner" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
            <div className="cw-footer-note">Press Enter to send · Shift+Enter for new line</div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
