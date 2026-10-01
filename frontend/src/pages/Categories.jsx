import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import AdminSidebar from "../components/AdminSidebar";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  // ============================================================
  // FETCH CATEGORIES
  // ============================================================

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Admin login required.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/categories`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load categories."
        );
      }

      setCategories(data.categories || []);
    } catch (err) {
      console.error("Fetch Categories Error:", err);
      setError(err.message || "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ADD CATEGORY
  // ============================================================

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setShowModal(true);
  };

  // ============================================================
  // EDIT CATEGORY
  // ============================================================

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
    setShowModal(true);
  };

  // ============================================================
  // SAVE CATEGORY - FRONTEND ONLY FOR NOW
  // ============================================================

  const handleSaveCategory = () => {
    if (!categoryName.trim()) {
      alert("Please enter category name.");
      return;
    }

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((category) =>
          category.id === editingCategory.id
            ? {
                ...category,
                name: categoryName,
                description: categoryDescription,
              }
            : category
        )
      );
    } else {
      const newCategory = {
        id: Date.now(),
        name: categoryName,
        description: categoryDescription,
        tickets: 0,
      };

      setCategories((prev) => [...prev, newCategory]);
    }

    setShowModal(false);
    setCategoryName("");
    setCategoryDescription("");
    setEditingCategory(null);
  };

  // ============================================================
  // DELETE CATEGORY - FRONTEND ONLY FOR NOW
  // ============================================================

  const handleDeleteCategory = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    setCategories((prev) =>
      prev.filter((category) => category.id !== id)
    );
  };

  // ============================================================
  // SUMMARY
  // ============================================================

  const totalCategories = categories.length;

  const totalTickets = categories.reduce(
    (total, category) =>
      total + Number(category.tickets || 0),
    0
  );

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <div className="dashboard-page">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <AdminSidebar />

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="dashboard-main">

        {/* HEADER */}

        <div className="admin-header">

          <div>

            <p className="dashboard-label">
              ADMINISTRATION
            </p>

            <h1>Categories</h1>

            <p>
              Manage complaint categories and maintenance areas.
            </p>

          </div>


          <div className="admin-profile">

            <span className="admin-initial">
              A
            </span>

            <div>
              <strong>Administrator</strong>
              <small>Admin</small>
            </div>

          </div>

        </div>


        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <div className="dashboard-stats admin-stats">

          <div className="stat-card">

            <div className="stat-icon">
              🗂️
            </div>

            <div>
              <h3>{totalCategories}</h3>
              <p>Total Categories</p>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              🎫
            </div>

            <div>
              <h3>{totalTickets}</h3>
              <p>Total Tickets</p>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              🏫
            </div>

            <div>
              <h3>{totalCategories}</h3>
              <p>Maintenance Areas</p>
            </div>

          </div>

        </div>


        {/* ====================================================
            CATEGORY SECTION
        ==================================================== */}

        <section className="admin-section">

          <div className="admin-section-header">

            <div>

              <h2>Complaint Categories</h2>

              <p>
                Categories available for campus maintenance
                complaints.
              </p>

            </div>


            <button
              className="admin-primary-btn"
              onClick={handleAddCategory}
            >
              + Add Category
            </button>

          </div>


          {/* ERROR */}

          {error && (
            <div className="notification-error">
              {error}
            </div>
          )}


          {/* LOADING */}

          {loading ? (

            <div className="notification-empty">

              <div className="notification-empty-icon">
                ⏳
              </div>

              <h3>Loading categories...</h3>

              <p>
                Please wait while categories are loaded.
              </p>

            </div>

          ) : categories.length === 0 ? (

            <div className="notification-empty">

              <div className="notification-empty-icon">
                🗂️
              </div>

              <h3>No Categories Found</h3>

              <p>
                There are currently no complaint categories.
              </p>

            </div>

          ) : (

            <div className="admin-quick-grid">

              {categories.map((category) => (

                <div
                  className="admin-action-card"
                  key={category.id}
                >

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >

                    <span>🛠️</span>

                    <div>

                      <button
                        onClick={() =>
                          handleEditCategory(category)
                        }
                        title="Edit Category"
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          marginRight: "6px",
                        }}
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteCategory(category.id)
                        }
                        title="Delete Category"
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        🗑️
                      </button>

                    </div>

                  </div>


                  <h3>
                    {category.name}
                  </h3>


                  <p>
                    {category.description ||
                      "No description available."}
                  </p>


                  <p>
                    🎫 {category.tickets || 0} Tickets
                  </p>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* ====================================================
            ADD / EDIT MODAL
        ==================================================== */}

        {showModal && (

          <div className="admin-modal-overlay">

            <div className="admin-modal">

              <div className="admin-modal-header">

                <h2>
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <button
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>

              </div>


              <div className="admin-modal-body">

                <div className="admin-form-group">

                  <label>
                    Category Name
                  </label>

                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) =>
                      setCategoryName(e.target.value)
                    }
                    placeholder="Enter category name"
                  />

                </div>


                <div className="admin-form-group">

                  <label>
                    Description
                  </label>

                  <textarea
                    value={categoryDescription}
                    onChange={(e) =>
                      setCategoryDescription(
                        e.target.value
                      )
                    }
                    placeholder="Enter category description"
                    rows="4"
                  />

                </div>

              </div>


              <div className="admin-modal-footer">

                <button
                  className="admin-secondary-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="admin-primary-btn"
                  onClick={handleSaveCategory}
                >
                  {editingCategory
                    ? "Update Category"
                    : "Add Category"}
                </button>

              </div>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}

export default Categories;