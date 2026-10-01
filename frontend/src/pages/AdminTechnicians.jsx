import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import AdminSidebar from "../components/AdminSidebar";

function AdminTechnicians() {
  const [technicians, setTechnicians] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  // ============================================================
  // LOAD TECHNICIANS
  // ============================================================

  const loadTechnicians = async () => {
    try {
      setLoading(true);
      setError("");

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
        setError(data.message || "Failed to load technicians.");
        return;
      }

      setTechnicians(data.technicians || []);
    } catch (error) {
      setError("Cannot connect to Flask backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Admin login session not found.");
      setLoading(false);
      return;
    }

    loadTechnicians();
  }, []);

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredTechnicians = technicians.filter((technician) => {
    const searchText = search.toLowerCase();

    return (
      String(technician.full_name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(technician.email || "")
        .toLowerCase()
        .includes(searchText) ||
      String(technician.phone || "")
        .toLowerCase()
        .includes(searchText) ||
      String(technician.specialization || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="dashboard-main">

        {/* Header */}
        <header className="dashboard-header">

          <div>
            <h1>Technicians</h1>

            <p>
              Manage maintenance technicians and their details.
            </p>
          </div>

          <div className="admin-profile">

            <span>A</span>

            <div>
              <strong>Administrator</strong>
              <small>Admin</small>
            </div>

          </div>

        </header>

        {/* Statistics */}
        <section className="stats-grid">

          <div className="stat-card">

            <span className="stat-icon">
              👨‍🔧
            </span>

            <div>
              <h3>{technicians.length}</h3>
              <p>Total Technicians</p>
            </div>

          </div>

          <div className="stat-card">

            <span className="stat-icon">
              👤
            </span>

            <div>
              <h3>{technicians.length}</h3>
              <p>Available Technicians</p>
            </div>

          </div>

          <div className="stat-card">

            <span className="stat-icon">
              🔧
            </span>

            <div>
              <h3>—</h3>
              <p>Assigned Tickets</p>
            </div>

          </div>

          <div className="stat-card">

            <span className="stat-icon">
              📋
            </span>

            <div>
              <h3>{technicians.length}</h3>
              <p>Active Technicians</p>
            </div>

          </div>

        </section>

        {/* Technician Section */}
        <section className="admin-ticket-section">

          {/* Search */}
          <div className="ticket-filter-bar">

            <input
              type="text"
              placeholder="🔎 Search technician..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

          {/* Error */}
          {error && (
            <p style={{ color: "red", margin: "15px 0" }}>
              {error}
            </p>
          )}

          {/* Loading */}
          {loading ? (

            <p style={{ padding: "20px" }}>
              Loading technicians...
            </p>

          ) : (

            <div className="admin-ticket-table-wrapper">

              <table className="admin-ticket-table">

                <thead>

                  <tr>
                    <th>Technician</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Specialization</th>
                    <th>Role</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredTechnicians.length === 0 ? (

                    <tr>

                      <td
                        colSpan="5"
                        style={{ textAlign: "center" }}
                      >
                        No technicians found.
                      </td>

                    </tr>

                  ) : (

                    filteredTechnicians.map((technician) => (

                      <tr key={technician.id}>

                        <td>
                          <strong>
                            {technician.full_name}
                          </strong>
                        </td>

                        <td>
                          {technician.email || "—"}
                        </td>

                        <td>
                          {technician.phone || "—"}
                        </td>

                        <td>
                          {technician.specialization ||
                            "General Maintenance"}
                        </td>

                        <td>

                          <span className="status assigned">
                            Technician
                          </span>

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default AdminTechnicians;