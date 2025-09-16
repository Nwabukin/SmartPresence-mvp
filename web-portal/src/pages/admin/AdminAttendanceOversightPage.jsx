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
    return <div>Loading sessions...</div>;
  }

  if (error && !sessions.length) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Attendance Reports (Admin)</h1>
      <p>
        <em>Read-only view of attendance data for system monitoring</em>
      </p>

      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/admin/dashboard"
          style={{
            padding: '8px 12px',
            backgroundColor: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            marginRight: '10px',
          }}
        >
          ← Back to Dashboard
        </Link>
        <span style={{ fontSize: '14px', color: '#666' }}>
          Total Sessions: <strong>{sessions.length}</strong>
          {selectedSession && (
            <span style={{ marginLeft: '20px' }}>
              | Selected Session: <strong>{selectedSession.session_id}</strong>
            </span>
          )}
        </span>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3>Select Session to View Attendance</h3>
          {sessions.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th
                      style={{
                        padding: '12px',
                        border: '1px solid #dee2e6',
                        textAlign: 'left',
                      }}
                    >
                      Session ID
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        border: '1px solid #dee2e6',
                        textAlign: 'left',
                      }}
                    >
                      Class
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        border: '1px solid #dee2e6',
                        textAlign: 'left',
                      }}
                    >
                      Room
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        border: '1px solid #dee2e6',
                        textAlign: 'left',
                      }}
                    >
                      Start Time
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        border: '1px solid #dee2e6',
                        textAlign: 'left',
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr
                      key={session.session_id}
                      style={{ borderBottom: '1px solid #dee2e6' }}
                    >
                      <td
                        style={{ padding: '12px', border: '1px solid #dee2e6' }}
                      >
                        {session.session_id}
                      </td>
                      <td
                        style={{ padding: '12px', border: '1px solid #dee2e6' }}
                      >
                        <strong>{session.class_name}</strong>
                      </td>
                      <td
                        style={{ padding: '12px', border: '1px solid #dee2e6' }}
                      >
                        {session.room_name}
                      </td>
                      <td
                        style={{ padding: '12px', border: '1px solid #dee2e6' }}
                      >
                        {new Date(session.start_time).toLocaleString()}
                      </td>
                      <td
                        style={{ padding: '12px', border: '1px solid #dee2e6' }}
                      >
                        <button
                          onClick={() => handleSessionSelect(session)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          View Attendance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No sessions found.</p>
          )}
        </div>

        <div style={{ flex: 1 }}>
          {selectedSession && (
            <>
              <h3>Attendance for Session {selectedSession.session_id}</h3>
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '5px',
                  marginBottom: '20px',
                }}
              >
                <p>
                  <strong>Class:</strong> {selectedSession.class_name}
                </p>
                <p>
                  <strong>Room:</strong> {selectedSession.room_name}
                </p>
                <p>
                  <strong>Time:</strong>{' '}
                  {new Date(selectedSession.start_time).toLocaleString()} -{' '}
                  {new Date(selectedSession.end_time).toLocaleString()}
                </p>
                <p>
                  <strong>Total Attendance Records:</strong> {attendance.length}
                </p>
              </div>

              {attendance.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th
                          style={{
                            padding: '12px',
                            border: '1px solid #dee2e6',
                            textAlign: 'left',
                          }}
                        >
                          Student Name
                        </th>
                        <th
                          style={{
                            padding: '12px',
                            border: '1px solid #dee2e6',
                            textAlign: 'left',
                          }}
                        >
                          Email
                        </th>
                        <th
                          style={{
                            padding: '12px',
                            border: '1px solid #dee2e6',
                            textAlign: 'left',
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: '12px',
                            border: '1px solid #dee2e6',
                            textAlign: 'left',
                          }}
                        >
                          Marked At
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((record) => (
                        <tr
                          key={record.record_id}
                          style={{ borderBottom: '1px solid #dee2e6' }}
                        >
                          <td
                            style={{
                              padding: '12px',
                              border: '1px solid #dee2e6',
                            }}
                          >
                            <strong>
                              {record.student_first_name}{' '}
                              {record.student_last_name}
                            </strong>
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              border: '1px solid #dee2e6',
                            }}
                          >
                            {record.student_email}
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              border: '1px solid #dee2e6',
                            }}
                          >
                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor:
                                  record.status === 'present'
                                    ? '#d4edda'
                                    : record.status === 'absent'
                                      ? '#f8d7da'
                                      : '#fff3cd',
                                color:
                                  record.status === 'present'
                                    ? '#155724'
                                    : record.status === 'absent'
                                      ? '#721c24'
                                      : '#856404',
                              }}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              border: '1px solid #dee2e6',
                            }}
                          >
                            {new Date(record.marked_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No attendance records found for this session.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAttendanceOversightPage;
