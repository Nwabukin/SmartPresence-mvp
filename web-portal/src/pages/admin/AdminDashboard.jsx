import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalRooms: 0,
    totalClasses: 0,
    totalSessions: 0,
    recentSessions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: adminUser } = useAuth();

  const fetchDashboardData = async () => {
    if (adminUser?.role !== 'admin') {
      setError('Access Denied: You do not have permission to view this page.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch all data in parallel
      const [users, rooms, classes, sessions] = await Promise.all([
        apiRequest('/users', 'GET'),
        apiRequest('/rooms', 'GET'),
        apiRequest('/classes', 'GET'),
        apiRequest('/sessions', 'GET'),
      ]);

      // Calculate statistics
      const totalUsers = users?.length || 0;
      const totalTeachers =
        users?.filter((u) => u.role === 'teacher').length || 0;
      const totalStudents =
        users?.filter((u) => u.role === 'student').length || 0;
      const totalRooms = rooms?.length || 0;
      const totalClasses = classes?.length || 0;
      const totalSessions = sessions?.length || 0;

      // Get recent sessions (last 5)
      const recentSessions = sessions?.slice(0, 5) || [];

      setStats({
        totalUsers,
        totalTeachers,
        totalStudents,
        totalRooms,
        totalClasses,
        totalSessions,
        recentSessions,
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
    if (adminUser) {
      fetchDashboardData();
    }
  }, [adminUser]);

  if (adminUser?.role !== 'admin') {
    return <div>{error || 'Access Denied. Requires Admin privileges.'}</div>;
  }

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>
        <em>System overview and monitoring</em>
      </p>

      {/* Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}
      >
        <div
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '5px',
            textAlign: 'center',
          }}
        >
          <h3>{stats.totalUsers}</h3>
          <p>Total Users</p>
          <Link to="/admin/users">Manage Users</Link>
        </div>
        <div
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '5px',
            textAlign: 'center',
          }}
        >
          <h3>{stats.totalTeachers}</h3>
          <p>Teachers</p>
        </div>
        <div
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '5px',
            textAlign: 'center',
          }}
        >
          <h3>{stats.totalStudents}</h3>
          <p>Students</p>
        </div>
        <div
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '5px',
            textAlign: 'center',
          }}
        >
          <h3>{stats.totalRooms}</h3>
          <p>Rooms</p>
          <Link to="/admin/rooms">Manage Rooms</Link>
        </div>
        <div
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '5px',
            textAlign: 'center',
          }}
        >
          <h3>{stats.totalClasses}</h3>
          <p>Classes</p>
          <Link to="/admin/classes">View All Classes</Link>
        </div>
        <div
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '5px',
            textAlign: 'center',
          }}
        >
          <h3>{stats.totalSessions}</h3>
          <p>Sessions</p>
          <Link to="/admin/sessions">View All Sessions</Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to="/admin/users"
            style={{
              padding: '10px 15px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
            }}
          >
            Manage Users
          </Link>
          <Link
            to="/admin/rooms"
            style={{
              padding: '10px 15px',
              backgroundColor: '#28a745',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
            }}
          >
            Manage Rooms
          </Link>
          <Link
            to="/admin/classes"
            style={{
              padding: '10px 15px',
              backgroundColor: '#17a2b8',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
            }}
          >
            View Classes
          </Link>
          <Link
            to="/admin/sessions"
            style={{
              padding: '10px 15px',
              backgroundColor: '#ffc107',
              color: 'black',
              textDecoration: 'none',
              borderRadius: '5px',
            }}
          >
            View Sessions
          </Link>
          <Link
            to="/admin/attendance"
            style={{
              padding: '10px 15px',
              backgroundColor: '#6f42c1',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
            }}
          >
            Attendance Reports
          </Link>
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <h2>Recent Sessions</h2>
        {stats.recentSessions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Class</th>
                <th>Room</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSessions.map((session) => (
                <tr key={session.session_id}>
                  <td>{session.session_id}</td>
                  <td>{session.class_name}</td>
                  <td>{session.room_name}</td>
                  <td>{new Date(session.start_time).toLocaleString()}</td>
                  <td>{new Date(session.end_time).toLocaleString()}</td>
                  <td>
                    <Link
                      to={`/admin/attendance?session=${session.session_id}`}
                    >
                      View Attendance
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No recent sessions found.</p>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
