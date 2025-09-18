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
  // Student profile fields
  const [matricNo, setMatricNo] = useState('');
  const [studentDepartment, setStudentDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [level, setLevel] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  // Teacher profile fields
  const [lecturerNo, setLecturerNo] = useState('');
  const [teacherDepartment, setTeacherDepartment] = useState('');
  const [faculty, setFaculty] = useState('');
  const [office, setOffice] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');

  useEffect(() => {
    if (isEditMode && initialData) {
      setFirstName(initialData.first_name || '');
      setLastName(initialData.last_name || '');
      setEmail(initialData.email || '');
      setRole(initialData.role || ROLES.STUDENT);
      setPassword('');
      // Prefill profile fields if present
      if (initialData.role === ROLES.STUDENT && initialData.profile) {
        setMatricNo(initialData.profile.matric_no || '');
        setStudentDepartment(initialData.profile.department || '');
        setCourse(initialData.profile.course || '');
        setLevel(initialData.profile.level || '');
        setStudentPhone(initialData.profile.phone || '');
      } else if (initialData.role === ROLES.TEACHER && initialData.profile) {
        setLecturerNo(initialData.profile.lecturer_no || '');
        setTeacherDepartment(initialData.profile.department || '');
        setFaculty(initialData.profile.faculty || '');
        setOffice(initialData.profile.office || '');
        setTeacherPhone(initialData.profile.phone || '');
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
    // Attach role-specific profile payloads
    if (role === ROLES.STUDENT) {
      userData.profileStudent = {
        matricNo: matricNo.trim(),
        department: studentDepartment.trim(),
        course: course.trim(),
        level: level.trim(),
        phone: studentPhone.trim() || undefined,
      };
    } else if (role === ROLES.TEACHER) {
      userData.profileTeacher = {
        lecturerNo: lecturerNo.trim(),
        department: teacherDepartment.trim(),
        faculty: faculty.trim(),
        office: office.trim() || undefined,
        phone: teacherPhone.trim() || undefined,
      };
    }
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
          onChange={(e) => {
            setFirstName(e.target.value);
          }}
          autoFocus
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
          onChange={(e) => {
            setLastName(e.target.value);
          }}
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
          onChange={(e) => {
            setEmail(e.target.value);
          }}
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
            onChange={(e) => {
              setPassword(e.target.value);
            }}
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
          onChange={(e) => {
            setRole(e.target.value);
          }}
          required
          style={{ width: '100%', padding: '8px' }}
        >
          {/* Admins can only create/edit teachers or students via this UI as per backend logic */}
          <option value={ROLES.TEACHER}>Teacher</option>
          <option value={ROLES.STUDENT}>Student</option>
        </select>
      </div>
      {/* Role-specific fields */}
      {role === ROLES.STUDENT && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label htmlFor="matricNo">Matric Number:</label>
            <input id="matricNo" type="text" value={matricNo} onChange={(e) => setMatricNo(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label htmlFor="studentDepartment">Department:</label>
            <input id="studentDepartment" type="text" value={studentDepartment} onChange={(e) => setStudentDepartment(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label htmlFor="course">Course of Study:</label>
            <input id="course" type="text" value={course} onChange={(e) => setCourse(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label htmlFor="level">Level:</label>
            <input id="level" type="text" value={level} onChange={(e) => setLevel(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label htmlFor="studentPhone">Phone:</label>
            <input id="studentPhone" type="text" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>
        </div>
      )}
      {role === ROLES.TEACHER && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label htmlFor="lecturerNo">Lecturer ID:</label>
            <input id="lecturerNo" type="text" value={lecturerNo} onChange={(e) => setLecturerNo(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label htmlFor="teacherDepartment">Department:</label>
            <input id="teacherDepartment" type="text" value={teacherDepartment} onChange={(e) => setTeacherDepartment(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label htmlFor="faculty">Faculty:</label>
            <input id="faculty" type="text" value={faculty} onChange={(e) => setFaculty(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label htmlFor="office">Office Location:</label>
            <input id="office" type="text" value={office} onChange={(e) => setOffice(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label htmlFor="teacherPhone">Phone:</label>
            <input id="teacherPhone" type="text" value={teacherPhone} onChange={(e) => setTeacherPhone(e.target.value)} style={{ width: '100%', padding: '8px' }} />
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
