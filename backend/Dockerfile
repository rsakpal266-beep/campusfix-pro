# ---------- Backend: Flask API ----------
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 5000

# Gunicorn for production. app:app => app.py exposes `app`
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]
