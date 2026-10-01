# CampusFix Pro

Campus maintenance & repair system — React (Vite) frontend + Flask backend + PostgreSQL.

```
campusfix-pro/
├── frontend/          # React + Vite app
│   ├── src/
│   ├── public/
│   ├── Dockerfile     # multi-stage build → nginx
│   ├── nginx.conf
│   └── .env.example
├── backend/           # Flask API (PostgreSQL via psycopg2)
│   ├── routes/
│   ├── app.py
│   ├── config.py
│   ├── db.py
│   ├── schema.sql
│   ├── seed_users.py
│   ├── requirements.txt
│   ├── Dockerfile     # python-slim + gunicorn
│   └── .env.example
└── docker-compose.yml # postgres + backend + frontend
```

## Database setup

Create the tables once (local or managed Postgres):

```bash
psql $DATABASE_URL -f backend/schema.sql
# or:
# psql -h localhost -U postgres -d campusfix_pro -f backend/schema.sql
```

Then seed the default Admin / Technician accounts:

```bash
cd backend
python seed_users.py
```

## Local dev (without Docker)

Frontend:

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:5000
npm install
npm run dev            # http://localhost:5173
```

Backend:

```bash
cd backend
cp .env.example .env   # POSTGRES_* or DATABASE_URL
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python app.py                # http://localhost:5000
```

## Docker

```bash
# Build + run everything (postgres :5432, api :5000, web :3000)
docker compose up --build

# Backend only
docker build -t campusfix-backend ./backend
docker run -p 5000:5000 --env-file ./backend/.env campusfix-backend

# Frontend only (bake API URL at build time)
docker build --build-arg VITE_API_URL=http://localhost:5000 -t campusfix-frontend ./frontend
docker run -p 3000:80 campusfix-frontend
```

API base URL is centralized in `frontend/src/config.js` via `VITE_API_URL`.
Backend config is env-driven in `backend/config.py` (`DATABASE_URL` or `POSTGRES_*`).
