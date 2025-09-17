import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/Modal';
import SessionForm from '../../components/SessionForm';

function TeacherSessionManagementPage() {
  const { user: teacherUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentSession, setCurrentSession] = useState(null);
  const [formSubmissionError, setFormSubmissionError] = useState(null);

  // Fetch initial data: teacher's classes, all rooms (for form), and existing sessions
  const fetchData = async () => {
    if (teacherUser?.role !== 'teacher') {
      setError('Access Denied');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [fetchedSessions, fetchedClasses, fetchedRooms] = await Promise.all(
        [
          apiRequest('/sessions'),
          apiRequest('/classes'),
          apiRequest('/rooms'),
        ]
      );
      setSessions(fetchedSessions || []);
      setClasses(fetchedClasses || []);
      setRooms(fetchedRooms || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching session management data:', err);
      setError('Failed to load data: ' + err.message);
      setSessions([]);
      setClasses([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teacherUser) {
      fetchData();
    }
  }, [teacherUser]);

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
        await apiRequest(
          `/sessions/${currentSession.session_id}`,
          'PUT',
          sessionData
        );
      }
      fetchData(); // Re-fetch all data including sessions
      closeModal();
    } catch (err) {
      console.error(
        `Error ${modalMode === 'create' ? 'creating' : 'updating'} session:`,
        err
      );
      setFormSubmissionError(
        err.message ||
          `Failed to ${modalMode === 'create' ? 'create' : 'update'} session.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      setLoading(true);
      try {
        await apiRequest(`/sessions/${sessionId}`, 'DELETE');
        fetchData();
        setError(null);
      } catch (err) {
        console.error('Error deleting session:', err);
        setError('Failed to delete session: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!teacherUser || teacherUser.role !== 'teacher') {
    return <div>{error || 'Access Denied: Requires Teacher privileges.'}</div>;
  }

  if (loading && !isModalOpen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-gray-600">Loading session data...</p>
        </div>
      </div>
    );
  }

  if (error && sessions.length === 0 && classes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
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
              <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
              <p className="text-gray-600 mt-1">Schedule and manage your class sessions</p>
            </div>
            <Link to="/teacher/dashboard" className="btn btn-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
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

        {/* Action Bar */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Schedule Sessions</h2>
                <p className="text-gray-600">Create and manage your class sessions</p>
              </div>
              <button
                onClick={() => openModal('create')}
                disabled={loading || classes.length === 0 || rooms.length === 0}
                className="btn btn-primary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Schedule New Session
              </button>
            </div>

            {/* Prerequisites Check */}
            <div className="mt-4 space-y-2">
              {classes.length === 0 && (
                <div className="alert alert-warning">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    You must have at least one class to schedule a session.
                  </div>
                </div>
              )}
              {rooms.length === 0 && (
                <div className="alert alert-warning">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    There are no rooms available to schedule a session.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">
              Existing Sessions ({sessions.length})
            </h2>
            <p className="text-gray-600">Your scheduled class sessions</p>
          </div>
          <div className="card-body">
            {loading && (
              <div className="text-center py-8">
                <div className="loading mb-4"></div>
                <p className="text-gray-600">Loading sessions...</p>
              </div>
            )}

            {!loading && sessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Session ID</th>
                      <th>Class</th>
                      <th>Room</th>
                      <th>Date</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Duration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => {
                      const classDetails = classes.find(
                        (c) => c.class_id === session.class_id
                      );
                      const roomDetails = rooms.find(
                        (r) => r.room_id === session.room_id
                      );
                      
                      // Calculate duration
                      const startTime = new Date(`2000-01-01T${session.start_time}`);
                      const endTime = new Date(`2000-01-01T${session.end_time}`);
                      const durationMs = endTime - startTime;
                      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
                      const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                      const duration = `${durationHours}h ${durationMinutes}m`;

                      return (
                        <tr key={session.session_id}>
                          <td className="font-mono text-sm">{session.session_id}</td>
                          <td>
                            <div>
                              <div className="font-medium">{classDetails ? classDetails.name : 'N/A'}</div>
                              {classDetails && (
                                <div className="text-sm text-gray-500">{classDetails.course_code}</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="font-medium">{roomDetails ? roomDetails.name : 'N/A'}</div>
                              {roomDetails && (
                                <div className="text-sm text-gray-500">Capacity: {roomDetails.capacity}</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="text-sm">
                              <div className="font-medium">
                                {new Date(session.session_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-gray-500">
                                {new Date(session.session_date).toLocaleDateString('en-US', {
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </td>
                          <td className="font-mono text-sm">{session.start_time}</td>
                          <td className="font-mono text-sm">{session.end_time}</td>
                          <td className="text-sm text-gray-600">{duration}</td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openModal('edit', session)}
                                disabled={classes.length === 0 || rooms.length === 0}
                                className="btn btn-primary btn-sm"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSession(session.session_id)}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Scheduled</h3>
                <p className="text-gray-600 mb-4">You haven't scheduled any class sessions yet.</p>
                <button
                  onClick={() => openModal('create')}
                  disabled={classes.length === 0 || rooms.length === 0}
                  className="btn btn-primary"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Schedule Your First Session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <Modal
          onClose={closeModal}
          title={
            modalMode === 'create' ? 'Schedule New Session' : 'Edit Session'
          }
        >
          <SessionForm
            onSubmit={handleFormSubmit}
            initialData={currentSession}
            classes={classes}
            rooms={rooms}
            onCancel={closeModal}
            isEditMode={modalMode === 'edit'}
          />
          {formSubmissionError && (
            <div className="alert alert-error mt-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formSubmissionError}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

export default TeacherSessionManagementPage;
