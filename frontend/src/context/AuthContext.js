import React, { createContext, useContext, useEffect, useState } from 'react';
import { buildApiUrl } from '../config/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'cms_token';
const USER_KEY = 'cms_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);

  const syncUser = (nextUser) => {
    setUser(nextUser);

    if (nextUser) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      sessionStorage.removeItem(USER_KEY);
      // Backward compatibility for places still reading this key.
      localStorage.removeItem('user');
    }
  };

  const login = (userData, userToken) => {
    syncUser(userData);
    setToken(userToken);

    sessionStorage.setItem(TOKEN_KEY, userToken);
    // Backward compatibility for existing pages.
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    syncUser(null);
    setToken(null);

    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  useEffect(() => {
    const fetchCurrentUser = async (activeToken) => {
      try {
        const res = await fetch(buildApiUrl('/api/auth/me'), {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeToken}`
          }
        });

        const data = await res.json();

        if (res.ok && data.success && data.user) {
          syncUser(data.user);
          // Backward compatibility for existing pages.
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          logout();
        }
      } catch (error) {
        console.error('Fetch user error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const authFetch = async (url, options = {}) => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY) || token;

    const headers = {
      'Content-Type': 'application/json',
      ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
      ...options.headers
    };

    const response = await fetch(buildApiUrl(url), {
      ...options,
      headers
    });

    if (response.status === 401) {
      logout();
    }

    return response;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
