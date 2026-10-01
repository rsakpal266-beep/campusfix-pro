import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

const DEMO_ROLES = [
  {
    id: "student",
    name: "Student / User",
    icon: "👤",
    email: "student@campusfix.com",
    password: "Student@123",
    role: "student",
    redirect: "/dashboard",
    badge: "User Portal",
    desc: "Submit complaints, track tickets, FixBot AI",
  },
  {
    id: "technician",
    name: "Technician",
    icon: "🛠️",
    email: "rahul@campusfix.com",
    password: "Tech@123",
    role: "technician",
    redirect: "/technician-dashboard",
    badge: "Tech Portal",
    desc: "Manage assigned tasks, update ticket status",
  },
  {
    id: "admin",
    name: "Administrator",
    icon: "👑",
    email: "admin@campusfix.com",
    password: "Admin@123",
    role: "admin",
    redirect: "/admin-dashboard",
    badge: "Admin Portal",
    desc: "Full system control, ticket & user management",
  },
];

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [activeRole, setActiveRole] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const handleSelectRole = (roleItem) => {
    setActiveRole(roleItem.id);
    setEmail(roleItem.email);
    setPassword(roleItem.password);
    setError("");
    setInfoMessage(`Filled credentials for ${roleItem.name}. Ready to login!`);
  };

  const handleDirectDemoAccess = (roleItem) => {
    // Allows testing/demo mode if backend is offline or for instant evaluation
    const demoUser = {
      id: roleItem.id === "admin" ? 1 : roleItem.id === "technician" ? 2 : 3,
      full_name:
        roleItem.id === "admin"
          ? "CampusFix Administrator"
          : roleItem.id === "technician"
          ? "Rahul Patil"
          : "Demo Student",
      email: roleItem.email,
      role: roleItem.role,
    };

    localStorage.setItem("token", "demo-token-" + roleItem.id);
    localStorage.setItem("user", JSON.stringify(demoUser));
    navigate(roleItem.redirect);
  };

  const executeLogin = async (loginEmail, loginPassword) => {
    setError("");
    setInfoMessage("");

    if (!loginEmail || !loginPassword) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed. Check credentials.");
        return;
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Save logged-in user information
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect according to role
      if (data.user.role === "student" || data.user.role === "faculty") {
        navigate("/dashboard");
      } else if (data.user.role === "technician") {
        navigate("/technician-dashboard");
      } else if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        setError("Unknown user role: " + data.user.role);
      }
    } catch (err) {
      console.warn("Backend connection failed, offering direct demo access:", err);
      setError(
        "Cannot connect to Flask backend. Make sure the server is running on " +
          API_BASE_URL +
          ", or use the 'Direct Access' buttons below."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    executeLogin(email, password);
  };

  const handleQuickLogin = (roleItem) => {
    handleSelectRole(roleItem);
    executeLogin(roleItem.email, roleItem.password);
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-enhanced">
        <div className="login-logo">
          <div className="login-brand-text">
            <strong>
              CampusFix <span>Pro</span>
            </strong>
            <small>MAINTENANCE & REPAIR SYSTEM</small>
          </div>
        </div>

        <h2>Welcome Back!</h2>
        <p className="auth-subtitle">
          Select a role or enter your credentials to access your dashboard.
        </p>

        {/* Quick Role Selectors */}
        <div className="role-selector-container">
          <p className="role-selector-title">⚡ Quick Role Selection & Demo Login</p>
          <div className="role-selector-grid">
            {DEMO_ROLES.map((roleItem) => (
              <button
                key={roleItem.id}
                type="button"
                className={`role-select-btn ${activeRole === roleItem.id ? "active" : ""}`}
                onClick={() => handleSelectRole(roleItem)}
                title={roleItem.desc}
              >
                <div className="role-btn-top">
                  <span className="role-btn-icon">{roleItem.icon}</span>
                  <span className="role-btn-name">{roleItem.name}</span>
                </div>
                <small className="role-btn-badge">{roleItem.badge}</small>
              </button>
            ))}
          </div>
        </div>

        {infoMessage && <p className="auth-info-message">ℹ️ {infoMessage}</p>}

        <form onSubmit={handleFormSubmit}>
          <label>Email / Username</label>
          <input
            type="text"
            placeholder="Enter your email or username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setActiveRole(null);
            }}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setActiveRole(null);
            }}
          />

          <div className="auth-options">
            <label className="remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>

            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-actions-group">
            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        {/* Direct Demo / Portal Access */}
        <div className="demo-portals-section">
          <p className="demo-portals-heading">
            <span>Direct Portal Access (Demo Mode)</span>
          </p>
          <div className="demo-portals-buttons">
            {DEMO_ROLES.map((roleItem) => (
              <button
                key={roleItem.id}
                type="button"
                className="demo-portal-pill"
                onClick={() => handleDirectDemoAccess(roleItem)}
              >
                {roleItem.icon} {roleItem.name}
              </button>
            ))}
          </div>
        </div>

        <p className="auth-switch">
          Don't have an account?
          <Link to="/register"> Register</Link>
        </p>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default Login;