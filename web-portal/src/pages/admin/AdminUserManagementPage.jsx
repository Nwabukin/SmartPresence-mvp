import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/Modal';
import UserForm from '../../components/UserForm'; // Import UserForm

function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: adminUser } = useAuth();
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    if (adminUser?.role !== 'admin') {
      setError('Access Denied: You do not have permission to view this page.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiRequest('/users', 'GET');
      setUsers(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchUsers();
    }
  }, [adminUser]);

  const handleCreateUser = async (userData) => {
    try {
      // Debug: log payload (without password value length only)
      // eslint-disable-next-line no-console
      console.log('[Admin] Create user payload', {
        ...userData,
        password: userData.password ? `len:${userData.password.length}` : undefined,
      });
      const newUser = await apiRequest('/users', 'POST', userData);
      // eslint-disable-next-line no-console
      console.log('[Admin] Create user response', newUser);
      setUsers([newUser.user, ...users]); // Backend returns { message, user: newUser.rows[0] }
      setShowCreateUserModal(false);
      setError(null);
    } catch (err) {
      console.error('Error creating user:', err);
      setError(`Error creating user: ${err.message}`);
    }
  };

  const handleEditUserClick = async (userToEdit) => {
    try {
      // Fetch full user with profile to ensure prefill
      const full = await apiRequest(`/users/${userToEdit.user_id}`, 'GET');
      setEditingUser(full);
      setShowEditUserModal(true);
      setError(null);
    } catch (e) {
      console.error('Error fetching user for edit:', e);
      setError(`Failed to load user for edit: ${e.message}`);
    }
  };

  const handleUpdateUser = async (userData) => {
    if (!editingUser) return;
    try {
      // Debug: log update request
      // eslint-disable-next-line no-console
      console.log('[Admin] Update user payload', { id: editingUser.user_id, body: userData });
      const updatedUserResponse = await apiRequest(
        `/users/${editingUser.user_id}`,
        'PUT',
        userData
      );
      // eslint-disable-next-line no-console
      console.log('[Admin] Update user response', updatedUserResponse);
      // Assuming backend returns { message, user: result.rows[0] }
      const updatedUser = updatedUserResponse.user;
      setUsers(
        users.map((u) => (u.user_id === updatedUser.user_id ? updatedUser : u))
      );
      setShowEditUserModal(false);
      setEditingUser(null);
      setError(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(`Error updating user: ${err.message}`);
    }
  };

  const handleDeleteUserClick = async (userId) => {
    // eslint-disable-next-line no-restricted-globals
    if (
      confirm(
        'Are you sure you want to delete this user? This action cannot be undone.'
      )
    ) {
      try {
        await apiRequest(`/users/${userId}`, 'DELETE');
        setUsers(users.filter((u) => u.user_id !== userId));
        setError(null);
      } catch (err) {
        console.error('Error deleting user:', err);
        setError(`Error deleting user: ${err.message}`);
      }
    }
  };

  if (adminUser?.role !== 'admin') {
    return <div>{error || 'Access Denied. Requires Admin privileges.'}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error && !users.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Users</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchUsers}
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
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage system users and permissions</p>
            </div>
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="btn btn-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New User
            </button>
          </div>
        </div>
      </div>

      <div className="container py-8">
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

        {/* Users Table */}
        {users.length > 0 ? (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Users ({users.length})</h2>
              <p className="text-gray-600">Manage user accounts and permissions</p>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Profile ID</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.user_id}>
                        <td className="font-mono text-sm">{user.user_id}</td>
                        <td className="font-medium">{user.email}</td>
                        <td>
                          <div>
                            <div className="font-medium">{user.first_name} {user.last_name}</div>
                          </div>
                        </td>
                        <td className="font-mono text-sm">
                          {user.role === 'student' && user.profile?.matric_no ? (
                            <span>{user.profile.matric_no}</span>
                          ) : user.role === 'teacher' && user.profile?.lecturer_no ? (
                            <span>{user.profile.lecturer_no}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            user.role === 'admin' ? 'badge-error' :
                            user.role === 'teacher' ? 'badge-success' :
                            'badge-info'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="text-sm text-gray-600">
                          {(() => {
                            const d = user.created_at ? new Date(user.created_at) : null;
                            return d && !isNaN(d.getTime())
                              ? d.toLocaleDateString()
                              : '—';
                          })()}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEditUserClick(user)}
                              className="btn btn-secondary btn-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteUserClick(user.user_id)}
                              className="btn btn-danger btn-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first user account.</p>
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="btn btn-primary"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New User
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <Modal
        title="Create New User"
        show={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
      >
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateUserModal(false)}
        />
      </Modal>

      {editingUser && (
        <Modal
          title={`Edit User: ${editingUser.email}`}
          show={showEditUserModal}
          onClose={() => {
            setShowEditUserModal(false);
            setEditingUser(null);
          }}
        >
          <UserForm
            onSubmit={handleUpdateUser}
            initialData={editingUser}
            onCancel={() => {
              setShowEditUserModal(false);
              setEditingUser(null);
            }}
            isEditMode={true}
          />
        </Modal>
      )}
    </div>
  );
}

export default AdminUserManagementPage;
