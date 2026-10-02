import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const resetToken = sessionStorage.getItem("reset_token");

    if (!resetToken) {
      setError("Reset session expired. Please request a new reset link.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reset_token: resetToken,
            new_password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Password reset failed.");
        return;
      }

      sessionStorage.removeItem("reset_token");

      setMessage(
        data.message || "Password reset successfully."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      setError(
        "Cannot connect to server. Make sure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <h2>Reset Password</h2>

        <p className="auth-subtitle">
          Enter your new password below.
        </p>

        <form onSubmit={handleResetPassword}>

          <label>New Password</label>

          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label>Confirm Password</label>

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
          />

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          {message && (
            <p className="auth-success">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>

        </form>

        <p className="auth-switch">
          Remember your password?
          <Link to="/login"> Login</Link>
        </p>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>

      </div>

    </div>
  );
}

export default ResetPassword;