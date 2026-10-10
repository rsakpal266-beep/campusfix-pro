const configuredApiUrl = import.meta.env.VITE_API_URL;

export const API_BASE_URL = (
  configuredApiUrl ||
  "https://campusfix-backend-l3j2.onrender.com"
).replace(/\/+$/, "");
