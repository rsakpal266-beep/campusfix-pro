import React, { useState } from "react";
import { Link } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";

function AdminNotifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Complaint Submitted",
      message:
        "A new water leakage complaint has been submitted by Riddhi Sakpal.",
      time: "10 minutes ago",
      type: "complaint",
      read: false,
    },
    {
      id: 2,
      title: "Technician Assigned",
      message:
        "Rahul Patil has been assigned to ticket #CF-1023.",
      time: "35 minutes ago",
      type: "assignment",
      read: false,
    },
    {
      id: 3,
      title: "Ticket Status Updated",
      message:
        "Ticket #CF-1022 has been marked as Resolved.",
      time: "1 hour ago",
      type: "status",
      read: true,
    },
    {
      id: 4,
      title: "New Feedback Received",
      message:
        "A user has submitted feedback for ticket #CF-1022.",
      time: "2 hours ago",
      type: "feedback",
      read: true,
    },
    {
      id: 5,
      title: "High Priority Complaint",
      message:
        "A high-priority network problem has been reported in Computer Lab 1.",
      time: "3 hours ago",
      type: "priority",
      read: false,
    },
  ]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(
      notifications.filter(
        (notification) => notification.id !== id
      )
    );
  };

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="dashboard-main">

        {/* Header */}
        <header className="dashboard-header">

          <div>
            <h1>Notifications</h1>

            <p>
              Stay updated with important campus maintenance activities.
            </p>
          </div>

          <div className="admin-profile">

            <div className="profile-avatar">
              A
            </div>

            <div>
              <strong>Administrator</strong>
              <span>Admin</span>
            </div>

          </div>

        </header>

        {/* Notification Summary */}
        <section className="notification-summary">

          <div className="notification-summary-card">
            <span className="notification-summary-icon">
              🔔
            </span>

            <div>
              <h3>{notifications.length}</h3>
              <p>Total Notifications</p>
            </div>
          </div>

          <div className="notification-summary-card">
            <span className="notification-summary-icon">
              🔵
            </span>

            <div>
              <h3>{unreadCount}</h3>
              <p>Unread Notifications</p>
            </div>
          </div>

          <div className="notification-summary-card">
            <span className="notification-summary-icon">
              ✅
            </span>

            <div>
              <h3>
                {notifications.length - unreadCount}
              </h3>
              <p>Read Notifications</p>
            </div>
          </div>

        </section>

        {/* Notifications Section */}
        <section className="admin-notifications-section">

          <div className="notifications-header">

            <div>
              <h2>Recent Notifications</h2>

              <p>
                Important updates related to tickets and users.
              </p>
            </div>

            <button
              className="mark-all-btn"
              onClick={markAllAsRead}
            >
              ✓ Mark All as Read
            </button>

          </div>

          {/* Notification List */}
          <div className="admin-notification-list">

            {notifications.length === 0 ? (

              <div className="empty-notifications">
                <div>🔕</div>

                <h3>No Notifications</h3>

                <p>
                  You're all caught up!
                </p>
              </div>

            ) : (

              notifications.map((notification) => (

                <div
                  key={notification.id}
                  className={`admin-notification-item ${
                    notification.read ? "read" : "unread"
                  }`}
                >

                  <div className="notification-icon">

                    {notification.type === "complaint" && "🎫"}

                    {notification.type === "assignment" && "👨‍🔧"}

                    {notification.type === "status" && "🔄"}

                    {notification.type === "feedback" && "💬"}

                    {notification.type === "priority" && "⚠️"}

                  </div>

                  <div className="notification-content">

                    <div className="notification-title-row">

                      <h3>
                        {notification.title}
                      </h3>

                      {!notification.read && (
                        <span className="unread-dot"></span>
                      )}

                    </div>

                    <p>
                      {notification.message}
                    </p>

                    <span className="notification-time">
                      {notification.time}
                    </span>

                  </div>

                  <div className="notification-actions">

                    {!notification.read && (
                      <button
                        className="read-btn"
                        onClick={() =>
                          markAsRead(notification.id)
                        }
                      >
                        Mark Read
                      </button>
                    )}

                    <button
                      className="delete-notification-btn"
                      onClick={() =>
                        deleteNotification(notification.id)
                      }
                    >
                      ✕
                    </button>

                  </div>

                </div>

              ))

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminNotifications;