import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import AdminSidebar from "../components/AdminSidebar";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // FETCH USERS
  // ============================================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/users`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        setError(data.message || "Failed to load users.");
        return;
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error("Fetch users error:", error);

      setError(
        "Cannot connect to Flask backend. Make sure Flask backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchUsers();
  }, []);

  // ============================================================
  // FILTER USERS
  // ============================================================

  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      String(user.full_name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(user.email || "")
        .toLowerCase()
        .includes(searchText) ||
      String(user.department || "")
        .toLowerCase()
        .includes(searchText) ||
      String(user.role || "")
        .toLowerCase()
        .includes(searchText);

    const matchesRole =
      roleFilter === "All" ||
      String(user.role || "").toLowerCase() ===
        roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  // ============================================================
  // USER STATISTICS
  // ============================================================

  const totalUsers = users.length;

  const totalStudents = users.filter(
    (user) => user.role === "student"
  ).length;

  const totalFaculty = users.filter(
    (user) => user.role === "faculty"
  ).length;

  const totalTechnicians = users.filter(
    (user) => user.role === "technician"
  ).length;

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // ROLE CLASS
  // ============================================================

  const getRoleClass = (role) => {
    return String(role || "")
      .toLowerCase()
      .replaceAll(" ", "-");
  };

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
            <h1>Manage Users</h1>

            <p>
              View and manage registered students and faculty members.
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

        {/* ERROR */}

        {error && (
          <div className="notification-error">
            {error}
          </div>
        )}

        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <section className="stats-grid">

          <div className="stat-card">

            <span className="stat-icon">
              👥
            </span>

            <div>
              <h3>{totalUsers}</h3>
              <p>Total Users</p>
            </div>

          </div>

          <div className="stat-card">

            <span className="stat-icon">
              🎓
            </span>

            <div>
              <h3>{totalStudents}</h3>
              <p>Students</p>
            </div>

          </div>

          <div className="stat-card">

            <span className="stat-icon">
              👩‍🏫
            </span>

            <div>
              <h3>{totalFaculty}</h3>
              <p>Faculty</p>
            </div>

          </div>

          <div className="stat-card">

            <span className="stat-icon">
              👨‍🔧
            </span>

            <div>
              <h3>{totalTechnicians}</h3>
              <p>Technicians</p>
            </div>

          </div>

        </section>

        {/* ====================================================
            USERS SECTION
        ==================================================== */}

        <section className="manage-users-section">

          {/* TOOLBAR */}

          <div className="users-toolbar">

            <div>
              <h2>Registered Users</h2>

              <p>
                Manage student, faculty, technician and admin accounts.
              </p>
            </div>

            <div className="users-filter-controls">

              <input
                type="text"
                placeholder="🔎 Search users..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              <select
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(e.target.value)
                }
              >

                <option value="All">
                  All Roles
                </option>

                <option value="student">
                  Student
                </option>

                <option value="faculty">
                  Faculty
                </option>

                <option value="technician">
                  Technician
                </option>

                <option value="admin">
                  Admin
                </option>

              </select>

            </div>

          </div>

          {/* RESULTS COUNT */}

          {!loading && !error && (
            <div className="users-result-count">
              Showing{" "}
              <strong>{filteredUsers.length}</strong>{" "}
              of{" "}
              <strong>{users.length}</strong>{" "}
              users
            </div>
          )}

          {/* LOADING */}

          {loading && (
            <div className="users-loading">

              <div className="loading-spinner"></div>

              <p>
                Loading users...
              </p>

            </div>
          )}

          {/* USERS TABLE */}

          {!loading && !error && (

            <div className="users-table-wrapper">

              <table className="users-table">

                <thead>

                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Registered</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredUsers.map((user) => (

                    <tr key={user.id}>

                      {/* USER */}

                      <td>

                        <div className="user-name-cell">

                          <div className="user-avatar">
                            {user.full_name
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </div>

                          <div>

                            <strong>
                              {user.full_name ||
                                "Unknown User"}
                            </strong>

                            <small>
                              User ID: {user.id}
                            </small>

                          </div>

                        </div>

                      </td>

                      {/* EMAIL */}

                      <td>
                        {user.email || "-"}
                      </td>

                      {/* ROLE */}

                      <td>

                        <span
                          className={`role-badge ${getRoleClass(
                            user.role
                          )}`}
                        >
                          {user.role
                            ? user.role
                                .charAt(0)
                                .toUpperCase() +
                              user.role.slice(1)
                            : "Unknown"}
                        </span>

                      </td>

                      {/* DEPARTMENT */}

                      <td>
                        {user.department || "-"}
                      </td>

                      {/* REGISTERED */}

                      <td>
                        {formatDate(user.created_at)}
                      </td>

                    </tr>

                  ))}

                  {/* NO USERS */}

                  {filteredUsers.length === 0 && (

                    <tr>

                      <td
                        colSpan="5"
                        className="empty-users"
                      >

                        <div>

                          <span>👥</span>

                          <strong>
                            No users found
                          </strong>

                          <p>
                            Try changing your search
                            or role filter.
                          </p>

                        </div>

                      </td>

                    </tr>

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

export default ManageUsers;