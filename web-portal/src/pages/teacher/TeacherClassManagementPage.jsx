import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/Modal';
import ClassForm from '../../components/ClassForm'; // Import ClassForm

function TeacherClassManagementPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentClass, setCurrentClass] = useState(null); // For editing or deleting
  const [formSubmissionError, setFormSubmissionError] = useState(null);

  const fetchClasses = async () => {
    if (user?.role !== 'teacher') {
      setError('Access Denied: This page is for teachers only.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiRequest('/classes', 'GET');
      setClasses(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError(err.message || 'Failed to fetch classes.');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  const openModal = (mode, cls = null) => {
    setModalMode(mode);
    setCurrentClass(cls);
    setFormSubmissionError(null); // Clear previous form errors
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentClass(null);
    setModalMode('create');
    setFormSubmissionError(null);
  };

  const handleFormSubmit = async (classData) => {
    setFormSubmissionError(null);
    try {
      if (modalMode === 'create') {
        await apiRequest('/classes', 'POST', classData);
        // Optionally, you could add the new class to local state
        // or re-fetch to get the class_id assigned by the backend.
      } else if (modalMode === 'edit' && currentClass) {
        await apiRequest(`/classes/${currentClass.class_id}`, 'PUT', classData);
      }
      fetchClasses(); // Re-fetch classes to show changes
      closeModal();
    } catch (err) {
      console.error(`Error ${modalMode === 'create' ? 'creating' : 'updating'} class:`, err);
      setFormSubmissionError(err.message || `Failed to ${modalMode === 'create' ? 'create' : 'update'} class.`);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await apiRequest(`/classes/${classId}`, 'DELETE');
        fetchClasses(); // Re-fetch classes
      } catch (err) {
        console.error('Error deleting class:', err);
        setError(err.message || 'Failed to delete class.'); // Show error to user
      }
    }
  };

  if (user?.role !== 'teacher') {
    return <div>{error || 'Access Denied: Requires Teacher privileges.'}</div>;
  }

  if (loading) {
    return <div>Loading classes...</div>;
  }

  if (error && !classes.length) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>My Classes (Teacher)</h1>
      <button onClick={() => openModal('create')} style={{marginBottom: 15}}>Create New Class</button>

      {error && !classes.length && <p style={{color: 'red'}}>Error: {error}</p>}
      {classes.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Course Code</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <tr key={cls.class_id}>
                <td>{cls.class_id}</td>
                <td>{cls.name}</td>
                <td>{cls.course_code}</td>
                <td>{cls.description || 'N/A'}</td>
                <td>
                  <button onClick={() => openModal('edit', cls)} style={{marginRight: '5px'}}>Edit</button>
                  <button onClick={() => handleDeleteClass(cls.class_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !error && !loading && <p>No classes found. Click "Create New Class" to add one.</p>
      )}

      {isModalOpen && (
        <Modal onClose={closeModal} title={modalMode === 'create' ? 'Create New Class' : 'Edit Class'}>
          <ClassForm
            onSubmit={handleFormSubmit}
            initialData={modalMode === 'edit' ? currentClass : {}}
            onCancel={closeModal}
            isEditMode={modalMode === 'edit'}
          />
          {formSubmissionError && <p style={{ color: 'red', marginTop: '10px' }}>{formSubmissionError}</p>}
        </Modal>
      )}
    </div>
  );
}

export default TeacherClassManagementPage; 