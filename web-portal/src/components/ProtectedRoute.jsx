import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Link } from 'react-router-dom';

/**
 * A component to protect routes that require authentication and optionally a specific role.
 * If the user is not authenticated or doesn't have the required role, 
 * it redirects to the login page or an unauthorized page.
 * @param {{children: React.ReactNode, role?: string}} props
 */
const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Optional: Show a loading indicator while auth state is being determined
    return <div>Loading...</div>; 
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they login,
    // which is a nicer user experience than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a role is required and the user does not have it
  if (role && user?.role !== role) {
    // Redirect to a generic unauthorized page or home, or display an error message.
    // For simplicity, redirecting to home. A dedicated "Unauthorized" page would be better.
    // Or, we can show an inline message, but that means the parent layout might still render.
    // Let's return an inline message for now, but a dedicated page is a good improvement.
    return (
      <div>
        <h1>Access Denied</h1>
        <p>You do not have the required permissions to view this page.</p>
        <Link to="/">Go to Homepage</Link>
      </div>
    );
    // Alternative: return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute; 