// Central API base URL — reads from .env.production in prod, falls back to localhost in dev
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
