import { Link } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";

function FixBot() {
  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <UserSidebar />


      {/* Main Content */}
      <main className="dashboard-main fixbot-main">

        <div className="fixbot-header">

          <div>
            <p className="dashboard-label">
              AI ASSISTANT
            </p>

            <h1>FixBot AI 🤖</h1>

            <p>
              Get quick assistance with campus maintenance issues.
            </p>
          </div>

          <div className="fixbot-status">
            <span></span>
            Online
          </div>

        </div>


        {/* Chat Box */}
        <div className="fixbot-container">

          {/* Chat Header */}
          <div className="fixbot-chat-header">

            <div className="fixbot-avatar">
              🤖
            </div>

            <div>
              <h2>FixBot AI</h2>
              <p>Campus Maintenance Assistant</p>
            </div>

          </div>


          {/* Messages */}
          <div className="fixbot-messages">

            <div className="chat-message bot-message">

              <div className="chat-avatar">
                🤖
              </div>

              <div className="message-bubble">
                <p>
                  Hello! 👋 I'm FixBot AI.
                </p>

                <p>
                  I can help you understand campus maintenance
                  issues and guide you about reporting a complaint.
                </p>

                <small>
                  FixBot AI • Just now
                </small>
              </div>

            </div>


            <div className="chat-message user-message">

              <div className="message-bubble">
                <p>
                  How can I report a water leakage?
                </p>

                <small>
                  You • Just now
                </small>
              </div>

            </div>


            <div className="chat-message bot-message">

              <div className="chat-avatar">
                🤖
              </div>

              <div className="message-bubble">

                <p>
                  You can report it by going to
                  <strong> Raise Complaint</strong>.
                </p>

                <p>
                  Select <strong>Plumbing</strong> as the category,
                  enter the location, choose the appropriate priority,
                  describe the issue and submit the complaint.
                </p>

                <small>
                  FixBot AI • Just now
                </small>

              </div>

            </div>

          </div>


          {/* Suggested Questions */}
          <div className="suggested-questions">

            <p>Try asking:</p>

            <button>
              How do I track my ticket?
            </button>

            <button>
              How do I report an electrical issue?
            </button>

            <button>
              What does In Progress mean?
            </button>

          </div>


          {/* Message Input */}
          <div className="chat-input-area">

            <input
              type="text"
              placeholder="Type your message..."
            />

            <button className="send-message-btn">
              ➤
            </button>

          </div>

          <div className="fixbot-disclaimer">
            FixBot AI provides assistance related to CampusFix Pro
            maintenance services.
          </div>

        </div>

      </main>

    </div>
  );
}

export default FixBot;