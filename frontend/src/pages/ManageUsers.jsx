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
  const [successMsg, setSuccessMsg] = useState("");

  // Current logged in admin info
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const collegeName = storedUser.college_name || "College Administration";

  // Modal State for Onboarding New User
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Modal State for Resetting Password
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  // New User Form State
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "student",
    department: "",
    phone: "",
    specialization: "",
    student_or_emp_id: "",
  });

  // Credential Share Modal State (Shown immediately after creation or reset)
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  // ============================================================
  // FETCH USERS
  // ============================================================
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login as College Administrator.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        setError(data.detail || data.message || "Failed to load users.");
        return;
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError("Cannot connect to backend server. Ensure FastAPI is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Generate random secure password
  const generatePassword = (setter) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (setter) {
      setter(pwd);
    } else {
      setFormData((prev) => ({ ...prev, password: pwd }));
    }
  };

  // Open modal with pre-selected role
  const handleOpenAddModal = (presetRole = "student") => {
    setFormData({
      full_name: "",
      email: "",
      password: "",
      role: presetRole,
      department: "",
      phone: "",
      specialization: "",
      student_or_emp_id: "",
    });
    setCreateError("");
    setShowCreateModal(true);
    generatePassword();
  };

  // Handle User Creation
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError("");

    if (!formData.full_name || !formData.email || !formData.password || !formData.role) {
      setCreateError("Full name, email, password, and role are required.");
      return;
    }

    try {
      setCreateLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          college_name: collegeName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.detail || data.message || "Failed to create user account.");
        return;
      }

      // Show shareable credentials
      setCreatedCredentials(data.credentials);
      setShowCreateModal(false);
      setSuccessMsg(`Account created for ${formData.full_name} (${formData.role.toUpperCase()})! Share credentials below.`);

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        password: "",
        role: "student",
        department: "",
        phone: "",
        specialization: "",
        student_or_emp_id: "",
      });

      // Refresh table
      fetchUsers();
    } catch (err) {
      console.error("Create user error:", err);
      setCreateError("Network error while creating account.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Password Reset by Admin
  const handleOpenResetModal = (user) => {
    setResetModalUser(user);
    setResetError("");
    generatePassword(setNewPasswordInput);
  };

  const handleExecuteResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setResetError("");

    if (!newPasswordInput || newPasswordInput.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }

    try {
      setResetLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/admin/users/${resetModalUser.id}/reset-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          new_password: newPasswordInput,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResetError(data.detail || data.message || "Failed to reset password.");
        return;
      }

      setResetModalUser(null);
      setCreatedCredentials(data.credentials);
      setSuccessMsg(`Password successfully reset for ${resetModalUser.full_name}!`);
    } catch (err) {
      console.error("Reset password error:", err);
      setResetError("Network error while updating password.");
    } finally {
      setResetLoading(false);
    }
  };

  // Handle User Status Toggle
  const handleToggleStatus = async (user) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}/toggle-status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || data.message || "Failed to toggle status.");
        return;
      }

      setSuccessMsg(data.message);
      fetchUsers();
    } catch (err) {
      console.error("Toggle status error:", err);
    }
  };

  // Handle User Deletion
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.full_name} (${user.role})?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || data.message || "Failed to delete user.");
        return;
      }

      setSuccessMsg(`User ${user.full_name} was deleted successfully.`);
      fetchUsers();
    } catch (err) {
      console.error("Delete user error:", err);
    }
  };

  // Copy Credentials to Clipboard
  const copyCredentials = () => {
    if (!createdCredentials) return;
    const textToCopy =
      createdCredentials.share_message ||
      `🏛️ ${collegeName} — CampusFix Pro Account:\nRole: ${createdCredentials.role}\nName: ${createdCredentials.full_name}\nLogin Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nPortal URL: ${window.location.origin}/login`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  // ============================================================
  // FILTER USERS
  // ============================================================
  const filteredUsers = users.filter((user) => {
    // Defense-in-depth: Never show accounts from other colleges
    if (
      storedUser.college_name &&
      user.college_name &&
      user.college_name.trim().toLowerCase() !== storedUser.college_name.trim().toLowerCase()
    ) {
      return false;
    }

    const searchText = search.toLowerCase().trim();
    const matchesSearch =
      String(user.full_name || "").toLowerCase().includes(searchText) ||
      String(user.email || "").toLowerCase().includes(searchText) ||
      String(user.department || "").toLowerCase().includes(searchText) ||
      String(user.role || "").toLowerCase().includes(searchText) ||
      String(user.student_or_emp_id || "").toLowerCase().includes(searchText);

    const matchesRole =
      roleFilter === "All" ||
      String(user.role || "").toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const totalStudents = users.filter((u) => u.role === "student").length;
  const totalFaculty = users.filter((u) => u.role === "faculty").length;
  const totalTechnicians = users.filter((u) => u.role === "technician").length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="dashboard-page">
      <AdminSidebar />

      <main className="dashboard-main">
        {/* HEADER */}
        <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="role-badge admin">🏛️ {collegeName}</span>
              <span style={{ color: "var(--cf-lime)", fontSize: "13px", fontWeight: "600" }}>• Institutional Console</span>
            </div>
            <h1>Campus User Provisioning</h1>
            <p>
              Add Technicians, Students, and Faculty with their email and password, provide credentials, and manage accounts.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => handleOpenAddModal("technician")}
              className="onboard-btn"
              style={{
                background: "rgba(163, 230, 53, 0.15)",
                border: "1px solid var(--cf-lime)",
                color: "var(--cf-lime)",
                padding: "10px 16px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                borderRadius: "8px",
              }}
            >
              <span>🛠️</span> + Add Technician
            </button>

            <button
              onClick={() => handleOpenAddModal("faculty")}
              className="onboard-btn"
              style={{
                background: "rgba(163, 230, 53, 0.15)",
                border: "1px solid var(--cf-lime)",
                color: "var(--cf-lime)",
                padding: "10px 16px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                borderRadius: "8px",
              }}
            >
              <span>👩‍🏫</span> + Add Faculty
            </button>

            <button
              onClick={() => handleOpenAddModal("student")}
              className="onboard-btn"
              style={{
                background: "rgba(163, 230, 53, 0.15)",
                border: "1px solid var(--cf-lime)",
                color: "var(--cf-lime)",
                padding: "10px 16px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                borderRadius: "8px",
              }}
            >
              <span>🎓</span> + Add Student
            </button>

            <button
              onClick={() => handleOpenAddModal("student")}
              className="onboard-btn"
              style={{ padding: "10px 20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span>➕</span> Onboard Member
            </button>
          </div>
        </header>

        {error && <div className="notification-error" style={{ margin: "15px 0" }}>⚠️ {error}</div>}
        {successMsg && (
          <div
            className="notification-success"
            style={{
              background: "rgba(163, 230, 53, 0.15)",
              border: "1px solid var(--cf-lime)",
              color: "var(--cf-lime)",
              padding: "12px 18px",
              borderRadius: "10px",
              margin: "15px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>✅ {successMsg}</span>
            <button
              onClick={() => setSuccessMsg("")}
              style={{ background: "none", border: "none", color: "var(--cf-lime)", cursor: "pointer", fontSize: "16px" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* STATISTICS */}
        <section className="stats-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div>
              <h3>{totalUsers}</h3>
              <p>Total Members</p>
            </div>
          </div>

          <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setRoleFilter("technician")}>
            <span className="stat-icon">🛠️</span>
            <div>
              <h3>{totalTechnicians}</h3>
              <p>Technicians</p>
            </div>
          </div>

          <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setRoleFilter("faculty")}>
            <span className="stat-icon">👩‍🏫</span>
            <div>
              <h3>{totalFaculty}</h3>
              <p>Faculty Members</p>
            </div>
          </div>

          <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setRoleFilter("student")}>
            <span className="stat-icon">🎓</span>
            <div>
              <h3>{totalStudents}</h3>
              <p>Students</p>
            </div>
          </div>

          <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setRoleFilter("admin")}>
            <span className="stat-icon">👑</span>
            <div>
              <h3>{totalAdmins}</h3>
              <p>College Admins</p>
            </div>
          </div>
        </section>

        {/* USERS TABLE SECTION */}
        <section className="manage-users-section">
          <div className="users-toolbar">
            <div>
              <h2>Registered Campus Members</h2>
              <p>These accounts are provisioned by your college. Use Actions to reset passwords or manage access.</p>
            </div>

            <div className="users-filter-controls">
              <input
                type="text"
                placeholder="🔎 Search by name, email, department, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="All">All Roles ({totalUsers})</option>
                <option value="technician">🛠️ Technicians ({totalTechnicians})</option>
                <option value="student">🎓 Students ({totalStudents})</option>
                <option value="faculty">👩‍🏫 Faculty ({totalFaculty})</option>
                <option value="admin">👑 Administrators ({totalAdmins})</option>
              </select>
            </div>
          </div>

          {!loading && (
            <div className="users-result-count" style={{ color: "var(--cf-muted)", margin: "10px 0" }}>
              Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> campus accounts
            </div>
          )}

          {loading ? (
            <div className="users-loading" style={{ padding: "40px", textAlign: "center" }}>
              <div className="loading-spinner"></div>
              <p>Loading campus members...</p>
            </div>
          ) : (
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User & ID</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Department / Specialization</th>
                    <th>Contact Phone</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-name-cell">
                          <div
                            className="user-avatar"
                            style={{
                              background: "rgba(163, 230, 53, 0.15)",
                              color: "var(--cf-lime)",
                              border: "1px solid var(--cf-lime)",
                            }}
                          >
                            {user.full_name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <strong style={{ color: "#ffffff" }}>{user.full_name || "Unknown User"}</strong>
                            <small style={{ color: "var(--cf-muted)", display: "block" }}>
                              {user.student_or_emp_id ? `ID: ${user.student_or_emp_id}` : `DB #${user.id}`}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td style={{ color: "#e2e8f0" }}>{user.email || "-"}</td>

                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === "admin" && "👑 Admin"}
                          {user.role === "technician" && "🛠️ Tech"}
                          {user.role === "faculty" && "👩‍🏫 Faculty"}
                          {user.role === "student" && "🎓 Student"}
                        </span>
                      </td>

                      <td>
                        <span style={{ color: "#ffffff" }}>{user.department || "-"}</span>
                        {user.specialization && (
                          <small style={{ display: "block", color: "var(--cf-muted)" }}>
                            ({user.specialization})
                          </small>
                        )}
                      </td>

                      <td style={{ color: "var(--cf-muted)" }}>{user.phone || "-"}</td>

                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: user.is_active ? "rgba(163, 230, 53, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            color: user.is_active ? "var(--cf-lime)" : "#f87171",
                            border: `1px solid ${user.is_active ? "var(--cf-lime)" : "#ef4444"}`,
                          }}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        {user.role === "admin" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              background: "rgba(163, 230, 53, 0.1)",
                              color: "var(--cf-lime)",
                              border: "1px solid rgba(163, 230, 53, 0.3)",
                            }}
                          >
                            👑 {user.id === storedUser.id ? "Primary Admin (You)" : "College Admin"}
                          </span>
                        ) : (
                          <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                            {/* Reset Password */}
                            <button
                              onClick={() => handleOpenResetModal(user)}
                              title="Reset password and provide new login credentials"
                              style={{
                                background: "rgba(163, 230, 53, 0.12)",
                                border: "1px solid var(--cf-lime)",
                                color: "var(--cf-lime)",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              🔑 Pass
                            </button>

                            {/* Toggle Active Status */}
                            <button
                              onClick={() => handleToggleStatus(user)}
                              title={user.is_active ? "Deactivate account" : "Activate account"}
                              style={{
                                background: user.is_active ? "rgba(234, 179, 8, 0.15)" : "rgba(163, 230, 53, 0.15)",
                                border: `1px solid ${user.is_active ? "#eab308" : "var(--cf-lime)"}`,
                                color: user.is_active ? "#fde047" : "var(--cf-lime)",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              {user.is_active ? "⏸️" : "▶️"}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteUser(user)}
                              title="Delete member account"
                              style={{
                                background: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid #ef4444",
                                color: "#f87171",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="empty-users" style={{ textAlign: "center", padding: "40px" }}>
                        <div>
                          <span style={{ fontSize: "36px" }}>👥</span>
                          <strong style={{ display: "block", margin: "10px 0" }}>No members match your criteria</strong>
                          <p style={{ color: "var(--cf-muted)" }}>Try adjusting your search query or role filter.</p>
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

      {/* ============================================================
          MODAL 1: CREATE & ONBOARD USER
      ============================================================ */}
      {showCreateModal && (
        <div className="credentials-modal-overlay">
          <div className="credentials-modal" style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--cf-border)", paddingBottom: "15px" }}>
              <h2 style={{ margin: 0, color: "var(--cf-lime)", display: "flex", alignItems: "center", gap: "10px" }}>
                <span>🛡️</span> Add Member to {collegeName}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "20px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: "var(--cf-muted)", fontSize: "14px", margin: "12px 0 16px 0" }}>
              Create an account for a <strong>Technician</strong>, <strong>Student</strong>, or <strong>Faculty</strong>.
              Enter their email and set a password. After creating, you will get a copyable credentials card to share with them so they can log in.
            </p>

            {createError && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#fca5a5", padding: "10px", borderRadius: "8px", marginBottom: "15px", fontSize: "13px" }}>
                ⚠️ {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {/* Role */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)" }}>
                    Account Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: "100%", padding: "10px", background: "#05120a", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px" }}
                  >
                    <option value="technician">🛠️ Campus Technician (Works on repair orders, logs status)</option>
                    <option value="student">🎓 Student (Raises issues, tracks ticket status, FixBot AI)</option>
                    <option value="faculty">👩‍🏫 Faculty Member (Lab & departmental issues, priority alerts)</option>
                    <option value="admin">👑 Secondary College Admin (System oversight, assignments)</option>
                  </select>
                </div>

                {/* Full Name */}
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px", background: "#05120a", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px" }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)" }}>
                    Login Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px", background: "#05120a", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px" }}
                  />
                </div>

                {/* Password with generator */}
                <div style={{ gridColumn: "span 2" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "13px", color: "var(--cf-muted)" }}>
                      Assigned Password (to provide user for login) *
                    </label>
                    <button
                      type="button"
                      onClick={() => generatePassword()}
                      style={{ background: "rgba(163, 230, 53, 0.15)", border: "1px solid var(--cf-lime)", color: "var(--cf-lime)", padding: "3px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                    >
                      ⚡ Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px", background: "#05120a", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px", fontFamily: "monospace" }}
                  />
                </div>

                {/* Department */}
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)" }}>
                    Department / Trade
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Facilities, CS, Electrical"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{ width: "100%", padding: "10px", background: "#05120a", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px" }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)" }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: "100%", padding: "10px", background: "#05120a", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px" }}
                  />
                </div>

                {/* Specialization / ID */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)" }}>
                    {formData.role === "technician" ? "Technician Specialization (e.g. Electrical, Plumbing, AV)" : "Student Roll No. / Employee ID"}
                  </label>
                  <input
                    type="text"
                    placeholder={formData.role === "technician" ? "Plumbing, Electrical, Audio-Visual" : "e.g. STU-2024-041"}
                    value={formData.role === "technician" ? formData.specialization : formData.student_or_emp_id}
                    onChange={(e) => {
                      if (formData.role === "technician") {
                        setFormData({ ...formData, specialization: e.target.value });
                      } else {
                        setFormData({ ...formData, student_or_emp_id: e.target.value });
                      }
                    }}
                    style={{ width: "100%", padding: "10px", background: "#05120a", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "10px 18px", background: "transparent", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px", cursor: "pointer" }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn-primary"
                  style={{ padding: "10px 24px" }}
                >
                  {createLoading ? "Provisioning..." : "Create Account & Get Credentials 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: RESET PASSWORD MODAL
      ============================================================ */}
      {resetModalUser && (
        <div className="credentials-modal-overlay">
          <div className="credentials-modal" style={{ maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--cf-border)", paddingBottom: "12px" }}>
              <h2 style={{ margin: 0, color: "var(--cf-lime)", display: "flex", alignItems: "center", gap: "8px", fontSize: "18px" }}>
                <span>🔑</span> Reset Password
              </h2>
              <button
                onClick={() => setResetModalUser(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "20px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: "var(--cf-muted)", fontSize: "13px", margin: "12px 0 16px 0" }}>
              Reset login password for <strong>{resetModalUser.full_name}</strong> ({resetModalUser.role.toUpperCase()}).
              You can provide this new password to them.
            </p>

            {resetError && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#fca5a5", padding: "10px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px" }}>
                ⚠️ {resetError}
              </div>
            )}

            <form onSubmit={handleExecuteResetPassword}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)" }}>
                  User Email: <span style={{ color: "#ffffff" }}>{resetModalUser.email}</span>
                </label>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", color: "var(--cf-muted)" }}>New Password *</label>
                  <button
                    type="button"
                    onClick={() => generatePassword(setNewPasswordInput)}
                    style={{ background: "rgba(163, 230, 53, 0.15)", border: "1px solid var(--cf-lime)", color: "var(--cf-lime)", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}
                  >
                    ⚡ Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", background: "#05120a", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px", fontFamily: "monospace" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="btn-primary"
                  style={{ padding: "8px 20px" }}
                >
                  {resetLoading ? "Updating..." : "Save & Share Credentials 🔑"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: CREDENTIALS GENERATED & READY TO SHARE
      ============================================================ */}
      {createdCredentials && (
        <div className="credentials-modal-overlay">
          <div className="credentials-modal">
            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <span style={{ fontSize: "42px" }}>🎉</span>
              <h2 style={{ color: "var(--cf-lime)", margin: "10px 0 5px 0" }}>
                Credentials Ready to Share!
              </h2>
              <p style={{ color: "var(--cf-muted)", fontSize: "14px" }}>
                Provide these login details to the member so they can sign in to their portal.
              </p>
            </div>

            <div className="credentials-card-box">
              <div className="cred-row">
                <span className="cred-label">College / Institution:</span>
                <span className="cred-val" style={{ color: "#ffffff" }}>
                  {createdCredentials.college_name || collegeName}
                </span>
              </div>

              <div className="cred-row">
                <span className="cred-label">Assigned Role:</span>
                <span className="cred-val" style={{ textTransform: "capitalize", color: "var(--cf-lime)" }}>
                  {createdCredentials.role}
                </span>
              </div>

              <div className="cred-row">
                <span className="cred-label">Full Name:</span>
                <span className="cred-val">{createdCredentials.full_name}</span>
              </div>

              <div className="cred-row">
                <span className="cred-label">Login Email:</span>
                <span className="cred-val">{createdCredentials.email}</span>
              </div>

              <div className="cred-row">
                <span className="cred-label">Password:</span>
                <span className="cred-val" style={{ letterSpacing: "1px", color: "var(--cf-lime)", fontWeight: "bold" }}>
                  {createdCredentials.password}
                </span>
              </div>

              <div className="cred-row">
                <span className="cred-label">Portal Sign In:</span>
                <span className="cred-val">{window.location.origin}/login</span>
              </div>
            </div>

            <div className="cred-share-actions">
              <button onClick={copyCredentials} className="share-btn-copy">
                {copied ? "✅ Copied to Clipboard!" : "📋 Copy All Login Credentials"}
              </button>

              <a
                href={`mailto:${createdCredentials.email}?subject=${encodeURIComponent(`Your ${collegeName} Login Credentials`)}&body=${encodeURIComponent(createdCredentials.share_message || "")}`}
                className="share-btn-email"
              >
                <span>✉️</span> Share via Email
              </a>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(createdCredentials.share_message || "")}`}
                target="_blank"
                rel="noreferrer"
                className="share-btn-wa"
              >
                <span>💬</span> Share on WhatsApp
              </a>
            </div>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                onClick={() => setCreatedCredentials(null)}
                style={{ background: "none", border: "none", color: "var(--cf-muted)", cursor: "pointer", fontSize: "14px", textDecoration: "underline" }}
              >
                Done / Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;