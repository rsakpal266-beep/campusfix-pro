import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import UserSidebar from "../components/UserSidebar";

function Notifications() {

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch notifications
  const fetchNotifications = async () => {

    try {

      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/notifications`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load notifications.");
        return;
      }

      setNotifications(data.notifications || []);

    } catch (error) {

      console.error("Notification error:", error);

      setError(
        "Cannot connect to Flask backend. Make sure Flask backend is running."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    fetchNotifications();
  }, []);


  // Mark one notification as read
  const markAsRead = async (notificationId) => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {

        setNotifications((previousNotifications) =>
          previousNotifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );

      }

    } catch (error) {

      console.error("Mark notification read error:", error);

    }
  };


  // Mark all notifications as read
  const markAllAsRead = async () => {

    try {

      const token = localStorage.getItem("token");

      const unreadNotifications = notifications.filter(
        (notification) => !notification.is_read
      );

      await Promise.all(
        unreadNotifications.map((notification) =>
          fetch(
            `${API_BASE_URL}/api/notifications/${notification.id}/read`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

    } catch (error) {

      console.error("Mark all notifications error:", error);

    }
  };


  // Format notification date
  const formatDate = (dateValue) => {

    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return dateValue;
    }

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

    if (text.includes("assigned")) {
      return "👨‍🔧";
    }

    if (text.includes("resolved")) {
      return "✅";
    }

    if (text.includes("status")) {
      return "🔧";
    }

    if (text.includes("submitted")) {
      return "🎫";
    }

    return "🔔";
  };


  return (
    <div className="dashboard-page">

      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <main className="dashboard-main">

        <div className="notifications-header">

          <div>

            <p className="dashboard-label">
              NOTIFICATIONS
            </p>

            <h1>Notifications</h1>

            <p>
              Stay updated about your maintenance complaints.
            </p>

          </div>

          <button
            className="mark-read-btn"
            onClick={markAllAsRead}
            disabled={
              notifications.filter(
                (notification) => !notification.is_read
              ).length === 0
            }
          >
            Mark all as read
          </button>

        </div>


        {/* Error */}
        {error && (
          <div className="notification-error">
            {error}
          </div>
        )}


        {/* Loading */}
        {loading && (
          <div className="notification-card">
            <div className="notification-content">
              <p>Loading notifications...</p>
            </div>
          </div>
        )}


        {/* Notification List */}
        {!loading && !error && notifications.length > 0 && (

          <div className="notifications-list">

            {notifications.map((notification) => {

              const isUnread =
                notification.is_read === false ||
                notification.is_read === 0;

              /*
                Backend may return ticket_id as the actual
                CF-XXXX ticket code or as the numeric database ID.
              */
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
                  className={`notification-card ${
                    isUnread ? "unread" : ""
                  }`}
                  key={notification.id}
                >

                  <div className="notification-icon">
                    {getNotificationIcon(notification.title)}
                  </div>


                  <div className="notification-content">

                    <div className="notification-title-row">

                      <h3>
                        {notification.title}
                      </h3>

                      <span>
                        {formatDate(notification.created_at)}
                      </span>

                    </div>


                    <p>
                      {notification.message}
                    </p>


                    <div className="notification-actions">

                      {ticketCode && (
                        <Link to={`/ticket/${ticketCode}`}>
                          View Ticket
                        </Link>
                      )}

                      {isUnread && (
                        <button
                          className="notification-read-btn"
                          onClick={() =>
                            markAsRead(notification.id)
                          }
                        >
                          Mark as read
                        </button>
                      )}

                    </div>

                  </div>


                  {isUnread && (
                    <div className="unread-dot"></div>
                  )}

                </div>

              );

            })}

          </div>

        )}


        {/* No notifications */}
        {!loading && !error && notifications.length === 0 && (

          <div className="notification-card">

            <div className="notification-icon">
              🔔
            </div>

            <div className="notification-content">

              <h3>No notifications</h3>

              <p>
                You don't have any notifications yet.
              </p>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}

export default Notifications;