import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

function AdminAttendanceOversightPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
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

  const fetchAttendance = async (sessionId) => {
    try {
      const data = await apiRequest(`/sessions/${sessionId}/attendance`, 'GET');
      setAttendance(data || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message || 'Failed to fetch attendance.');
      setAttendance([]);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchSessions();
    }
  }, [adminUser]);

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    fetchAttendance(session.session_id);
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
              <p className="text-gray-600 mt-1">Read-only view of attendance data for system monitoring</p>
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
                <p className="text-gray-600">Overview of all sessions with attendance data</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">{sessions.length}</div>
                <div className="text-sm text-gray-600">Total Sessions</div>
                {selectedSession && (
                  <div className="mt-2">
                    <div className="text-lg font-semibold text-gray-900">Session {selectedSession.session_id}</div>
                    <div className="text-sm text-gray-600">Selected</div>
                  </div>
                )}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sessions List */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Select Session</h2>
              <p className="text-gray-600">Choose a session to view attendance records</p>
            </div>
            <div className="card-body">
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.session_id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedSession?.session_id === session.session_id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSessionSelect(session)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{session.class_name}</div>
                          <div className="text-sm text-gray-600">
                            {session.room_name} • {new Date(session.start_time).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm text-gray-500">#{session.session_id}</div>
                          <button className="btn btn-primary btn-sm mt-2">
                            View Attendance
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Found</h3>
                  <p className="text-gray-600">No sessions have been created yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Details */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Attendance Details</h2>
              <p className="text-gray-600">
                {selectedSession ? `Session ${selectedSession.session_id}` : 'Select a session to view attendance'}
              </p>
            </div>
            <div className="card-body">
              {selectedSession ? (
                <>
                  {/* Session Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Class</div>
                        <div className="font-medium">{selectedSession.class_name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Room</div>
                        <div className="font-medium">{selectedSession.room_name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Start Time</div>
                        <div className="font-medium">{new Date(selectedSession.start_time).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">End Time</div>
                        <div className="font-medium">{new Date(selectedSession.end_time).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">Total Attendance Records</div>
                      <div className="text-2xl font-bold text-primary-600">{attendance.length}</div>
                    </div>
                  </div>

                  {/* Attendance Table */}
                  {attendance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Marked At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.map((record) => (
                            <tr key={record.record_id}>
                              <td>
                                <div className="font-medium">
                                  {record.student_first_name} {record.student_last_name}
                                </div>
                              </td>
                              <td className="text-sm text-gray-600">{record.student_email}</td>
                              <td>
                                <span className={`badge ${
                                  record.status === 'present' ? 'badge-success' :
                                  record.status === 'absent' ? 'badge-error' :
                                  'badge-warning'
                                }`}>
                                  {record.status}
                                </span>
                              </td>
                              <td className="text-sm text-gray-600">
                                {new Date(record.marked_at).toLocaleString()}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
                      <p className="text-gray-600">No attendance has been marked for this session yet.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Session</h3>
                  <p className="text-gray-600">Choose a session from the list to view attendance records.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAttendanceOversightPage;
