import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminRoomManagementPage from './pages/admin/AdminRoomManagementPage';
import AdminUserManagementPage from './pages/admin/AdminUserManagementPage';
import TeacherClassManagementPage from './pages/teacher/TeacherClassManagementPage';
import TeacherEnrollmentPage from './pages/teacher/TeacherEnrollmentPage';
import TeacherSessionManagementPage from './pages/teacher/TeacherSessionManagementPage';
import ProtectedRoute from './components/ProtectedRoute';
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
                <span>Welcome, {user?.email || 'User'}! (Role: {user?.role})</span> {/** Display role */}
              </li>
              <li>
                <button onClick={logout}>Logout</button>
              </li>
              {user?.role === 'admin' && (
                <>
                  <li>
                    <Link to="/admin/rooms">Manage Rooms</Link>
                  </li>
                  <li>
                    <Link to="/admin/users">Manage Users</Link>
                  </li>
                </>
              )}
              {user?.role === 'teacher' && (
                <>
                  <li>
                    <Link to="/teacher/classes">Manage My Classes</Link>
                  </li>
                  <li>
                    <Link to="/teacher/enrollments">Manage Student Enrollments</Link>
                  </li>
                  <li>
                    <Link to="/teacher/sessions">Manage Class Sessions</Link>
                  </li>
                </>
              )}
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
        <Route path="/admin/rooms" element={<ProtectedRoute role="admin"><AdminRoomManagementPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUserManagementPage /></ProtectedRoute>} />
        <Route path="/teacher/classes" element={<ProtectedRoute role="teacher"><TeacherClassManagementPage /></ProtectedRoute>} />
        <Route path="/teacher/enrollments" element={<ProtectedRoute role="teacher"><TeacherEnrollmentPage /></ProtectedRoute>} />
        <Route path="/teacher/sessions" element={<ProtectedRoute role="teacher"><TeacherSessionManagementPage /></ProtectedRoute>} />
        {/* Define more routes here as the application grows */}
        {/* Example of a protected route to be added later:
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} /> 
        */}
      </Routes>
    </div>
  );
}

export default App;
