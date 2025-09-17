import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalSessions: 0,
    totalStudents: 0,
    upcomingSessions: 0,
    recentSessions: [],
    recentAttendance: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: teacherUser } = useAuth();

  const fetchDashboardData = async () => {
    if (teacherUser?.role !== 'teacher') {
      setError('Access Denied: You do not have permission to view this page.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch teacher-specific data in parallel
      const [classes, sessions, users] = await Promise.all([
        apiRequest('/classes', 'GET'),
        apiRequest('/sessions', 'GET'),
        apiRequest('/users', 'GET'),
      ]);

      // Calculate teacher-specific statistics
      const totalClasses = classes?.length || 0;
      const totalSessions = sessions?.length || 0;
      
      // Calculate total students across all teacher's classes
      let totalStudents = 0;
      if (classes && classes.length > 0) {
        for (const cls of classes) {
          try {
            const enrolledStudents = await apiRequest(`/classes/${cls.class_id}/students`, 'GET');
            totalStudents += enrolledStudents?.length || 0;
          } catch (err) {
            console.warn(`Failed to fetch students for class ${cls.class_id}:`, err);
          }
        }
      }

      // Get upcoming sessions (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingSessions = sessions?.filter(session => {
        const sessionDate = new Date(session.start_time);
        return sessionDate >= now && sessionDate <= nextWeek;
      }).length || 0;

      // Get recent sessions (last 5)
      const recentSessions = sessions?.slice(0, 5) || [];

      // Get recent attendance records (last 10)
      const recentAttendance = [];
      if (sessions && sessions.length > 0) {
        for (const session of sessions.slice(0, 3)) {
          try {
            const attendance = await apiRequest(`/sessions/${session.session_id}/attendance`, 'GET');
            if (attendance && attendance.length > 0) {
              recentAttendance.push({
                sessionId: session.session_id,
                className: classes?.find(c => c.class_id === session.class_id)?.name || 'Unknown Class',
                attendanceCount: attendance.length,
                presentCount: attendance.filter(a => a.status === 'present').length,
                date: session.start_time
              });
            }
          } catch (err) {
            console.warn(`Failed to fetch attendance for session ${session.session_id}:`, err);
          }
        }
      }

      setStats({
        totalClasses,
        totalSessions,
        totalStudents,
        upcomingSessions,
        recentSessions,
        recentAttendance,
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teacherUser) {
      fetchDashboardData();
    }
  }, [teacherUser]);

  if (teacherUser?.role !== 'teacher') {
    return <div>{error || 'Access Denied. Requires Teacher privileges.'}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600 mt-1">Overview of your classes, sessions, and attendance</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Welcome back</p>
                <p className="font-medium text-gray-900">{teacherUser?.firstName || teacherUser?.email}</p>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Classes Card */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">My Classes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalClasses}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/teacher/classes" className="btn btn-primary btn-sm w-full">
                  Manage Classes
                </Link>
              </div>
            </div>
          </div>

          {/* Total Sessions Card */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/teacher/sessions" className="btn btn-secondary btn-sm w-full">
                  Manage Sessions
                </Link>
              </div>
            </div>
          </div>

          {/* Total Students Card */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/teacher/enrollments" className="btn btn-secondary btn-sm w-full">
                  Manage Enrollments
                </Link>
              </div>
            </div>
          </div>

          {/* Upcoming Sessions Card */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.upcomingSessions}</p>
                </div>
                <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/teacher/sessions" className="btn btn-secondary btn-sm w-full">
                  View Sessions
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            <p className="text-gray-600">Common teaching tasks</p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/teacher/classes" className="btn btn-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Manage Classes
              </Link>
              <Link to="/teacher/sessions" className="btn btn-success">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Schedule Sessions
              </Link>
              <Link to="/teacher/enrollments" className="btn btn-secondary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Manage Students
              </Link>
              <Link to="/teacher/attendance" className="btn btn-secondary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Attendance
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Recent Sessions</h2>
            <p className="text-gray-600">Latest session activity</p>
          </div>
          <div className="card-body">
            {stats.recentSessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Session ID</th>
                      <th>Class</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSessions.map((session) => (
                      <tr key={session.session_id}>
                        <td className="font-mono text-sm">{session.session_id}</td>
                        <td className="font-medium">{session.class_name || 'Unknown Class'}</td>
                        <td className="text-sm text-gray-600">
                          {new Date(session.start_time).toLocaleString()}
                        </td>
                        <td className="text-sm text-gray-600">
                          {new Date(session.end_time).toLocaleString()}
                        </td>
                        <td>
                          <Link
                            to={`/teacher/attendance?session=${session.session_id}`}
                            className="btn btn-primary btn-sm"
                          >
                            View Attendance
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Sessions</h3>
                <p className="text-gray-600">No sessions have been created yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Attendance Summary */}
        {stats.recentAttendance.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Recent Attendance Summary</h2>
              <p className="text-gray-600">Latest attendance records</p>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Date</th>
                      <th>Present</th>
                      <th>Total</th>
                      <th>Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentAttendance.map((attendance, index) => (
                      <tr key={index}>
                        <td className="font-medium">{attendance.className}</td>
                        <td className="text-sm text-gray-600">
                          {new Date(attendance.date).toLocaleDateString()}
                        </td>
                        <td className="text-success-600 font-medium">{attendance.presentCount}</td>
                        <td className="text-gray-600">{attendance.attendanceCount}</td>
                        <td>
                          <span className={`badge ${
                            (attendance.presentCount / attendance.attendanceCount) >= 0.8 
                              ? 'badge-success' 
                              : (attendance.presentCount / attendance.attendanceCount) >= 0.6 
                                ? 'badge-warning' 
                                : 'badge-error'
                          }`}>
                            {Math.round((attendance.presentCount / attendance.attendanceCount) * 100)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;
