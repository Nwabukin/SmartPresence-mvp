import React, { useState, useEffect } from 'react';

const SessionForm = ({
  onSubmit,
  initialData = {},
  classes = [],
  rooms = [],
  onCancel,
  isEditMode = false,
}) => {
  const [classId, setClassId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isEditMode && initialData) {
      setClassId(initialData.class_id || '');
      setRoomId(initialData.room_id || '');
      // Assuming session_date is in YYYY-MM-DD format from backend for date input
      setSessionDate(
        initialData.session_date
          ? new Date(initialData.session_date).toISOString().split('T')[0]
          : ''
      );
      setStartTime(initialData.start_time || '');
      setEndTime(initialData.end_time || '');
    } else {
      // Reset form for create mode or if no initial data
      setClassId('');
      setRoomId('');
      setSessionDate('');
      setStartTime('');
      setEndTime('');
    }
  }, [initialData, isEditMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!classId || !roomId || !sessionDate || !startTime || !endTime) {
      setFormError('All fields are required.');
      return;
    }
    // Basic time validation (start < end)
    if (startTime >= endTime) {
      setFormError('Start time must be before end time.');
      return;
    }
    setFormError('');
    
    // Combine date and time into ISO timestamps
    const startDateTime = new Date(`${sessionDate}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${sessionDate}T${endTime}:00`).toISOString();
    
    onSubmit({
      class_id: parseInt(classId),
      room_id: parseInt(roomId),
      start_time: startDateTime,
      end_time: endDateTime,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
    >
      <div>
        <label
          htmlFor="class"
          style={{ display: 'block', marginBottom: '5px' }}
        >
          Class:
        </label>
        <select
          id="class"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="">Select Class</option>
          {classes.map((cls) => (
            <option key={cls.class_id} value={cls.class_id}>
              {cls.name} ({cls.course_code})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="room" style={{ display: 'block', marginBottom: '5px' }}>
          Room:
        </label>
        <select
          id="room"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="">Select Room</option>
          {rooms.map((room) => (
            <option key={room.room_id} value={room.room_id}>
              {room.name} (Capacity: {room.capacity})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="sessionDate"
          style={{ display: 'block', marginBottom: '5px' }}
        >
          Date:
        </label>
        <input
          id="sessionDate"
          type="date"
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div>
        <label
          htmlFor="startTime"
          style={{ display: 'block', marginBottom: '5px' }}
        >
          Start Time:
        </label>
        <input
          id="startTime"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div>
        <label
          htmlFor="endTime"
          style={{ display: 'block', marginBottom: '5px' }}
        >
          End Time:
        </label>
        <input
          id="endTime"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      {formError && <p style={{ color: 'red', marginTop: 0 }}>{formError}</p>}
      <div
        style={{
          marginTop: '10px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
        }}
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '8px 15px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          style={{
            padding: '8px 15px',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {isEditMode ? 'Update Session' : 'Schedule Session'}
        </button>
      </div>
    </form>
  );
};

export default SessionForm;
