import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";
import AdminSidebar from "../components/AdminSidebar";
import TechnicianSidebar from "../components/TechnicianSidebar";
import { API_BASE_URL } from "../config";

function FixBot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hello! 👋 I'm **FixBot AI**, your smart campus maintenance assistant. I can help diagnose issues with electrical, plumbing, network, classroom AV, or furniture, guide you on how to raise complaints, and explain repair statuses. How can I help you today?",
      time: "Just now",
      suggestions: [
        "How do I report a water leakage?",
        "Ceiling fan is making noise in Room 204",
        "Wi-Fi is disconnected in the hostel",
        "What does In Progress mean?",
        "Campus emergency maintenance number",
      ],
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => "session_" + Math.random().toString(36).substring(2, 9));

  // Optional real API key override (stored in browser for instant evaluation)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("fixbot_gemini_api_key") || "");
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [providerStatus, setProviderStatus] = useState("AI Ready");

  const messagesEndRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = storedUser.role || "student";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSaveApiKey = (keyVal) => {
    setApiKey(keyVal);
    localStorage.setItem("fixbot_gemini_api_key", keyVal);
  };

  const handleSendMessage = async (textToSend) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || loading) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: promptText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/fixbot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptText,
          session_id: sessionId,
          api_key: apiKey || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.detail || data.message || "FixBot service error");
      }

      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: data.response,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        provider: data.provider,
        suggestions: data.suggestions || [],
      };

      setMessages((prev) => [...prev, botMessage]);
      if (data.provider === "google_gemini") {
        setProviderStatus("Powered by Google Gemini ⚡");
      } else if (data.provider === "openai") {
        setProviderStatus("Powered by OpenAI GPT ⚡");
      } else {
        setProviderStatus("CampusFix Knowledge Engine 🤖");
      }
    } catch (err) {
      console.error("FixBot chat error:", err);
      const errorMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: `⚠️ I had trouble connecting to the maintenance knowledge service. (${err.message}). You can still raise a complaint directly from the sidebar.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: "bot",
        text: "Conversation cleared. How can I assist with campus maintenance?",
        time: "Just now",
        suggestions: [
          "How do I report a water leakage?",
          "How do I report an electrical issue?",
          "How do I track my ticket?",
        ],
      },
    ]);
  };

  // Render appropriate sidebar according to user role
  const renderSidebar = () => {
    if (userRole === "admin") return <AdminSidebar />;
    if (userRole === "technician") return <TechnicianSidebar />;
    return <UserSidebar />;
  };

  return (
    <div className="dashboard-page">
      {renderSidebar()}

      <main className="dashboard-main fixbot-main">
        {/* FIXBOT HEADER */}
        <div className="fixbot-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="dashboard-label" style={{ color: "var(--cf-lime)", letterSpacing: "1px", fontWeight: "700" }}>
              CAMPUS MAINTENANCE AI
            </p>
            <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              FixBot AI Assistant 🤖
            </h1>
            <p>
              Real-time diagnosis, complaint guidance, and priority recommendations powered by Gemini AI.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              style={{
                background: "rgba(163, 230, 53, 0.12)",
                border: "1px solid var(--cf-lime)",
                color: "var(--cf-lime)",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              ⚙️ {apiKey ? "API Key Connected" : "Configure API Key"}
            </button>

            <div className="fixbot-status" style={{ background: "rgba(163, 230, 53, 0.15)", border: "1px solid var(--cf-lime)", color: "var(--cf-lime)" }}>
              <span style={{ background: "var(--cf-lime)" }}></span>
              {providerStatus}
            </div>
          </div>
        </div>

        {/* OPTIONAL REAL API KEY CONFIG PANEL */}
        {showKeyConfig && (
          <div
            style={{
              background: "#082114",
              border: "1px solid var(--cf-lime)",
              borderRadius: "14px",
              padding: "18px",
              marginBottom: "20px",
              animation: "fadeIn 0.25s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--cf-lime)", margin: 0, fontSize: "16px" }}>
                🔑 Live Gemini / OpenAI API Key Configuration
              </h3>
              <button
                onClick={() => setShowKeyConfig(false)}
                style={{ background: "none", border: "none", color: "var(--cf-muted)", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <p style={{ color: "var(--cf-muted)", fontSize: "13px", margin: "8px 0 14px 0" }}>
              You can paste a Google Gemini API Key below to enable live generative AI responses directly in FixBot. (Keys are stored locally in your browser session).
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "#04120a",
                  border: "1px solid var(--cf-border)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontFamily: "monospace",
                }}
              />
              {apiKey && (
                <button
                  onClick={() => handleSaveApiKey("")}
                  style={{
                    padding: "10px 16px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid #ef4444",
                    color: "#fca5a5",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Clear Key
                </button>
              )}
            </div>
          </div>
        )}

        {/* CHAT CONTAINER */}
        <div className="fixbot-container">
          <div className="fixbot-chat-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="fixbot-avatar">🤖</div>
              <div>
                <h2>FixBot AI</h2>
                <p>Campus Maintenance Specialist</p>
              </div>
            </div>

            <button
              onClick={clearChat}
              style={{
                background: "transparent",
                border: "1px solid var(--cf-border)",
                color: "var(--cf-muted)",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              🗑️ Clear Chat
            </button>
          </div>

          {/* MESSAGES LIST */}
          <div className="fixbot-messages" style={{ minHeight: "380px", maxHeight: "500px", overflowY: "auto" }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.sender === "bot" ? "bot-message" : "user-message"}`}>
                {msg.sender === "bot" && <div className="chat-avatar">🤖</div>}

                <div className="message-bubble" style={{ lineHeight: "1.6" }}>
                  <div style={{ whiteSpace: "pre-line" }}>{msg.text}</div>
                  <small style={{ display: "block", marginTop: "6px", opacity: 0.7, fontSize: "11px" }}>
                    {msg.sender === "bot" ? "FixBot AI" : "You"} • {msg.time}
                  </small>

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          style={{
                            background: "rgba(163, 230, 53, 0.12)",
                            border: "1px solid rgba(163, 230, 53, 0.35)",
                            color: "var(--cf-lime)",
                            padding: "4px 10px",
                            borderRadius: "14px",
                            fontSize: "12px",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message bot-message">
                <div className="chat-avatar">🤖</div>
                <div className="message-bubble" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div className="loading-spinner" style={{ width: "16px", height: "16px" }}></div>
                  <span style={{ color: "var(--cf-lime)", fontSize: "13px" }}>FixBot is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* CHAT INPUT AREA */}
          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Ask FixBot (e.g. 'Ceiling fan is sparking in 204' or 'How do I raise a complaint?')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="send-message-btn"
              style={{ opacity: input.trim() ? 1 : 0.6 }}
            >
              ➤
            </button>
          </div>

          <div className="fixbot-disclaimer" style={{ color: "var(--cf-muted)", fontSize: "12px", padding: "10px" }}>
            FixBot AI provides campus maintenance advice. For emergency hazards, contact Facilities Hotline: <strong>+91 98765 43210</strong>.
          </div>
        </div>
      </main>
    </div>
  );
}

export default FixBot;