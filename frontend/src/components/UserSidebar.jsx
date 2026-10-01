import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

function UserSidebar() {
  const navigate = useNavigate();

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
      <div className="sidebar-role-badge user-badge">
        <span>👤</span> User Portal
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
