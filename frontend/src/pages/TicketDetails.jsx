import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config";
import UserSidebar from "../components/UserSidebar";

function TicketDetails() {
  const { ticketId } = useParams();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login to view ticket details.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tickets/${ticketId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load ticket.");
        return;
      }

      setTicket(data.ticket);

    } catch (error) {
      setError(
        "Cannot connect to server. Make sure Flask backend is running."
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
        month: "long",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
      status === "Assigned" ||
      status === "In Progress"
    ) {
      return "progress";
    }

    if (status === "Resolved") {
      return "resolved";
    }

    return "pending";
  };

  const getTimelineClass = (step) => {
    if (!ticket) return "";

    const statusOrder = [
      "Submitted",
      "Assigned",
      "In Progress",
      "Resolved",
    ];

    const currentIndex = statusOrder.indexOf(ticket.status);
    const stepIndex = statusOrder.indexOf(step);

    if (currentIndex >= stepIndex) {
      return "completed";
    }

    return "";
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <UserSidebar />
        <main className="dashboard-main">
          <p>Loading ticket details...</p>
        </main>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="dashboard-page">
        <UserSidebar />
        <main className="dashboard-main">
          <div className="auth-error">
            {error || "Ticket not found."}
          </div>

          <Link to="/my-tickets" className="back-link">
            ← Back to My Tickets
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <main className="dashboard-main">

        <div className="details-header">

          <div>

            <Link
              to="/my-tickets"
              className="back-link"
            >
              ← Back to My Tickets
            </Link>

            <p className="dashboard-label">
              TICKET DETAILS
            </p>

            <h1>
              #{ticket.ticket_id}
            </h1>

            <p>
              Complete information about your maintenance complaint.
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


        <div className="details-grid">

          {/* Main Ticket Information */}
          <section className="details-card">

            <h2>Complaint Information</h2>

            <div className="detail-item">
              <span>Category</span>
              <strong>{ticket.category}</strong>
            </div>

            <div className="detail-item">
              <span>Location</span>
              <strong>{ticket.location}</strong>
            </div>

            <div className="detail-item">
              <span>Priority</span>

              <strong>
                {ticket.priority === "High" && "🔴 "}
                {ticket.priority === "Medium" && "🟡 "}
                {ticket.priority === "Low" && "🟢 "}
                {ticket.priority}
              </strong>

            </div>

            <div className="detail-item">
              <span>Submitted On</span>

              <strong>
                {formatDate(ticket.created_at)}
              </strong>
            </div>

            <div className="description-box">

              <span>Description</span>

              <p>
                {ticket.description}
              </p>

            </div>

          </section>


          {/* Assignment */}
          <section className="details-card">

            <h2>Assignment</h2>

            <div className="assignment-box">

              <div className="technician-icon">
                👨‍🔧
              </div>

              <div>

                <span>
                  Assigned Technician
                </span>

                <strong>
                  {ticket.technician_name ||
                    "Not Assigned"}
                </strong>

                <small>
                  {ticket.technician_name
                    ? "Technician assigned to this ticket"
                    : "Waiting for administrator assignment"}
                </small>

              </div>

            </div>

          </section>


          {/* Status Timeline */}
          <section className="details-card timeline-card">

            <h2>Ticket Status</h2>

            <div className="timeline">

              <div
                className={`timeline-item ${getTimelineClass(
                  "Submitted"
                )}`}
              >

                <div className="timeline-dot">
                  {getTimelineClass("Submitted")
                    ? "✓"
                    : "1"}
                </div>

                <div>

                  <h3>
                    Complaint Submitted
                  </h3>

                  <p>
                    {formatDateTime(ticket.created_at)}
                  </p>

                </div>

              </div>


              <div
                className={`timeline-item ${getTimelineClass(
                  "Assigned"
                )}`}
              >

                <div className="timeline-dot">
                  {getTimelineClass("Assigned")
                    ? "✓"
                    : "2"}
                </div>

                <div>

                  <h3>
                    Technician Assigned
                  </h3>

                  <p>
                    {ticket.technician_name
                      ? "Technician assigned"
                      : "Waiting for assignment"}
                  </p>

                </div>

              </div>


              <div
                className={`timeline-item ${getTimelineClass(
                  "In Progress"
                )}`}
              >

                <div className="timeline-dot">
                  {getTimelineClass("In Progress")
                    ? "✓"
                    : "3"}
                </div>

                <div>

                  <h3>
                    In Progress
                  </h3>

                  <p>
                    {ticket.status === "In Progress" ||
                    ticket.status === "Resolved"
                      ? "Maintenance work in progress"
                      : "Maintenance work will appear here"}
                  </p>

                </div>

              </div>


              <div
                className={`timeline-item ${getTimelineClass(
                  "Resolved"
                )}`}
              >

                <div className="timeline-dot">
                  {getTimelineClass("Resolved")
                    ? "✓"
                    : "4"}
                </div>

                <div>

                  <h3>
                    Resolved
                  </h3>

                  <p>
                    {ticket.status === "Resolved"
                      ? formatDateTime(ticket.updated_at)
                      : "Resolution details will appear here"}
                  </p>

                </div>

              </div>

            </div>

          </section>


          {/* Image */}
          <section className="details-card">

            <h2>Uploaded Image</h2>

            <div className="ticket-image-placeholder">

              🖼️

              <p>
                Complaint image
              </p>

              <small>
                {ticket.image_path
                  ? ticket.image_path
                  : "Uploaded image will appear here."}
              </small>

            </div>

          </section>


          {/* Resolution */}
          <section className="details-card resolution-card">

            <h2>Resolution Details</h2>

            {ticket.resolution_details ? (

              <div className="resolution-empty">

                <span>🔧</span>

                <h3>
                  Resolution Available
                </h3>

                <p>
                  {ticket.resolution_details}
                </p>

              </div>

            ) : (

              <div className="resolution-empty">

                <span>🔧</span>

                <h3>
                  Not Resolved Yet
                </h3>

                <p>
                  Resolution details will be added by the technician
                  after the maintenance work is completed.
                </p>

              </div>

            )}

          </section>

        </div>

      </main>

    </div>
  );
}

export default TicketDetails;