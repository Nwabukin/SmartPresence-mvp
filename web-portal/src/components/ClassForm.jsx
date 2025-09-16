import React, { useState, useEffect } from 'react';

const ClassForm = ({
  onSubmit,
  initialData = {},
  onCancel,
  isEditMode = false,
}) => {
  const [name, setName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setName(initialData.name || '');
    setCourseCode(initialData.course_code || '');
    setDescription(initialData.description || '');
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !courseCode.trim()) {
      setFormError('Class name and Course Code are required.');
      return;
    }
    setFormError('');
    onSubmit({
      name: name.trim(),
      course_code: courseCode.trim(),
      description: description.trim() || null, // Send null if description is empty
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
    >
      <div>
        <label
          htmlFor="className"
          style={{ display: 'block', marginBottom: '5px' }}
        >
          Class Name:
        </label>
        <input
          id="className"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div>
        <label
          htmlFor="courseCode"
          style={{ display: 'block', marginBottom: '5px' }}
        >
          Course Code:
        </label>
        <input
          id="courseCode"
          type="text"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div>
        <label
          htmlFor="description"
          style={{ display: 'block', marginBottom: '5px' }}
        >
          Description (Optional):
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
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
          {isEditMode ? 'Update Class' : 'Create Class'}
        </button>
      </div>
    </form>
  );
};

export default ClassForm;
