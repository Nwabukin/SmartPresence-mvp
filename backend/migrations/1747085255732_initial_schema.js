/* eslint-disable @typescript-eslint/naming-convention */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create ENUM types
  pgm.createType('user_role', ['admin', 'teacher', 'student']);
  pgm.createType('attendance_status', ['present', 'absent', 'late', 'excused']);

  // Create users table
  pgm.createTable('users', {
    user_id: 'id',
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    first_name: { type: 'varchar(100)' },
    last_name: { type: 'varchar(100)' },
    role: { type: 'user_role', notNull: true },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create rooms table
  pgm.createTable('rooms', {
    room_id: 'id',
    name: { type: 'varchar(100)', notNull: true },
    location_description: { type: 'text' },
    wifi_ssid: { type: 'varchar(100)', notNull: true, unique: true },
    bluetooth_beacon_id: { type: 'varchar(100)', notNull: true, unique: true },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create classes table
  pgm.createTable('classes', {
    class_id: 'id',
    teacher_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    name: { type: 'varchar(150)', notNull: true },
    description: { type: 'text' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create enrollments table
  pgm.createTable('enrollments', {
    enrollment_id: 'id',
    student_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    class_id: {
      type: 'integer',
      notNull: true,
      references: 'classes',
      onDelete: 'CASCADE',
    },
    enrollment_date: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  // Unique constraint for enrollments
  pgm.addConstraint('enrollments', 'enrollments_student_class_unique', {
    unique: ['student_id', 'class_id'],
  });

  // Create sessions table
  pgm.createTable('sessions', {
    session_id: 'id',
    class_id: {
      type: 'integer',
      notNull: true,
      references: 'classes',
      onDelete: 'CASCADE',
    },
    room_id: {
      type: 'integer',
      notNull: true,
      references: 'rooms',
      onDelete: 'RESTRICT',
    },
    start_time: { type: 'timestamp with time zone', notNull: true },
    end_time: { type: 'timestamp with time zone', notNull: true },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  // Check constraint for session times
  pgm.addConstraint('sessions', 'check_session_times', {
    check: 'end_time > start_time',
  });

  // Create attendance_records table
  pgm.createTable('attendance_records', {
    record_id: 'id',
    session_id: {
      type: 'integer',
      notNull: true,
      references: 'sessions',
      onDelete: 'CASCADE',
    },
    student_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    marked_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    status: { type: 'attendance_status', notNull: true, default: 'present' },
    modified_by_teacher_id: {
      type: 'integer',
      references: 'users',
      onDelete: 'SET NULL',
    },
  });
  // Unique constraint for attendance records
  pgm.addConstraint(
    'attendance_records',
    'attendance_records_session_student_unique',
    {
      unique: ['session_id', 'student_id'],
    },
  );

  // Create indexes
  pgm.createIndex('enrollments', 'student_id');
  pgm.createIndex('enrollments', 'class_id');
  pgm.createIndex('sessions', 'class_id');
  pgm.createIndex('sessions', 'room_id');
  pgm.createIndex('attendance_records', 'session_id');
  pgm.createIndex('attendance_records', 'student_id');
};

exports.down = (pgm) => {
  // Drop tables in reverse order of creation due to dependencies
  pgm.dropIndex('attendance_records', 'student_id');
  pgm.dropIndex('attendance_records', 'session_id');
  pgm.dropIndex('sessions', 'room_id');
  pgm.dropIndex('sessions', 'class_id');
  pgm.dropIndex('enrollments', 'class_id');
  pgm.dropIndex('enrollments', 'student_id');

  pgm.dropConstraint(
    'attendance_records',
    'attendance_records_session_student_unique',
  );
  pgm.dropTable('attendance_records');

  pgm.dropConstraint('sessions', 'check_session_times');
  pgm.dropTable('sessions');

  pgm.dropConstraint('enrollments', 'enrollments_student_class_unique');
  pgm.dropTable('enrollments');

  pgm.dropTable('classes');

  pgm.dropTable('rooms');

  pgm.dropTable('users');

  // Drop ENUM types
  pgm.dropType('attendance_status');
  pgm.dropType('user_role');
}; 