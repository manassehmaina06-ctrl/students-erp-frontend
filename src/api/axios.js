import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Guard: only fire the redirect ONCE per page session
let redirecting = false;

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !redirecting) {
      redirecting = true;
      localStorage.removeItem('token');
      // Only redirect if we're NOT already on a public page
      const publicPaths = ['/login', '/register', '/'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      } else {
        // Reset the guard on public pages so a fresh attempt can be made
        setTimeout(() => { redirecting = false; }, 1000);
      }
    }
    return Promise.reject(err);
  }
);

export default api;