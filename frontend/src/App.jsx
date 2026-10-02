import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserDashboard from "./pages/UserDashboard";
import RaiseComplaint from "./pages/RaiseComplaint";
import MyTickets from "./pages/MyTickets";
import TicketDetails from "./pages/TicketDetails";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import FixBot from "./pages/FixBot";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTickets from "./pages/AdminTickets"; 
import ManageUsers from "./pages/ManageUsers";
import Categories from "./pages/Categories";
import AdminNotifications from "./pages/AdminNotifications";
import AdminReports from "./pages/AdminReports";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import TechnicianTickets from "./pages/TechnicianTickets";
import TechnicianTicketDetails from "./pages/TechnicianTicketDetails";
import TechnicianNotifications from "./pages/TechnicianNotifications";
import TechnicianProfile from "./pages/TechnicianProfile";
import AdminTechnicians from "./pages/AdminTechnicians";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="app">

      {/* Navbar */}
<nav className="navbar">

  <div className="logo">
    <div className="brand-icon">
      🔧
    </div>

    <div className="brand-text">
      <strong>
        CampusFix <span>Pro</span>
      </strong>
      <small>MAINTENANCE & REPAIR SYSTEM</small>
    </div>
  </div>

  <div className="nav-links">
    <a href="#home">Home</a>
    <a href="#features">Features</a>
    <a href="#how-it-works">How It Works</a>
    <a href="#about">About</a>
  </div>

  <div className="nav-buttons">
    <button
      className="portal-btn"
      onClick={() => navigate("/login")}
      title="Access Student, Technician, or Admin Portals"
    >
      🔑 Portals Login
    </button>

    <button
      className="register-btn"
      onClick={() => navigate("/register")}
    >
      🏛️ Register College
    </button>
  </div>

</nav>

      {/* Hero Section */}
<section id="home" className="hero-section">

  <div className="hero-content">

    <div className="hero-badge">
      ✨ Smart Campus Maintenance & FixBot AI Assistant
    </div>

    <h1>
      Campus Maintenance &<br />
      <span>Repair Ticket System</span>
    </h1>

    <p className="hero-description">
      Centralized platform for students, faculty, technicians, and administrators to report, track, assign, and resolve campus maintenance problems in real time.
    </p>

    <div className="hero-actions">

      <button
        className="report-btn"
        onClick={() => {
          const user = localStorage.getItem("user");
          if (user) {
            navigate("/raise-complaint");
          } else {
            navigate("/login");
          }
        }}
      >
        Report an Issue
      </button>

      <button
        className="portal-hero-btn"
        onClick={() => navigate("/login")}
      >
        🚀 Dashboard Portals
      </button>

      <button
        className="learn-btn"
        onClick={() => {
          document.getElementById("features")?.scrollIntoView({
            behavior: "smooth"
          });
        }}
      >
        Learn More
      </button>
    </div>
  </div>
</section>
{/* Features Section */}
<section id="features" className="features-section">

  <div className="section-heading">
    <p>WHY CAMPUSFIX PRO?</p>

    <h2>
      Everything you need to manage campus issues
    </h2>

    <span>
      A simple platform for reporting, tracking and resolving
      campus maintenance problems.
    </span>
  </div>

  <div className="feature-grid">

    <div className="feature-card">
      <div className="feature-icon">📝</div>

      <h3>Easy Reporting</h3>

      <p>
        Report maintenance problems with category,
        location, priority, description and image.
      </p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">🎫</div>

      <h3>Ticket Tracking</h3>

      <p>
        Get a unique Ticket ID and track your complaint
        status from submission to resolution.
      </p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">🔧</div>

      <h3>Technician Assignment</h3>

      <p>
        Administrators can assign maintenance complaints
        to the appropriate technician.
      </p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">🤖</div>

      <h3>FixBot AI</h3>

      <p>
        Users can chat with FixBot AI to get assistance
        related to campus maintenance issues.
      </p>
    </div>

  </div>

</section>
{/* How It Works Section */}
<section id="how-it-works" className="how-section">

  <div className="section-heading">
    <p>HOW IT WORKS</p>

    <h2>Fix campus problems in 3 simple steps</h2>

    <span>
      CampusFix Pro makes the maintenance process simple,
      transparent and easy to track.
    </span>
  </div>

  <div className="steps-container">

    <div className="step-card">
      <div className="step-number">01</div>
      <h3>Report</h3>
      <p>
        Submit a complaint by selecting the category,
        location, priority and adding a description or image.
      </p>
    </div>

    <div className="step-line"></div>

    <div className="step-card">
      <div className="step-number">02</div>
      <h3>Track</h3>
      <p>
        Receive a unique Ticket ID and track the progress
        of your complaint through its status.
      </p>
    </div>

    <div className="step-line"></div>

    <div className="step-card">
      <div className="step-number">03</div>
      <h3>Resolve</h3>
      <p>
        The assigned technician works on the issue and
        updates the ticket with resolution details.
      </p>
    </div>

  </div>

</section>
{/* About Section */}
<section id="about" className="about-section">

  <div className="about-content">

    <div className="about-text">
      <p className="about-label">ABOUT CAMPUSFIX PRO</p>

      <h2>
        Making campus maintenance simple and transparent.
      </h2>

      <p>
        CampusFix Pro is a campus maintenance and repair ticket
        system designed to make it easier for students and faculty
        to report maintenance issues and track their complaints.
      </p>

      <p>
        Administrators can manage complaints and assign technicians,
        while technicians can update ticket status and provide
        resolution details.
      </p>

      <button className="about-button">
        Learn More
      </button>
    </div>

    <div className="about-box">
      <div className="about-box-icon">🔧</div>
      <h3>Campus Maintenance</h3>
      <p>
        Report • Track • Resolve
      </p>
    </div>

  </div>

</section>


{/* Footer */}
<footer className="footer">

  <div className="footer-content">

    <div className="footer-brand">
      <h3>🔧 CampusFix Pro</h3>
      <p>
        Campus Maintenance and Repair Ticket System
      </p>
    </div>

    <div className="footer-links">
      <a href="#home">Home</a>
      <a href="#features">Features</a>
      <a href="#how-it-works">How It Works</a>
      <a href="#about">About</a>
    </div>

  </div>

  <div className="footer-bottom">
    <p>© 2026 CampusFix Pro. All rights reserved.</p>
  </div>

</footer>

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/raise-complaint" element={<RaiseComplaint />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/ticket/:ticketId" element={<TicketDetails />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/fixbot" element={<FixBot />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-tickets" element={<AdminTickets />} />
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/manage-categories" element={<Categories />} />
        <Route path="/admin-notifications" element={<AdminNotifications />} />
        <Route path="/admin-reports" element={<AdminReports />} />
        <Route path="/technician-dashboard" element={<TechnicianDashboard />} />
        <Route path="/technician-tickets" element={<TechnicianTickets />} />
        <Route path="/technician-ticket/:ticketId" element={<TechnicianTicketDetails />} />
        <Route path="/technician-notifications" element={<TechnicianNotifications />} />
        <Route path="/technician-profile" element={<TechnicianProfile />} />
        <Route path="/admin-technicians" element={<AdminTechnicians />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;