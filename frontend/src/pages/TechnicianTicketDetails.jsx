import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config";
import TechnicianSidebar from "../components/TechnicianSidebar";

function TechnicianTicketDetails() {
  const { ticketId } = useParams();

  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState("");
  const [resolution, setResolution] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingResolution, setSavingResolution] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const technicianName = storedUser.full_name || "Technician";

  // ============================================================
  // LOAD TICKET DETAILS
  // ============================================================

  const loadTicket = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/technician/tickets/${ticketId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        setError(data.message || "Failed to load ticket.");
        return;
      }

      setTicket(data.ticket);
      setStatus(data.ticket.status || "Assigned");
      setResolution(data.ticket.resolution_details || "");
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

    loadTicket();
  }, [ticketId]);

  // ============================================================
  // SELECT STATUS
  // ============================================================

  const selectStatus = (newStatus) => {
    setStatus(newStatus);
    setError("");
    setMessage("");
  };

  // ============================================================
  // SAVE STATUS + RESOLUTION
  // ============================================================

const saveResolution = async () => {
  // Resolution details are required only when resolving the ticket
  if (status === "Resolved" && !resolution.trim()) {
    setError("Please enter resolution details before resolving the ticket.");
    return;
  }

  try {
    setSavingResolution(true);
    setError("");
    setMessage("");

    const response = await fetch(
      `${API_BASE_URL}/api/technician/tickets/${ticketId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: status,
          resolution_details: resolution.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      setError(data.message || "Failed to save ticket.");
      return;
    }

    setMessage("Ticket status updated successfully.");

    await loadTicket();

  } catch (error) {
    setError("Cannot connect to backend server.");
  } finally {
    setSavingResolution(false);
  }
};

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="dashboard-page">
        <TechnicianSidebar />
        <main className="dashboard-main">
          <p style={{ padding: "30px" }}>
            Loading ticket details...
          </p>
        </main>
      </div>
    );
  }

  // ============================================================
  // TICKET NOT FOUND
  // ============================================================

  if (!ticket) {
    return (
      <div className="dashboard-page">
        <TechnicianSidebar />
        <main className="dashboard-main">
          <p
            style={{
              color: "red",
              padding: "30px",
            }}
          >
            {error || "Ticket not found."}
          </p>
        </main>
      </div>
    );
  }

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const submittedDate = ticket.created_at
    ? new Date(ticket.created_at).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not available";

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <TechnicianSidebar />

      {/* Main Content */}

      {/* Main Content */}
      <main className="dashboard-main">

        {/* Header */}
        <header className="dashboard-header">

          <div>
            <h1>Ticket Details</h1>

            <p>
              View complaint information and update ticket status.
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

        {/* Messages */}
        {error && (
          <p
            style={{
              color: "red",
              margin: "15px 0",
            }}
          >
            {error}
          </p>
        )}

        {message && (
          <p
            style={{
              color: "green",
              margin: "15px 0",
            }}
          >
            {message}
          </p>
        )}

        {/* Back Button */}
        <Link
          to="/technician-tickets"
          className="back-to-tickets"
        >
          ← Back to Assigned Tickets
        </Link>

        {/* Ticket Header */}
        <section className="technician-ticket-header-card">

          <div>

            <span className="ticket-id-label">
              Ticket ID
            </span>

            <h2>#{ticket.ticket_id}</h2>

            <p>{ticket.category}</p>

          </div>

          <div className="ticket-header-status">

            <span
              className={`priority ${String(
                ticket.priority || ""
              ).toLowerCase()}`}
            >
              {ticket.priority} Priority
            </span>

            <span
              className={`status ${String(
                status || ""
              )
                .toLowerCase()
                .replaceAll(" ", "-")}`}
            >
              {status}
            </span>

          </div>

        </section>

        {/* Main Ticket Content */}
        <section className="technician-ticket-details-grid">

          {/* Complaint Information */}
          <div className="technician-detail-card">

            <div className="detail-card-title">
              <h2>Complaint Information</h2>
            </div>

            <div className="detail-row">
              <span>Issue</span>
              <strong>{ticket.category}</strong>
            </div>

            <div className="detail-row">
              <span>Category</span>
              <strong>{ticket.category}</strong>
            </div>

            <div className="detail-row">
              <span>Location</span>
              <strong>📍 {ticket.location}</strong>
            </div>

            <div className="detail-row">

              <span>Priority</span>

              <span
                className={`priority ${String(
                  ticket.priority || ""
                ).toLowerCase()}`}
              >
                {ticket.priority}
              </span>

            </div>

            <div className="description-box">

              <span>Description</span>

              <p>
                {ticket.description}
              </p>

            </div>

          </div>

          {/* User Information */}
          <div className="technician-detail-card">

            <div className="detail-card-title">
              <h2>Submitted By</h2>
            </div>

            <div className="user-detail-profile">

              <div className="large-user-avatar">
                {String(
                  ticket.user_name || "U"
                ).charAt(0).toUpperCase()}
              </div>

              <div>

                <strong>
                  {ticket.user_name}
                </strong>

                <span>
                  {ticket.user_email}
                </span>

              </div>

            </div>

            <div className="detail-row">

              <span>Submitted On</span>

              <strong>
                {submittedDate}
              </strong>

            </div>

            <div className="detail-row">

              <span>Assigned Technician</span>

              <strong>
                {ticket.technician_name || technicianName}
              </strong>

            </div>

          </div>

        </section>

        {/* Complaint Image */}
        <section className="technician-detail-card image-card">

          <div className="detail-card-title">

            <h2>Complaint Image</h2>

            <span>
              Uploaded by user
            </span>

          </div>

          {ticket.image_path ? (

            <div className="complaint-image-placeholder">

              <img
                src={`${API_BASE_URL}/${ticket.image_path}`}
                alt="Complaint"
                style={{
                  maxWidth: "100%",
                  maxHeight: "350px",
                  objectFit: "contain",
                }}
              />

            </div>

          ) : (

            <div className="complaint-image-placeholder">

              <div>
                🖥️
              </div>

              <strong>
                No Complaint Image
              </strong>

              <p>
                No image was uploaded with this complaint.
              </p>

            </div>

          )}

        </section>

        {/* Status Update */}
        <section className="technician-detail-card status-update-card">

          <div className="detail-card-title">

            <div>

              <h2>Update Ticket Status</h2>

              <span>
                Select the current progress of this complaint.
              </span>

            </div>

          </div>

          <div className="status-buttons">

            {/* Assigned */}
            <button
              type="button"
              className={
                status === "Assigned"
                  ? "status-action active"
                  : "status-action"
              }
              disabled={savingResolution}
              onClick={() => selectStatus("Assigned")}
            >
              📋 Assigned
            </button>

            {/* In Progress */}
            <button
              type="button"
              className={
                status === "In Progress"
                  ? "status-action active"
                  : "status-action"
              }
              disabled={savingResolution}
              onClick={() => selectStatus("In Progress")}
            >
              🔧 In Progress
            </button>

            {/* Resolved */}
            <button
              type="button"
              className={
                status === "Resolved"
                  ? "status-action resolved-active"
                  : "status-action"
              }
              disabled={savingResolution}
              onClick={() => selectStatus("Resolved")}
            >
              ✅ Resolved
            </button>

          </div>

        </section>

        {/* Resolution Details */}
        <section className="technician-detail-card resolution-card">

          <div className="detail-card-title">

            <div>

              <h2>Resolution Details</h2>

              <span>
                Describe how the complaint was resolved.
              </span>

            </div>

          </div>

          <textarea
            placeholder="Example: Monitor cable was replaced and the computer display is now working properly."
            value={resolution}
            onChange={(e) =>
              setResolution(e.target.value)
            }
          />

          <div className="resolution-actions">

            <button
              type="button"
              className="save-resolution-btn"
              onClick={saveResolution}
              disabled={savingResolution}
            >
              {savingResolution
                ? "Saving..."
                : "✅ Save Resolution"}
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default TechnicianTicketDetails;