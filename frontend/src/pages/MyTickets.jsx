import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import UserSidebar from "../components/UserSidebar";

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    let result = [...tickets];

    // Search
    if (search.trim()) {
      const searchText = search.toLowerCase();

      result = result.filter(
        (ticket) =>
          ticket.ticket_id.toLowerCase().includes(searchText) ||
          ticket.category.toLowerCase().includes(searchText) ||
          ticket.location.toLowerCase().includes(searchText)
      );
    }

    // Status filter
    if (statusFilter !== "All Status") {
      result = result.filter(
        (ticket) => ticket.status === statusFilter
      );
    }

    // Priority filter
    if (priorityFilter !== "All Priorities") {
      result = result.filter(
        (ticket) => ticket.priority === priorityFilter
      );
    }

    setFilteredTickets(result);
  }, [tickets, search, statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login to view your tickets.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tickets/my`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load tickets.");
        return;
      }

      setTickets(data.tickets || []);
      setFilteredTickets(data.tickets || []);

    } catch (error) {
      setError(
        "Cannot connect to server. Make sure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getStatusClass = (status) => {
    if (
      status === "Pending" ||
      status === "Submitted"
    ) {
      return "pending";
    }

    if (
      status === "In Progress" ||
      status === "Assigned"
    ) {
      return "progress";
    }

    if (status === "Resolved") {
      return "resolved";
    }

    return "pending";
  };

  const totalTickets = tickets.length;

  const pendingTickets = tickets.filter(
    (ticket) =>
      ticket.status === "Pending" ||
      ticket.status === "Submitted" ||
      ticket.status === "Assigned"
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "In Progress"
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "Resolved"
  ).length;

  return (
    <div className="dashboard-page">

      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <main className="dashboard-main">

        <div className="tickets-header">

          <div>
            <p className="dashboard-label">
              TICKET MANAGEMENT
            </p>

            <h1>My Tickets</h1>

            <p>
              View and track the maintenance complaints you have submitted.
            </p>
          </div>

          <Link
            to="/raise-complaint"
            className="dashboard-report-btn"
          >
            + Raise Complaint
          </Link>

        </div>


        {/* Ticket Summary */}
        <div className="ticket-summary">

          <div className="ticket-summary-card">
            <span>🎫</span>

            <div>
              <h3>{totalTickets}</h3>
              <p>Total</p>
            </div>
          </div>

          <div className="ticket-summary-card">
            <span>⏳</span>

            <div>
              <h3>{pendingTickets}</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="ticket-summary-card">
            <span>🔧</span>

            <div>
              <h3>{inProgressTickets}</h3>
              <p>In Progress</p>
            </div>
          </div>

          <div className="ticket-summary-card">
            <span>✅</span>

            <div>
              <h3>{resolvedTickets}</h3>
              <p>Resolved</p>
            </div>
          </div>

        </div>


        {/* Filter */}
        <div className="tickets-filter">

          <input
            type="text"
            placeholder="Search by Ticket ID or issue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option>All Priorities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>

        </div>


        {/* Error */}
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}


        {/* Loading */}
        {loading && (
          <p>Loading your tickets...</p>
        )}


        {/* No Tickets */}
        {!loading &&
          !error &&
          filteredTickets.length === 0 && (
            <div className="ticket-card">

              <h3>No tickets found</h3>

              <p>
                You haven't submitted any complaints matching
                the selected filters.
              </p>

            </div>
          )}


        {/* Tickets */}
        {!loading &&
          !error &&
          filteredTickets.length > 0 && (

            <div className="tickets-list">

              {filteredTickets.map((ticket) => (

                <div
                  className="ticket-card"
                  key={ticket.id}
                >

                  <div className="ticket-card-top">

                    <div>

                      <span className="ticket-id">
                        #{ticket.ticket_id}
                      </span>

                      <h3>
                        {ticket.category}
                      </h3>

                      <p>
                        📍 {ticket.location}
                      </p>

                    </div>

                    <span
                      className={`status ${getStatusClass(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>

                  </div>


                  <div className="ticket-info">

                    <div>
                      <small>Category</small>
                      <strong>{ticket.category}</strong>
                    </div>

                    <div>
                      <small>Priority</small>
                      <strong>{ticket.priority}</strong>
                    </div>

                    <div>
                      <small>Submitted</small>
                      <strong>
                        {formatDate(ticket.created_at)}
                      </strong>
                    </div>

                    <div>
                      <small>Technician</small>
                      <strong>
                        {ticket.technician_name ||
                          "Not Assigned"}
                      </strong>
                    </div>

                  </div>


                  <div className="ticket-card-bottom">

                    <span>
                      Last updated:{" "}
                      {formatDate(ticket.updated_at)}
                    </span>

                    <Link
                      to={`/ticket/${ticket.ticket_id}`}
                      className="view-ticket-btn"
                    >
                      View Details
                    </Link>

                  </div>

                </div>

              ))}

            </div>

          )}

      </main>

    </div>
  );
}

export default MyTickets;