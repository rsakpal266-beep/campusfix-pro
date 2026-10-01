// Central base URL for the Flask backend.
// Set VITE_API_URL in frontend/.env for local dev,
// or as a Docker build arg (see frontend/Dockerfile).
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
