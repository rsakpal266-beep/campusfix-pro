import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import AdminSidebar from "../components/AdminSidebar";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const collegeName = storedUser.college_name || "College Administration";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

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
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        setError(data.detail || data.message || "Failed to load users.");
        return;
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError("Cannot connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const generatePassword = (setter) => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError("");

    if (
      !formData.full_name ||
      !formData.email ||
      !formData.password ||
      !formData.role
    ) {
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
        setCreateError(data.detail || data.message || "Failed to create account.");
        return;
      }

      setCreatedCredentials(data.credentials);
      setShowCreateModal(false);
      setSuccessMsg(`Account created for ${formData.full_name}.`);
      await fetchUsers();
    } catch (err) {
      console.error("Create user error:", err);
      setCreateError("Network error while creating account.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleApproveUser = async (user) => {
    if (
      !window.confirm(`Approve registration for ${user.full_name}?`)
    ) {
      return;
    }

    try {
      setActionLoading(user.id);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${user.id}/approve`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to approve account.");
        return;
      }

      setSuccessMsg(data.message || "Account approved successfully.");
      await fetchUsers();
    } catch (err) {
      console.error("Approve error:", err);
      alert("Unable to connect to the backend.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async (user) => {
    if (!window.confirm(`Reject registration for ${user.full_name}?`)) {
      return;
    }

    try {
      setActionLoading(user.id);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${user.id}/reject`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to reject account.");
        return;
      }

      setSuccessMsg(data.message || "Registration rejected.");
      await fetchUsers();
    } catch (err) {
      console.error("Reject error:", err);
      alert("Unable to connect to the backend.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${user.id}/toggle-status`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || "Failed to update account status.");
        return;
      }

      setSuccessMsg(data.message);
      await fetchUsers();
    } catch (err) {
      console.error("Toggle status error:", err);
      alert("Unable to connect to the backend.");
    }
  };

  const handleDeleteUser = async (user) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${user.full_name} (${user.role})?`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${user.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || "Failed to delete user.");
        return;
      }

      setSuccessMsg(`User ${user.full_name} was deleted.`);
      await fetchUsers();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Unable to connect to the backend.");
    }
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

      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${resetModalUser.id}/reset-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ new_password: newPasswordInput }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        setResetError(data.detail || "Failed to reset password.");
        return;
      }

      setResetModalUser(null);
      setCreatedCredentials(data.credentials);
      setSuccessMsg(`Password reset for ${resetModalUser.full_name}.`);
    } catch (err) {
      console.error("Reset password error:", err);
      setResetError("Unable to connect to the backend.");
    } finally {
      setResetLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;

    const textToCopy =
      createdCredentials.share_message ||
      `College: ${collegeName}\nRole: ${createdCredentials.role}\nName: ${createdCredentials.full_name}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLogin: ${window.location.origin}/login`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const filteredUsers = users.filter((user) => {
    if (
      storedUser.college_name &&
      user.college_name &&
      user.college_name.trim().toLowerCase() !==
        storedUser.college_name.trim().toLowerCase()
    ) {
      return false;
    }

    const term = search.toLowerCase().trim();
    const matchesSearch = [
      user.full_name,
      user.email,
      user.department,
      user.role,
      user.student_or_emp_id,
    ].some((value) => String(value || "").toLowerCase().includes(term));

    const matchesRole =
      roleFilter === "All" ||
      String(user.role || "").toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const pendingCount = users.filter(
    (u) =>
      ["student", "faculty"].includes(u.role) &&
      u.approval_status === "pending"
  ).length;

  const totalStudents = users.filter((u) => u.role === "student").length;
  const totalFaculty = users.filter((u) => u.role === "faculty").length;
  const totalTechnicians = users.filter((u) => u.role === "technician").length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("en-IN");
  };

  const actionButtonStyle = {
    padding: "5px 8px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  };

  return (
    <div className="dashboard-page">
      <AdminSidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="role-badge admin">🏛️ {collegeName}</span>
            <h1>Manage Campus Users</h1>
            <p>Review registrations and manage accounts for your college.</p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="onboard-btn" onClick={() => handleOpenAddModal("technician")}>
              + Add Technician
            </button>
            <button className="onboard-btn" onClick={() => handleOpenAddModal("faculty")}>
              + Add Faculty
            </button>
            <button className="onboard-btn" onClick={() => handleOpenAddModal("student")}>
              + Add Student
            </button>
          </div>
        </header>

        {error && <div className="notification-error">⚠️ {error}</div>}

        {successMsg && (
          <div className="notification-success" style={{ margin: "15px 0" }}>
            <span>✅ {successMsg}</span>
            <button onClick={() => setSuccessMsg("")}>✕</button>
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <h3>{users.length}</h3>
            <p>Total Members</p>
          </div>
          <div className="stat-card">
            <h3>{pendingCount}</h3>
            <p>Pending Approvals</p>
          </div>
          <div className="stat-card">
            <h3>{totalStudents}</h3>
            <p>Students</p>
          </div>
          <div className="stat-card">
            <h3>{totalFaculty}</h3>
            <p>Faculty</p>
          </div>
          <div className="stat-card">
            <h3>{totalTechnicians}</h3>
            <p>Technicians</p>
          </div>
        </section>

        <section className="manage-users-section">
          <div className="users-toolbar">
            <div>
              <h2>Registered Campus Members</h2>
              <p>Pending students and faculty require approval before login.</p>
            </div>

            <div className="users-filter-controls">
              <input
                type="text"
                placeholder="Search name, email, department, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
                <option value="technician">Technicians</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p>Loading campus members...</p>
          ) : (
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Phone</th>
                    <th>Approval / Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const approvalStatus = user.approval_status || "approved";
                    const isPending =
                      ["student", "faculty"].includes(user.role) &&
                      approvalStatus === "pending";
                    const isRejected = approvalStatus === "rejected";

                    return (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.full_name || "Unknown"}</strong>
                          <small style={{ display: "block" }}>
                            {user.student_or_emp_id || `DB #${user.id}`}
                          </small>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.department || "-"}</td>
                        <td>{user.phone || "-"}</td>

                        <td>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 600,
                              display: "inline-block",
                              color: isPending
                                ? "#facc15"
                                : isRejected
                                ? "#f87171"
                                : user.is_active
                                ? "#4ade80"
                                : "#94a3b8",
                              background: isPending
                                ? "rgba(250,204,21,0.12)"
                                : isRejected
                                ? "rgba(239,68,68,0.12)"
                                : "rgba(148,163,184,0.12)",
                              border: `1px solid ${
                                isPending
                                  ? "#facc15"
                                  : isRejected
                                  ? "#ef4444"
                                  : user.is_active
                                  ? "#22c55e"
                                  : "#64748b"
                              }`,
                            }}
                          >
                            {isPending
                              ? "Pending Approval"
                              : isRejected
                              ? "Rejected"
                              : user.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          {user.role === "admin" ? (
                            <span>College Admin</span>
                          ) : (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {isPending && (
                                <>
                                  <button
                                    disabled={actionLoading === user.id}
                                    onClick={() => handleApproveUser(user)}
                                    style={{
                                      ...actionButtonStyle,
                                      background: "#14532d",
                                      color: "#bbf7d0",
                                      border: "1px solid #22c55e",
                                    }}
                                  >
                                    {actionLoading === user.id ? "Please wait..." : "✅ Approve"}
                                  </button>
                                  <button
                                    disabled={actionLoading === user.id}
                                    onClick={() => handleRejectUser(user)}
                                    style={{
                                      ...actionButtonStyle,
                                      background: "#7f1d1d",
                                      color: "#fecaca",
                                      border: "1px solid #ef4444",
                                    }}
                                  >
                                    ❌ Reject
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => {
                                  setResetModalUser(user);
                                  setResetError("");
                                  generatePassword(setNewPasswordInput);
                                }}
                                style={{
                                  ...actionButtonStyle,
                                  background: "rgba(163,230,53,0.12)",
                                  border: "1px solid #a3e635",
                                  color: "#a3e635",
                                }}
                              >
                                🔑 Password
                              </button>

                              {!isPending && (
                                <button
                                  onClick={() => handleToggleStatus(user)}
                                  style={{
                                    ...actionButtonStyle,
                                    background: "transparent",
                                    border: "1px solid #94a3b8",
                                    color: "#e2e8f0",
                                  }}
                                >
                                  {user.is_active ? "Deactivate" : "Activate"}
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteUser(user)}
                                style={{
                                  ...actionButtonStyle,
                                  background: "rgba(239,68,68,0.12)",
                                  border: "1px solid #ef4444",
                                  color: "#f87171",
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: 30 }}>
                        No users match your search or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showCreateModal && (
          <div className="credentials-modal-overlay">
            <div className="credentials-modal" style={{ maxWidth: 560 }}>
              <h2>Add Member to {collegeName}</h2>
              {createError && <p className="notification-error">{createError}</p>}

              <form onSubmit={handleCreateUser}>
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="technician">Technician</option>
                </select>

                <label>Full Name</label>
                <input
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                />

                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />

                <label>Password</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <button type="button" onClick={() => generatePassword()}>
                    Generate
                  </button>
                </div>

                <label>Department</label>
                <input
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />

                <label>Phone</label>
                <input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />

                <label>Student / Employee ID</label>
                <input
                  value={formData.student_or_emp_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      student_or_emp_id: e.target.value,
                    })
                  }
                />

                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={createLoading}>
                    {createLoading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {resetModalUser && (
          <div className="credentials-modal-overlay">
            <div className="credentials-modal" style={{ maxWidth: 480 }}>
              <h2>Reset Password</h2>
              <p>
                Reset password for <strong>{resetModalUser.full_name}</strong>
              </p>
              {resetError && <p className="notification-error">{resetError}</p>}

              <form onSubmit={handleExecuteResetPassword}>
                <label>New Password</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => generatePassword(setNewPasswordInput)}
                  >
                    Generate
                  </button>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={resetLoading}>
                    {resetLoading ? "Saving..." : "Save Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {createdCredentials && (
          <div className="credentials-modal-overlay">
            <div className="credentials-modal">
              <h2>Account Credentials</h2>
              <p>
                <strong>College:</strong> {createdCredentials.college_name || collegeName}
              </p>
              <p><strong>Name:</strong> {createdCredentials.full_name}</p>
              <p><strong>Email:</strong> {createdCredentials.email}</p>
              <p><strong>Role:</strong> {createdCredentials.role}</p>
              <p><strong>Password:</strong> {createdCredentials.password}</p>

              <button onClick={copyCredentials}>
                {copied ? "Copied!" : "Copy Credentials"}
              </button>
              <button onClick={() => setCreatedCredentials(null)}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ManageUsers;
