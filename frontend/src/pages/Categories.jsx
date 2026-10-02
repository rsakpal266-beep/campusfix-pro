import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import AdminSidebar from "../components/AdminSidebar";

const ICON_OPTIONS = [
  { value: "zap", label: "⚡ Electrical" },
  { value: "droplet", label: "💧 Plumbing" },
  { value: "chair", label: "🪑 Furniture" },
  { value: "sparkles", label: "✨ Cleaning" },
  { value: "wifi", label: "📶 Internet / Network" },
  { value: "monitor", label: "🖥️ Classroom Equipment" },
  { value: "snowflake", label: "❄️ HVAC / Air Conditioning" },
  { value: "shield", label: "🛡️ Security & Locks" },
  { value: "wrench", label: "🔧 General / Maintenance" },
];

function getCategoryEmoji(iconName) {
  switch (iconName) {
    case "zap": return "⚡";
    case "droplet": return "💧";
    case "chair": return "🪑";
    case "sparkles": return "✨";
    case "wifi": return "📶";
    case "monitor": return "🖥️";
    case "snowflake": return "❄️";
    case "shield": return "🛡️";
    default: return "🔧";
  }
}

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("wrench");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const collegeName = storedUser.college_name || "College Administration";

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/admin/categories`);
      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.detail || data.message || "Failed to load categories.");
      }

      setCategories(data.categories || []);
    } catch (err) {
      console.error("Fetch Categories Error:", err);
      setError("Unable to connect to backend server. Please verify backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryIcon("wrench");
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryDescription(cat.description || "");
    setCategoryIcon(cat.icon || "wrench");
    setModalError("");
    setShowModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!categoryName.trim()) {
      setModalError("Please enter a category name.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setModalError("Admin session expired. Please log in again.");
      return;
    }

    try {
      setModalLoading(true);

      const url = editingCategory
        ? `${API_BASE_URL}/api/admin/categories/${editingCategory.id}`
        : `${API_BASE_URL}/api/admin/categories`;

      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          description: categoryDescription.trim(),
          icon: categoryIcon,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.detail || data.message || "Failed to save category.");
      }

      setSuccessMsg(
        editingCategory
          ? `Category '${categoryName}' updated successfully!`
          : `🎉 Category '${categoryName}' created successfully!`
      );
      setShowModal(false);
      fetchCategories();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Save category error:", err);
      setModalError(err.message || "An error occurred while saving.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete category "${cat.name}"?`
    );
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Admin login required.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/categories/${cat.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        alert(data.detail || data.message || "Failed to delete category.");
        return;
      }

      setSuccessMsg(`Category "${cat.name}" deleted successfully.`);
      fetchCategories();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Delete category error:", err);
      alert("Error deleting category. Please try again.");
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalTicketsCount = categories.reduce(
    (sum, c) => sum + (c.ticket_count || 0),
    0
  );

  return (
    <div className="dashboard-page">
      <AdminSidebar />

      <main className="dashboard-main">
        {/* HEADER */}
        <header
          className="dashboard-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="role-badge admin">🏛️ {collegeName}</span>
              <span style={{ color: "var(--cf-lime)", fontSize: "13px", fontWeight: "600" }}>• System Active</span>
            </div>
            <h1>Complaint Categories & Maintenance Areas</h1>
            <p>Define and manage issue categories, technical domains, and problem routing for campus tickets.</p>
          </div>

          <button
            className="onboard-btn"
            onClick={handleOpenAddModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <span>➕</span> + Add Category
          </button>
        </header>

        {/* FEEDBACK BANNERS */}
        {successMsg && (
          <div
            style={{
              background: "rgba(163, 230, 53, 0.15)",
              border: "1px solid var(--cf-lime)",
              color: "var(--cf-lime)",
              padding: "12px 18px",
              borderRadius: "10px",
              margin: "16px 0",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>✅</span> {successMsg}
          </div>
        )}

        {error && (
          <div
            className="notification-error"
            style={{
              margin: "16px 0",
              padding: "14px 18px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              borderRadius: "10px",
              color: "#fca5a5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>⚠️ {error}</span>
            <button
              onClick={fetchCategories}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              🔄 Retry
            </button>
          </div>
        )}

        {/* STATS OVERVIEW */}
        <div className="dashboard-stats" style={{ marginTop: "18px" }}>
          <div className="stat-card">
            <div className="stat-icon">🗂️</div>
            <div>
              <h3>{categories.length}</h3>
              <p>Total Categories</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎫</div>
            <div>
              <h3>{totalTicketsCount}</h3>
              <p>Total Linked Tickets</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div>
              <h3>{categories.filter((c) => c.is_active !== false).length}</h3>
              <p>Active Service Domains</p>
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div
          style={{
            margin: "24px 0 16px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ position: "relative", minWidth: "280px", maxWidth: "420px", flex: 1 }}>
            <span
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--cf-muted)",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                background: "#05120a",
                border: "1px solid var(--cf-border)",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <span style={{ color: "var(--cf-muted)", fontSize: "13px" }}>
            Showing <strong>{filteredCategories.length}</strong> of {categories.length} categories
          </span>
        </div>

        {/* CATEGORY GRID */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--cf-muted)" }}>
            ⏳ Loading complaint categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              background: "var(--cf-card)",
              borderRadius: "16px",
              border: "1px dashed var(--cf-border)",
              marginTop: "16px",
            }}
          >
            <span style={{ fontSize: "40px" }}>🗂️</span>
            <h3 style={{ color: "#ffffff", margin: "12px 0 6px 0" }}>No Categories Found</h3>
            <p style={{ color: "var(--cf-muted)", fontSize: "14px", marginBottom: "16px" }}>
              {searchQuery ? "No categories match your search term." : "Create your first complaint category."}
            </p>
            <button className="onboard-btn" onClick={handleOpenAddModal} style={{ padding: "8px 16px" }}>
              + Add Category
            </button>
          </div>
        ) : (
          <div className="admin-quick-grid">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="admin-action-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: "rgba(163, 230, 53, 0.12)",
                        border: "1px solid rgba(163, 230, 53, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                      }}
                    >
                      {getCategoryEmoji(cat.icon)}
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => handleOpenEditModal(cat)}
                        title="Edit Category"
                        style={{
                          background: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid var(--cf-border)",
                          color: "#e2e8f0",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          cursor: "pointer",
                          fontSize: "13px",
                          transition: "all 0.2s",
                        }}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        title="Delete Category"
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#f87171",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          cursor: "pointer",
                          fontSize: "13px",
                          transition: "all 0.2s",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <h3 style={{ margin: "0 0 6px 0", color: "#ffffff", fontSize: "17px", fontWeight: "700" }}>
                    {cat.name}
                  </h3>

                  <p
                    style={{
                      color: "var(--cf-muted)",
                      fontSize: "13.5px",
                      lineHeight: "1.5",
                      margin: "0 0 16px 0",
                      minHeight: "40px",
                    }}
                  >
                    {cat.description || "General maintenance and repair category."}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid rgba(74, 222, 128, 0.12)",
                    paddingTop: "12px",
                    fontSize: "12.5px",
                  }}
                >
                  <span
                    style={{
                      background: "rgba(163, 230, 53, 0.1)",
                      color: "var(--cf-lime)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontWeight: "600",
                    }}
                  >
                    🎫 {cat.ticket_count || 0} Tickets
                  </span>

                  <span style={{ color: "#4ade80", fontSize: "12px" }}>
                    ● Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============================================================
            ADD / EDIT MODAL
        ============================================================ */}
        {showModal && (
          <div className="credentials-modal-overlay">
            <div className="credentials-modal" style={{ maxWidth: "520px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(74, 222, 128, 0.15)",
                  paddingBottom: "14px",
                  marginBottom: "16px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: "var(--cf-lime)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "20px",
                  }}
                >
                  <span>{editingCategory ? "✏️" : "🗂️"}</span>
                  {editingCategory ? "Edit Category" : "Add New Complaint Category"}
                </h2>

                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "20px",
                    padding: "4px",
                  }}
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid #ef4444",
                    color: "#fca5a5",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    marginBottom: "14px",
                    fontSize: "13px",
                  }}
                >
                  ⚠️ {modalError}
                </div>
              )}

              <form onSubmit={handleSaveCategory}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)", fontWeight: "600" }}>
                      Category Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Air Conditioning & Ventilation"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        background: "#05120a",
                        border: "1px solid var(--cf-border)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)", fontWeight: "600" }}>
                      Category Icon
                    </label>
                    <select
                      value={categoryIcon}
                      onChange={(e) => setCategoryIcon(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        background: "#05120a",
                        border: "1px solid var(--cf-border)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)", fontWeight: "600" }}>
                      Description
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Brief details about what issues fall under this category..."
                      value={categoryDescription}
                      onChange={(e) => setCategoryDescription(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        background: "#05120a",
                        border: "1px solid var(--cf-border)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    marginTop: "22px",
                    paddingTop: "14px",
                    borderTop: "1px solid rgba(74, 222, 128, 0.15)",
                  }}
                >
                  <button
                    type="button"
                    className="admin-secondary-btn"
                    onClick={() => setShowModal(false)}
                    disabled={modalLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="onboard-btn"
                    disabled={modalLoading}
                    style={{
                      padding: "10px 22px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    {modalLoading ? "Saving..." : editingCategory ? "Update Category 🚀" : "Add Category 🚀"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Categories;