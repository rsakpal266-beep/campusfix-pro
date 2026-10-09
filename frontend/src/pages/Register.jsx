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

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!formData.full_name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (role === "admin" && !formData.college_name.trim()) {
      setError("Please enter your College / Institution Name.");
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
      let payload;

      if (role === "admin") {
        // Preserve the existing College Admin registration format.
        payload = {
          college_name: formData.college_name.trim(),
          college_code: formData.college_code.trim(),
          admin_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          campus_address: formData.campus_address.trim(),
          password: formData.password,
        };
      } else {
        // Student and Faculty registration.
        payload = {
          role,
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          department: formData.department.trim(),
          student_or_emp_id: formData.student_or_emp_id.trim(),
          college_name: formData.college_name.trim(),
          password: formData.password,
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data.detail === "string"
            ? data.detail
            : data.message || "Registration failed."
        );
        return;
      }

      // College Admin keeps the existing automatic login behavior.
      if (role === "admin" && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setMessage(
          "College registered successfully! Redirecting to Admin Dashboard..."
        );

        setTimeout(() => {
          navigate("/admin-dashboard");
        }, 1200);

        return;
      }

      setMessage(
        `${role === "student" ? "Student" : "Faculty"} registration successful! Please log in.`
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        "Unable to connect to the backend server. Please check your connection."
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

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span style={{ fontSize: "36px" }}>
            {role === "admin" ? "🏛️" : role === "faculty" ? "👩‍🏫" : "🎓"}
          </span>

          <h2 style={{ margin: "6px 0", color: "#ffffff" }}>
            {role === "admin"
              ? "Register Your College"
              : "Create Your Account"}
          </h2>

          <p className="auth-subtitle" style={{ margin: 0 }}>
            {role === "admin"
              ? "Create an institution account to manage campus maintenance."
              : "Register to report and track campus maintenance complaints."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>Register As *</label>
          <select
            name="role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setError("");
              setMessage("");
            }}
            required
          >
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="admin">College Admin</option>
          </select>

          <label>
            {role === "admin" ? "Admin / Registrar Name *" : "Full Name *"}
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />

          <label>
            {role === "admin" ? "Official College Email *" : "Email Address *"}
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            required
          />

          {role === "admin" ? (
            <>
              <label>College / Institution Name *</label>
              <input
                type="text"
                name="college_name"
                value={formData.college_name}
                onChange={handleChange}
                placeholder="Enter college name"
                required
              />

              <label>College / Campus Code</label>
              <input
                type="text"
                name="college_code"
                value={formData.college_code}
                onChange={handleChange}
                placeholder="e.g. COLLEGE-01"
              />

              <label>Campus Location / City</label>
              <input
                type="text"
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
                type="text"
                name="college_name"
                value={formData.college_name}
                onChange={handleChange}
                placeholder="Enter your college name"
              />

              <label>
                {role === "student" ? "Student ID" : "Employee ID"}
              </label>
              <input
                type="text"
                name="student_or_emp_id"
                value={formData.student_or_emp_id}
                onChange={handleChange}
                placeholder="Enter your ID (optional)"
              />

              <label>Department / Class</label>
              <input
                type="text"
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
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "16px",
            }}
          >
            {loading
              ? "Registering..."
              : role === "admin"
                ? "Register College 🏛️"
                : `Register as ${role === "student" ? "Student 🎓" : "Faculty 👩‍🏫"}`}
          </button>
        </form>

        <div
          className="auth-switch"
          style={{ marginTop: "18px", textAlign: "center" }}
        >
          Already have an account?{" "}
          <Link to="/login" style={{ fontWeight: "bold" }}>
            Sign In
          </Link>
        </div>

        <div
          style={{
            marginTop: "14px",
            textAlign: "center",
            fontSize: "12px",
            color: "var(--cf-muted)",
          }}
        >
          🔒 Technician accounts can only be created by an authorized College
          Admin.
        </div>

        <div style={{ textAlign: "center", marginTop: "14px" }}>
          <Link to="/" className="back-home">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
