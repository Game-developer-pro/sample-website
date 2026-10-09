// ChatWidget.jsx – a floating help/chat widget with modal dialog
import React, { useState } from "react";
import "./ChatWidget.css";

/*
  The widget appears as a round button in the bottom‑right corner.
  When clicked it expands into a glass‑morphism style modal where the user can
  type a query and see a streaming list of messages.
  For now the "send" handler just echoes the user input – you can replace it
  with an API call to your backend (e.g. /api/chat) later.
*/

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const toggle = () => setOpen((v) => !v);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    // Placeholder: echo back the same text after a short delay.
    const reply = { role: "assistant", content: `You wrote: ${userMsg.content}` };
    setTimeout(() => setMessages((prev) => [...prev, reply]), 500);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button className="chat-toggle" onClick={toggle} aria-label="Help chat">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="chat-modal" role="dialog" aria-modal="true">
          <div className="chat-header">
            <h2>Help &amp; Chat</h2>
            <button className="chat-close" onClick={toggle} aria-label="Close chat">
              ✕
            </button>
          </div>
          <div className="chat-body">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={"chat-message " + (msg.role === "assistant" ? "assistant" : "user")}
              >
                {msg.content}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <textarea
              rows={2}
              placeholder="Ask Antigravity…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button onClick={sendMessage} className="send-btn">
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
