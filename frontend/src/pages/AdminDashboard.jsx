import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { API_BASE_URL } from "../config";

function AdminDashboard() {

  // ============================================================
  // DASHBOARD DATA
  // ============================================================

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ============================================================
  // FETCH ADMIN DASHBOARD DATA
  // ============================================================

  useEffect(() => {

    const fetchDashboard = async () => {

      try {

        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login as administrator.");
          setLoading(false);
          return;
        }


        const response = await fetch(
          `${API_BASE_URL}/api/admin/dashboard`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );


        const data = await response.json();


        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load dashboard."
          );
        }


        setDashboardData(data);

      } catch (err) {

        console.error("Admin Dashboard Error:", err);

        setError(err.message);

      } finally {

        setLoading(false);

      }

    };


    fetchDashboard();

  }, []);


  // ============================================================
  // DASHBOARD VALUES
  // ============================================================

  const statistics = dashboardData?.statistics || {};

  const recentTickets =
    dashboardData?.recent_tickets || [];


  // ============================================================
  // FORMAT STATUS
  // ============================================================

  const getStatusClass = (status) => {

    if (status === "Resolved") {
      return "status resolved";
    }

    if (status === "In Progress") {
      return "status progress";
    }

    if (status === "Assigned") {
      return "status progress";
    }

    return "status pending";

  };


  // ============================================================
  // FORMAT PRIORITY
  // ============================================================

  const getPriorityClass = (priority) => {

    if (priority === "High") {
      return "priority-high";
    }

    if (priority === "Medium") {
      return "priority-medium";
    }

    return "priority-low";

  };

  return (

    <div className="dashboard-page">

      <AdminSidebar />

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="dashboard-main">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-header">


          <div>

            <p className="dashboard-label">
              ADMINISTRATION
            </p>


            <h1>
              Admin Dashboard
            </h1>


            <p>
              Manage campus maintenance complaints and monitor
              their resolution.
            </p>

          </div>



          {/* Admin Profile */}

          <div className="admin-profile">

            <span className="admin-initial">
              A
            </span>


            <div>

              <strong>
                Administrator
              </strong>


              <small>
                Admin
              </small>

            </div>

          </div>


        </div>



        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (

          <div
            style={{
              background: "#3a1820",
              color: "#ff9aa9",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "20px"
            }}
          >
            ⚠️ {error}
          </div>

        )}



        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="dashboard-stats admin-stats">


          {/* Total Tickets */}

          <div className="stat-card">

            <div className="stat-icon">
              🎫
            </div>


            <div>

              <h3>

                {loading
                  ? "..."
                  : statistics.total_tickets ?? 0}

              </h3>


              <p>
                Total Tickets
              </p>

            </div>

          </div>



          {/* Pending */}

          <div className="stat-card">

            <div className="stat-icon">
              ⏳
            </div>


            <div>

              <h3>

                {loading
                  ? "..."
                  : statistics.pending ?? 0}

              </h3>


              <p>
                Pending
              </p>

            </div>

          </div>



          {/* In Progress */}

          <div className="stat-card">

            <div className="stat-icon">
              🔧
            </div>


            <div>

              <h3>

                {loading
                  ? "..."
                  : statistics.in_progress ?? 0}

              </h3>


              <p>
                In Progress
              </p>

            </div>

          </div>



          {/* Resolved */}

          <div className="stat-card">

            <div className="stat-icon">
              ✅
            </div>


            <div>

              <h3>

                {loading
                  ? "..."
                  : statistics.resolved ?? 0}

              </h3>


              <p>
                Resolved
              </p>

            </div>

          </div>


        </div>



        {/* =================================================
            RECENT TICKETS
        ================================================= */}

        <section className="admin-section">


          <div className="admin-section-header">

            <div>

              <h2>
                Recent Tickets
              </h2>


              <p>
                Latest maintenance complaints submitted by users.
              </p>

            </div>


            <Link to="/admin-tickets">
              View All →
            </Link>

          </div>



          <div className="admin-table">


            {/* Table Header */}

            <div className="admin-table-row admin-table-heading">

              <span>
                Ticket ID
              </span>

              <span>
                Issue
              </span>

              <span>
                Priority
              </span>

              <span>
                Technician
              </span>

              <span>
                Status
              </span>

            </div>



            {/* Loading */}

            {loading && (

              <div
                className="admin-table-row"
                style={{
                  justifyContent: "center"
                }}
              >

                <span>
                  Loading tickets...
                </span>

              </div>

            )}



            {/* No Tickets */}

            {!loading && recentTickets.length === 0 && (

              <div
                className="admin-table-row"
                style={{
                  justifyContent: "center"
                }}
              >

                <span>
                  No tickets found.
                </span>

              </div>

            )}



            {/* Real Tickets */}

            {!loading &&
              recentTickets.map((ticket) => (

                <div
                  className="admin-table-row"
                  key={ticket.ticket_id}
                >


                  <span>
                    #{ticket.ticket_id}
                  </span>


                  <span>
                    {ticket.category || "Maintenance Issue"}
                  </span>


                  <span
                    className={getPriorityClass(
                      ticket.priority
                    )}
                  >
                    {ticket.priority}
                  </span>


                  <span>
                    {ticket.technician_name ||
                      "Not Assigned"}
                  </span>


                  <span
                    className={getStatusClass(
                      ticket.status
                    )}
                  >
                    {ticket.status}
                  </span>


                </div>

              ))}


          </div>

        </section>



        {/* =================================================
            SYSTEM OVERVIEW
        ================================================= */}

        <section className="admin-overview-section">


          {/* Users */}

          <div className="admin-overview-card">

            <div className="overview-icon">
              👥
            </div>


            <div>

              <h3>
                User Management
              </h3>


              <p>
                Manage students, faculty and maintenance staff accounts.
              </p>

            </div>


            <Link to="/manage-users">
              Manage Users →
            </Link>

          </div>



          {/* Technicians */}

          <div className="admin-overview-card">

            <div className="overview-icon">
              👨‍🔧
            </div>


            <div>

              <h3>
                Technician Management
              </h3>


              <p>
                Manage technicians and monitor their assigned work.
              </p>

            </div>


            <Link to="/admin-technicians">
              View Technicians →
            </Link>

          </div>



          {/* Reports */}

          <div className="admin-overview-card">

            <div className="overview-icon">
              📊
            </div>


            <div>

              <h3>
                Reports & Analytics
              </h3>


              <p>
                View ticket statistics and campus maintenance reports.
              </p>

            </div>


            <Link to="/admin-reports">
              View Reports →
            </Link>

          </div>


        </section>



        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="admin-quick-section">


          <h2>
            Quick Actions
          </h2>


          <div className="admin-quick-grid">


            {/* Manage Tickets */}

            <Link
              to="/admin-tickets"
              className="admin-action-card"
            >

              <span>
                🎫
              </span>


              <h3>
                Manage Tickets
              </h3>


              <p>
                View, assign and update maintenance tickets.
              </p>

            </Link>



            {/* Manage Users */}

            <Link
              to="/manage-users"
              className="admin-action-card"
            >

              <span>
                👥
              </span>


              <h3>
                Manage Users
              </h3>


              <p>
                View and manage student, faculty and technician accounts.
              </p>

            </Link>



            {/* Categories */}

            <Link
              to="/manage-categories"
              className="admin-action-card"
            >

              <span>
                🏷️
              </span>


              <h3>
                Manage Categories
              </h3>


              <p>
                Add and manage campus maintenance categories.
              </p>

            </Link>



            {/* Reports */}

            <Link
              to="/admin-reports"
              className="admin-action-card"
            >

              <span>
                📈
              </span>


              <h3>
                Generate Reports
              </h3>


              <p>
                View maintenance statistics and reports.
              </p>

            </Link>


          </div>

        </section>


      </main>

    </div>

  );
}

export default AdminDashboard;