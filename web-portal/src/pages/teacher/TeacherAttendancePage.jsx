import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

function TeacherAttendancePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]); // For displaying class name
  const [rooms, setRooms] = useState([]); // For displaying room name

  // Fetch initial data: teacher's sessions, classes, and rooms
  useEffect(() => {
    const fetchInitialData = async () => {
      if (user?.role === 'teacher') {
        setLoading(true);
        try {
          const [fetchedSessions, fetchedClasses, fetchedRooms] =
            await Promise.all([
              apiRequest('/sessions'), // Fetches sessions for the logged-in teacher
              apiRequest('/classes'), // Fetches classes for the logged-in teacher
              apiRequest('/rooms'), // Fetches all rooms
            ]);
          setSessions(fetchedSessions || []);
          setClasses(fetchedClasses || []);
          setRooms(fetchedRooms || []);
          if (fetchedSessions && fetchedSessions.length > 0) {
            // Optionally, auto-select the first session or the most recent one
            // setSelectedSession(fetchedSessions[0].session_id);
          }
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
  }, [user]);

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
      // API endpoint: PUT /attendance-records/:recordId
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
    return `${classInfo ? classInfo.name : 'Unknown Class'} - ${roomInfo ? roomInfo.name : 'Unknown Room'} - ${new Date(session.session_date).toLocaleDateString()} ${session.start_time}-${session.end_time}`;
  };

  if (user?.role !== 'teacher') {
    return <div>Access Denied: Requires Teacher privileges.</div>;
  }

  return (
    <div>
      <h1>View & Modify Attendance</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <label htmlFor="session-select">Select Session:</label>
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

      {loading && <p>Loading...</p>}

      {selectedSession && !loading && (
        <>
          <h2>
            Attendance for:{' '}
            {sessions.find((s) => s.session_id === parseInt(selectedSession))
              ? getSessionDisplayInfo(selectedSession)
              : 'Selected Session'}
          </h2>
          {attendanceRecords.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Student ID</th>
                  <th>Student Name</th>{' '}
                  {/* Assuming student details are part of the record */}
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record.record_id}>
                    <td>{record.record_id}</td>
                    <td>{record.student_id}</td>
                    <td>{record.student_name || 'N/A'}</td>{' '}
                    {/* Adjust if student_name is available */}
                    <td>{new Date(record.timestamp).toLocaleString()}</td>
                    <td>{record.status}</td>
                    <td>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>
              No attendance records found for this session, or no students were
              expected.
            </p>
          )}
        </>
      )}
      {!selectedSession && !loading && sessions.length > 0 && (
        <p>Please select a session to view attendance.</p>
      )}
      {!selectedSession && !loading && sessions.length === 0 && (
        <p>No sessions available. Please schedule a session first.</p>
      )}
    </div>
  );
}

export default TeacherAttendancePage;
