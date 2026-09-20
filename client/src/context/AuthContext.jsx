import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          // Send cookies with request
          credentials: 'include' 
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    // In a full implementation, you might want to call a /logout endpoint to clear the HTTP-only cookie on the server.
    // For now, since the cookie is HTTP-only, we just clear the local state.
    // Actually, to properly clear HTTP-only cookie we must hit an endpoint.
    try {
        // Optional: wait for backend logout endpoint if it existed
        // await fetch('http://localhost:5000/api/auth/logout', { method: 'POST', credentials: 'include' });
        setUser(null);
        // Force reload to clear any cached states and cookies (if max-age was set to 0 by backend)
        window.location.href = '/'; 
    } catch(err) {
        console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
