import React, { useState, useEffect } from 'react';

const ROLES = {
  // Define roles, ideally this would come from a shared utility or config
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

const UserForm = ({
  onSubmit,
  initialData = null,
  onCancel,
  isEditMode = false,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Only for create mode
  const [role, setRole] = useState(ROLES.STUDENT); // Default role
  const [formError, setFormError] = useState('');

  // Role-specific state
  const [studentMatricNo, setStudentMatricNo] = useState('');
  const [studentDepartment, setStudentDepartment] = useState('');
  const [studentCourse, setStudentCourse] = useState('');
  const [studentLevel, setStudentLevel] = useState('');
  const [studentPhone, setStudentPhone] = useState('');

  const [teacherLecturerNo, setTeacherLecturerNo] = useState('');
  const [teacherDepartment, setTeacherDepartment] = useState('');
  const [teacherOffice, setTeacherOffice] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');

  useEffect(() => {
    if (isEditMode && initialData) {
      setFirstName(initialData.first_name || '');
      setLastName(initialData.last_name || '');
      setEmail(initialData.email || '');
      setRole(initialData.role || ROLES.STUDENT);
      setPassword('');

      const profile = initialData.profile || {};
      if (initialData.role === ROLES.STUDENT) {
        setStudentMatricNo(profile.matric_no || '');
        setStudentDepartment(profile.department || '');
        setStudentCourse(profile.course || '');
        setStudentLevel(profile.level || '');
        setStudentPhone(profile.phone || '');
      } else if (initialData.role === ROLES.TEACHER) {
        setTeacherLecturerNo(profile.lecturer_no || '');
        setTeacherDepartment(profile.department || '');
        setTeacherOffice(profile.office || '');
        setTeacherPhone(profile.phone || '');
      }
    }
  }, [isEditMode, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      (!isEditMode && !password)
    ) {
      setFormError(
        'First name, last name, email, and password (for new users) are required.'
      );
      return;
    }
    if (!Object.values(ROLES).includes(role)) {
      setFormError('Invalid role selected.');
      return;
    }
    if (!isEditMode && role === ROLES.STUDENT) {
      if (!studentMatricNo.trim() || !studentDepartment.trim() || !studentCourse.trim() || !studentLevel.trim()) {
        setFormError('Student profile requires matric no, department, course, and level.');
        return;
      }
    }
    if (!isEditMode && role === ROLES.TEACHER) {
      if (!teacherLecturerNo.trim() || !teacherDepartment.trim()) {
        setFormError('Teacher profile requires lecturer ID/No and department.');
        return;
      }
    }
    setFormError('');
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      role,
    };
    if (!isEditMode && password) {
      userData.password = password;
    }
    if (role === ROLES.STUDENT) {
      const hasAllStudent =
        !!studentMatricNo.trim() &&
        !!studentDepartment.trim() &&
        !!studentCourse.trim() &&
        !!studentLevel.trim();
      if (!isEditMode || hasAllStudent) {
        // On create we require; on edit we include only if all provided
        userData.profileStudent = {
          matricNo: studentMatricNo.trim(),
          department: studentDepartment.trim(),
          course: studentCourse.trim(),
          level: studentLevel.trim(),
          phone: studentPhone.trim() || undefined,
        };
      }
    } else if (role === ROLES.TEACHER) {
      const hasRequiredTeacher =
        !!teacherLecturerNo.trim() && !!teacherDepartment.trim();
      if (!isEditMode || hasRequiredTeacher) {
        userData.profileTeacher = {
          lecturerNo: teacherLecturerNo.trim(),
          department: teacherDepartment.trim(),
          office: teacherOffice.trim() || undefined,
          phone: teacherPhone.trim() || undefined,
        };
      }
    }
    // Debug: local form payload summary
    // eslint-disable-next-line no-console
    console.log('[UserForm] submit', {
      mode: isEditMode ? 'edit' : 'create',
      role,
      hasPassword: Boolean(userData.password),
      hasStudentProfile: Boolean(userData.profileStudent),
      hasTeacherProfile: Boolean(userData.profileTeacher),
    });
    onSubmit(userData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
    >
      <div>
        <label htmlFor="firstName">First Name:</label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div>
        <label htmlFor="lastName">Last Name:</label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      {!isEditMode && (
        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
      )}
      <div>
        <label htmlFor="role">Role:</label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        >
          {/* Admins can only create/edit teachers or students via this UI as per backend logic */}
          <option value={ROLES.TEACHER}>Teacher</option>
          <option value={ROLES.STUDENT}>Student</option>
        </select>
      </div>

      {role === ROLES.STUDENT && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label htmlFor="matricNo">Matric No.:</label>
            <input
              id="matricNo"
              type="text"
              value={studentMatricNo}
              onChange={(e) => setStudentMatricNo(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div>
            <label htmlFor="studentDepartment">Department:</label>
            <input
              id="studentDepartment"
              type="text"
              value={studentDepartment}
              onChange={(e) => setStudentDepartment(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div>
            <label htmlFor="studentCourse">Course:</label>
            <input
              id="studentCourse"
              type="text"
              value={studentCourse}
              onChange={(e) => setStudentCourse(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div>
            <label htmlFor="studentLevel">Level:</label>
            <input
              id="studentLevel"
              type="text"
              value={studentLevel}
              onChange={(e) => setStudentLevel(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div>
            <label htmlFor="studentPhone">Phone (optional):</label>
            <input
              id="studentPhone"
              type="tel"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        </div>
      )}

      {role === ROLES.TEACHER && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label htmlFor="lecturerNo">Lecturer ID/No.:</label>
            <input
              id="lecturerNo"
              type="text"
              value={teacherLecturerNo}
              onChange={(e) => setTeacherLecturerNo(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div>
            <label htmlFor="teacherDepartment">Department:</label>
            <input
              id="teacherDepartment"
              type="text"
              value={teacherDepartment}
              onChange={(e) => setTeacherDepartment(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div>
            <label htmlFor="teacherOffice">Office (optional):</label>
            <input
              id="teacherOffice"
              type="text"
              value={teacherOffice}
              onChange={(e) => setTeacherOffice(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div>
            <label htmlFor="teacherPhone">Phone (optional):</label>
            <input
              id="teacherPhone"
              type="tel"
              value={teacherPhone}
              onChange={(e) => setTeacherPhone(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        </div>
      )}

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
          {isEditMode ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
