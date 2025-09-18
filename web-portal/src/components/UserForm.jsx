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

  useEffect(() => {
    if (isEditMode && initialData) {
      setFirstName(initialData.first_name || '');
      setLastName(initialData.last_name || '');
      setEmail(initialData.email || '');
      setRole(initialData.role || ROLES.STUDENT);
      setPassword('');
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
