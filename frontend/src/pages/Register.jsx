
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "",
    student_or_emp_id: "",
    college_name: "",
    college_code: "",
    campus_address: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!formData.full_name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (role === "admin" && !formData.college_name.trim()) {
      setError("Please enter your college name.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const payload =
        role === "admin"
          ? {
              role: "admin",
              college_name: formData.college_name.trim(),
              college_code: formData.college_code.trim(),
              admin_name: formData.full_name.trim(),
              email: formData.email.trim().toLowerCase(),
              phone: formData.phone.trim(),
              campus_address: formData.campus_address.trim(),
              password: formData.password,
            }
          : {
              role,
              full_name: formData.full_name.trim(),
              email: formData.email.trim().toLowerCase(),
              phone: formData.phone.trim(),
              department: formData.department.trim(),
              student_or_emp_id: formData.student_or_emp_id.trim(),
              college_name: formData.college_name.trim(),
              password: formData.password,
            };

      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || data.message || "Registration failed.");
        return;
      }

      // College Admin registration keeps the existing auto-login flow.
      if (role === "admin" && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setMessage("College registered successfully! Redirecting...");

        setTimeout(() => navigate("/admin-dashboard"), 1200);
        return;
      }

      setMessage("Registration successful! Please log in.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        "Unable to connect to the server. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div
        className="auth-card auth-card-enhanced"
        style={{ maxWidth: "560px" }}
      >
        <div className="login-logo">
          <div className="login-brand-text">
            <strong>
              CampusFix <span>Pro</span>
            </strong>
            <small>MAINTENANCE & REPAIR SYSTEM</small>
          </div>
        </div>

        <h2 style={{ textAlign: "center", color: "#ffffff" }}>
          Create Your Account
        </h2>

        <p className="auth-subtitle" style={{ textAlign: "center" }}>
          Register to report and track campus maintenance complaints.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>Register As *</label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setError("");
              setMessage("");
            }}
          >
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="admin">College Admin</option>
          </select>

          <label>Full Name *</label>
          <input
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />

          <label>Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />

          {role === "admin" ? (
            <>
              <label>College / Institution Name *</label>
              <input
                name="college_name"
                value={formData.college_name}
                onChange={handleChange}
                placeholder="Enter college name"
                required
              />

              <label>College / Campus Code</label>
              <input
                name="college_code"
                value={formData.college_code}
                onChange={handleChange}
                placeholder="Enter college code"
              />

              <label>Campus Location / City</label>
              <input
                name="campus_address"
                value={formData.campus_address}
                onChange={handleChange}
                placeholder="Enter campus location"
              />
            </>
          ) : (
            <>
              <label>College / Institution Name</label>
              <input
                name="college_name"
                value={formData.college_name}
                onChange={handleChange}
                placeholder="Enter your college name"
              />

              <label>
                {role === "student"
                  ? "Student ID (optional)"
                  : "Employee ID (optional)"}
              </label>
              <input
                name="student_or_emp_id"
                value={formData.student_or_emp_id}
                onChange={handleChange}
                placeholder="Enter your ID"
              />

              <label>Department / Class</label>
              <input
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Information Technology"
              />
            </>
          )}

          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />

          <label>Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            minLength={6}
            required
          />

          <label>Confirm Password *</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            required
          />

          {error && (
            <div className="auth-error-banner" role="alert">
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div className="auth-info-banner" role="status">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
            style={{ width: "100%", padding: "14px", marginTop: "16px" }}
          >
            {loading
              ? "Registering..."
              : role === "admin"
                ? "Register College"
                : `Register as ${role === "student" ? "Student" : "Faculty"}`}
          </button>
        </form>

        <div className="auth-switch" style={{ textAlign: "center" }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px" }}>
          Technician accounts can only be created by an authorized College
          Admin.
        </p>

        <div style={{ textAlign: "center" }}>
          <Link to="/">← Back to Homepage</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
