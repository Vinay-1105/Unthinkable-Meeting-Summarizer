export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export const API_ENDPOINTS = {
  upload: `${API_BASE_URL}/api/upload`,
  transcribe: `${API_BASE_URL}/api/transcribe`,
  summarize: `${API_BASE_URL}/api/summarize`,
  meetings: `${API_BASE_URL}/api/meetings`,
  meetingById: (id) => `${API_BASE_URL}/api/meetings/${id}`,
};
