import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import { useAuth } from './contexts/AuthContext'; // Import useAuth
import './App.css'; // Keep existing styles for now

function App() {
  const { isAuthenticated, user, logout } = useAuth(); // Get auth state and functions

  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          {isAuthenticated ? (
            <>
              <li>
                <span>Welcome, {user?.email || 'User'}!</span> {/** Display user email or generic User */}
              </li>
              <li>
                <button onClick={logout}>Logout</button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/login">Login</Link>
            </li>
          )}
          {/* Add more navigation links as needed */}
        </ul>
      </nav>

      <hr />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Define more routes here as the application grows */}
        {/* Example of a protected route to be added later:
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} /> 
        */}
      </Routes>
    </div>
  );
}

export default App;
