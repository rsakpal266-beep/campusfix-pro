import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email or username.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to send reset link.");
        return;
      }

      sessionStorage.setItem("reset_token", data.reset_token);

      setMessage(
        data.message || "Password reset request created successfully."
      );

      setTimeout(() => {
        window.location.href = "/reset-password";
      }, 1000);

    } catch (error) {
      setError(
        "Cannot connect to server. Make sure Flask backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <h2>Forgot Password?</h2>

        <p className="auth-subtitle">
          Enter your registered email address to reset your password.
        </p>

        <form onSubmit={handleForgotPassword}>

          <label>Email / Username</label>

          <input
            type="text"
            placeholder="Enter your email or username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;