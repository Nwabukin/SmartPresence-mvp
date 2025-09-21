/* eslint-disable @typescript-eslint/naming-convention */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // student_profiles table
  pgm.createTable('student_profiles', {
    student_profile_id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    matric_no: { type: 'varchar(100)', notNull: true },
    department: { type: 'varchar(150)', notNull: true },
    course: { type: 'varchar(150)', notNull: true },
    level: { type: 'varchar(50)', notNull: true },
    phone: { type: 'varchar(50)' },
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
  // Unique constraints for student profiles
  pgm.addConstraint('student_profiles', 'student_profiles_user_unique', {
    unique: ['user_id'],
  });
  pgm.addConstraint('student_profiles', 'student_profiles_matric_no_unique', {
    unique: ['matric_no'],
  });

  // teacher_profiles table
  pgm.createTable('teacher_profiles', {
    teacher_profile_id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    lecturer_no: { type: 'varchar(100)', notNull: true },
    department: { type: 'varchar(150)', notNull: true },
    office: { type: 'varchar(150)' },
    phone: { type: 'varchar(50)' },
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
  // Unique constraints for teacher profiles
  pgm.addConstraint('teacher_profiles', 'teacher_profiles_user_unique', {
    unique: ['user_id'],
  });
  pgm.addConstraint('teacher_profiles', 'teacher_profiles_lecturer_no_unique', {
    unique: ['lecturer_no'],
  });

  // Helpful indexes
  pgm.createIndex('student_profiles', 'matric_no');
  pgm.createIndex('teacher_profiles', 'lecturer_no');
};

exports.down = (pgm) => {
  pgm.dropIndex('teacher_profiles', 'lecturer_no');
  pgm.dropIndex('student_profiles', 'matric_no');
  pgm.dropConstraint('teacher_profiles', 'teacher_profiles_lecturer_no_unique');
  pgm.dropConstraint('teacher_profiles', 'teacher_profiles_user_unique');
  pgm.dropTable('teacher_profiles');
  pgm.dropConstraint('student_profiles', 'student_profiles_matric_no_unique');
  pgm.dropConstraint('student_profiles', 'student_profiles_user_unique');
  pgm.dropTable('student_profiles');
};
