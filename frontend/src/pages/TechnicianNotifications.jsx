import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import TechnicianSidebar from "../components/TechnicianSidebar";

function TechnicianNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const technicianName = storedUser.full_name || "Technician";

  // ============================================================
  // LOAD NOTIFICATIONS
  // ============================================================

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        setError(
          data.message || "Failed to load notifications."
        );
        return;
      }

      setNotifications(data.notifications || []);

    } catch (error) {
      setError("Cannot connect to Flask backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Technician login session not found.");
      setLoading(false);
      return;
    }

    loadNotifications();
  }, []);

  // ============================================================
  // MARK AS READ
  // ============================================================

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        return;
      }

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

    } catch (error) {
      console.error("Mark notification error:", error);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const unreadCount = notifications.filter(
    (notification) =>
      notification.is_read === false ||
      notification.is_read === 0
  ).length;

  return (
    <div className="dashboard-page">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <TechnicianSidebar />

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="dashboard-main">

        {/* Header */}
        <header className="dashboard-header">

          <div>

            <h1>Notifications</h1>

            <p>
              View important updates related to your assigned tickets.
            </p>

          </div>

          <div className="admin-profile">

            <span>
              {technicianName.charAt(0).toUpperCase()}
            </span>

            <div>
              <strong>{technicianName}</strong>
              <small>Technician</small>
            </div>

          </div>

        </header>

        {/* Notification Summary */}
        <section className="stats-grid">

          <div className="stat-card">

            <span className="stat-icon">
              🔔
            </span>

            <div>
              <h3>{notifications.length}</h3>
              <p>Total Notifications</p>
            </div>

          </div>

          <div className="stat-card">

            <span className="stat-icon">
              📩
            </span>

            <div>
              <h3>{unreadCount}</h3>
              <p>Unread Notifications</p>
            </div>

          </div>

        </section>

        {/* Notifications */}
        <section className="admin-ticket-section">

          <div className="ticket-filter-bar">

            <div>
              <h2>Recent Notifications</h2>

              <p>
                Stay updated with ticket assignments and changes.
              </p>
            </div>

          </div>

          {loading && (
            <div className="notification-empty">
              Loading notifications...
            </div>
          )}

          {error && !loading && (
            <div className="notification-error">
              {error}
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (

            <div className="notification-empty">

              <div className="notification-empty-icon">
                🔔
              </div>

              <h3>No Notifications</h3>

              <p>
                You don't have any notifications yet.
              </p>

            </div>

          )}

          {!loading && !error && notifications.length > 0 && (

            <div className="technician-notification-list">

              {notifications.map((notification) => {

                const unread =
                  notification.is_read === false ||
                  notification.is_read === 0;

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
                      🔔
                    </div>

                    <div className="notification-content">

                      <h3>
                        {notification.title}
                      </h3>

                      <p>
                        {notification.message}
                      </p>

                      {notification.ticket_number && (
                        <span className="notification-ticket">
                          Ticket #{notification.ticket_number}
                        </span>
                      )}

                      {notification.created_at && (
                        <small>
                          {new Date(
                            notification.created_at
                          ).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      )}

                    </div>

                    {unread && (
                      <button
                        type="button"
                        className="notification-read-btn"
                        onClick={() =>
                          markAsRead(notification.id)
                        }
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

export default TechnicianNotifications;