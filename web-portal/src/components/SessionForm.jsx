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
      
      // Extract date and time from ISO timestamps
      if (initialData.start_time) {
        const startDate = new Date(initialData.start_time);
        setSessionDate(startDate.toISOString().split('T')[0]);
        setStartTime(startDate.toTimeString().slice(0, 5)); // HH:MM format
      }
      
      if (initialData.end_time) {
        const endDate = new Date(initialData.end_time);
        setEndTime(endDate.toTimeString().slice(0, 5)); // HH:MM format
      }
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
    
    // Combine date and time into ISO timestamps preserving local intent
    // Build Date objects and serialize with timezone offset instead of forcing UTC
    const startLocal = new Date(`${sessionDate}T${startTime}:00`);
    const endLocal = new Date(`${sessionDate}T${endTime}:00`);

    const toIsoWithOffset = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const HH = pad(d.getHours());
      const MM = pad(d.getMinutes());
      const SS = pad(d.getSeconds());
      const tzMin = d.getTimezoneOffset(); // minutes difference from UTC
      const sign = tzMin > 0 ? '-' : '+';
      const abs = Math.abs(tzMin);
      const offH = pad(Math.floor(abs / 60));
      const offM = pad(abs % 60);
      return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}${sign}${offH}:${offM}`;
    };

    const startDateTime = toIsoWithOffset(startLocal);
    const endDateTime = toIsoWithOffset(endLocal);
    
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
