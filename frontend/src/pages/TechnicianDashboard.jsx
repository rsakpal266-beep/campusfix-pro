import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import TechnicianSidebar from "../components/TechnicianSidebar";

function TechnicianDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [currentUser, setCurrentUser] = useState(storedUser);

  const technicianName = currentUser.full_name || currentUser.name || "Technician";

  // ============================================================
  // LOAD ASSIGNED TICKETS
  // ============================================================

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/technician/tickets`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        setError(data.message || "Failed to load assigned tickets.");
        return;
      }

      setTickets(data.tickets || []);

    } catch (error) {
      setError("Cannot connect to backend server.");
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

    loadTickets();

    // Refresh technician profile from database to ensure current name is always shown
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setCurrentUser(data.user);
            localStorage.setItem("user", JSON.stringify({ ...storedUser, ...data.user }));
          }
        }
      } catch (e) {
        // Fallback to storedUser silently
      }
    };

    fetchProfile();
  }, []);

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalAssigned = tickets.length;

  const pendingTickets = tickets.filter(
    (ticket) =>
      ticket.status === "Pending" ||
      ticket.status === "Submitted"
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "In Progress"
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "Resolved"
  ).length;

  // Show recent tickets only
  const recentTickets = tickets.slice(0, 5);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <TechnicianSidebar />

      {/* Main Content */}
      <main className="dashboard-main">

        {/* Header */}
        <header className="dashboard-header">

          <div>
            <h1>Technician Dashboard</h1>

            <p>
              Manage your assigned campus maintenance tickets.
            </p>
          </div>

          <Link
            to="/technician-profile"
            className="admin-profile"
            style={{ textDecoration: "none", cursor: "pointer" }}
            title="View Profile"
          >
            <span>
              {technicianName.charAt(0).toUpperCase()}
            </span>

            <div>
              <strong>{technicianName}</strong>
              <small>Technician</small>
            </div>
          </Link>

        </header>

        {/* Welcome */}
        <section className="technician-welcome">

          <div>
            <h2>
              Welcome, {technicianName.split(" ")[0]}! 👋
            </h2>

            <p>
              Here are your current maintenance assignments.
            </p>
          </div>

        </section>

        {/* Error */}
        {error && (
          <p
            style={{
              color: "red",
              margin: "15px 0"
            }}
          >
            {error}
          </p>
        )}

        {/* Statistics */}
        <section className="stats-grid">

          <div className="stat-card">

            <span className="stat-icon">
              🎫
            </span>

            <div>
              <h3>{totalAssigned}</h3>
              <p>Total Assigned</p>
            </div>

          </div>

          <div className="stat-card">

            <span className="stat-icon">
              ⏳
            </span>

            <div>
              <h3>{pendingTickets}</h3>
              <p>Pending</p>
            </div>

          </div>

          <div className="stat-card">

            <span className="stat-icon">
              🔧
            </span>

            <div>
              <h3>{inProgressTickets}</h3>
              <p>In Progress</p>
            </div>

          </div>

          <div className="stat-card">

            <span className="stat-icon">
              ✅
            </span>

            <div>
              <h3>{resolvedTickets}</h3>
              <p>Resolved</p>
            </div>

          </div>

        </section>

        {/* Assigned Tickets */}
        <section className="technician-tickets-section">

          <div className="technician-section-header">

            <div>
              <h2>Recent Assigned Tickets</h2>

              <p>
                Tickets assigned to you by the administrator.
              </p>
            </div>

            <Link
              to="/technician-tickets"
              className="view-all-btn"
            >
              View All
            </Link>

          </div>

          <div className="technician-ticket-table-wrapper">

            {loading ? (

              <p style={{ padding: "20px" }}>
                Loading assigned tickets...
              </p>

            ) : (

              <table className="technician-ticket-table">

                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Issue</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {recentTickets.length === 0 ? (

                    <tr>
                      <td
                        colSpan="7"
                        style={{ textAlign: "center" }}
                      >
                        No tickets assigned yet.
                      </td>
                    </tr>

                  ) : (

                    recentTickets.map((ticket) => (

                      <tr key={ticket.id}>

                        <td>
                          <strong>
                            {ticket.ticket_id}
                          </strong>
                        </td>

                        <td>
                          {ticket.description}
                        </td>

                        <td>
                          {ticket.category}
                        </td>

                        <td>
                          {ticket.location}
                        </td>

                        <td>

                          <span
                            className={`priority ${String(
                              ticket.priority || ""
                            ).toLowerCase()}`}
                          >
                            {ticket.priority}
                          </span>

                        </td>

                        <td>

                          <span
                            className={`status ${String(
                              ticket.status || ""
                            )
                              .toLowerCase()
                              .replaceAll(" ", "-")}`}
                          >
                            {ticket.status}
                          </span>

                        </td>

                        <td>

                          <Link
                            to={`/technician-ticket/${ticket.ticket_id}`}
                            className="view-ticket-btn"
                          >
                            View
                          </Link>

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            )}

          </div>

        </section>

        {/* Quick Actions */}
        <section className="technician-quick-actions">

          <h2>Quick Actions</h2>

          <div className="technician-action-grid">

            <Link
              to="/technician-tickets"
              className="technician-action-card"
            >

              <span>🎫</span>

              <div>
                <strong>Assigned Tickets</strong>

                <p>
                  View all your assigned complaints.
                </p>
              </div>

            </Link>

            <Link
              to="/technician-notifications"
              className="technician-action-card"
            >

              <span>🔔</span>

              <div>
                <strong>Notifications</strong>

                <p>
                  Check your latest updates.
                </p>
              </div>

            </Link>

            <Link
              to="/technician-profile"
              className="technician-action-card"
            >

              <span>👤</span>

              <div>
                <strong>My Profile</strong>

                <p>
                  View your technician profile.
                </p>
              </div>

            </Link>

          </div>

        </section>

      </main>

    </div>
  );
}

export default TechnicianDashboard;