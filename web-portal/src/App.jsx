import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRoomManagementPage from './pages/admin/AdminRoomManagementPage';
import AdminUserManagementPage from './pages/admin/AdminUserManagementPage';
import AdminClassOversightPage from './pages/admin/AdminClassOversightPage';
import AdminSessionOversightPage from './pages/admin/AdminSessionOversightPage';
import AdminAttendanceOversightPage from './pages/admin/AdminAttendanceOversightPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherClassManagementPage from './pages/teacher/TeacherClassManagementPage';
import TeacherEnrollmentPage from './pages/teacher/TeacherEnrollmentPage';
import TeacherSessionManagementPage from './pages/teacher/TeacherSessionManagementPage';
import TeacherAttendancePage from './pages/teacher/TeacherAttendancePage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isAuthenticated, user, logout } = useAuth(); // Get auth state and functions

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <Link to="/" className="navbar-brand">
              SmartPresence
            </Link>
            
            <ul className="navbar-nav">
              <li>
                <Link to="/">Home</Link>
              </li>
              
              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' && (
                    <>
                      <li>
                        <Link to="/admin/dashboard">Dashboard</Link>
                      </li>
                      <li>
                        <Link to="/admin/rooms">Rooms</Link>
                      </li>
                      <li>
                        <Link to="/admin/users">Users</Link>
                      </li>
                      <li>
                        <Link to="/admin/classes">Classes</Link>
                      </li>
                      <li>
                        <Link to="/admin/sessions">Sessions</Link>
                      </li>
                      <li>
                        <Link to="/admin/attendance">Attendance</Link>
                      </li>
                    </>
                  )}
                  
                  {user?.role === 'teacher' && (
                    <>
                      <li>
                        <Link to="/teacher/dashboard">Dashboard</Link>
                      </li>
                      <li>
                        <Link to="/teacher/classes">My Classes</Link>
                      </li>
                      <li>
                        <Link to="/teacher/enrollments">Enrollments</Link>
                      </li>
                      <li>
                        <Link to="/teacher/sessions">Sessions</Link>
                      </li>
                      <li>
                        <Link to="/teacher/attendance">Attendance</Link>
                      </li>
                    </>
                  )}
                  
                  <li className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{user?.firstName || user?.email}</div>
                        <div className="text-gray-500 capitalize">{user?.role}</div>
                      </div>
                    </div>
                    <button 
                      onClick={logout}
                      className="btn btn-sm btn-secondary"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link to="/login" className="btn btn-primary btn-sm">
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <main className="py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rooms"
          element={
            <ProtectedRoute role="admin">
              <AdminRoomManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="admin">
              <AdminUserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute role="admin">
              <AdminClassOversightPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sessions"
          element={
            <ProtectedRoute role="admin">
              <AdminSessionOversightPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute role="admin">
              <AdminAttendanceOversightPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/classes"
          element={
            <ProtectedRoute role="teacher">
              <TeacherClassManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/enrollments"
          element={
            <ProtectedRoute role="teacher">
              <TeacherEnrollmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/sessions"
          element={
            <ProtectedRoute role="teacher">
              <TeacherSessionManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute role="teacher">
              <TeacherAttendancePage />
            </ProtectedRoute>
          }
        />
          {/* Define more routes here as the application grows */}
          {/* Example of a protected route to be added later:
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} /> 
          */}
        </Routes>
      </main>
    </div>
  );
}

export default App;
