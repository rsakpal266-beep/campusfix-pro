import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import UserSidebar from "../components/UserSidebar";

function RaiseComplaint() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([
    { id: 1, name: "Electrical" },
    { id: 2, name: "Plumbing" },
    { id: 3, name: "Furniture" },
    { id: 4, name: "Cleaning" },
    { id: 5, name: "Internet / Network" },
    { id: 6, name: "Classroom Equipment" },
    { id: 7, name: "Other" },
  ]);

  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // Fetch active categories from backend on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        if (response.ok) {
          const data = await response.json();
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
        }
      } catch (err) {
        console.error("Categories fetch error:", err);
      }
    };

    fetchCategories();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImage(null);
      setImageBase64("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size must be less than 5MB.");
      return;
    }

    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImageBase64("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      setError("Your session has expired. Please login again to submit a complaint.");
      return;
    }

    if (!categoryId) {
      setError("Please select a maintenance category.");
      return;
    }

    if (!location.trim()) {
      setError("Please enter the specific location on campus.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the maintenance issue.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category_id: Number(categoryId),
          location: location.trim(),
          priority: priority,
          description: description.trim(),
          image_path: imageBase64 || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || data.message || "Failed to submit complaint. Please check your inputs.");
        return;
      }

      const ticketId = data.ticket?.ticket_id || data.ticket_id || (data.id ? `#${data.id}` : "");
      setSuccess(`Complaint submitted successfully! Your Ticket ID is ${ticketId}`);
      setSubmittedTicket(data);

      // Reset form fields
      setCategoryId("");
      setLocation("");
      setPriority("Medium");
      setDescription("");
      setImage(null);
      setImageBase64("");
    } catch (err) {
      console.error("Submit ticket error:", err);
      setError("Cannot reach backend server. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="complaint-header">
          <p className="dashboard-label">CAMPUS MAINTENANCE</p>
          <h1>Raise a Complaint</h1>
          <p>
            Report a campus maintenance issue and provide details for rapid inspection & repair.
          </p>
        </div>

        {/* Complaint Form */}
        <div className="complaint-card">
          {/* Success Banner */}
          {success && (
            <div
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid #10b981",
                color: "#6ee7b7",
                padding: "16px",
                borderRadius: "10px",
                marginBottom: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", fontSize: "15px" }}>
                <span>✅</span>
                <span>{success}</span>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <Link
                  to="/my-tickets"
                  style={{
                    background: "#10b981",
                    color: "#ffffff",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  View My Tickets →
                </Link>
                <button
                  type="button"
                  onClick={() => setSuccess("")}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    color: "#e2e8f0",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Report Another Issue
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className="auth-error"
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #ef4444",
                color: "#fca5a5",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              {/* Category */}
              <div className="form-group">
                <label>Complaint Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="form-group">
                <label>Location on Campus *</label>
                <input
                  type="text"
                  placeholder="e.g. Block A, Room 204 or Library 1st Floor"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label>Priority Level *</label>
              <div className="priority-options">
                <label className="priority-option">
                  <input
                    type="radio"
                    name="priority"
                    value="High"
                    checked={priority === "High"}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                  <span>🔴 High Priority</span>
                </label>

                <label className="priority-option">
                  <input
                    type="radio"
                    name="priority"
                    value="Medium"
                    checked={priority === "Medium"}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                  <span>🟡 Medium Priority</span>
                </label>

                <label className="priority-option">
                  <input
                    type="radio"
                    name="priority"
                    value="Low"
                    checked={priority === "Low"}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                  <span>🟢 Low Priority</span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Complaint Description *</label>
              <textarea
                rows="5"
                placeholder="Describe the problem clearly (e.g. AC unit leaking water onto desk row 3, fan making loud noise)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label>Attach Photo (Optional)</label>
              <div className="upload-box" style={{ position: "relative" }}>
                {imageBase64 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    <img
                      src={imageBase64}
                      alt="Complaint Preview"
                      style={{
                        maxHeight: "160px",
                        maxWidth: "100%",
                        borderRadius: "8px",
                        border: "1px solid var(--cf-border)",
                        objectFit: "cover",
                      }}
                    />
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "var(--cf-muted)" }}>{image?.name}</span>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        style={{
                          background: "rgba(239, 68, 68, 0.2)",
                          border: "1px solid #ef4444",
                          color: "#f87171",
                          borderRadius: "6px",
                          padding: "3px 10px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span>📷</span>
                    <p>Click or drag a photo of the maintenance problem</p>
                    <small>Supports PNG, JPG, JPEG (Up to 5MB)</small>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,image/*"
                      onChange={handleImageChange}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer",
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="complaint-actions">
              <Link to="/dashboard" className="cancel-button">
                Cancel
              </Link>

              <button
                type="submit"
                className="submit-complaint"
                disabled={loading}
              >
                {loading ? "Submitting Ticket..." : "Submit Complaint 🚀"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default RaiseComplaint;