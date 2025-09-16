import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

function AdminSessionOversightPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: adminUser } = useAuth();

  const fetchSessions = async () => {
    if (adminUser?.role !== 'admin') {
      setError('Access Denied: You do not have permission to view this page.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiRequest('/sessions', 'GET');
      setSessions(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message || 'Failed to fetch sessions.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchSessions();
    }
  }, [adminUser]);

  if (adminUser?.role !== 'admin') {
    return <div>{error || 'Access Denied. Requires Admin privileges.'}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error && !sessions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Sessions</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchSessions}
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
              <h1 className="text-3xl font-bold text-gray-900">Session Overview</h1>
              <p className="text-gray-600 mt-1">Read-only view of all sessions for system monitoring</p>
            </div>
            <Link
              to="/admin/dashboard"
              className="btn btn-secondary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats Card */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Session Statistics</h2>
                <p className="text-gray-600">Overview of all sessions in the system</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">{sessions.length}</div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Sessions Table */}
        {sessions.length > 0 ? (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">All Sessions</h2>
              <p className="text-gray-600">Monitor all sessions across the system</p>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Session ID</th>
                      <th>Class</th>
                      <th>Course Code</th>
                      <th>Room</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.session_id}>
                        <td className="font-mono text-sm">{session.session_id}</td>
                        <td>
                          <div className="font-medium text-gray-900">{session.class_name}</div>
                        </td>
                        <td>
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {session.course_code}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="font-medium">{session.room_name}</span>
                          </div>
                        </td>
                        <td className="text-sm text-gray-600">
                          {new Date(session.start_time).toLocaleString()}
                        </td>
                        <td className="text-sm text-gray-600">
                          {new Date(session.end_time).toLocaleString()}
                        </td>
                        <td className="text-sm text-gray-600">
                          {new Date(session.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <Link
                            to={`/admin/attendance?session=${session.session_id}`}
                            className="btn btn-primary btn-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            View Attendance
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          !error && !loading && (
            <div className="card">
              <div className="card-body text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Found</h3>
                <p className="text-gray-600">No sessions have been created yet.</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default AdminSessionOversightPage;
