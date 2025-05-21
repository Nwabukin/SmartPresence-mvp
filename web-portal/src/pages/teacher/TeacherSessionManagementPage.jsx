import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/Modal';
import SessionForm from '../../components/SessionForm'; // Import SessionForm

function TeacherSessionManagementPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]); // For selecting a class when creating/filtering sessions
  const [rooms, setRooms] = useState([]); // For selecting a room when creating sessions
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentSession, setCurrentSession] = useState(null);
  const [formSubmissionError, setFormSubmissionError] = useState(null);

  // Fetch initial data: teacher's classes, all rooms (for form), and existing sessions
  const fetchData = async () => {
    if (user?.role !== 'teacher') {
      setError('Access Denied');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [fetchedSessions, fetchedClasses, fetchedRooms] = await Promise.all([
        apiRequest('/sessions'), // Assuming /sessions fetches sessions for the logged-in teacher
        apiRequest('/classes'),   // Assuming /classes fetches classes for the logged-in teacher
        apiRequest('/rooms')      // Assuming /rooms fetches all rooms
      ]);
      setSessions(fetchedSessions || []);
      setClasses(fetchedClasses || []);
      setRooms(fetchedRooms || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching session management data:", err);
      setError("Failed to load data: " + err.message);
      setSessions([]);
      setClasses([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
        fetchData();
    }
  }, [user]);

  const openModal = (mode, session = null) => {
    setModalMode(mode);
    setCurrentSession(session);
    setFormSubmissionError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSession(null);
    setFormSubmissionError(null);
  };

  const handleFormSubmit = async (sessionData) => {
    setFormSubmissionError(null);
    setLoading(true);
    try {
      if (modalMode === 'create') {
        await apiRequest('/sessions', 'POST', sessionData);
      } else if (modalMode === 'edit' && currentSession) {
        await apiRequest(`/sessions/${currentSession.session_id}`, 'PUT', sessionData);
      }
      fetchData(); // Re-fetch all data including sessions
      closeModal();
    } catch (err) {
      console.error(`Error ${modalMode === 'create' ? 'creating' : 'updating'} session:`, err);
      setFormSubmissionError(err.message || `Failed to ${modalMode === 'create' ? 'create' : 'update'} session.`);
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      setLoading(true);
      try {
        await apiRequest(`/sessions/${sessionId}`, 'DELETE');
        fetchData(); // Re-fetch all data including sessions
      } catch (err) {
        console.error('Error deleting session:', err);
        setError("Failed to delete session: " + err.message); // Display error to user
      } finally {
          setLoading(false);
      }
    }
  };

  if (!user || user.role !== 'teacher') {
    return <div>{error || 'Access Denied: Requires Teacher privileges.'}</div>;
  }

  if (loading && !isModalOpen) { // Avoid page loading indicator when modal is active and performing its own loading
    return <div>Loading session data...</div>;
  }
  
  return (
    <div>
      <h1>Manage Class Sessions</h1>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <button onClick={() => openModal('create')} style={{ marginBottom: 15 }} disabled={loading || classes.length === 0 || rooms.length === 0}>
        Schedule New Session
      </button>
      {classes.length === 0 && <p style={{color: 'orange'}}>You must have at least one class to schedule a session.</p>}
      {rooms.length === 0 && <p style={{color: 'orange'}}>There are no rooms available to schedule a session.</p>}

      <h2>Existing Sessions</h2>
      {sessions.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Class</th>
              <th>Room</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => {
                const classDetails = classes.find(c => c.class_id === session.class_id);
                const roomDetails = rooms.find(r => r.room_id === session.room_id);
                return (
                    <tr key={session.session_id}>
                        <td>{session.session_id}</td>
                        <td>{classDetails ? classDetails.name : 'N/A'}</td>
                        <td>{roomDetails ? roomDetails.name : 'N/A'}</td>
                        <td>{new Date(session.session_date).toLocaleDateString()}</td>
                        <td>{session.start_time}</td>
                        <td>{session.end_time}</td>
                        <td>
                        <button onClick={() => openModal('edit', session)} style={{ marginRight: '5px' }} disabled={classes.length === 0 || rooms.length === 0}>
                            Edit
                        </button>
                        <button onClick={() => handleDeleteSession(session.session_id)}>Delete</button>
                        </td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      ) : (
        <p>No sessions scheduled yet.</p>
      )}

      {isModalOpen && (
        <Modal onClose={closeModal} title={modalMode === 'create' ? 'Schedule New Session' : 'Edit Session'}>
          <SessionForm 
            onSubmit={handleFormSubmit} 
            initialData={currentSession}
            classes={classes} 
            rooms={rooms} 
            onCancel={closeModal} 
            isEditMode={modalMode === 'edit'}
            // Pass loading state to form if needed for submit button
          />
          {formSubmissionError && <p style={{ color: 'red', marginTop: '10px' }}>{formSubmissionError}</p>}
        </Modal>
      )}
    </div>
  );
}

export default TeacherSessionManagementPage; 