import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

function TechnicianSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

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
      <div className="sidebar-role-badge tech-badge">
        <span>🛠️</span> Technician Portal
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
      </nav>

      {/* Logout */}
      <button className="dashboard-logout" onClick={handleLogout}>
        🚪 <span>Logout</span>
      </button>
    </aside>
  );
}

export default TechnicianSidebar;
