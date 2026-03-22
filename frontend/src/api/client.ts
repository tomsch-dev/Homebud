import axios from 'axios';

// In production: VITE_API_URL is empty → requests go to same origin (nginx proxies /api/* to backend)
// In development: VITE_API_URL=http://localhost:8000 → direct to backend
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

/** Set or clear the auth token used for API requests */
export function setAuthToken(token: string | null) {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common['Authorization'];
  }
  // Resolve the token-ready promise
  if (_tokenReadyResolve) {
    _tokenReadyResolve();
    _tokenReadyResolve = null;
  }
}

// Promise that resolves when the first token is set (or cleared for unauth)
let _tokenReadyResolve: (() => void) | null = null;
export const tokenReady = new Promise<void>((resolve) => {
  _tokenReadyResolve = resolve;
});

export default client;
