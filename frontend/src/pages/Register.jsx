import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    college_name: "",
    college_code: "",
    admin_name: "",
    email: "",
    phone: "",
    campus_address: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!formData.college_name.trim()) {
      setError("Please enter your College / Institution Name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please provide an official college email address.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          college_name: formData.college_name.trim(),
          college_code: formData.college_code.trim(),
          admin_name: formData.admin_name.trim() || `${formData.college_name.trim()} Administrator`,
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          campus_address: formData.campus_address.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || data.message || "Registration failed.");
        return;
      }

      // Automatically store token & user
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setMessage(
        `🎉 ${formData.college_name} registered successfully! Redirecting to College Management Console...`
      );

      setTimeout(() => {
        navigate("/admin-dashboard");
      }, 1500);
    } catch (err) {
      console.error("Register error:", err);
      setError("Unable to connect to the backend server. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-enhanced" style={{ maxWidth: "560px" }}>
        {/* Brand Header */}
        <div className="login-logo">
          <div className="login-brand-text">
            <strong>
              CampusFix <span>Pro</span>
            </strong>
            <small>INSTITUTIONAL MAINTENANCE & REPAIR SYSTEM</small>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <span style={{ fontSize: "36px" }}>🏛️</span>
          <h2 style={{ margin: "6px 0", color: "#ffffff" }}>Register Your College</h2>
          <p className="auth-subtitle" style={{ margin: 0 }}>
            Create an official institution account to manage campus work orders, technicians, faculty, and students.
          </p>
        </div>

        {/* Institutional Onboarding Notice */}
        <div
          style={{
            background: "rgba(163, 230, 53, 0.08)",
            border: "1px dashed var(--cf-lime)",
            borderRadius: "10px",
            padding: "12px 14px",
            marginBottom: "18px",
            fontSize: "13px",
            color: "#e2e8f0",
            lineHeight: "1.5",
          }}
        >
          <strong style={{ color: "var(--cf-lime)" }}>🛡️ How Access Works:</strong>
          <br />
          Only Colleges/Institutions register here. Once registered, the College Admin adds{" "}
          <strong>Technicians</strong>, <strong>Faculty</strong>, and <strong>Students</strong>{" "}
          from the dashboard and provides them with their login email and password. Those roles do not self-register.
        </div>

        {error && (
          <div
            className="auth-error-banner"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              color: "#fca5a5",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "14px",
              fontSize: "13px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div
            className="auth-info-banner"
            style={{
              background: "rgba(163, 230, 53, 0.15)",
              border: "1px solid var(--cf-lime)",
              color: "var(--cf-lime)",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "14px",
              fontSize: "13px",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* College Name */}
            <div style={{ gridColumn: "span 2" }}>
              <label>College / University Name *</label>
              <input
                type="text"
                name="college_name"
                value={formData.college_name}
                onChange={handleChange}
                placeholder="e.g. Apex Institute of Technology"
                required
              />
            </div>

            {/* Campus Code */}
            <div>
              <label>College / Campus Code</label>
              <input
                type="text"
                name="college_code"
                value={formData.college_code}
                onChange={handleChange}
                placeholder="e.g. APEX-01"
              />
            </div>

            {/* Administrator Full Name */}
            <div>
              <label>Admin / Registrar Name *</label>
              <input
                type="text"
                name="admin_name"
                value={formData.admin_name}
                onChange={handleChange}
                placeholder="e.g. Dr. Sarah Jenkins"
                required
              />
            </div>

            {/* Official College Email */}
            <div style={{ gridColumn: "span 2" }}>
              <label>Official College Admin Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. admin@apex.edu"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label>Contact Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>

            {/* Campus City / Address */}
            <div>
              <label>Campus Location / City</label>
              <input
                type="text"
                name="campus_address"
                value={formData.campus_address}
                onChange={handleChange}
                placeholder="e.g. North Campus, Pune"
              />
            </div>

            {/* Password */}
            <div>
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
            style={{ width: "100%", padding: "14px", marginTop: "16px" }}
          >
            {loading ? "Registering College..." : "Register College & Launch Dashboard 🏛️"}
          </button>
        </form>

        <div className="auth-switch" style={{ marginTop: "18px", textAlign: "center" }}>
          <span>Already registered your College? </span>
          <Link to="/login" style={{ color: "var(--cf-lime)", fontWeight: "bold" }}>
            Sign In to Portal
          </Link>
        </div>

        <div
          style={{
            marginTop: "12px",
            textAlign: "center",
            fontSize: "12px",
            color: "var(--cf-muted)",
          }}
        >
          🎓 Are you a <strong>Technician</strong>, <strong>Faculty</strong>, or{" "}
          <strong>Student</strong>?<br />
          Please log in using the email & password provided by your College Admin.
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

export default Register;