const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';
console.log("API BASE URL =", import.meta.env.VITE_API_BASE_URL);

export const getAuthToken = () => localStorage.getItem('uae_admin_token');
export const setAuthToken = (token: string) => localStorage.setItem('uae_admin_token', token);
export const clearAuthToken = () => localStorage.removeItem('uae_admin_token');

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  
  if (response.status === 401) {
    clearAuthToken();
    window.location.reload();
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'API Request failed');
  }

  return response.json();
}

export const api = {
  signup: (data: any) => request('/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request('/login', { method: 'POST', body: JSON.stringify(data) }),
  
  getTasks: () => request('/tasks'),
  createTask: (task: any) => request('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id: number | string, task: any) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(task) }),
  deleteTask: (id: number | string) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
