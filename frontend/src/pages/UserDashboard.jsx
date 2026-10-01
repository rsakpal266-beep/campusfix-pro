import { Link } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";

function UserDashboard() {
  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <UserSidebar />


      {/* Main Content */}
      <main className="dashboard-main">

        <div className="dashboard-header">
          <div>
            <p className="dashboard-label">USER DASHBOARD</p>
            <h1>Welcome back! 👋</h1>
            <p>
              Manage your campus maintenance requests from one place.
            </p>
          </div>

          <Link to="/raise-complaint" className="dashboard-report-btn">
            + Report an Issue
          </Link>
        </div>


        {/* Statistics */}
        <div className="dashboard-stats">

          <div className="stat-card">
            <div className="stat-icon">🎫</div>
            <div>
              <h3>12</h3>
              <p>Total Tickets</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div>
              <h3>4</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔧</div>
            <div>
              <h3>3</h3>
              <p>In Progress</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div>
              <h3>5</h3>
              <p>Resolved</p>
            </div>
          </div>

        </div>


        {/* Recent Tickets */}
        <section className="recent-tickets">

          <div className="section-title-row">
            <div>
              <h2>Recent Tickets</h2>
              <p>Your latest maintenance requests</p>
            </div>

            <Link to="/my-tickets">
              View All
            </Link>
          </div>


          <div className="ticket-table">

            <div className="ticket-row ticket-heading">
              <span>Ticket ID</span>
              <span>Issue</span>
              <span>Location</span>
              <span>Status</span>
            </div>

            <div className="ticket-row">
              <span>#CF-1024</span>
              <span>Water Leakage</span>
              <span>Block A</span>
              <span className="status pending">Pending</span>
            </div>

            <div className="ticket-row">
              <span>#CF-1023</span>
              <span>Broken Fan</span>
              <span>Room 204</span>
              <span className="status progress">In Progress</span>
            </div>

            <div className="ticket-row">
              <span>#CF-1022</span>
              <span>Damaged Chair</span>
              <span>Library</span>
              <span className="status resolved">Resolved</span>
            </div>

          </div>

        </section>


        {/* Quick Actions */}
        <section className="quick-actions">

          <h2>Quick Actions</h2>

          <div className="quick-grid">

            <Link to="/raise-complaint" className="quick-card">
              <span>➕</span>
              <h3>Raise Complaint</h3>
              <p>Report a new maintenance issue.</p>
            </Link>

            <Link to="/my-tickets" className="quick-card">
              <span>🎫</span>
              <h3>My Tickets</h3>
              <p>View and track your complaints.</p>
            </Link>

            <Link to="/fixbot" className="quick-card">
              <span>🤖</span>
              <h3>Chat with FixBot</h3>
              <p>Get help with your maintenance issue.</p>
            </Link>

          </div>

        </section>

      </main>

    </div>
  );
}

export default UserDashboard;