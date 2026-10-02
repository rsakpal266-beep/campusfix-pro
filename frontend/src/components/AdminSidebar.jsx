import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const collegeName = storedUser.college_name || "College Administration";

  return (
    <aside className="dashboard-sidebar">
      {/* Brand Logo */}
      <Link to="/admin-dashboard" className="dashboard-logo">
        <div className="dashboard-brand-icon">🔧</div>
        <div className="dashboard-brand-text">
          <strong>
            CampusFix <span>Pro</span>
          </strong>
          <small>MAINTENANCE SYSTEM</small>
        </div>
      </Link>

      {/* Role Pill & College Name */}
      <div
        className="sidebar-role-badge admin-badge"
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
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", fontSize: "12px" }}>
          <span>👑</span> College Admin
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#e2e8f0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={collegeName}
        >
          🏛️ {collegeName}
        </div>
      </div>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <NavLink
          to="/admin-dashboard"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          📊 <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin-tickets"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          🎫 <span>All Tickets</span>
        </NavLink>

        <NavLink
          to="/manage-users"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          👥 <span>Manage Users</span>
        </NavLink>

        <NavLink
          to="/manage-categories"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          📂 <span>Categories</span>
        </NavLink>

        <NavLink
          to="/admin-technicians"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          👨‍🔧 <span>Technicians</span>
        </NavLink>

        <NavLink
          to="/admin-notifications"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          🔔 <span>Notifications</span>
        </NavLink>

        <NavLink
          to="/admin-reports"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          📈 <span>Reports</span>
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

export default AdminSidebar;