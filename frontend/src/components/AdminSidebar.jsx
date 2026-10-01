import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

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

      {/* Role Pill */}
      <div className="sidebar-role-badge admin-badge">
        <span>👑</span> Administrator
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
      </nav>

      {/* Logout */}
      <button className="dashboard-logout" onClick={handleLogout}>
        🚪 <span>Logout</span>
      </button>
    </aside>
  );
}

export default AdminSidebar;