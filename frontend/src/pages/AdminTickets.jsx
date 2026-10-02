import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import AdminSidebar from "../components/AdminSidebar";

function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewTicket, setViewTicket] = useState(null);
  const [technician, setTechnician] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [priorityFilter, setPriorityFilter] = useState("All Priority");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(false);

  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const collegeName = storedUser.college_name || "College Administration";

  // ============================================================
  // LOAD TICKETS
  // ============================================================

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/tickets`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        setError(data.message || "Failed to load tickets.");
        return;
      }

      setTickets(data.tickets || []);
    } catch (error) {
      setError("Cannot connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD TECHNICIANS
  // ============================================================

  const loadTechnicians = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/technicians`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        console.error(
          data.message || "Failed to load technicians."
        );
        return;
      }

      setTechnicians(data.technicians || []);
    } catch (error) {
      console.error("Technician loading error:", error);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (!token) {
      setError("Admin login session not found.");
      setLoading(false);
      return;
    }

    loadTickets();
    loadTechnicians();
  }, []);

  // ============================================================
  // ASSIGN TECHNICIAN
  // ============================================================

  const assignTechnician = async () => {
    if (!technician || !selectedTicket) {
      return;
    }

    try {
      setAssigning(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/tickets/${selectedTicket.ticket_id}/assign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            technician_id: Number(technician),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        alert(data.message || "Failed to assign technician.");
        return;
      }

      alert("Technician assigned successfully!");

      setSelectedTicket(null);
      setTechnician("");

      await loadTickets();
    } catch (error) {
      alert("Cannot connect to backend server.");
    } finally {
      setAssigning(false);
    }
  };

  // ============================================================
  // FILTER TICKETS
  // ============================================================

  const filteredTickets = tickets.filter((ticket) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      String(ticket.ticket_id || "")
        .toLowerCase()
        .includes(searchText) ||
      String(ticket.user_name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(ticket.description || "")
        .toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "All Status" ||
      ticket.status === statusFilter;

    const matchesPriority =
      priorityFilter === "All Priority" ||
      ticket.priority === priorityFilter;

    const matchesCategory =
      categoryFilter === "All Categories" ||
      ticket.category === categoryFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesCategory
    );
  });

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalTickets = tickets.length;

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
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (status) => {
    return String(status || "")
      .toLowerCase()
      .replaceAll(" ", "-");
  };

  // ============================================================
  // PRIORITY CLASS
  // ============================================================

  const getPriorityClass = (priority) => {
    return String(priority || "").toLowerCase();
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // ============================================================
  // CLOSE VIEW MODAL
  // ============================================================

  const closeViewModal = () => {
    setViewTicket(null);
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="dashboard-page">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <AdminSidebar />

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="role-badge admin">🏛️ {collegeName}</span>
              <span style={{ color: "var(--cf-lime)", fontSize: "13px", fontWeight: "600" }}>• Institutional Complaints</span>
            </div>
            <h1>All Tickets</h1>

            <p>
              Manage maintenance complaints for {collegeName}.
            </p>
          </div>

          <div className="admin-profile">

            <span>A</span>

            <div>
              <strong>{storedUser.full_name || "Administrator"}</strong>
              <small>{collegeName}</small>
            </div>

          </div>

        </header>

        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <section className="stats-grid">

          <div className="stat-card">

            <span className="stat-icon">
              🎫
            </span>

            <div>
              <h3>{totalTickets}</h3>
              <p>Total Tickets</p>
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

        {/* ====================================================
            TICKETS SECTION
        ==================================================== */}

        <section className="admin-ticket-section">

          {/* FILTER BAR */}

          <div className="ticket-filter-bar">

            <input
              type="text"
              placeholder="🔎 Search Ticket ID, user or issue..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
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

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
            >
              <option>All Categories</option>
              <option>Electrical</option>
              <option>Plumbing</option>
              <option>Furniture</option>
              <option>Cleaning</option>
              <option>Internet / Network</option>
              <option>Classroom Equipment</option>
              <option>Other</option>
            </select>

          </div>

          {/* ERROR */}

          {error && (
            <p
              style={{
                color: "#ff6b6b",
                margin: "15px 0",
              }}
            >
              {error}
            </p>
          )}

          {/* LOADING */}

          {loading ? (

            <p style={{ padding: "20px" }}>
              Loading tickets...
            </p>

          ) : (

            <div className="admin-ticket-table-wrapper">

              <table className="admin-ticket-table">

                <thead>

                  <tr>
                    <th>Ticket ID</th>
                    <th>User</th>
                    <th>Issue</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Technician</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredTickets.length === 0 ? (

                    <tr>

                      <td
                        colSpan="8"
                        style={{
                          textAlign: "center",
                          padding: "30px",
                        }}
                      >
                        No tickets found.
                      </td>

                    </tr>

                  ) : (

                    filteredTickets.map((ticket) => (

                      <tr key={ticket.id || ticket.ticket_id}>

                        {/* Ticket ID */}

                        <td>
                          <strong>
                            {ticket.ticket_id}
                          </strong>
                        </td>

                        {/* User */}

                        <td>
                          <div>
                            <span style={{ color: "#ffffff" }}>{ticket.user_name || "Unknown User"}</span>
                            {ticket.user_phone && (
                              <small style={{ display: "block", color: "var(--cf-muted)", fontSize: "11px" }}>
                                📞 {ticket.user_phone}
                              </small>
                            )}
                          </div>
                        </td>

                        {/* Issue */}

                        <td>
                          <span
                            title={ticket.description}
                          >
                            {ticket.description
                              ? ticket.description.length > 45
                                ? ticket.description.substring(
                                    0,
                                    45
                                  ) + "..."
                                : ticket.description
                              : "No description"}
                          </span>
                        </td>

                        {/* Category */}

                        <td>
                          {ticket.category || "Other"}
                        </td>

                        {/* Priority */}

                        <td>

                          <span
                            className={`priority ${getPriorityClass(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority || "Medium"}
                          </span>

                        </td>

                        {/* Technician */}

                        <td>

                          {ticket.technician_name ? (

                            ticket.technician_name

                          ) : (

                            <span className="not-assigned">
                              Not Assigned
                            </span>

                          )}

                        </td>

                        {/* Status */}

                        <td>

                          <span
                            className={`status ${getStatusClass(
                              ticket.status
                            )}`}
                          >
                            {ticket.status}
                          </span>

                        </td>

                        {/* ACTION */}

                        <td>

                          {!ticket.technician_id ? (

                            <button
                              className="assign-btn"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setTechnician("");
                              }}
                            >
                              Assign
                            </button>

                          ) : (

                            <button
                              className="view-ticket-btn"
                              onClick={() =>
                                setViewTicket(ticket)
                              }
                            >
                              View
                            </button>

                          )}

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* ====================================================
            ASSIGN TECHNICIAN MODAL
        ==================================================== */}

        {selectedTicket && (

          <div className="modal-overlay">

            <div className="assign-modal">

              <button
                className="modal-close"
                onClick={() => {
                  setSelectedTicket(null);
                  setTechnician("");
                }}
              >
                ✕
              </button>

              <h2>Assign Technician</h2>

              <p>
                Assign a technician to ticket{" "}
                <strong>
                  #{selectedTicket.ticket_id}
                </strong>
              </p>

              <div className="selected-ticket-info">

                <strong>
                  {selectedTicket.description}
                </strong>

                <span>
                  {selectedTicket.category}
                </span>

              </div>

              <label>
                Select Technician
              </label>

              <select
                value={technician}
                onChange={(e) =>
                  setTechnician(e.target.value)
                }
              >

                <option value="">
                  Choose Technician
                </option>

                {technicians.map((tech) => (

                  <option
                    key={tech.id}
                    value={tech.id}
                  >
                    {tech.full_name}
                  </option>

                ))}

              </select>

              <div className="modal-actions">

                <button
                  className="cancel-btn"
                  onClick={() => {
                    setSelectedTicket(null);
                    setTechnician("");
                  }}
                >
                  Cancel
                </button>

                <button
                  className="confirm-assign-btn"
                  onClick={assignTechnician}
                  disabled={assigning || !technician}
                >
                  {assigning
                    ? "Assigning..."
                    : "Assign Technician"}
                </button>

              </div>

            </div>

          </div>

        )}

        {/* ====================================================
            VIEW TICKET DETAILS MODAL
        ==================================================== */}

        {viewTicket && (

          <div className="modal-overlay">

            <div className="assign-modal ticket-details-modal">

              <button
                className="modal-close"
                onClick={closeViewModal}
              >
                ✕
              </button>

              <h2>Ticket Details</h2>

              <p>
                Complete information for{" "}
                <strong>
                  #{viewTicket.ticket_id}
                </strong>
              </p>

              <div className="ticket-details-grid">

                <div className="ticket-detail-item">
                  <span>Ticket ID</span>
                  <strong>
                    #{viewTicket.ticket_id}
                  </strong>
                </div>

                <div className="ticket-detail-item">
                  <span>User</span>
                  <div>
                    <strong style={{ display: "block" }}>
                      {viewTicket.user_name || "Unknown User"}
                    </strong>
                    {viewTicket.user_phone && (
                      <small style={{ color: "var(--cf-muted)", fontSize: "12px" }}>
                        📞 {viewTicket.user_phone}
                      </small>
                    )}
                  </div>
                </div>

                <div className="ticket-detail-item">
                  <span>Category</span>
                  <strong>
                    {viewTicket.category || "Other"}
                  </strong>
                </div>

                <div className="ticket-detail-item">
                  <span>Priority</span>

                  <strong>
                    <span
                      className={`priority ${getPriorityClass(
                        viewTicket.priority
                      )}`}
                    >
                      {viewTicket.priority || "Medium"}
                    </span>
                  </strong>

                </div>

                <div className="ticket-detail-item">
                  <span>Status</span>

                  <strong>
                    <span
                      className={`status ${getStatusClass(
                        viewTicket.status
                      )}`}
                    >
                      {viewTicket.status}
                    </span>
                  </strong>

                </div>

                <div className="ticket-detail-item">
                  <span>Technician</span>
                  <strong>
                    {viewTicket.technician_name ||
                      "Not Assigned"}
                  </strong>
                </div>

                <div className="ticket-detail-item">
                  <span>Location</span>
                  <strong>
                    {viewTicket.location ||
                      "Not Provided"}
                  </strong>
                </div>

                <div className="ticket-detail-item">
                  <span>Created At</span>
                  <strong>
                    {viewTicket.created_at
                      ? new Date(
                          viewTicket.created_at
                        ).toLocaleString()
                      : "Not Available"}
                  </strong>
                </div>

              </div>

              <div className="ticket-description-box">

                <span>Issue Description</span>

                <p>
                  {viewTicket.description ||
                    "No description provided."}
                </p>

              </div>

              <div className="modal-actions">

                <button
                  className="cancel-btn"
                  onClick={closeViewModal}
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}

export default AdminTickets;