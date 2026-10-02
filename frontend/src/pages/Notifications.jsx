
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import UserSidebar from "../components/UserSidebar";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const isUnread = (notification) =>
    notification.is_read === false ||
    notification.is_read === 0 ||
    notification.is_read === "0";

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const currentToken = localStorage.getItem("token");

      if (!currentToken) {
        setError("Please login again.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/notifications`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        setError(data.message || "Failed to load notifications.");
        return;
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Notification error:", err);
      setError("Cannot connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(isUnread).length;

  // Mark one notification as read
  const markAsRead = async (notificationId) => {
    try {
      const currentToken = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
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
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Mark notification read error:", err);
      setError(err.message || "Could not update notification.");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const currentToken = localStorage.getItem("token");

      const unreadNotifications = notifications.filter(isUnread);

      const results = await Promise.all(
        unreadNotifications.map((notification) =>
          fetch(
            `${API_BASE_URL}/api/notifications/${notification.id}/read`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${currentToken}`,
              },
            }
          )
        )
      );

      if (results.some((response) => !response.ok)) {
        throw new Error("Some notifications could not be updated.");
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error("Mark all notifications error:", err);
      setError(err.message || "Could not update notifications.");
    }
  };

  // Format notification date
  const formatDate = (dateValue) => {
    if (!dateValue) return "Recently";

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) return dateValue;

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Notification icon
  const getNotificationIcon = (title) => {
    const text = title?.toLowerCase() || "";

    if (text.includes("assigned")) return "👨‍🔧";
    if (text.includes("resolved")) return "✅";
    if (text.includes("status")) return "🔧";
    if (text.includes("submitted") || text.includes("created")) return "🎫";

    return "🔔";
  };

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
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
              View important updates related to your maintenance complaints.
            </p>
          </div>

          <Link
            to="/profile"
            className="admin-profile"
            style={{ textDecoration: "none", cursor: "pointer" }}
            title="View Profile"
          >
            {(() => {
              const user = JSON.parse(localStorage.getItem("user") || "{}");
              const name = user.full_name || user.name || "Student";
              return (
                <>
                  <span>{name.charAt(0).toUpperCase()}</span>
                  <div>
                    <strong>{name}</strong>
                    <small>Student</small>
                  </div>
                </>
              );
            })()}
          </Link>
        </header>

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

        {/* Notifications Panel */}
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

          {/* Error */}
          {error && (
            <div className="notification-error">
              ⚠️ {error}
              <button
                type="button"
                onClick={fetchNotifications}
                style={{ marginLeft: "12px", cursor: "pointer" }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="notification-empty">
              Loading notifications...
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && notifications.length === 0 && (
            <div className="notification-empty">
              <div className="notification-empty-icon">🔔</div>
              <h3>No Notifications</h3>
              <p>You don't have any notifications yet.</p>
            </div>
          )}

          {/* Notification List */}
          {!loading && notifications.length > 0 && (
            <div className="technician-notification-list">
              {notifications.map((notification) => {
                const unread = isUnread(notification);

                const ticketCode =
                  notification.ticket_code ||
                  (
                    typeof notification.ticket_id === "string" &&
                    notification.ticket_id.startsWith("CF-")
                      ? notification.ticket_id
                      : null
                  );

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
                      {getNotificationIcon(notification.title)}
                    </div>

                    <div className="notification-content">
                      <h3>
                        {notification.title || "CampusFix Pro Notification"}
                      </h3>

                      <p>{notification.message}</p>

                      {ticketCode && (
                        <Link
                          to={`/ticket/${ticketCode}`}
                          className="notification-ticket"
                        >
                          View Ticket #{ticketCode}
                        </Link>
                      )}

                      <small>{formatDate(notification.created_at)}</small>
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

export default Notifications;
