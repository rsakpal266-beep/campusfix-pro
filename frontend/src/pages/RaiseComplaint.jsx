import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import UserSidebar from "../components/UserSidebar";

function RaiseComplaint() {
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Category name → MySQL category ID
  const categoryIds = {
    "Electrical": 1,
    "Plumbing": 2,
    "Furniture": 3,
    "Cleaning": 4,
    "Internet / Network": 5,
    "Classroom Equipment": 6,
    "Other": 7,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Get logged-in user
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      setError("Please login before raising a complaint.");
      return;
    }

    const user = JSON.parse(savedUser);

    if (!user.id) {
      setError("User information is missing. Please login again.");
      return;
    }

    if (!category || !location || !priority || !description) {
      setError("Please fill all required fields.");
      return;
    }

    const categoryId = categoryIds[category];

    if (!categoryId) {
      setError("Please select a valid complaint category.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            category_id: categoryId,
            location: location,
            priority: priority,
            description: description,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to submit complaint.");
        return;
      }

      setSuccess(
        `Complaint submitted successfully! Ticket ID: ${data.ticket_id}`
      );

      // Clear form
      setCategory("");
      setLocation("");
      setPriority("Medium");
      setDescription("");
      setImage(null);

    } catch (error) {
      setError(
        "Cannot connect to server. Make sure Flask backend is running."
      );
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
            Report a campus maintenance issue and provide the
            details needed for quick resolution.
          </p>
        </div>


        {/* Complaint Form */}
        <div className="complaint-card">

          <form onSubmit={handleSubmit}>

            <div className="form-row">

              <div className="form-group">
                <label>Complaint Category *</label>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Internet / Network">
                    Internet / Network
                  </option>
                  <option value="Classroom Equipment">
                    Classroom Equipment
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>


              <div className="form-group">
                <label>Location *</label>

                <input
                  type="text"
                  placeholder="e.g. Block A, Room 204"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

            </div>


            <div className="form-group">
              <label>Priority *</label>

              <div className="priority-options">

                <label className="priority-option">
                  <input
                    type="radio"
                    name="priority"
                    value="High"
                    checked={priority === "High"}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                  <span>🔴 High</span>
                </label>

                <label className="priority-option">
                  <input
                    type="radio"
                    name="priority"
                    value="Medium"
                    checked={priority === "Medium"}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                  <span>🟡 Medium</span>
                </label>

                <label className="priority-option">
                  <input
                    type="radio"
                    name="priority"
                    value="Low"
                    checked={priority === "Low"}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                  <span>🟢 Low</span>
                </label>

              </div>
            </div>


            <div className="form-group">
              <label>Complaint Description *</label>

              <textarea
                rows="6"
                placeholder="Describe the maintenance problem in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>


            <div className="form-group">
              <label>Upload Image</label>

              <div className="upload-box">
                <span>🖼️</span>

                <p>
                  Upload an image of the problem
                </p>

                <small>
                  JPG, JPEG or PNG
                </small>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </div>
            </div>


            {/* Error Message */}
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="success-message">
                {success}
              </div>
            )}


            <div className="complaint-actions">

              <Link
                to="/dashboard"
                className="cancel-button"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="submit-complaint"
                disabled={loading}
              >
                {loading
                  ? "Submitting..."
                  : "Submit Complaint"}
              </button>

            </div>

          </form>

        </div>

      </main>

    </div>
  );
}

export default RaiseComplaint;