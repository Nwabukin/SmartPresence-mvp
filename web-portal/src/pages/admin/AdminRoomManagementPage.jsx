import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiService'; // Assuming apiService is in services
import { useAuth } from '../../contexts/AuthContext'; // To check admin role

// Simple Modal Component (can be moved to a separate file later)
const Modal = ({ show, onClose, title, children }) => {
  if (!show) {
    return null;
  }
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', padding: 20, borderRadius: 5, minWidth: 300 }}>
        <h2>{title}</h2>
        {children}
        <button onClick={onClose} style={{marginTop: 10}}>Close</button>
      </div>
    </div>
  );
};

// Room Form Component (can be moved to a separate file later)
const RoomForm = ({ onSubmit, initialData = {}, onCancel }) => {
  const [name, setName] = useState(initialData.name || '');
  const [wifiSsid, setWifiSsid] = useState(initialData.wifi_ssid || '');
  const [beaconId, setBeaconId] = useState(initialData.bluetooth_beacon_id || '');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !wifiSsid) {
      setFormError('Room name and Wi-Fi SSID are required.');
      return;
    }
    setFormError('');
    onSubmit({ name, wifi_ssid: wifiSsid, bluetooth_beacon_id: beaconId });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="roomName">Room Name:</label>
        <input id="roomName" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="wifiSsid">Wi-Fi SSID:</label>
        <input id="wifiSsid" type="text" value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="beaconId">Bluetooth Beacon ID (Optional):</label>
        <input id="beaconId" type="text" value={beaconId} onChange={(e) => setBeaconId(e.target.value)} />
      </div>
      {formError && <p style={{ color: 'red' }}>{formError}</p>}
      <div style={{marginTop: 15}}>
        <button type="submit">Save Room</button>
        {onCancel && <button type="button" onClick={onCancel} style={{marginLeft: 10}}>Cancel</button>}
      </div>
    </form>
  );
};

function AdminRoomManagementPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Get user to check role
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); 
  const [editingRoom, setEditingRoom] = useState(null); 

  // TODO: Add logic for Create/Edit/Delete modals/forms

  useEffect(() => {
    const fetchRooms = async () => {
      // Ensure user is an admin before fetching
      // This check should ideally be part of a ProtectedRoute for admin roles
      if (user?.role !== 'admin') {
        setError('Access Denied: You do not have permission to view this page.');
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

    if (user) { // Only fetch if user context is available
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
      const updatedRoom = await apiRequest(`/rooms/${editingRoom.room_id}`, 'PUT', roomData);
      setRooms(rooms.map(r => r.room_id === updatedRoom.room_id ? updatedRoom : r));
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
    if (confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      try {
        await apiRequest(`/rooms/${roomId}`, 'DELETE');
        setRooms(rooms.filter(r => r.room_id !== roomId));
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
    return <div>Loading rooms...</div>;
  }

  if (error && !rooms.length) { // Show error prominently if it occurs and no rooms are loaded
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Room Management (Admin)</h1>
      <button onClick={() => setShowCreateModal(true)} style={{marginBottom: 15}}>Create New Room</button>
      
      <Modal title="Create New Room" show={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <RoomForm onSubmit={handleCreateRoom} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      {editingRoom && (
        <Modal title={`Edit Room: ${editingRoom.name}`} show={showEditModal} onClose={() => { setShowEditModal(false); setEditingRoom(null); }}>
          <RoomForm 
            onSubmit={handleUpdateRoom} 
            initialData={editingRoom} 
            onCancel={() => { setShowEditModal(false); setEditingRoom(null); }} 
          />
        </Modal>
      )}

      {error && <p style={{color: 'red'}}>{error}</p>} {/* Display general errors */}
      {rooms.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Wi-Fi SSID</th>
              <th>Bluetooth Beacon ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.room_id}>
                <td>{room.room_id}</td>
                <td>{room.name}</td>
                <td>{room.wifi_ssid}</td>
                <td>{room.bluetooth_beacon_id || 'N/A'}</td>
                <td>
                  <button onClick={() => handleEditClick(room)}>Edit</button>
                  <button onClick={() => handleDeleteClick(room.room_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !error && !loading && <p>No rooms found. Click "Create New Room" to add one.</p>
      )}
    </div>
  );
}

export default AdminRoomManagementPage; 