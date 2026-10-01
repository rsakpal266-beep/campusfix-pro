import React from "react";
import { Link } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";

function AdminReports() {
  const categoryData = [
    { name: "Electrical", tickets: 28 },
    { name: "Plumbing", tickets: 21 },
    { name: "Furniture", tickets: 18 },
    { name: "Cleaning", tickets: 15 },
    { name: "Internet / Network", tickets: 12 },
    { name: "Classroom Equipment", tickets: 10 },
  ];

  const technicianData = [
    {
      name: "Rahul Patil",
      assigned: 18,
      resolved: 14,
      pending: 4,
    },
    {
      name: "Ajay Sharma",
      assigned: 15,
      resolved: 11,
      pending: 4,
    },
    {
      name: "Priya Shah",
      assigned: 12,
      resolved: 9,
      pending: 3,
    },
  ];

  const recentActivity = [
    {
      ticket: "CF-1024",
      issue: "Water Leakage",
      status: "Pending",
      date: "19 Sep 2026",
    },
    {
      ticket: "CF-1023",
      issue: "Broken Fan",
      status: "In Progress",
      date: "19 Sep 2026",
    },
    {
      ticket: "CF-1022",
      issue: "Damaged Chair",
      status: "Resolved",
      date: "18 Sep 2026",
    },
    {
      ticket: "CF-1021",
      issue: "Network Problem",
      status: "Pending",
      date: "18 Sep 2026",
    },
  ];

  const maxCategoryTickets = Math.max(
    ...categoryData.map((item) => item.tickets)
  );

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="dashboard-main">

        {/* Header */}
        <header className="dashboard-header">

          <div>
            <h1>Reports & Analytics</h1>

            <p>
              Monitor campus maintenance performance and ticket activity.
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

        {/* Print Button */}
        <div className="reports-actions">

          <button
            className="print-report-btn"
            onClick={() => window.print()}
          >
            🖨️ Print Report
          </button>

        </div>

        {/* Statistics */}
        <section className="report-stats-grid">

          <div className="report-stat-card">
            <div className="report-stat-icon">
              🎫
            </div>

            <div>
              <h3>128</h3>
              <p>Total Tickets</p>
            </div>
          </div>

          <div className="report-stat-card">
            <div className="report-stat-icon">
              ⏳
            </div>

            <div>
              <h3>24</h3>
              <p>Pending Tickets</p>
            </div>
          </div>

          <div className="report-stat-card">
            <div className="report-stat-icon">
              🔧
            </div>

            <div>
              <h3>31</h3>
              <p>In Progress</p>
            </div>
          </div>

          <div className="report-stat-card">
            <div className="report-stat-icon">
              ✅
            </div>

            <div>
              <h3>73</h3>
              <p>Resolved Tickets</p>
            </div>
          </div>

        </section>

        {/* Reports Grid */}
        <section className="reports-grid">

          {/* Category Report */}
          <div className="report-card">

            <div className="report-card-header">
              <div>
                <h2>Complaints by Category</h2>
                <p>Number of tickets in each category.</p>
              </div>

              <span className="report-card-icon">
                📂
              </span>
            </div>

            <div className="category-report-list">

              {categoryData.map((category) => (

                <div
                  className="category-report-row"
                  key={category.name}
                >

                  <div className="category-report-info">

                    <span>
                      {category.name}
                    </span>

                    <strong>
                      {category.tickets}
                    </strong>

                  </div>

                  <div className="category-progress">
                    <div
                      className="category-progress-fill"
                      style={{
                        width: `${
                          (category.tickets /
                            maxCategoryTickets) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* Ticket Status Report */}
          <div className="report-card">

            <div className="report-card-header">

              <div>
                <h2>Ticket Status</h2>
                <p>Current ticket distribution.</p>
              </div>

              <span className="report-card-icon">
                📊
              </span>

            </div>

            <div className="status-report">

              <div className="status-report-item">
                <span className="status-circle pending-circle"></span>

                <div>
                  <strong>24</strong>
                  <span>Pending</span>
                </div>
              </div>

              <div className="status-report-item">
                <span className="status-circle progress-circle"></span>

                <div>
                  <strong>31</strong>
                  <span>In Progress</span>
                </div>
              </div>

              <div className="status-report-item">
                <span className="status-circle resolved-circle"></span>

                <div>
                  <strong>73</strong>
                  <span>Resolved</span>
                </div>
              </div>

            </div>

            <div className="status-total">
              <strong>128</strong>
              <span>Total Tickets</span>
            </div>

          </div>

        </section>

        {/* Technician Workload */}
        <section className="report-card technician-report-card">

          <div className="report-card-header">

            <div>
              <h2>Technician Workload</h2>

              <p>
                Assigned and resolved tickets by technician.
              </p>
            </div>

            <span className="report-card-icon">
              👨‍🔧
            </span>

          </div>

          <div className="technician-table-wrapper">

            <table className="technician-report-table">

              <thead>
                <tr>
                  <th>Technician</th>
                  <th>Assigned</th>
                  <th>Resolved</th>
                  <th>Pending</th>
                </tr>
              </thead>

              <tbody>

                {technicianData.map((technician) => (

                  <tr key={technician.name}>

                    <td>
                      <div className="technician-name">
                        <div className="technician-avatar">
                          {technician.name.charAt(0)}
                        </div>

                        <strong>
                          {technician.name}
                        </strong>
                      </div>
                    </td>

                    <td>
                      {technician.assigned}
                    </td>

                    <td>
                      <span className="resolved-number">
                        {technician.resolved}
                      </span>
                    </td>

                    <td>
                      <span className="pending-number">
                        {technician.pending}
                      </span>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </section>

        {/* Recent Activity */}
        <section className="report-card recent-activity-card">

          <div className="report-card-header">

            <div>
              <h2>Recent Ticket Activity</h2>

              <p>
                Latest maintenance ticket updates.
              </p>
            </div>

            <span className="report-card-icon">
              🕒
            </span>

          </div>

          <div className="recent-activity-list">

            {recentActivity.map((activity) => (

              <div
                className="recent-activity-row"
                key={activity.ticket}
              >

                <div>
                  <strong>
                    #{activity.ticket}
                  </strong>

                  <span>
                    {activity.issue}
                  </span>
                </div>

                <span
                  className={`status ${activity.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {activity.status}
                </span>

                <span className="activity-date">
                  {activity.date}
                </span>

              </div>

            ))}

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminReports;