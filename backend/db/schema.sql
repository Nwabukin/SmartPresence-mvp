-- Enum type for user roles
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');

-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Store hashed passwords only!
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
    room_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location_description TEXT, -- e.g., Building A, Floor 2
    wifi_ssid VARCHAR(100) UNIQUE NOT NULL, -- Assuming SSID is unique identifier for room wifi
    bluetooth_beacon_id VARCHAR(100) UNIQUE NOT NULL, -- Assuming beacon ID is unique
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE classes (
    class_id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Link to the teacher
    name VARCHAR(150) NOT NULL, -- e.g., Physics 101
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments table (Many-to-Many between Students and Classes)
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id) -- Ensure a student can only enroll once per class
);

-- Sessions table
CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES rooms(room_id) ON DELETE RESTRICT, -- Prevent deleting room if sessions exist
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_session_times CHECK (end_time > start_time) -- Ensure end time is after start time
);

-- Enum type for attendance status
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

-- Attendance Records table
CREATE TABLE attendance_records (
    record_id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device_id VARCHAR(200),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status attendance_status NOT NULL DEFAULT 'present',
    modified_by_teacher_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL, -- Track manual modifications
    UNIQUE(session_id, student_id) -- Ensure only one record per student per session
);

-- Optional: Indexes for performance on frequently queried columns
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX idx_sessions_class_id ON sessions(class_id);
CREATE INDEX idx_sessions_room_id ON sessions(room_id);
CREATE INDEX idx_attendance_session_id ON attendance_records(session_id);
CREATE INDEX idx_attendance_student_id ON attendance_records(student_id); 
CREATE INDEX IF NOT EXISTS idx_attendance_device_id ON attendance_records(device_id);
-- Enforce one device per session (prevents same device re-marking in a session)
DO $$ BEGIN
  ALTER TABLE attendance_records ADD CONSTRAINT uniq_session_device UNIQUE (session_id, device_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Profiles for Students and Teachers (role-specific data)
CREATE TABLE IF NOT EXISTS student_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    matric_no VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    course VARCHAR(150) NOT NULL,
    level VARCHAR(50) NOT NULL,
    phone VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS teacher_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    lecturer_no VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    faculty VARCHAR(150) NOT NULL,
    office VARCHAR(150),
    phone VARCHAR(50)
);

-- Notifications table for student notifications
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'session_reminder', 'attendance_confirmed', 'session_cancelled', 'class_enrolled'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_session_id INTEGER REFERENCES sessions(session_id) ON DELETE CASCADE,
    related_class_id INTEGER REFERENCES classes(class_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);