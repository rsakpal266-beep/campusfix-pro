import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import AdminSidebar from "../components/AdminSidebar";

function AdminTechnicians() {
  const [technicians, setTechnicians] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add Technician Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    specialization: "Electrical & Appliances",
    phone: "",
    department: "Facilities & Maintenance",
  });

  // Credential Modal State
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const collegeName = storedUser.college_name || "College Administration";

  // ============================================================
  // LOAD TECHNICIANS
  // ============================================================
  const loadTechnicians = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/admin/technicians`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        setError(data.message || "Failed to load technicians.");
        return;
      }

      setTechnicians(data.technicians || []);
    } catch (err) {
      setError("Cannot connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Admin login session not found.");
      setLoading(false);
      return;
    }

    loadTechnicians();
  }, []);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pwd }));
  };

  const handleOpenAddModal = () => {
    setFormData({
      full_name: "",
      email: "",
      password: "",
      specialization: "Electrical & Appliances",
      phone: "",
      department: "Facilities & Maintenance",
    });
    setModalError("");
    setShowAddModal(true);
    generatePassword();
  };

  const handleCreateTechnician = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!formData.full_name || !formData.email || !formData.password) {
      setModalError("Name, Email, and Password are required.");
      return;
    }

    try {
      setModalLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: "technician",
          department: formData.department.trim(),
          specialization: formData.specialization.trim(),
          phone: formData.phone.trim(),
          college_name: collegeName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setModalError(data.detail || data.message || "Failed to onboard technician.");
        return;
      }

      setCreatedCredentials(data.credentials);
      setShowAddModal(false);
      setSuccessMsg(`Technician ${formData.full_name} onboarded! Provide their credentials below.`);
      loadTechnicians();
    } catch (err) {
      setModalError("Network error while creating technician.");
    } finally {
      setModalLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const textToCopy =
      createdCredentials.share_message ||
      `🏛️ ${collegeName} — Technician Account:\nName: ${createdCredentials.full_name}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLogin: ${window.location.origin}/login`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const filteredTechnicians = technicians.filter((tech) => {
    const searchText = search.toLowerCase();
    return (
      String(tech.full_name || "").toLowerCase().includes(searchText) ||
      String(tech.email || "").toLowerCase().includes(searchText) ||
      String(tech.phone || "").toLowerCase().includes(searchText) ||
      String(tech.specialization || "").toLowerCase().includes(searchText)
    );
  });

  return (
    <div className="dashboard-page">
      <AdminSidebar />

      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="role-badge admin">🏛️ {collegeName}</span>
              <span style={{ color: "var(--cf-lime)", fontSize: "13px", fontWeight: "600" }}>• Technical Roster</span>
            </div>
            <h1>Campus Technicians</h1>
            <p>
              Technicians are provisioned by your college. Add new technicians and provide them with their login credentials.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="onboard-btn"
            style={{ padding: "10px 20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <span>➕</span> Onboard New Technician
          </button>
        </header>

        {successMsg && (
          <div
            className="notification-success"
            style={{
              background: "rgba(163, 230, 53, 0.15)",
              border: "1px solid var(--cf-lime)",
              color: "var(--cf-lime)",
              padding: "12px 18px",
              borderRadius: "10px",
              margin: "15px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>✅ {successMsg}</span>
            <button
              onClick={() => setSuccessMsg("")}
              style={{ background: "none", border: "none", color: "var(--cf-lime)", cursor: "pointer", fontSize: "16px" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Statistics */}
        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">👨‍🔧</span>
            <div>
              <h3>{technicians.length}</h3>
              <p>Total Technicians</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">⚡</span>
            <div>
              <h3>{technicians.filter((t) => (t.specialization || "").toLowerCase().includes("electric")).length}</h3>
              <p>Electrical Specialists</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">💧</span>
            <div>
              <h3>{technicians.filter((t) => (t.specialization || "").toLowerCase().includes("plumb")).length}</h3>
              <p>Plumbing Specialists</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">🌐</span>
            <div>
              <h3>{technicians.filter((t) => (t.specialization || "").toLowerCase().includes("net") || (t.specialization || "").toLowerCase().includes("it")).length}</h3>
              <p>IT & Network Specialists</p>
            </div>
          </div>
        </section>

        {/* Technician Section */}
        <section className="admin-ticket-section">
          {/* Search */}
          <div className="ticket-filter-bar">
            <input
              type="text"
              placeholder="🔎 Search technician by name, specialization, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {error && <p style={{ color: "red", margin: "15px 0" }}>{error}</p>}

          {loading ? (
            <p style={{ padding: "20px" }}>Loading technicians...</p>
          ) : (
            <div className="admin-ticket-table-wrapper">
              <table className="admin-ticket-table">
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th>Email Address (Login ID)</th>
                    <th>Contact Phone</th>
                    <th>Specialization</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTechnicians.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "30px" }}>
                        No technicians found. Click "+ Onboard New Technician" above to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredTechnicians.map((technician) => (
                      <tr key={technician.id}>
                        <td>
                          <strong>{technician.full_name}</strong>
                        </td>
                        <td style={{ color: "#e2e8f0" }}>{technician.email || "—"}</td>
                        <td>{technician.phone || "—"}</td>
                        <td>
                          <span style={{ color: "var(--cf-lime)" }}>
                            {technician.specialization || "General Maintenance"}
                          </span>
                        </td>
                        <td>
                          <span className="status assigned">Active Technician</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* MODAL: ONBOARD TECHNICIAN */}
      {showAddModal && (
        <div className="credentials-modal-overlay">
          <div className="credentials-modal" style={{ maxWidth: "540px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--cf-border)", paddingBottom: "12px" }}>
              <h2 style={{ margin: 0, color: "var(--cf-lime)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🛠️</span> Onboard Campus Technician
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "20px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: "var(--cf-muted)", fontSize: "13px", margin: "12px 0 16px 0" }}>
              Add a maintenance technician to <strong>{collegeName}</strong>. You will receive a copyable credentials card to share with them so they can log in.
            </p>

            {modalError && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#fca5a5", padding: "10px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px" }}>
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTechnician}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)" }}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Hari Kumar"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px", background: "#05120a", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px" }}
                  />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)" }}>Login Email *</label>
                  <input
                    type="email"
                    placeholder="e.g. hari.tech@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px", background: "#05120a", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px" }}
                  />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "13px", color: "var(--cf-muted)" }}>Assigned Password (for technician login) *</label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      style={{ background: "rgba(163, 230, 53, 0.15)", border: "1px solid var(--cf-lime)", color: "var(--cf-lime)", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}
                    >
                      ⚡ Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px", background: "#05120a", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px", fontFamily: "monospace" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)" }}>Specialization</label>
                  <select
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    style={{ width: "100%", padding: "10px", background: "#05120a", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px" }}
                  >
                    <option value="Electrical & Appliances">Electrical & Appliances</option>
                    <option value="Plumbing & Sanitation">Plumbing & Sanitation</option>
                    <option value="Furniture & Carpentry">Furniture & Carpentry</option>
                    <option value="Network & Wi-Fi Systems">Network & Wi-Fi Systems</option>
                    <option value="Audio-Visual & Smartboards">Audio-Visual & Smartboards</option>
                    <option value="General Campus Maintenance">General Campus Maintenance</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--cf-muted)" }}>Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: "100%", padding: "10px", background: "#05120a", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--cf-border)", color: "#ffffff", borderRadius: "8px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="btn-primary"
                  style={{ padding: "8px 22px" }}
                >
                  {modalLoading ? "Onboarding..." : "Onboard & Get Credentials 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS SHARE MODAL */}
      {createdCredentials && (
        <div className="credentials-modal-overlay">
          <div className="credentials-modal">
            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <span style={{ fontSize: "42px" }}>🎉</span>
              <h2 style={{ color: "var(--cf-lime)", margin: "10px 0 5px 0" }}>
                Technician Credentials Generated!
              </h2>
              <p style={{ color: "var(--cf-muted)", fontSize: "14px" }}>
                Share these login details with the technician so they can sign in to their dashboard.
              </p>
            </div>

            <div className="credentials-card-box">
              <div className="cred-row">
                <span className="cred-label">Institution:</span>
                <span className="cred-val" style={{ color: "#ffffff" }}>
                  {createdCredentials.college_name || collegeName}
                </span>
              </div>
              <div className="cred-row">
                <span className="cred-label">Role:</span>
                <span className="cred-val" style={{ color: "var(--cf-lime)" }}>
                  Technician
                </span>
              </div>
              <div className="cred-row">
                <span className="cred-label">Name:</span>
                <span className="cred-val">{createdCredentials.full_name}</span>
              </div>
              <div className="cred-row">
                <span className="cred-label">Login Email:</span>
                <span className="cred-val">{createdCredentials.email}</span>
              </div>
              <div className="cred-row">
                <span className="cred-label">Password:</span>
                <span className="cred-val" style={{ letterSpacing: "1px", color: "var(--cf-lime)", fontWeight: "bold" }}>
                  {createdCredentials.password}
                </span>
              </div>
              <div className="cred-row">
                <span className="cred-label">Login URL:</span>
                <span className="cred-val">{window.location.origin}/login</span>
              </div>
            </div>

            <div className="cred-share-actions">
              <button onClick={copyCredentials} className="share-btn-copy">
                {copied ? "✅ Copied to Clipboard!" : "📋 Copy All Login Credentials"}
              </button>

              <a
                href={`mailto:${createdCredentials.email}?subject=${encodeURIComponent(`Technician Login Credentials - ${collegeName}`)}&body=${encodeURIComponent(createdCredentials.share_message || "")}`}
                className="share-btn-email"
              >
                <span>✉️</span> Share via Email
              </a>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(createdCredentials.share_message || "")}`}
                target="_blank"
                rel="noreferrer"
                className="share-btn-wa"
              >
                <span>💬</span> Share on WhatsApp
              </a>
            </div>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                onClick={() => setCreatedCredentials(null)}
                style={{ background: "none", border: "none", color: "var(--cf-muted)", cursor: "pointer", fontSize: "14px", textDecoration: "underline" }}
              >
                Done / Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTechnicians;