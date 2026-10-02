import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const executeLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
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
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || data.message || "Invalid email or password. Please verify credentials.");
        return;
      }

      // Save real JWT token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect by role
      if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else if (data.user.role === "technician") {
        navigate("/technician-dashboard");
      } else if (data.user.role === "faculty" || data.user.role === "student") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login connection error:", err);
      setError(`Unable to reach backend at ${API_BASE_URL}. Ensure the service is running.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-enhanced" style={{ maxWidth: "460px" }}>
        {/* Brand Header */}
        <div className="login-logo">
          <div className="login-brand-text">
            <strong>
              CampusFix <span>Pro</span>
            </strong>
            <small>CAMPUS MAINTENANCE & REPAIR SYSTEM</small>
          </div>
        </div>

        <h2>Sign In to Portal</h2>
        <p className="auth-subtitle">
          Sign in with your official account credentials.
        </p>

        {/* Feedback Messages */}
        {error && (
          <div
            className="auth-error-banner"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              color: "#fca5a5",
              padding: "10px",
              borderRadius: "8px",
              margin: "12px 0",
              fontSize: "14px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={executeLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="login-email">Campus / Official Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="e.g. yourname@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="login-password">Password</label>
              <Link to="/forgot-password" style={{ color: "var(--cf-lime)", fontSize: "13px", textDecoration: "none" }}>
                Forgot Password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
            style={{ width: "100%", padding: "14px", marginTop: "10px" }}
          >
            {loading ? "Authenticating..." : "Sign In 🚀"}
          </button>
        </form>

        <div
          style={{
            marginTop: "20px",
            padding: "14px",
            background: "rgba(163, 230, 53, 0.08)",
            borderRadius: "10px",
            border: "1px dashed rgba(163, 230, 53, 0.35)",
            fontSize: "13px",
            color: "#e2e8f0",
            lineHeight: "1.5",
          }}
        >
          🎓 <strong>Students, Faculty & Technicians:</strong> Accounts are provisioned directly by your College Administration. Please use the email and password provided by your institution.
        </div>

        <div className="auth-switch" style={{ marginTop: "18px", textAlign: "center" }}>
          <span>New College or University? </span>
          <Link to="/register" style={{ color: "var(--cf-lime)", fontWeight: "bold" }}>
            Register Your College 🏛️
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: "14px" }}>
          <Link to="/" className="back-home" style={{ color: "var(--cf-muted)", fontSize: "13px" }}>
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;