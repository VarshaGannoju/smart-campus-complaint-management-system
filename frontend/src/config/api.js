const defaultDevApiBase = (() => {
  if (process.env.NODE_ENV !== 'development') return '';
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol || 'http:';
    const host = window.location.hostname || 'localhost';
    return `${protocol}//${host}:5000`;
  }
  return 'http://localhost:5000';
})();

const rawApiBase = process.env.REACT_APP_API_URL || defaultDevApiBase;

export const API_BASE_URL = rawApiBase.replace(/\/+$/, '');

export const buildApiUrl = (path) => {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};
