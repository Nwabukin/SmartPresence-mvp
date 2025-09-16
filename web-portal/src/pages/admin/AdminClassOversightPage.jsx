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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  if (error && !classes.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Classes</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchClasses}
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
              <h1 className="text-3xl font-bold text-gray-900">Class Overview</h1>
              <p className="text-gray-600 mt-1">Read-only view of all classes for system monitoring</p>
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
                <h2 className="text-xl font-semibold text-gray-900">Class Statistics</h2>
                <p className="text-gray-600">Overview of all classes in the system</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">{classes.length}</div>
                <div className="text-sm text-gray-600">Total Classes</div>
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

        {/* Classes Table */}
        {classes.length > 0 ? (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">All Classes</h2>
              <p className="text-gray-600">Monitor all classes across the system</p>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Class Name</th>
                      <th>Course Code</th>
                      <th>Description</th>
                      <th>Teacher ID</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((classItem) => (
                      <tr key={classItem.class_id}>
                        <td className="font-mono text-sm">{classItem.class_id}</td>
                        <td>
                          <div className="font-medium text-gray-900">{classItem.name}</div>
                        </td>
                        <td>
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {classItem.course_code}
                          </span>
                        </td>
                        <td className="text-gray-600">
                          {classItem.description || (
                            <span className="text-gray-400 italic">No description</span>
                          )}
                        </td>
                        <td className="font-mono text-sm">{classItem.teacher_id}</td>
                        <td className="text-sm text-gray-600">
                          {new Date(classItem.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <Link
                            to={`/admin/sessions?class=${classItem.class_id}`}
                            className="btn btn-primary btn-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Sessions
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Found</h3>
                <p className="text-gray-600">No classes have been created yet.</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default AdminClassOversightPage;
