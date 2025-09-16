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
      const newUser = await apiRequest('/users', 'POST', userData);
      setUsers([newUser.user, ...users]); // Backend returns { message, user: newUser.rows[0] }
      setShowCreateUserModal(false);
      setError(null);
    } catch (err) {
      console.error('Error creating user:', err);
      setError(`Error creating user: ${err.message}`);
    }
  };

  const handleEditUserClick = (userToEdit) => {
    setEditingUser(userToEdit);
    setShowEditUserModal(true);
    setError(null);
  };

  const handleUpdateUser = async (userData) => {
    if (!editingUser) return;
    try {
      const updatedUserResponse = await apiRequest(
        `/users/${editingUser.user_id}`,
        'PUT',
        userData
      );
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
    return <div>Loading users...</div>;
  }

  if (error && !users.length) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>User Management (Admin)</h1>
      <button
        onClick={() => setShowCreateUserModal(true)}
        style={{ marginBottom: 15 }}
      >
        Create New User
      </button>

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

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {users.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td>{user.user_id}</td>
                <td>{user.email}</td>
                <td>{user.first_name}</td>
                <td>{user.last_name}</td>
                <td>{user.role}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleEditUserClick(user)}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteUserClick(user.user_id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !error &&
        !loading && <p>No users found. Click "Create New User" to add one.</p>
      )}
    </div>
  );
}

export default AdminUserManagementPage;
