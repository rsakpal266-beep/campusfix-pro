
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { API_BASE_URL } from "../config";

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login as College Administrator.");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
          throw new Error(
            data.detail ||
              data.message ||
              "Failed to load dashboard data."
          );
        }

        setDashboardData(data);
      } catch (err) {
        console.error("Admin Dashboard Error:", err);
        setError(err.message || "Failed to connect to backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const statistics = dashboardData?.statistics || {};
  const recentTickets = dashboardData?.recent_tickets || [];
  const categoryDistribution = dashboardData?.category_distribution || [];

  const getStatusClass = (status) => {
    const s = String(status || "").toLowerCase();

    if (s === "resolved" || s === "closed") {
      return "status resolved";
    }

    if (s === "in progress" || s === "assigned") {
      return "status progress";
    }

    return "status pending";
  };

  const getPriorityClass = (priority) => {
    const p = String(priority || "").toLowerCase();

    if (p === "high" || p === "critical") {
      return "priority-high";
    }

    if (p === "medium") {
      return "priority-medium";
    }

    return "priority-low";
  };

  const totalCatSum =
    categoryDistribution.reduce(
      (acc, category) => acc + (Number(category.count) || 0),
      0
    ) || 1;

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const collegeName =
    storedUser.college_name || "College Administration";

  return (
    <div className="dashboard-page">
      <AdminSidebar />

      <main className="dashboard-main">
        {/* HEADER */}
        <div
          className="admin-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                flexWrap: "wrap",
              }}
            >
              <span className="role-badge admin">
                🏛️ {collegeName}
              </span>

              <span
                style={{
                  color: "var(--cf-lime)",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                • System Live
              </span>
            </div>

            <h1>Campus Operations Dashboard</h1>

            <p>
              Overview of college maintenance complaints, technician
              dispatches, and user onboarding.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/manage-users"
              className="onboard-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              <span>➕</span> Onboard Member
            </Link>

            <Link
              to="/admin-tickets"
              className="dashboard-report-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              <span>🎫</span> View All Tickets
            </Link>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            className="notification-error"
            style={{ margin: "15px 0" }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* 6 KEY METRICS CARDS */}
        <section
          className="stats-grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          <div className="stat-card">
            <span className="stat-icon">📋</span>
            <div>
              <h3>{statistics.total_tickets ?? 0}</h3>
              <p>Total Complaints</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">⏳</span>
            <div>
              <h3>{statistics.pending ?? 0}</h3>
              <p>Pending / Unassigned</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">🔧</span>
            <div>
              <h3>{statistics.in_progress ?? 0}</h3>
              <p>In Progress</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div>
              <h3>{statistics.resolved ?? 0}</h3>
              <p>Resolved</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">👨‍🔧</span>
            <div>
              <h3>{statistics.total_technicians ?? 0}</h3>
              <p>Technicians</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div>
              <h3>{statistics.total_users ?? 0}</h3>
              <p>Total Members</p>
            </div>
          </div>
        </section>

        {/* RECENT TICKETS AND CATEGORY WORKLOAD */}
        <div
          className="admin-dashboard-bottom-grid"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: "24px",
            marginTop: "24px",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* RECENT CAMPUS COMPLAINTS */}
          <section
            className="admin-tickets-section"
            style={{
              background: "var(--cf-card)",
              padding: "24px",
              borderRadius: "16px",
              border: "1px solid var(--cf-border)",
              width: "100%",
              minWidth: 0,
              maxWidth: "100%",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                marginBottom: "18px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    color: "#ffffff",
                    margin: 0,
                    fontSize: "18px",
                  }}
                >
                  Recent Campus Complaints
                </h2>

                <p
                  style={{
                    color: "var(--cf-muted)",
                    fontSize: "13px",
                    margin: "4px 0 0",
                  }}
                >
                  Latest submissions across academic blocks and hostels
                </p>
              </div>

              <Link
                to="/admin-tickets"
                style={{
                  color: "var(--cf-lime)",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                }}
              >
                View All →
              </Link>
            </div>

            {loading ? (
              <p
                style={{
                  color: "var(--cf-muted)",
                  padding: "20px",
                }}
              >
                Loading tickets...
              </p>
            ) : recentTickets.length === 0 ? (
              <p
                style={{
                  color: "var(--cf-muted)",
                  padding: "20px",
                }}
              >
                No tickets recorded in the system.
              </p>
            ) : (
              <div style={{ width: "100%", overflowX: "auto" }}>
                <table
                  className="users-table"
                  style={{
                    width: "100%",
                    minWidth: "700px",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Reported By</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentTickets.map((ticket) => (
                      <tr key={ticket.id ?? ticket.ticket_id}>
                        <td>
                          <strong
                            style={{
                              color: "var(--cf-lime)",
                              fontFamily: "monospace",
                            }}
                          >
                            #{ticket.ticket_id}
                          </strong>
                        </td>

                        <td style={{ color: "#e2e8f0" }}>
                          {ticket.category}
                        </td>

                        <td style={{ color: "var(--cf-muted)" }}>
                          {ticket.location}
                        </td>

                        <td style={{ color: "#ffffff" }}>
                          {ticket.user_name}
                        </td>

                        <td>
                          <span
                            className={`priority ${getPriorityClass(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status ${getStatusClass(
                              ticket.status
                            )}`}
                          >
                            {ticket.status}
                          </span>
                        </td>

                        <td>
                          <Link
                            to="/admin-tickets"
                            style={{
                              background: "rgba(163, 230, 53, 0.12)",
                              color: "var(--cf-lime)",
                              border: "1px solid var(--cf-lime)",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              textDecoration: "none",
                              fontSize: "12px",
                              fontWeight: "600",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* CATEGORY WORKLOAD */}
          <section
            className="category-workload-card"
            style={{
              background: "var(--cf-card)",
              padding: "24px",
              borderRadius: "16px",
              border: "1px solid var(--cf-border)",
              width: "100%",
              minWidth: 0,
              maxWidth: "100%",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <h2
              style={{
                color: "#ffffff",
                margin: "0 0 4px",
                fontSize: "18px",
              }}
            >
              Category Workload
            </h2>

            <p
              style={{
                color: "var(--cf-muted)",
                fontSize: "13px",
                margin: "0 0 18px",
              }}
            >
              Live complaint volume by category
            </p>

            {categoryDistribution.length === 0 ? (
              <p style={{ color: "var(--cf-muted)" }}>
                No category statistics available.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  width: "100%",
                  minWidth: 0,
                }}
              >
                {categoryDistribution.map((cat, idx) => {
                  const count = Number(cat.count) || 0;
                  const pct = Math.round((count / totalCatSum) * 100);

                  return (
                    <div
                      key={
                        cat.category_id ??
                        cat.category ??
                        cat.name ??
                        idx
                      }
                      style={{
                        width: "100%",
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "6px",
                          fontSize: "13px",
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            color: "#ffffff",
                            minWidth: 0,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {cat.category ?? cat.name ?? "Other"}
                        </span>

                        <span
                          style={{
                            color: "var(--cf-muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {count} ({pct}%)
                        </span>
                      </div>

                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          background: "rgba(148, 163, 184, 0.18)",
                          borderRadius: "20px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background:
                              "linear-gradient(90deg, #2563eb, #60a5fa)",
                            borderRadius: "20px",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              style={{
                borderTop: "1px solid var(--cf-border)",
                marginTop: "20px",
                paddingTop: "16px",
              }}
            >
              <Link
                to="/manage-categories"
                style={{
                  color: "var(--cf-lime)",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                ⚙️ Manage Categories →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
