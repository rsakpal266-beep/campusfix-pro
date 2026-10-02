import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import TechnicianSidebar from "../components/TechnicianSidebar";

function TechnicianProfile() {
  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [profile, setProfile] = useState({
    name: storedUser.full_name || storedUser.name || "Technician",
    email: storedUser.email || "",
    phone: storedUser.phone || "",
    role: storedUser.role
      ? storedUser.role.charAt(0).toUpperCase() + storedUser.role.slice(1)
      : "Technician",
    department: storedUser.department || "Maintenance Department",
    specialization: storedUser.specialization || "General Maintenance",
    college_name: storedUser.college_name || "",
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  // Fetch updated profile from API on mount
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
            setProfile({
              name: u.full_name || u.name || "Technician",
              email: u.email || "",
              phone: u.phone || "",
              role: u.role
                ? u.role.charAt(0).toUpperCase() + u.role.slice(1)
                : "Technician",
              department: u.department || "Maintenance Department",
              specialization: u.specialization || "General Maintenance",
              college_name: u.college_name || storedUser.college_name || "",
            });
            localStorage.setItem(
              "user",
              JSON.stringify({ ...storedUser, ...u })
            );
          }
        }
      } catch (err) {
        console.error("Error fetching technician profile:", err);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async () => {
    setSuccessMsg("");
    setErrorMsg("");

    if (!profile.name.trim()) {
      setErrorMsg("Full name cannot be empty.");
      return;
    }

    if (!token) {
      setErrorMsg("Authentication session expired. Please log in again.");
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
          full_name: profile.name.trim(),
          phone: profile.phone.trim(),
          department: profile.department.trim(),
          specialization: profile.specialization.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(
          data.detail || data.message || "Failed to update profile."
        );
        return;
      }

      setSuccessMsg("Profile updated successfully!");
      setEditing(false);

      if (data.user) {
        const updated = { ...storedUser, ...data.user };
        localStorage.setItem("user", JSON.stringify(updated));
        setProfile((prev) => ({
          ...prev,
          name: data.user.full_name || prev.name,
          phone: data.user.phone || prev.phone,
          department: data.user.department || prev.department,
          specialization: data.user.specialization || prev.specialization,
        }));
      }
    } catch (err) {
      setErrorMsg("Unable to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordSuccess("");
    setPasswordError("");

    if (
      !passwords.current ||
      !passwords.newPassword ||
      !passwords.confirm
    ) {
      setPasswordError("Please fill all password fields.");
      return;
    }

    if (passwords.newPassword.length < 6) {
      setPasswordError("New password must contain at least 6 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirm) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (passwords.current === passwords.newPassword) {
      setPasswordError(
        "New password must be different from current password."
      );
      return;
    }

    if (!token) {
      setPasswordError("Session expired. Please log in again.");
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
          current_password: passwords.current,
          new_password: passwords.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(
          data.detail || data.message || "Failed to change password."
        );
        return;
      }

      setPasswordSuccess("Password changed successfully!");
      setPasswords({
        current: "",
        newPassword: "",
        confirm: "",
      });

      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (err) {
      setPasswordError("Unable to connect to backend server.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const avatarLetter = (profile.name || "T").trim().charAt(0).toUpperCase();

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <TechnicianSidebar />

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <div className="profile-page-header">
          <div>
            <h1>My Profile</h1>
            <p>
              View and manage your technician profile information.
            </p>
          </div>

          <button
            className="primary-btn"
            disabled={loading}
            onClick={() => {
              if (editing) {
                handleSaveProfile();
              } else {
                setSuccessMsg("");
                setErrorMsg("");
                setEditing(true);
              }
            }}
          >
            {loading
              ? "Saving..."
              : editing
              ? "✓ Save Changes"
              : "✏️ Edit Profile"}
          </button>
        </div>

        {/* Feedback Banners */}
        {successMsg && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid #10b981",
              color: "#6ee7b7",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              color: "#fca5a5",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="technician-profile-card">
          {/* Profile Header */}
          <div className="technician-profile-top">
            <div className="technician-profile-avatar">
              {avatarLetter}
            </div>

            <div>
              <h2>{profile.name}</h2>
              <p>
                {profile.role}
                {profile.college_name ? ` • 🏛️ ${profile.college_name}` : ""}
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="profile-information">
            <h3>Personal Information</h3>

            <div className="profile-grid">
              {/* Name */}
              <div className="profile-field">
                <label>Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p>{profile.name || "Not specified"}</p>
                )}
              </div>

              {/* Email */}
              <div className="profile-field">
                <label>Email Address</label>
                <p style={{ opacity: 0.9 }}>{profile.email || "No email registered"}</p>
              </div>

              {/* Phone */}
              <div className="profile-field">
                <label>Phone Number</label>
                {editing ? (
                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                  />
                ) : (
                  <p>{profile.phone || "Not provided"}</p>
                )}
              </div>

              {/* Role */}
              <div className="profile-field">
                <label>Role</label>
                <p>{profile.role}</p>
              </div>

              {/* Department */}
              <div className="profile-field">
                <label>Department</label>
                {editing ? (
                  <input
                    type="text"
                    name="department"
                    value={profile.department}
                    onChange={handleChange}
                    placeholder="e.g. Facilities & Maintenance"
                  />
                ) : (
                  <p>{profile.department || "General Maintenance"}</p>
                )}
              </div>

              {/* Specialization */}
              <div className="profile-field">
                <label>Specialization</label>
                {editing ? (
                  <input
                    type="text"
                    name="specialization"
                    value={profile.specialization}
                    onChange={handleChange}
                    placeholder="e.g. Electrical & Appliances"
                  />
                ) : (
                  <p>{profile.specialization || "General"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="profile-security">
            <h3>Account Security</h3>

            {/* Password Row */}
            <div className="security-row">
              <div>
                <strong>Password</strong>
                <p>Ensure your account is protected with a strong password</p>
              </div>

              <button
                className="secondary-btn"
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  setPasswordSuccess("");
                  setPasswordError("");
                }}
              >
                🔐 Change Password
              </button>
            </div>

            {/* Password Form */}
            {showPasswordForm && (
              <div className="password-form">
                <h4>Change Password</h4>

                {passwordSuccess && (
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "1px solid #10b981",
                      color: "#6ee7b7",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      marginBottom: "12px",
                      fontSize: "13px",
                    }}
                  >
                    ✅ {passwordSuccess}
                  </div>
                )}

                {passwordError && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid #ef4444",
                      color: "#fca5a5",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      marginBottom: "12px",
                      fontSize: "13px",
                    }}
                  >
                    ⚠️ {passwordError}
                  </div>
                )}

                <input
                  type="password"
                  name="current"
                  value={passwords.current}
                  onChange={handlePasswordChange}
                  placeholder="Current Password"
                />

                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="New Password (min. 6 characters)"
                />

                <input
                  type="password"
                  name="confirm"
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  placeholder="Confirm New Password"
                />

                <div className="password-actions">
                  <button
                    className="secondary-btn"
                    disabled={passwordLoading}
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordSuccess("");
                      setPasswordError("");
                      setPasswords({
                        current: "",
                        newPassword: "",
                        confirm: "",
                      });
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="primary-btn"
                    disabled={passwordLoading}
                    onClick={handleSavePassword}
                  >
                    {passwordLoading ? "Saving..." : "🔒 Save Password"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TechnicianProfile;