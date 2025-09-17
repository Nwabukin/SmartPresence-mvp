import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiService'; // Assuming apiService is in services
import { useAuth } from '../../contexts/AuthContext'; // To check admin role
import Modal from '../../components/Modal'; // Import Modal
import RoomForm from '../../components/RoomForm'; // Import RoomForm

function AdminRoomManagementPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Get user to check role
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // CRUD operations are fully implemented below

  useEffect(() => {
    const fetchRooms = async () => {
      // Ensure user is an admin before fetching
      // This check should ideally be part of a ProtectedRoute for admin roles
      if (user?.role !== 'admin') {
        setError(
          'Access Denied: You do not have permission to view this page.'
        );
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await apiRequest('/rooms', 'GET'); // Endpoint for fetching rooms
        setRooms(data || []); // data might be null if API returns 204 or unexpected
        setError(null);
      } catch (err) {
        console.error('Error fetching rooms:', err);
        setError(err.message || 'Failed to fetch rooms.');
        setRooms([]); // Clear rooms on error
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      // Only fetch if user context is available
      fetchRooms();
    }
  }, [user]); // Refetch if user changes (e.g., after login)

  const handleCreateRoom = async (roomData) => {
    try {
      const newRoom = await apiRequest('/rooms', 'POST', roomData);
      setRooms([newRoom, ...rooms]);
      setShowCreateModal(false);
      setError(null); // Clear previous errors
    } catch (err) {
      console.error('Error creating room:', err);
      setError(`Error creating room: ${err.message}`);
    }
  };

  const handleEditClick = (room) => {
    setEditingRoom(room);
    setShowEditModal(true);
    setError(null); // Clear previous errors
  };

  const handleUpdateRoom = async (roomData) => {
    if (!editingRoom) return;
    try {
      const updatedRoom = await apiRequest(
        `/rooms/${editingRoom.room_id}`,
        'PUT',
        roomData
      );
      setRooms(
        rooms.map((r) => (r.room_id === updatedRoom.room_id ? updatedRoom : r))
      );
      setShowEditModal(false);
      setEditingRoom(null);
      setError(null);
    } catch (err) {
      console.error('Error updating room:', err);
      setError(`Error updating room: ${err.message}`);
    }
  };

  const handleDeleteClick = async (roomId) => {
    // eslint-disable-next-line no-restricted-globals
    if (
      confirm(
        'Are you sure you want to delete this room? This action cannot be undone.'
      )
    ) {
      try {
        await apiRequest(`/rooms/${roomId}`, 'DELETE');
        setRooms(rooms.filter((r) => r.room_id !== roomId));
        setError(null); // Clear previous errors
      } catch (err) {
        console.error('Error deleting room:', err);
        setError(`Error deleting room: ${err.message}`);
      }
    }
  };

  if (user?.role !== 'admin') {
    // This will be rendered if the initial role check in useEffect fails or before user is loaded
    return <div>{error || 'Access Denied. Requires Admin privileges.'}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (error && !rooms.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Rooms</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
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
              <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
              <p className="text-gray-600 mt-1">Manage classroom locations and tracking devices</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Room
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

        {/* Rooms Table */}
        {rooms.length > 0 ? (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Rooms ({rooms.length})</h2>
              <p className="text-gray-600">Manage classroom locations and tracking devices</p>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Wi-Fi SSID</th>
                      <th>Bluetooth Beacon</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room.room_id}>
                        <td className="font-mono text-sm">{room.room_id}</td>
                        <td className="font-medium">{room.name}</td>
                        <td>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                            </svg>
                            <span className="font-mono text-sm">{room.wifi_ssid}</span>
                          </div>
                        </td>
                        <td>
                          {room.bluetooth_beacon_id ? (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="font-mono text-sm">{room.bluetooth_beacon_id}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not configured</span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEditClick(room)}
                              className="btn btn-secondary btn-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(room.room_id)}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Rooms Found</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first room with tracking devices.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Room
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <Modal
        title="Create New Room"
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      >
        <RoomForm
          onSubmit={handleCreateRoom}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
      {editingRoom && (
        <Modal
          title={`Edit Room: ${editingRoom.name}`}
          show={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingRoom(null);
          }}
        >
          <RoomForm
            onSubmit={handleUpdateRoom}
            initialData={editingRoom}
            onCancel={() => {
              setShowEditModal(false);
              setEditingRoom(null);
            }}
            isEditMode={true}
          />
        </Modal>
      )}
    </div>
  );
}

export default AdminRoomManagementPage;
