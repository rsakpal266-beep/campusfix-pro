import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { API_BASE_URL } from "../config";

function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [authExpired, setAuthExpired] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      setAuthExpired(false);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in as College Administrator to view system notifications.");
        setAuthExpired(true);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setAuthExpired(true);
        setError("Your session has expired or your credentials were reset. Please sign in again.");
        return;
      }

      const data = await response.json();
      if (response.ok && data.status === "success") {
        setNotifications(data.notifications || []);
      } else {
        setError(data.detail || data.message || "Failed to load notifications.");
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
      setError(`Cannot connect to backend server at ${API_BASE_URL}. Ensure backend service is online.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    if (type === "assignment") return "🛠️";
    if (type === "priority") return "⚠️";
    if (type === "feedback") return "⭐";
    return "📬";
  };

  return (
    <div className="dashboard-page">
      <AdminSidebar />

      <main className="dashboard-main">
        <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="role-badge admin" style={{ display: "inline-block", marginBottom: "6px" }}>
              👑 College Administration
            </span>
            <h1>System Alerts & Notifications</h1>
            <p>Real-time campus maintenance dispatches, priority escalations, and status alerts.</p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="onboard-btn"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              ✓ Mark All as Read
            </button>
          )}
        </header>

        {error && (
          <div
            className="notification-error"
            style={{
              margin: "16px 0",
              padding: "14px 18px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              borderRadius: "10px",
              color: "#fca5a5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <span>⚠️ {error}</span>
            <div style={{ display: "flex", gap: "10px" }}>
              {authExpired ? (
                <Link
                  to="/login"
                  className="onboard-btn"
                  style={{
                    padding: "6px 14px",
                    fontSize: "12px",
                    textDecoration: "none",
                    background: "var(--cf-lime)",
                    color: "#000",
                    fontWeight: "bold",
                  }}
                >
                  Sign In Again 🚀
                </Link>
              ) : (
                <button
                  onClick={fetchNotifications}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  🔄 Retry Connection
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ margin: "20px 0", color: "var(--cf-muted)", fontSize: "14px" }}>
          You have <strong style={{ color: "var(--cf-lime)" }}>{unreadCount}</strong> unread alert(s)
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--cf-muted)" }}>
            Loading alerts...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "var(--cf-card)", borderRadius: "14px", border: "1px dashed var(--cf-border)" }}>
            <span style={{ fontSize: "36px" }}>🔔</span>
            <h3 style={{ color: "#ffffff", margin: "10px 0" }}>No Notifications</h3>
            <p style={{ color: "var(--cf-muted)", fontSize: "14px" }}>Everything is running smoothly on campus!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  background: notif.is_read ? "var(--cf-card)" : "rgba(163, 230, 53, 0.08)",
                  border: `1px solid ${notif.is_read ? "var(--cf-border)" : "var(--cf-lime)"}`,
                  borderRadius: "12px",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ fontSize: "24px" }}>{getIcon(notif.type)}</span>
                  <div>
                    <strong style={{ color: "#ffffff", fontSize: "15px" }}>{notif.title}</strong>
                    <p style={{ color: "var(--cf-muted)", margin: "4px 0 0 0", fontSize: "13.5px" }}>
                      {notif.message}
                    </p>
                    <small style={{ color: "#94a3b8", display: "block", marginTop: "4px", fontSize: "11px" }}>
                      {notif.created_at ? new Date(notif.created_at).toLocaleString() : "Recently"}
                    </small>
                  </div>
                </div>

                {!notif.is_read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    style={{
                      background: "rgba(163, 230, 53, 0.15)",
                      border: "1px solid var(--cf-lime)",
                      color: "var(--cf-lime)",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminNotifications;