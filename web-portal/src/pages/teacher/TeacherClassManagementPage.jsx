import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/Modal';
import ClassForm from '../../components/ClassForm';

function TeacherClassManagementPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: teacherUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentClass, setCurrentClass] = useState(null);
  const [formSubmissionError, setFormSubmissionError] = useState(null);

  const fetchClasses = async () => {
    if (teacherUser?.role !== 'teacher') {
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
    if (teacherUser) {
      fetchClasses();
    }
  }, [teacherUser]);

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
      console.error(
        `Error ${modalMode === 'create' ? 'creating' : 'updating'} class:`,
        err
      );
      setFormSubmissionError(
        err.message ||
          `Failed to ${modalMode === 'create' ? 'create' : 'update'} class.`
      );
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      try {
        await apiRequest(`/classes/${classId}`, 'DELETE');
        fetchClasses();
        setError(null);
      } catch (err) {
        console.error('Error deleting class:', err);
        setError(err.message || 'Failed to delete class.');
      }
    }
  };

  if (teacherUser?.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md">
          <div className="card-body text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You do not have the required permissions to view this page.</p>
            <Link to="/" className="btn btn-primary">Go to Homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  if (error && !classes.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Classes</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchClasses}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
              <p className="text-gray-600 mt-1">Manage your classes and course information</p>
            </div>
            <button
              onClick={() => openModal('create')}
              className="btn btn-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Class
            </button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-error mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Classes Table */}
        {classes.length > 0 ? (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">My Classes ({classes.length})</h2>
              <p className="text-gray-600">Manage your course classes and information</p>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Course Code</th>
                      <th>Description</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => (
                      <tr key={cls.class_id}>
                        <td className="font-mono text-sm">{cls.class_id}</td>
                        <td className="font-medium">{cls.name}</td>
                        <td>
                          <span className="badge badge-info">{cls.course_code}</span>
                        </td>
                        <td className="text-gray-600">
                          {cls.description || <span className="text-gray-400">No description</span>}
                        </td>
                        <td className="text-sm text-gray-600">
                          {cls.created_at ? new Date(cls.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => openModal('edit', cls)}
                              className="btn btn-secondary btn-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteClass(cls.class_id)}
                              className="btn btn-danger btn-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          !error && !loading && (
            <div className="card">
              <div className="card-body text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Found</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first class.</p>
                <button
                  onClick={() => openModal('create')}
                  className="btn btn-primary"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Class
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <Modal
        title={modalMode === 'create' ? 'Create New Class' : 'Edit Class'}
        show={isModalOpen}
        onClose={closeModal}
      >
        <ClassForm
          onSubmit={handleFormSubmit}
          initialData={modalMode === 'edit' ? currentClass : {}}
          onCancel={closeModal}
          isEditMode={modalMode === 'edit'}
        />
        {formSubmissionError && (
          <div className="alert alert-error mt-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formSubmissionError}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default TeacherClassManagementPage;
