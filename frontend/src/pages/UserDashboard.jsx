import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";
import { API_BASE_URL } from "../config";

function UserDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [currentUser, setCurrentUser] = useState(storedUser);
  const userName = currentUser.full_name || currentUser.name || "Campus Member";
  const userRole = currentUser.role || "student";
  const userDept = currentUser.department || "";

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchMyTickets = async () => {
      try {
        setLoading(true);
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/tickets/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok && data.status === "success") {
          setTickets(data.tickets || []);
        } else {
          setError(data.detail || data.message || "Failed to load tickets.");
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Unable to load latest tickets. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    };

    const fetchUserProfile = async () => {
      if (!token) return;
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
        // silent fallback
      }
    };

    fetchMyTickets();
    fetchUserProfile();
  }, []);

  // Compute live statistics dynamically from user's actual tickets
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter(
    (t) => t.status === "Submitted" || t.status === "Pending"
  ).length;
  const inProgressTickets = tickets.filter(
    (t) => t.status === "In Progress" || t.status === "Assigned"
  ).length;
  const resolvedTickets = tickets.filter(
    (t) => t.status === "Resolved" || t.status === "Closed"
  ).length;

  const recentTickets = tickets.slice(0, 5);

  const getStatusClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "resolved" || s === "closed") return "status resolved";
    if (s === "in progress" || s === "assigned") return "status progress";
    return "status pending";
  };

  const getPriorityClass = (priority) => {
    const p = String(priority || "").toLowerCase();
    if (p === "high" || p === "critical") return "priority-high";
    if (p === "medium") return "priority-medium";
    return "priority-low";
  };

  return (
    <div className="dashboard-page">
      <UserSidebar />

      <main className="dashboard-main">
        {/* HEADER */}
        <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
              <span className={`role-badge ${userRole}`} style={{ textTransform: "capitalize" }}>
                {userRole === "faculty" ? "👩‍🏫 Faculty Member" : "🎓 Student"}
              </span>
              {userDept && (
                <span style={{ color: "var(--cf-muted)", fontSize: "13px" }}>
                  • 🏛️ {userDept}
                </span>
              )}
              {currentUser.phone && (
                <span style={{ color: "var(--cf-muted)", fontSize: "13px" }}>
                  • 📞 {currentUser.phone}
                </span>
              )}
              {currentUser.student_or_emp_id && (
                <span style={{ color: "var(--cf-muted)", fontSize: "13px" }}>
                  • 🆔 {currentUser.student_or_emp_id}
                </span>
              )}
            </div>
            <h1>Welcome back, {userName.split(" ")[0]}! 👋</h1>
            <p>
              Manage, report, and track your campus maintenance requests in real-time.
            </p>
          </div>

          <Link to="/raise-complaint" className="dashboard-report-btn">
            + Report an Issue
          </Link>
        </div>

        {error && <div className="notification-error" style={{ margin: "15px 0" }}>⚠️ {error}</div>}

        {/* LIVE STATISTICS */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">🎫</div>
            <div>
              <h3>{totalTickets}</h3>
              <p>Total Raised</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div>
              <h3>{pendingTickets}</h3>
              <p>Under Review</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔧</div>
            <div>
              <h3>{inProgressTickets}</h3>
              <p>In Progress</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div>
              <h3>{resolvedTickets}</h3>
              <p>Resolved</p>
            </div>
          </div>
        </div>

        {/* RECENT TICKETS (DYNAMIC REAL DATA) */}
        <section className="recent-tickets">
          <div className="section-title-row">
            <div>
              <h2>Your Recent Complaints</h2>
              <p>Track progress, assigned technicians, and resolution details</p>
            </div>

            <Link to="/my-tickets" className="view-all-link" style={{ color: "var(--cf-lime)", textDecoration: "none", fontWeight: "600" }}>
              View All ({totalTickets}) →
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--cf-muted)" }}>
              Loading your tickets...
            </div>
          ) : recentTickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--cf-card)", borderRadius: "14px", border: "1px dashed var(--cf-border)" }}>
              <span style={{ fontSize: "40px" }}>🌱</span>
              <h3 style={{ color: "#ffffff", margin: "12px 0 6px 0" }}>No complaints reported yet</h3>
              <p style={{ color: "var(--cf-muted)", fontSize: "14px", marginBottom: "18px" }}>
                Found an issue with electricity, plumbing, furniture, or Wi-Fi? Report it to campus maintenance.
              </p>
              <Link to="/raise-complaint" className="btn-primary" style={{ display: "inline-block", padding: "10px 20px", textDecoration: "none" }}>
                + Raise Your First Complaint
              </Link>
            </div>
          ) : (
            <div className="ticket-table-wrapper" style={{ overflowX: "auto" }}>
              <table className="users-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Issue Summary</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <strong style={{ color: "var(--cf-lime)", fontFamily: "monospace" }}>
                          #{ticket.ticket_id}
                        </strong>
                      </td>
                      <td>
                        <span style={{ color: "#e2e8f0" }}>{ticket.category}</span>
                      </td>
                      <td style={{ color: "var(--cf-muted)" }}>{ticket.location}</td>
                      <td style={{ color: "#ffffff", maxWidth: "240px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ticket.description}
                      </td>
                      <td>
                        <span className={`priority ${getPriorityClass(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${getStatusClass(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/ticket/${ticket.ticket_id}`}
                          className="view-ticket-btn"
                          style={{
                            background: "rgba(163, 230, 53, 0.12)",
                            color: "var(--cf-lime)",
                            border: "1px solid var(--cf-lime)",
                            padding: "5px 12px",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* QUICK ACTIONS */}
        <section className="quick-actions" style={{ marginTop: "30px" }}>
          <h2>Quick Actions & Help</h2>

          <div className="quick-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            <Link to="/raise-complaint" className="quick-card" style={{ textDecoration: "none", color: "inherit", padding: "22px" }}>
              <span style={{ fontSize: "28px" }}>➕</span>
              <h3 style={{ color: "#ffffff", margin: "10px 0 6px 0" }}>Raise New Complaint</h3>
              <p style={{ color: "var(--cf-muted)", fontSize: "14px" }}>Report electrical, plumbing, lab, or hostel issues with photos.</p>
            </Link>

            <Link to="/my-tickets" className="quick-card" style={{ textDecoration: "none", color: "inherit", padding: "22px" }}>
              <span style={{ fontSize: "28px" }}>🎫</span>
              <h3 style={{ color: "#ffffff", margin: "10px 0 6px 0" }}>Track My Tickets</h3>
              <p style={{ color: "var(--cf-muted)", fontSize: "14px" }}>Check updates, technician notes, and provide feedback upon repair.</p>
            </Link>

            <Link to="/fixbot" className="quick-card" style={{ textDecoration: "none", color: "inherit", padding: "22px" }}>
              <span style={{ fontSize: "28px" }}>🤖</span>
              <h3 style={{ color: "var(--cf-lime)", margin: "10px 0 6px 0" }}>Chat with FixBot AI</h3>
              <p style={{ color: "var(--cf-muted)", fontSize: "14px" }}>Ask AI for emergency tips, resolution steps, or category advice.</p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;