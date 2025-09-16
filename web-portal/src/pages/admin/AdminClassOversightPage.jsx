import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

function AdminClassOversightPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: adminUser } = useAuth();

  const fetchClasses = async () => {
    if (adminUser?.role !== 'admin') {
      setError('Access Denied: You do not have permission to view this page.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiRequest('/classes', 'GET');
      setClasses(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError(err.message || 'Failed to fetch classes.');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchClasses();
    }
  }, [adminUser]);

  if (adminUser?.role !== 'admin') {
    return <div>{error || 'Access Denied. Requires Admin privileges.'}</div>;
  }

  if (loading) {
    return <div>Loading classes...</div>;
  }

  if (error && !classes.length) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Class Overview (Admin)</h1>
      <p>
        <em>Read-only view of all classes for system monitoring</em>
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
          Total Classes: <strong>{classes.length}</strong>
        </span>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {classes.length > 0 ? (
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
                  ID
                </th>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #dee2e6',
                    textAlign: 'left',
                  }}
                >
                  Name
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
                  Description
                </th>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #dee2e6',
                    textAlign: 'left',
                  }}
                >
                  Teacher ID
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
              {classes.map((classItem) => (
                <tr
                  key={classItem.class_id}
                  style={{ borderBottom: '1px solid #dee2e6' }}
                >
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {classItem.class_id}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <strong>{classItem.name}</strong>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {classItem.course_code}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {classItem.description || 'N/A'}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {classItem.teacher_id}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {new Date(classItem.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <Link
                      to={`/admin/sessions?class=${classItem.class_id}`}
                      style={{ color: '#007bff', textDecoration: 'none' }}
                    >
                      View Sessions
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !error && !loading && <p>No classes found.</p>
      )}
    </div>
  );
}

export default AdminClassOversightPage;
