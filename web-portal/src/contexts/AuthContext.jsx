import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiRequest, storeToken, removeToken } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smartpresence_token'));
  const [loading, setLoading] = useState(true); // To track initial auth state loading
  const navigate = useNavigate();

  useEffect(() => {
    const currentToken = localStorage.getItem('smartpresence_token');
    if (currentToken) {
      // TODO: Optionally, verify token with a backend endpoint here 
      // For now, assume token is valid if it exists and try to fetch user profile
      // This part would require a /users/me or /auth/profile endpoint on the backend
      // For this iteration, we'll just set the token and leave user as null until login
      setToken(currentToken);
      // Example: fetchUserProfile().then(setUser).catch(() => logout());
    }    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiRequest('/auth/login', 'POST', { email, password }, true);
      if (response && response.token && response.user) {
        storeToken(response.token);
        setToken(response.token);
        setUser(response.user);
        navigate('/'); // Redirect to home page after successful login
        return true;
      } else {
        // Handle cases where token or user might be missing in response
        throw new Error('Login failed: Invalid response from server.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      // removeToken(); // Ensure no partial state remains
      // setToken(null);
      // setUser(null);
      throw error; // Re-throw to be caught by the LoginPage component for UI feedback
    }
  };

  const logout = () => {
    removeToken();
    setToken(null);
    setUser(null);
    navigate('/login'); // Redirect to login page after logout
  };

  const isAuthenticated = !!token;

  // Wait until loading is false before rendering children to avoid flicker
  if (loading) {
    return <div>Loading authentication...</div>; // Or a proper spinner component
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, setUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}; 