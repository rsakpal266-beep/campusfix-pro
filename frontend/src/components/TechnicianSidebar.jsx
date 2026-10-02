import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

function TechnicianSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <aside className="dashboard-sidebar">
      {/* Brand Logo */}
      <Link to="/technician-dashboard" className="dashboard-logo">
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
        className="sidebar-role-badge tech-badge"
        style={{
          background: "rgba(163, 230, 53, 0.15)",
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
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", fontSize: "12px" }}>
          <span>🛠️</span> Technician Portal
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
          to="/technician-dashboard"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          📊 <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/technician-tickets"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          🎫 <span>Assigned Tickets</span>
        </NavLink>

        <NavLink
          to="/technician-notifications"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          🔔 <span>Notifications</span>
        </NavLink>

        <NavLink
          to="/technician-profile"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          👤 <span>My Profile</span>
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

export default TechnicianSidebar;
