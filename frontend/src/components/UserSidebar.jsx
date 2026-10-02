import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

function UserSidebar() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = storedUser.role || "student";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="dashboard-sidebar">
      {/* Brand Logo */}
      <Link to="/dashboard" className="dashboard-logo">
        <div className="dashboard-brand-icon">🔧</div>
        <div className="dashboard-brand-text">
          <strong>
            CampusFix <span>Pro</span>
          </strong>
          <small>MAINTENANCE SYSTEM</small>
        </div>
      </Link>

      {/* Role Pill */}
      <div
        className="sidebar-role-badge user-badge"
        style={{
          background: "rgba(163, 230, 53, 0.12)",
          border: "1px solid var(--cf-lime)",
          color: "var(--cf-lime)",
          padding: "8px 12px",
          borderRadius: "8px",
          margin: "0 12px 16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", fontSize: "12px", textTransform: "capitalize" }}>
          <span>{userRole === "faculty" ? "👩‍🏫" : "🎓"}</span> {userRole === "faculty" ? "Faculty Member" : "Student"}
        </div>
        {storedUser.college_name && (
          <div
            style={{
              fontSize: "11px",
              color: "#e2e8f0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={storedUser.college_name}
          >
            🏛️ {storedUser.college_name}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          📊 <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/raise-complaint"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          ➕ <span>Raise Complaint</span>
        </NavLink>

        <NavLink
          to="/my-tickets"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          🎫 <span>My Tickets</span>
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          🔔 <span>Notifications</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          👤 <span>Profile</span>
        </NavLink>

        <NavLink
          to="/fixbot"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          🤖 <span>FixBot AI</span>
        </NavLink>
      </nav>

      {/* Logout */}
      <button className="dashboard-logout" onClick={handleLogout}>
        🚪 <span>Logout</span>
      </button>
    </aside>
  );
}

export default UserSidebar;
