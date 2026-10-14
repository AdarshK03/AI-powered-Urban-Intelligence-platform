import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('uip_token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('uip_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Sync session state to localStorage
  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('uip_token', token);
      } else {
        localStorage.removeItem('uip_token');
      }

      if (user) {
        localStorage.setItem('uip_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('uip_user');
      }
    } catch (err) {
      console.error('Failed to synchronize auth state to localStorage', err);
    }
  }, [token, user]);

  // Verify token on initial load
  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem('uip_token');
      if (!storedToken) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        } else {
          // Token invalid or expired
          localStorage.removeItem('uip_token');
          localStorage.removeItem('uip_user');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Backend server not reachable during initial session check:', err.message);
      }
    }

    verifySession();
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback(async ({ email, password, roleHint = null }) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const message = data.message || 'Login failed. Please check your credentials.';
        setAuthError(message);
        setIsLoading(false);
        return { success: false, message };
      }

      // Check role constraint if logging into a role-specific interface
      if (roleHint && data.user.role !== roleHint) {
        const message = `Access restricted: this account is not authorized for ${roleHint} access.`;
        setAuthError(message);
        setIsLoading(false);
        return { success: false, message };
      }

      // Store credentials in localStorage as requested
      try {
        localStorage.setItem('uip_token', data.token);
        localStorage.setItem('uip_user', JSON.stringify(data.user));
        localStorage.setItem(
          'uip_credentials',
          JSON.stringify({ email, password, savedAt: new Date().toISOString() })
        );
      } catch (e) {
        console.error('Failed to store credentials in localStorage', e);
      }

      setToken(data.token);
      setUser(data.user);
      setIsLoading(false);

      return { success: true, user: data.user, token: data.token };
    } catch (err) {
      console.error('Network or server error during login:', err);
      const message = 'Unable to connect to authentication server. Please ensure the backend is running.';
      setAuthError(message);
      setIsLoading(false);
      return { success: false, message };
    }
  }, []);

  /**
   * Register a new user
   */
  const register = useCallback(async ({ name, email, password, confirmPassword, organisation }) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, confirmPassword, organisation }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const message = data.message || 'Registration failed.';
        setAuthError(message);
        setIsLoading(false);
        return { success: false, message };
      }

      // Save credentials & session
      try {
        localStorage.setItem('uip_token', data.token);
        localStorage.setItem('uip_user', JSON.stringify(data.user));
        localStorage.setItem(
          'uip_credentials',
          JSON.stringify({ email, password, savedAt: new Date().toISOString() })
        );
      } catch (e) {
        console.error('Failed to store credentials in localStorage', e);
      }

      setToken(data.token);
      setUser(data.user);
      setIsLoading(false);

      return { success: true, user: data.user, token: data.token };
    } catch (err) {
      console.error('Network or server error during registration:', err);
      const message = 'Unable to connect to authentication server. Please check your connection.';
      setAuthError(message);
      setIsLoading(false);
      return { success: false, message };
    }
  }, []);

  /**
   * Logout current session
   */
  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('uip_token');
      localStorage.removeItem('uip_user');
      // Do not necessarily remove saved login form credentials or keep as needed
      setToken(null);
      setUser(null);
      setAuthError(null);
    }
  }, [token]);

  /**
   * Retrieve saved credentials from localStorage
   */
  const getSavedCredentials = useCallback(() => {
    try {
      const saved = localStorage.getItem('uip_credentials');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Update authenticated user profile
   */
  const updateProfile = useCallback(async ({ name, organisation, phone }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, organisation, phone }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('uip_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [token]);

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        authError,
        login,
        register,
        updateProfile,
        logout,
        getSavedCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
