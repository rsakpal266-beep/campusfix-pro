import { Link } from "react-router-dom";
import { useState } from "react";
import { API_BASE_URL } from "../config";
import UserSidebar from "../components/UserSidebar";

function Profile() {

  const savedUser = localStorage.getItem("user");

  const initialUser = savedUser
    ? JSON.parse(savedUser)
    : null;

  const [user, setUser] = useState(initialUser);

  // Profile editing
  const [fullName, setFullName] = useState(
    initialUser?.full_name || ""
  );

  const [isEditing, setIsEditing] = useState(false);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // =====================================================
  // CHANGE PASSWORD STATES
  // =====================================================

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordLoading, setPasswordLoading] = useState(false);

  const [passwordMessage, setPasswordMessage] = useState("");

  const [passwordError, setPasswordError] = useState("");


  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSaveProfile = async () => {

    setMessage("");
    setError("");

    if (!fullName.trim()) {
      setError("Full name cannot be empty.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login again.");
      return;
    }

    try {

      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/profile`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },

          body: JSON.stringify({
            full_name: fullName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        setError(
          data.message || "Failed to update profile."
        );

        return;
      }

      // Update React state
      setUser(data.user);

      // Update localStorage
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Exit edit mode
      setIsEditing(false);

      setMessage(
        "Profile updated successfully!"
      );

    } catch (error) {
      setError("Cannot connect to backend server.");
    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handleChangePassword = async () => {

    setPasswordMessage("");
    setPasswordError("");

    // Check fields
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Please fill all password fields."
      );

      return;
    }

    // Check new password length
    if (newPassword.length < 6) {

      setPasswordError(
        "New password must contain at least 6 characters."
      );

      return;
    }

    // Check confirmation
    if (newPassword !== confirmPassword) {

      setPasswordError(
        "New password and confirm password do not match."
      );

      return;
    }

    // Check same password
    if (currentPassword === newPassword) {

      setPasswordError(
        "New password must be different from current password."
      );

      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {

      setPasswordError(
        "Your session has expired. Please login again."
      );

      return;
    }

    try {

      setPasswordLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/change-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },

          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        setPasswordError(
          data.message || "Failed to change password."
        );

        return;
      }

      // Success
      setPasswordMessage(
        "Password changed successfully!"
      );

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error) {
      setPasswordError("Cannot connect to backend server.");
    } finally {

      setPasswordLoading(false);

    }
  };


  // =====================================================
  // CLOSE PASSWORD FORM
  // =====================================================

  const handleClosePasswordForm = () => {

    setShowPasswordForm(false);

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setPasswordError("");
    setPasswordMessage("");
  };


  return (
    <div className="dashboard-page">


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <UserSidebar />


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="dashboard-main">


        {/* Profile Header */}

        <div className="profile-header">

          <div>

            <p className="dashboard-label">
              ACCOUNT SETTINGS
            </p>

            <h1>
              My Profile
            </h1>

            <p>
              View and manage your CampusFix Pro account information.
            </p>

          </div>

        </div>


        <div className="profile-grid">


          {/* =================================================
              PROFILE OVERVIEW
          ================================================= */}

          <section className="profile-card profile-overview">

            <div className="profile-avatar">
              👤
            </div>

            <h2>
              {user?.full_name || "User"}
            </h2>

            <p className="profile-role">

              {user?.role
                ? user.role.charAt(0).toUpperCase() +
                  user.role.slice(1)
                : "User"}

            </p>

            <p className="profile-email">
              {user?.email || "No email available"}
            </p>

            <button className="profile-picture-btn">
              Change Profile Picture
            </button>

          </section>


          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <section className="profile-card">

            <div className="profile-card-header">

              <div>

                <h2>
                  Personal Information
                </h2>

                <p>
                  Update your personal details.
                </p>

              </div>


              <button
                className="edit-profile-btn"

                onClick={() => {

                  if (isEditing) {

                    handleSaveProfile();

                  } else {

                    setFullName(
                      user?.full_name || ""
                    );

                    setIsEditing(true);

                    setMessage("");
                    setError("");
                  }

                }}

                disabled={loading}
              >

                {loading
                  ? "Saving..."
                  : isEditing
                    ? "💾 Save"
                    : "✏️ Edit"}

              </button>

            </div>


            {/* Profile Error */}

            {error && (

              <div className="auth-error">
                ❌ {error}
              </div>

            )}


            {/* Profile Success */}

            {message && (

              <div className="auth-success">
                ✅ {message}
              </div>

            )}


            <div className="profile-form">


              {/* Full Name */}

              <div className="profile-form-group">

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}

                  onChange={(e) =>
                    setFullName(e.target.value)
                  }

                  readOnly={!isEditing}
                />

              </div>


              {/* Email */}

              <div className="profile-form-group">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  value={user?.email || ""}
                  readOnly
                />

              </div>


              {/* Phone */}

              <div className="profile-form-group">

                <label>
                  Phone Number
                </label>

                <input
                  type="text"
                  value=""
                  placeholder="Not available"
                  readOnly
                />

              </div>


              {/* Role */}

              <div className="profile-form-group">

                <label>
                  Role
                </label>

                <input
                  type="text"

                  value={
                    user?.role
                      ? user.role.charAt(0).toUpperCase() +
                        user.role.slice(1)
                      : "User"
                  }

                  readOnly
                />

              </div>


              {/* Department */}

              <div className="profile-form-group">

                <label>
                  Department
                </label>

                <input
                  type="text"
                  value=""
                  placeholder="Not available"
                  readOnly
                />

              </div>


              {/* Class / Semester */}

              <div className="profile-form-group">

                <label>
                  Class / Semester
                </label>

                <input
                  type="text"
                  value=""
                  placeholder="Not available"
                  readOnly
                />

              </div>


            </div>

          </section>


          {/* =================================================
              SECURITY
          ================================================= */}

          <section className="profile-card security-card">


            <div className="profile-card-header">

              <div>

                <h2>
                  Security
                </h2>

                <p>
                  Manage your account password.
                </p>

              </div>

            </div>


            <div className="password-row">

              <div>

                <h3>
                  Password
                </h3>

                <p>
                  Your password is securely stored.
                </p>

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


            {/* =================================================
                CHANGE PASSWORD FORM
            ================================================= */}

            {showPasswordForm && (

              <div className="change-password-form">

                <h3>
                  Change Password
                </h3>

                <p>
                  Enter your current password and create a new password.
                </p>


                {/* Current Password */}

                <div className="profile-form-group">

                  <label>
                    Current Password
                  </label>

                  <input
                    type="password"
                    placeholder="Enter current password"

                    value={currentPassword}

                    onChange={(e) =>
                      setCurrentPassword(
                        e.target.value
                      )
                    }
                  />

                </div>


                {/* New Password */}

                <div className="profile-form-group">

                  <label>
                    New Password
                  </label>

                  <input
                    type="password"
                    placeholder="Enter new password"

                    value={newPassword}

                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                  />

                </div>


                {/* Confirm Password */}

                <div className="profile-form-group">

                  <label>
                    Confirm New Password
                  </label>

                  <input
                    type="password"
                    placeholder="Confirm new password"

                    value={confirmPassword}

                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                  />

                </div>


                {/* Password Error */}

                {passwordError && (

                  <div className="auth-error">
                    ❌ {passwordError}
                  </div>

                )}


                {/* Password Success */}

                {passwordMessage && (

                  <div className="auth-success">
                    ✅ {passwordMessage}
                  </div>

                )}


                {/* Buttons */}

                <div className="password-actions">

                  <button
                    type="button"
                    className="cancel-button"

                    onClick={
                      handleClosePasswordForm
                    }

                    disabled={passwordLoading}
                  >
                    Cancel
                  </button>


                  <button
                    type="button"
                    className="submit-complaint"

                    onClick={
                      handleChangePassword
                    }

                    disabled={passwordLoading}
                  >

                    {passwordLoading
                      ? "Changing..."
                      : "Change Password"}

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