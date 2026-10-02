// Central base URL for the FastAPI backend.
// Supports VITE_API_URL, and falls back to current hostname on port 5000.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL &&
  import.meta.env.VITE_API_URL !== "http://localhost:5000" &&
  import.meta.env.VITE_API_URL !== "http://127.0.0.1:5000"
    ? import.meta.env.VITE_API_URL
    : typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : "http://localhost:5000";

