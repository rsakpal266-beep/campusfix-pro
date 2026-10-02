import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import UserSidebar from "../components/UserSidebar";

function Profile() {
  const token = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");
  const initialUser = savedUser ? JSON.parse(savedUser) : null;

  const [user, setUser] = useState(initialUser);

  // Profile editing form fields
  const [fullName, setFullName] = useState(initialUser?.full_name || "");
  const [phone, setPhone] = useState(initialUser?.phone || "");
  const [department, setDepartment] = useState(initialUser?.department || "");
  const [studentOrEmpId, setStudentOrEmpId] = useState(initialUser?.student_or_emp_id || "");

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Change Password states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Fetch fresh profile on mount from backend
  useEffect(() => {
    const fetchProfile = async () => {
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
            const u = data.user;
            setUser(u);
            setFullName(u.full_name || "");
            setPhone(u.phone || "");
            setDepartment(u.department || "");
            setStudentOrEmpId(u.student_or_emp_id || "");
            localStorage.setItem("user", JSON.stringify({ ...initialUser, ...u }));
          }
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
      }
    };

    fetchProfile();
  }, [token]);

  // Save Profile Handler
  const handleSaveProfile = async () => {
    setMessage("");
    setError("");

    if (!fullName.trim()) {
      setError("Full name cannot be empty.");
      return;
    }

    if (!token) {
      setError("Please login again.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          department: department.trim(),
          student_or_emp_id: studentOrEmpId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.detail || "Failed to update profile.");
        return;
      }

      // Update state
      setUser(data.user);
      setFullName(data.user.full_name || "");
      setPhone(data.user.phone || "");
      setDepartment(data.user.department || "");
      setStudentOrEmpId(data.user.student_or_emp_id || "");

      // Update localStorage
      localStorage.setItem("user", JSON.stringify({ ...initialUser, ...data.user }));

      setIsEditing(false);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError("Cannot connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async () => {
    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }

    if (!token) {
      setPasswordError("Your session has expired. Please login again.");
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.detail || data.message || "Failed to change password.");
        return;
      }

      setPasswordMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordMessage("");
      }, 2500);
    } catch (err) {
      setPasswordError("Cannot connect to backend server.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClosePasswordForm = () => {
    setShowPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordMessage("");
  };

  const avatarChar = (user?.full_name || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="dashboard-page">
      <UserSidebar />

      <main className="dashboard-main">
        {/* Profile Header */}
        <div className="profile-header">
          <div>
            <p className="dashboard-label">ACCOUNT SETTINGS</p>
            <h1>My Profile</h1>
            <p>View and manage your CampusFix Pro account information.</p>
          </div>
        </div>

        <div className="profile-grid">
          {/* PROFILE OVERVIEW */}
          <section className="profile-card profile-overview">
            <div className="profile-avatar">
              {avatarChar}
            </div>

            <h2>{user?.full_name || "User"}</h2>

            <p className="profile-role">
              {user?.role
                ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                : "Student"}
            </p>

            <p className="profile-email">
              {user?.email || "No email available"}
            </p>

            <div style={{ margin: "14px 0", display: "flex", flexDirection: "column", gap: "8px", textAlign: "left", fontSize: "13px", padding: "14px", background: "rgba(8, 16, 36, 0.6)", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.15)" }}>
              <div style={{ color: "#e2e8f0" }}>
                <strong style={{ color: "#93c5fd" }}>📞 Phone: </strong>
                <span>{user?.phone || "Not provided"}</span>
              </div>
              {user?.department && (
                <div style={{ color: "#e2e8f0" }}>
                  <strong style={{ color: "#93c5fd" }}>🏛️ Dept: </strong>
                  <span>{user.department}</span>
                </div>
              )}
              {user?.student_or_emp_id && (
                <div style={{ color: "#e2e8f0" }}>
                  <strong style={{ color: "#93c5fd" }}>🆔 ID: </strong>
                  <span>{user.student_or_emp_id}</span>
                </div>
              )}
              {user?.college_name && (
                <div style={{ color: "#e2e8f0" }}>
                  <strong style={{ color: "#93c5fd" }}>🏫 Campus: </strong>
                  <span>{user.college_name}</span>
                </div>
              )}
            </div>
          </section>

          {/* PERSONAL INFORMATION */}
          <section className="profile-card">
            <div className="profile-card-header">
              <div>
                <h2>Personal Information</h2>
                <p>Update your personal details and contact number.</p>
              </div>

              <button
                className="edit-profile-btn"
                onClick={() => {
                  if (isEditing) {
                    handleSaveProfile();
                  } else {
                    setFullName(user?.full_name || "");
                    setPhone(user?.phone || "");
                    setDepartment(user?.department || "");
                    setStudentOrEmpId(user?.student_or_emp_id || "");
                    setIsEditing(true);
                    setMessage("");
                    setError("");
                  }
                }}
                disabled={loading}
              >
                {loading ? "Saving..." : isEditing ? "💾 Save Changes" : "✏️ Edit Profile"}
              </button>
            </div>

            {error && <div className="auth-error">❌ {error}</div>}
            {message && <div className="auth-success">✅ {message}</div>}

            <div className="profile-form">
              {/* Full Name */}
              <div className="profile-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  readOnly={!isEditing}
                  placeholder="Enter full name"
                />
              </div>

              {/* Email */}
              <div className="profile-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  style={{ opacity: 0.85 }}
                />
              </div>

              {/* Phone Number */}
              <div className="profile-form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={isEditing ? phone : (user?.phone || phone || "")}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={isEditing ? "e.g. +91 98765 43210" : (user?.phone || "Not provided")}
                  readOnly={!isEditing}
                />
              </div>

              {/* Role */}
              <div className="profile-form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={
                    user?.role
                      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                      : "Student"
                  }
                  readOnly
                  style={{ opacity: 0.85 }}
                />
              </div>

              {/* Department */}
              <div className="profile-form-group">
                <label>Department / Branch</label>
                <input
                  type="text"
                  value={isEditing ? department : (user?.department || department || "")}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder={isEditing ? "e.g. Computer Science" : (user?.department || "Not specified")}
                  readOnly={!isEditing}
                />
              </div>

              {/* Student Roll No. / Employee ID */}
              <div className="profile-form-group">
                <label>
                  {user?.role === "faculty" ? "Employee / Faculty ID" : "Student Roll No. / Enrollment ID"}
                </label>
                <input
                  type="text"
                  value={isEditing ? studentOrEmpId : (user?.student_or_emp_id || studentOrEmpId || "")}
                  onChange={(e) => setStudentOrEmpId(e.target.value)}
                  placeholder={isEditing ? "e.g. STU-2024-001" : (user?.student_or_emp_id || "Not specified")}
                  readOnly={!isEditing}
                />
              </div>

              {/* College / Institution */}
              <div className="profile-form-group" style={{ gridColumn: "span 2" }}>
                <label>College / Institution</label>
                <input
                  type="text"
                  value={user?.college_name || "Campus"}
                  readOnly
                  style={{ opacity: 0.85 }}
                />
              </div>
            </div>
          </section>

          {/* SECURITY */}
          <section className="profile-card security-card">
            <div className="profile-card-header">
              <div>
                <h2>Security</h2>
                <p>Manage your account password.</p>
              </div>
            </div>

            <div className="password-row">
              <div>
                <h3>Password</h3>
                <p>Ensure your account is protected with a strong password.</p>
              </div>

              <button
                className="change-password-btn"
                onClick={() => {
                  setShowPasswordForm(true);
                  setPasswordError("");
                  setPasswordMessage("");
                }}
              >
                Change Password
              </button>
            </div>

            {/* CHANGE PASSWORD FORM */}
            {showPasswordForm && (
              <div className="change-password-form">
                <h3>Change Password</h3>
                <p>Enter your current password and create a new password.</p>

                <div className="profile-form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div className="profile-form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password (min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="profile-form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {passwordError && <div className="auth-error">❌ {passwordError}</div>}
                {passwordMessage && <div className="auth-success">✅ {passwordMessage}</div>}

                <div className="password-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={handleClosePasswordForm}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="submit-complaint"
                    onClick={handleChangePassword}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Profile;