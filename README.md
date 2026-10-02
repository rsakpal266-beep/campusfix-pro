# CampusFix Pro 🛠️

Smart Campus Maintenance & Repair Ticket System — React (Vite) frontend + **FastAPI backend** + **PostgreSQL (12 Database Tables)** + **FixBot AI (Google Gemini)**.

Designed with a **Dark Green & Lime Green theme**, complete role-based workflows for College Administrators, Faculty, Students, and Technicians, and zero dummy data.

```
campusfix-pro/
├── frontend/          # React + Vite app (Dark Green & Lime Green UI)
│   ├── src/
│   │   ├── components/  # AdminSidebar, TechnicianSidebar, UserSidebar
│   │   ├── pages/       # Dashboards, Tickets, FixBot, ManageUsers, etc.
│   │   ├── index.css
│   │   └── modern.css   # Dark Green & Lime Green design system
│   ├── Dockerfile     # Multi-stage build → Nginx
│   └── package.json
├── backend/           # FastAPI 2.0 API (PostgreSQL + SQLAlchemy)
│   ├── routes/        # auth, tickets, admin, technician, fixbot, notifications, common
│   ├── main.py        # Central FastAPI application & OpenAPI docs (/docs)
│   ├── app.py         # Entrypoint alias
│   ├── config.py      # Env-driven settings (Postgres, JWT, Gemini)
│   ├── database.py    # SQLAlchemy session maker & robust engine
│   ├── models.py      # 12 ORM Database Tables
│   ├── schemas.py     # Pydantic v2 validation models
│   ├── security.py    # Bcrypt password hashing & JWT auth dependencies
│   ├── schema.sql     # Complete PostgreSQL DDL (12 tables)
│   ├── init_db.py     # Database verification & baseline seeding
│   ├── requirements.txt
│   └── Dockerfile     # python-slim + uvicorn
└── docker-compose.yml # postgres + FastAPI backend + React frontend
```

---

## 🏛️ 12 Database Tables
1. `users` — Accounts for Student, Faculty, Technician, and College Admin.
2. `categories` — Maintenance domains (Electrical, Plumbing, Furniture, Cleaning, Network, AV, Other).
3. `locations` — Campus blocks, floors, lecture halls, labs, and hostels.
4. `tickets` — Core complaints with tracking code (`CF-1001`), priority, status, and resolution details.
5. `ticket_history` — Audit trail of status transitions and assignments.
6. `ticket_comments` — Real-time communication between submitters, technicians, and administrators.
7. `ticket_attachments` — Photos and documentation of maintenance issues and repairs.
8. `ticket_feedback` — 1-5 star ratings and reviews upon ticket resolution.
9. `notifications` — Role-based alerts and updates.
10. `inventory_items` — Maintenance supplies, spare parts, and equipment tracking.
11. `technician_assignments` — Formal work order dispatches and assignment notes.
12. `fixbot_chat_logs` — History of FixBot AI sessions, queries, and responses.

---

## 👥 Roles & Credential Provisioning Workflow
- **👑 College Administrator**:
  - Registers the institution via `/register` (Institution Name, Campus Code, Registrar details, Admin Email & Password).
  - Full system oversight, category management, ticket dispatch, and reports.
  - Onboards new **Students**, **Faculty Members**, and **Technicians** via the **Manage Users** console (`/manage-users`).
  - Sets or auto-generates secure credentials and copies/shares them directly with users via WhatsApp, Email, or SMS.
- **👩‍🏫 Faculty Member**:
  - Provided login credentials by College Admin.
  - Report classroom, lab, and office maintenance issues with high priority.
  - Track complaint status in real-time and consult FixBot AI.
- **🎓 Student**:
  - Provided login credentials by College Admin.
  - Submit hostel and campus repair tickets with photos and location details.
  - Chat with FixBot AI and rate resolution quality.
- **🛠️ Campus Technician**:
  - Onboarded by College Admin with specialization (Electrical, Plumbing, HVAC, etc.).
  - Access assigned work orders via `/technician-dashboard`, update status (`In Progress` / `Resolved`), and log resolution notes.

---

## 🤖 FixBot AI (Google Gemini & OpenAI Integration)
FixBot AI provides intelligent campus maintenance guidance:
- Connects directly to Google Gemini via `GEMINI_API_KEY` (or OpenAI via `OPENAI_API_KEY`).
- In-browser API key configuration modal lets users or evaluators test with their own keys instantly.
- Intelligent fallback knowledge base handles electrical, plumbing, Wi-Fi, and emergency queries.
- All conversations are saved to Table 12 (`fixbot_chat_logs`).

---

## 🚀 Local Development

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # macOS/Linux
pip install -r requirements.txt
python app.py              # Server runs at http://localhost:5000
# Interactive API documentation: http://localhost:5000/docs
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev                # App runs at http://localhost:5173
```

---

## 🐳 Docker Deployment
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- FastAPI Backend: `http://localhost:5000`
- PostgreSQL: `localhost:5432`
