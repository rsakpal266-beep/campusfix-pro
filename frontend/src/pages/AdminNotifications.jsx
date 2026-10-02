
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { API_BASE_URL } from "../config";

function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authExpired, setAuthExpired] = useState(false);

  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = storedUser.full_name || storedUser.name || "Administrator";
  const collegeName = storedUser.college_name || "College Administration";

  const isUnread = (notification) =>
    notification.is_read === false ||
    notification.is_read === 0 ||
    notification.is_read === "0";

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      setAuthExpired(false);

      const currentToken = localStorage.getItem("token");

      if (!currentToken) {
        setError("Please sign in as College Administrator to view notifications.");
        setAuthExpired(true);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (response.status === 401) {
        setAuthExpired(true);
        setError("Your session has expired. Please sign in again.");
        return;
      }

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(
          data.detail || data.message || "Failed to load notifications."
        );
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Notifications fetch error:", err);
      setError(
        err.message ||
        `Cannot connect to backend server at ${API_BASE_URL}.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(isUnread).length;

  const markAsRead = async (id) => {
    try {
      const currentToken = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${id}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read.");
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Mark as read error:", err);
      setError(err.message || "Could not update notification.");
    }
  };

  const markAllAsRead = async () => {
    try {
      const currentToken = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/read-all`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read.");
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error("Mark all as read error:", err);
      setError(err.message || "Could not update notifications.");
    }
  };

  const getIcon = (type) => {
    if (type === "assignment") return "👨‍🔧";
    if (type === "priority") return "⚠️";
    if (type === "feedback") return "⭐";
    return "🔔";
  };

  return (
    <div className="dashboard-page">
      <AdminSidebar />

      <main className="dashboard-main">
        {/* Header */}
        <header
          className="dashboard-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1>Notifications</h1>
            <p>
              View important campus maintenance updates and system alerts.
            </p>
          </div>

          <Link
            to="/admin-dashboard"
            className="admin-profile"
            style={{ textDecoration: "none", cursor: "pointer" }}
            title="Admin Dashboard"
          >
            <span>
              {adminName.charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{adminName}</strong>
              <small>Administrator</small>
            </div>
          </Link>
        </header>

        {/* College Information */}
        <p
          style={{
            color: "var(--cf-muted)",
            fontSize: "13px",
            margin: "0 0 16px",
          }}
        >
          🏛️ {collegeName}
        </p>

        {/* Error */}
        {error && (
          <div className="notification-error" style={{ marginBottom: "16px" }}>
            ⚠️ {error}
            {authExpired ? (
              <Link
                to="/login"
                style={{ marginLeft: "12px", color: "#60a5fa" }}
              >
                Sign In Again
              </Link>
            ) : (
              <button
                type="button"
                onClick={fetchNotifications}
                style={{ marginLeft: "12px", cursor: "pointer" }}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Notification Summary */}
        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🔔</span>
            <div>
              <h3>{notifications.length}</h3>
              <p>Total Notifications</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">📩</span>
            <div>
              <h3>{unreadCount}</h3>
              <p>Unread Notifications</p>
            </div>
          </div>
        </section>

        {/* Recent Notifications */}
        <section className="admin-ticket-section">
          <div
            className="ticket-filter-bar"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2>Recent Notifications</h2>
              <p>Stay updated with ticket assignments and changes.</p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-read-btn"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {loading && (
            <div className="notification-empty">
              Loading notifications...
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="notification-empty">
              <div className="notification-empty-icon">🔔</div>
              <h3>No Notifications</h3>
              <p>You don't have any notifications yet.</p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className="technician-notification-list">
              {notifications.map((notification) => {
                const unread = isUnread(notification);

                return (
                  <div
                    key={notification.id}
                    className={
                      unread
                        ? "technician-notification unread"
                        : "technician-notification"
                    }
                  >
                    <div className="notification-icon">
                      {getIcon(notification.type)}
                    </div>

                    <div className="notification-content">
                      <h3>
                        {notification.title || "CampusFix Pro Notification"}
                      </h3>

                      <p>{notification.message}</p>

                      {notification.ticket_number && (
                        <span className="notification-ticket">
                          Ticket #{notification.ticket_number}
                        </span>
                      )}

                      <small>
                        {notification.created_at
                          ? new Date(notification.created_at).toLocaleString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "Recently"}
                      </small>
                    </div>

                    {unread && (
                      <button
                        type="button"
                        className="notification-read-btn"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminNotifications;
