import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import TechnicianSidebar from "../components/TechnicianSidebar";

function TechnicianTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [priorityFilter, setPriorityFilter] = useState("All Priority");

  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const technicianName = storedUser.full_name || "Technician";

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

    loadTickets();
  }, []);

  // ============================================================
  // FILTER TICKETS
  // ============================================================

  const filteredTickets = tickets.filter((ticket) => {
    const searchText = search.toLowerCase();

    const ticketId = String(ticket.ticket_id || "").toLowerCase();
    const issue = String(ticket.description || "").toLowerCase();
    const category = String(ticket.category || "").toLowerCase();
    const location = String(ticket.location || "").toLowerCase();

    const matchesSearch =
      ticketId.includes(searchText) ||
      issue.includes(searchText) ||
      category.includes(searchText) ||
      location.includes(searchText);

    const matchesStatus =
      statusFilter === "All Status" ||
      ticket.status === statusFilter;

    const matchesPriority =
      priorityFilter === "All Priority" ||
      ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

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
            <h1>Assigned Tickets</h1>

            <p>
              View and manage maintenance tickets assigned to you.
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

        {/* Summary */}
        <section className="stats-grid">

          <div className="stat-card">
            <span className="stat-icon">🎫</span>

            <div>
              <h3>{totalAssigned}</h3>
              <p>Assigned Tickets</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">⏳</span>

            <div>
              <h3>{pendingTickets}</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">🔧</span>

            <div>
              <h3>{inProgressTickets}</h3>
              <p>In Progress</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">✅</span>

            <div>
              <h3>{resolvedTickets}</h3>
              <p>Resolved</p>
            </div>
          </div>

        </section>

        {/* Tickets Section */}
        <section className="technician-all-tickets-section">

          <div className="technician-tickets-toolbar">

            <div>
              <h2>My Assigned Tickets</h2>

              <p>
                Tickets currently assigned to {technicianName}.
              </p>
            </div>

            <div className="technician-filters">

              <input
                type="text"
                placeholder="🔎 Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
              >
                <option>All Status</option>
                <option>Submitted</option>
                <option>Pending</option>
                <option>Assigned</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(e.target.value)
                }
              >
                <option>All Priority</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

            </div>

          </div>

          {/* Table */}
          <div className="technician-all-tickets-table-wrapper">

            {loading ? (

              <p style={{ padding: "20px" }}>
                Loading assigned tickets...
              </p>

            ) : (

              <table className="technician-all-tickets-table">

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

                  {filteredTickets.length === 0 ? (

                    <tr>
                      <td
                        colSpan="7"
                        className="no-tickets-found"
                      >
                        🔍 No tickets found.
                      </td>
                    </tr>

                  ) : (

                    filteredTickets.map((ticket) => (

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
                          📍 {ticket.location}
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

      </main>

    </div>
  );
}

export default TechnicianTickets;