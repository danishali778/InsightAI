const fallbackApiBase = 'http://localhost:8000/api';

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') || fallbackApiBase;
