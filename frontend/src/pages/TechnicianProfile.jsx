import React, { useState } from "react";
import { Link } from "react-router-dom";
import TechnicianSidebar from "../components/TechnicianSidebar";

function TechnicianProfile() {
  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [profile, setProfile] = useState({
    name: "Rahul Patil",
    email: "rahul.patil@example.com",
    phone: "9876543210",
    role: "Technician",
    department: "Maintenance Department",
    specialization: "Electrical & Classroom Equipment",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

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

  const handleSaveProfile = () => {
    setEditing(false);
    alert("Profile updated successfully!");
  };

  const handleSavePassword = () => {
    if (
      !passwords.current ||
      !passwords.newPassword ||
      !passwords.confirm
    ) {
      alert("Please fill all password fields.");
      return;
    }

    if (passwords.newPassword !== passwords.confirm) {
      alert("New password and confirm password do not match.");
      return;
    }

    alert("Password changed successfully!");

    setPasswords({
      current: "",
      newPassword: "",
      confirm: "",
    });

    setShowPasswordForm(false);
  };

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
            onClick={() => {
              if (editing) {
                handleSaveProfile();
              } else {
                setEditing(true);
              }
            }}
          >
            {editing ? "✓ Save Changes" : "✏️ Edit Profile"}
          </button>

        </div>

        {/* Profile Card */}
        <div className="technician-profile-card">

          {/* Profile Header */}
          <div className="technician-profile-top">

            <div className="technician-profile-avatar">
              R
            </div>

            <div>
              <h2>{profile.name}</h2>
              <p>{profile.role}</p>
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
                  />
                ) : (
                  <p>{profile.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="profile-field">
                <label>Email Address</label>

                {editing ? (
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                  />
                ) : (
                  <p>{profile.email}</p>
                )}
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
                  />
                ) : (
                  <p>{profile.phone}</p>
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
                  />
                ) : (
                  <p>{profile.department}</p>
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
                  />
                ) : (
                  <p>{profile.specialization}</p>
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
                <p>Last updated recently</p>
              </div>

              <button
                className="secondary-btn"
                onClick={() =>
                  setShowPasswordForm(!showPasswordForm)
                }
              >
                🔐 Change Password
              </button>

            </div>

            {/* Password Form */}
            {showPasswordForm && (
              <div className="password-form">

                <h4>Change Password</h4>

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
                  placeholder="New Password"
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
                    onClick={() => {
                      setShowPasswordForm(false);

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
                    onClick={handleSavePassword}
                  >
                    🔒 Save Password
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