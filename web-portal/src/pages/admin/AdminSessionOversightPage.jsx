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
    return <div>Loading sessions...</div>;
  }

  if (error && !sessions.length) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Session Overview (Admin)</h1>
      <p>
        <em>Read-only view of all sessions for system monitoring</em>
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
        </span>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
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
                  Class Name
                </th>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #dee2e6',
                    textAlign: 'left',
                  }}
                >
                  Course Code
                </th>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #dee2e6',
                    textAlign: 'left',
                  }}
                >
                  Room Name
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
                  End Time
                </th>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #dee2e6',
                    textAlign: 'left',
                  }}
                >
                  Created At
                </th>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #dee2e6',
                    textAlign: 'left',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.session_id}
                  style={{ borderBottom: '1px solid #dee2e6' }}
                >
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {session.session_id}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <strong>{session.class_name}</strong>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {session.course_code}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {session.room_name}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {new Date(session.start_time).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {new Date(session.end_time).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {new Date(session.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <Link
                      to={`/admin/attendance?session=${session.session_id}`}
                      style={{ color: '#007bff', textDecoration: 'none' }}
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
        !error && !loading && <p>No sessions found.</p>
      )}
    </div>
  );
}

export default AdminSessionOversightPage;
