import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

function TeacherAttendancePage() {
  const { user: teacherUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Fetch initial data: teacher's sessions, classes, and rooms
  useEffect(() => {
    const fetchInitialData = async () => {
      if (teacherUser?.role === 'teacher') {
        setLoading(true);
        try {
          const [fetchedSessions, fetchedClasses, fetchedRooms] =
            await Promise.all([
              apiRequest('/sessions'),
              apiRequest('/classes'),
              apiRequest('/rooms'),
            ]);
          setSessions(fetchedSessions || []);
          setClasses(fetchedClasses || []);
          setRooms(fetchedRooms || []);
          setError(null);
        } catch (err) {
          setError('Failed to fetch initial data: ' + err.message);
          setSessions([]);
          setClasses([]);
          setRooms([]);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchInitialData();
  }, [teacherUser]);

  // Fetch attendance records when a session is selected
  useEffect(() => {
    const fetchAttendance = async () => {
      if (selectedSession) {
        setLoading(true);
        try {
          // API endpoint: /sessions/:sessionId/attendance
          const data = await apiRequest(
            `/sessions/${selectedSession}/attendance`
          );
          setAttendanceRecords(data || []);
          setError(null);
        } catch (err) {
          setError('Failed to fetch attendance records: ' + err.message);
          setAttendanceRecords([]);
        } finally {
          setLoading(false);
        }
      }
    };
    if (selectedSession) {
      fetchAttendance();
    }
  }, [selectedSession]);

  const handleUpdateAttendance = async (recordId, newStatus) => {
    setLoading(true);
    try {
      await apiRequest(`/attendance-records/${recordId}`, 'PUT', {
        status: newStatus,
      });
      
      // Re-fetch attendance records for the current session to reflect changes
      const updatedData = await apiRequest(
        `/sessions/${selectedSession}/attendance`
      );
      setAttendanceRecords(updatedData || []);
      setError(null);
    } catch (err) {
      setError('Failed to update attendance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSessionDisplayInfo = (sessionId) => {
    const session = sessions.find((s) => s.session_id === parseInt(sessionId));
    if (!session) return 'Session details not found';
    const classInfo = classes.find((c) => c.class_id === session.class_id);
    const roomInfo = rooms.find((r) => r.room_id === session.room_id);
    const sessionDate = new Date(session.start_time);
    const startTime = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const endTime = new Date(session.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${classInfo ? classInfo.name : 'Unknown Class'} - ${roomInfo ? roomInfo.name : 'Unknown Room'} - ${sessionDate.toLocaleDateString()} ${startTime}-${endTime}`;
  };

  if (teacherUser?.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md">
          <div className="card-body text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You do not have the required permissions to view this page.</p>
            <Link to="/" className="btn btn-primary">Go to Homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error && sessions.length === 0) {
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

  const selectedSessionData = sessions.find((s) => s.session_id === parseInt(selectedSession));
  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { class: 'badge-success', label: 'Present' },
      absent: { class: 'badge-error', label: 'Absent' },
      late: { class: 'badge-warning', label: 'Late' },
      excused: { class: 'badge-info', label: 'Excused' }
    };
    const config = statusConfig[status] || { class: 'badge-neutral', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const getAttendanceStats = () => {
    if (attendanceRecords.length === 0) return null;
    
    const stats = attendanceRecords.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});
    
    const total = attendanceRecords.length;
    const present = stats.present || 0;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { total, present, attendanceRate, stats };
  };

  const attendanceStats = getAttendanceStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
              <p className="text-gray-600 mt-1">View and manage student attendance for your sessions</p>
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

        {/* Session Selection */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Select Session</h2>
            <p className="text-gray-600">Choose a session to view and manage attendance</p>
          </div>
          <div className="card-body">
            <div className="max-w-2xl">
              <label htmlFor="session-select" className="block text-sm font-medium text-gray-700 mb-2">
                Session
              </label>
              <div className="select select-bordered">
                <select
                  id="session-select"
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  disabled={loading || sessions.length === 0}
                >
                  <option value="">-- Select a Session --</option>
                  {sessions.map((session) => (
                    <option key={session.session_id} value={session.session_id}>
                      {getSessionDisplayInfo(session.session_id)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {selectedSession && selectedSessionData && (
          <>
            {/* Session Info */}
            <div className="card mb-8">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Session Information</h2>
                <p className="text-gray-600">Details for the selected session</p>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <p className="text-gray-900">
                      {classes.find(c => c.class_id === selectedSessionData.class_id)?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {classes.find(c => c.class_id === selectedSessionData.class_id)?.course_code || ''}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                    <p className="text-gray-900">
                      {rooms.find(r => r.room_id === selectedSessionData.room_id)?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Capacity: {rooms.find(r => r.room_id === selectedSessionData.room_id)?.capacity || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <p className="text-gray-900">
                      {new Date(selectedSessionData.start_time).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedSessionData.start_time).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: true 
                      })} - {new Date(selectedSessionData.end_time).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: true 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Statistics */}
            {attendanceStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card">
                  <div className="card-body text-center">
                    <div className="text-3xl font-bold text-gray-900">{attendanceStats.total}</div>
                    <div className="text-sm text-gray-600">Total Students</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <div className="text-3xl font-bold text-green-600">{attendanceStats.present}</div>
                    <div className="text-sm text-gray-600">Present</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <div className="text-3xl font-bold text-blue-600">{attendanceStats.attendanceRate}%</div>
                    <div className="text-sm text-gray-600">Attendance Rate</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <div className="text-3xl font-bold text-red-600">{attendanceStats.stats.absent || 0}</div>
                    <div className="text-sm text-gray-600">Absent</div>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Records */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">
                  Attendance Records ({attendanceRecords.length})
                </h2>
                <p className="text-gray-600">Manage individual student attendance</p>
              </div>
              <div className="card-body">
                {loading && (
                  <div className="text-center py-8">
                    <div className="loading mb-4"></div>
                    <p className="text-gray-600">Loading attendance records...</p>
                  </div>
                )}

                {!loading && attendanceRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Student Name</th>
                          <th>Matric Number</th>
                          <th>Timestamp</th>
                          <th>Current Status</th>
                          <th>Update Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.map((record) => (
                          <tr key={record.record_id}>
                            <td className="font-mono text-sm">{record.student_id}</td>
                            <td className="font-medium">
                              {record.student_first_name && record.student_last_name 
                                ? `${record.student_first_name} ${record.student_last_name}`
                                : 'N/A'
                              }
                            </td>
                            <td>
                              {record.student_matric_no ? (
                                <span className="badge badge-info">{record.student_matric_no}</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="text-sm text-gray-600">
                              {record.marked_at ? new Date(record.marked_at).toLocaleString() : 'Invalid Date'}
                            </td>
                            <td>{getStatusBadge(record.status)}</td>
                            <td>
                              <div className="select select-bordered select-sm">
                                <select
                                  value={record.status}
                                  onChange={(e) =>
                                    handleUpdateAttendance(
                                      record.record_id,
                                      e.target.value
                                    )
                                  }
                                  disabled={loading}
                                >
                                  <option value="present">Present</option>
                                  <option value="absent">Absent</option>
                                  <option value="late">Late</option>
                                  <option value="excused">Excused</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : !loading && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
                    <p className="text-gray-600">
                      No attendance records found for this session, or no students were expected.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!selectedSession && sessions.length > 0 && (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Session</h3>
              <p className="text-gray-600">Choose a session from the dropdown above to view attendance records.</p>
            </div>
          </div>
        )}

        {!selectedSession && sessions.length === 0 && (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Available</h3>
              <p className="text-gray-600 mb-4">You haven't scheduled any sessions yet.</p>
              <Link to="/teacher/sessions" className="btn btn-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Schedule a Session
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherAttendancePage;
