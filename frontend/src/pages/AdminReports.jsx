import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { API_BASE_URL } from "../config";

function AdminReports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login as College Administrator.");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/reports`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.status === "success") {
          setReportData(data);
        } else {
          setError(data.detail || data.message || "Failed to load report analytics.");
        }
      } catch (err) {
        console.error("Reports fetch error:", err);
        setError("Unable to connect to backend server.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const categoryData = reportData?.category_data || [];
  const technicianData = reportData?.technician_data || [];
  const priorityData = reportData?.priority_data || { High: 0, Medium: 0, Low: 0 };
  const recentActivity = reportData?.recent_activity || [];
  const averageRating = reportData?.average_rating || 5.0;

  const totalTickets = categoryData.reduce((acc, c) => acc + (c.tickets || 0), 0);
  const totalResolved = technicianData.reduce((acc, t) => acc + (t.resolved || 0), 0);
  const resolutionRate = totalTickets > 0 ? Math.round((totalResolved / totalTickets) * 100) : 100;

  const maxCategoryTickets = Math.max(1, ...categoryData.map((item) => item.tickets));

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const collegeName = storedUser.college_name || "College Administration";

  return (
    <div className="dashboard-page">
      <AdminSidebar />

      <main className="dashboard-main">
        {/* HEADER */}
        <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="role-badge admin">🏛️ {collegeName}</span>
              <span style={{ color: "var(--cf-lime)", fontSize: "13px", fontWeight: "600" }}>• Institutional Analytics</span>
            </div>
            <h1>Campus Maintenance Analytics & Reports</h1>
            <p>
              Live performance metrics, technician workloads, and resolution tracking for {collegeName}.
            </p>
          </div>

          <button
            className="print-report-btn"
            onClick={() => window.print()}
            style={{
              padding: "10px 20px",
              background: "rgba(163, 230, 53, 0.12)",
              border: "1px solid var(--cf-lime)",
              color: "var(--cf-lime)",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            🖨️ Print / Export Report
          </button>
        </header>

        {error && <div className="notification-error" style={{ margin: "15px 0" }}>⚠️ {error}</div>}

        {/* 4 SUMMARY STAT CARDS */}
        <section className="report-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px", margin: "20px 0" }}>
          <div className="report-stat-card stat-card" style={{ padding: "20px" }}>
            <div className="report-stat-icon" style={{ fontSize: "28px" }}>🎫</div>
            <div>
              <h3>{totalTickets}</h3>
              <p>Total Complaints Logged</p>
            </div>
          </div>

          <div className="report-stat-card stat-card" style={{ padding: "20px" }}>
            <div className="report-stat-icon" style={{ fontSize: "28px" }}>⚡</div>
            <div>
              <h3>{resolutionRate}%</h3>
              <p>Overall Resolution Rate</p>
            </div>
          </div>

          <div className="report-stat-card stat-card" style={{ padding: "20px" }}>
            <div className="report-stat-icon" style={{ fontSize: "28px" }}>⭐</div>
            <div>
              <h3>{averageRating} / 5.0</h3>
              <p>Student / Faculty Rating</p>
            </div>
          </div>

          <div className="report-stat-card stat-card" style={{ padding: "20px" }}>
            <div className="report-stat-icon" style={{ fontSize: "28px" }}>👨‍🔧</div>
            <div>
              <h3>{technicianData.length}</h3>
              <p>Active Technicians</p>
            </div>
          </div>
        </section>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", color: "var(--cf-muted)" }}>
            Computing live reports from database...
          </div>
        ) : (
          <>
            {/* TWO COLUMN: CATEGORY TICKETS & TECHNICIAN PERFORMANCE */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", margin: "24px 0" }}>
              {/* Category Breakdown */}
              <section style={{ background: "var(--cf-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--cf-border)" }}>
                <h2 style={{ color: "#ffffff", margin: "0 0 6px 0", fontSize: "18px" }}>Complaints by Category</h2>
                <p style={{ color: "var(--cf-muted)", fontSize: "13px", margin: "0 0 20px 0" }}>Volume distribution across campus facilities</p>

                {categoryData.length === 0 ? (
                  <p style={{ color: "var(--cf-muted)" }}>No complaints recorded yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {categoryData.map((cat, idx) => {
                      const barWidth = Math.round((cat.tickets / maxCategoryTickets) * 100);
                      return (
                        <div key={idx}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                            <span style={{ color: "#ffffff", fontWeight: "600" }}>{cat.name}</span>
                            <span style={{ color: "var(--cf-lime)", fontWeight: "700" }}>
                              {cat.tickets} tickets
                            </span>
                          </div>
                          <div style={{ height: "10px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "5px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${Math.max(barWidth, 6)}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #1d4ed8, #60a5fa)",
                                borderRadius: "5px",
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Technician Resolution Leaderboard */}
              <section style={{ background: "var(--cf-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--cf-border)" }}>
                <h2 style={{ color: "#ffffff", margin: "0 0 6px 0", fontSize: "18px" }}>Technician Resolution Rate</h2>
                <p style={{ color: "var(--cf-muted)", fontSize: "13px", margin: "0 0 20px 0" }}>Dispatched vs completed work orders</p>

                {technicianData.length === 0 ? (
                  <p style={{ color: "var(--cf-muted)" }}>No technicians assigned yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {technicianData.map((tech, idx) => {
                      const totalAssigned = tech.assigned || 1;
                      const rate = Math.round(((tech.resolved || 0) / totalAssigned) * 100);
                      return (
                        <div key={idx} style={{ padding: "12px", background: "#05120a", borderRadius: "10px", border: "1px solid rgba(74, 222, 128, 0.15)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ color: "#ffffff" }}>{tech.name}</strong>
                            <span style={{ color: "var(--cf-lime)", fontWeight: "700" }}>
                              {tech.resolved} / {tech.assigned} ({rate}%)
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "12px", color: "var(--cf-muted)" }}>
                            <span>Resolved: {tech.resolved}</span>
                            <span>•</span>
                            <span>Pending: {tech.pending}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* RECENT MAINTENANCE ACTIVITY */}
            <section style={{ background: "var(--cf-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--cf-border)" }}>
              <h2 style={{ color: "#ffffff", margin: "0 0 6px 0", fontSize: "18px" }}>Recent Ticket Activity</h2>
              <p style={{ color: "var(--cf-muted)", fontSize: "13px", margin: "0 0 18px 0" }}>Real-time audit log of latest maintenance complaints</p>

              {recentActivity.length === 0 ? (
                <p style={{ color: "var(--cf-muted)" }}>No recent ticket logs.</p>
              ) : (
                <table className="users-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Problem Description</th>
                      <th>Current Status</th>
                      <th>Submission Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong style={{ color: "var(--cf-lime)", fontFamily: "monospace" }}>
                            #{item.ticket}
                          </strong>
                        </td>
                        <td style={{ color: "#ffffff" }}>{item.issue}</td>
                        <td>
                          <span
                            className={`status ${
                              item.status === "Resolved"
                                ? "resolved"
                                : item.status === "In Progress"
                                ? "progress"
                                : "pending"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td style={{ color: "var(--cf-muted)" }}>{item.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminReports;