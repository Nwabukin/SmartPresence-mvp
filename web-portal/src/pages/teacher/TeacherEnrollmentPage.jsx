import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

function TeacherEnrollmentPage() {
  const { user: teacherUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch teacher's classes to populate a selector
  useEffect(() => {
    const fetchTeacherClasses = async () => {
      if (teacherUser?.role === 'teacher') {
        setLoading(true);
        try {
          const fetchedClasses = await apiRequest('/classes');
          setClasses(fetchedClasses || []);
          setError(null);
        } catch (err) {
          setError('Failed to fetch classes: ' + err.message);
          setClasses([]);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTeacherClasses();
  }, [teacherUser]);

  // Fetch enrolled students when a class is selected
  useEffect(() => {
    const fetchEnrolledStudents = async () => {
      if (selectedClass) {
        setLoading(true);
        try {
          // API endpoint needs to be like /classes/:classId/students
          const data = await apiRequest(`/classes/${selectedClass}/students`);
          setEnrolledStudents(data || []);
          setError(null);
        } catch (err) {
          setError('Failed to fetch enrolled students: ' + err.message);
          setEnrolledStudents([]);
        } finally {
          setLoading(false);
        }
      } else {
        setEnrolledStudents([]); // Clear if no class is selected
      }
    };
    fetchEnrolledStudents();
  }, [selectedClass]);

  // Fetch all students for enrollment
  useEffect(() => {
    const fetchAllStudentsForEnrollment = async () => {
      if (teacherUser?.role === 'teacher' && selectedClass) {
        setLoading(true);
        try {
          const allStudentUsers = await apiRequest('/users?role=student');
          setAllStudents(allStudentUsers || []);
        } catch (err) {
          console.error('Error fetching all students:', err);
          setAllStudents([]);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAllStudentsForEnrollment();
  }, [teacherUser, selectedClass]);

  const handleEnrollStudent = async (studentId) => {
    if (!selectedClass || !studentId) {
      setError('Please select a class and a student to enroll.');
      return;
    }
    setLoading(true);
    try {
      // API endpoint: POST /classes/:classId/students
      await apiRequest(`/classes/${selectedClass}/students`, 'POST', {
        student_id: studentId,
      });
      // Re-fetch enrolled students for the selected class
      const updatedEnrolledStudents = await apiRequest(
        `/classes/${selectedClass}/students`
      );
      setEnrolledStudents(updatedEnrolledStudents || []);
      setError(null);
    } catch (err) {
      setError('Failed to enroll student: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnenrollStudent = async (studentId) => {
    if (!selectedClass || !studentId) {
      setError('Please select a class and a student to unenroll.');
      return;
    }
    if (
      !window.confirm(
        'Are you sure you want to remove this student from the class? This action cannot be undone.'
      )
    )
      return;

    setLoading(true);
    try {
      await apiRequest(
        `/classes/${selectedClass}/students/${studentId}`,
        'DELETE'
      );
      const updatedEnrolledStudents = await apiRequest(
        `/classes/${selectedClass}/students`
      );
      setEnrolledStudents(updatedEnrolledStudents || []);
      setError(null);
    } catch (err) {
      setError('Failed to unenroll student: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (teacherUser?.role !== 'teacher') {
    return <div>Access Denied: Requires Teacher privileges.</div>;
  }

  if (loading && classes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-gray-600">Loading enrollment data...</p>
        </div>
      </div>
    );
  }

  if (error && classes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedClassData = classes.find((c) => c.class_id === parseInt(selectedClass));
  const availableStudents = allStudents.filter(
    (student) =>
      !enrolledStudents.some(
        (enrolled) => enrolled.user_id === student.user_id
      )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Enrollment</h1>
              <p className="text-gray-600 mt-1">Manage student enrollments in your classes</p>
            </div>
            <Link to="/teacher/dashboard" className="btn btn-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
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

        {/* Class Selection */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Select Class</h2>
            <p className="text-gray-600">Choose a class to manage student enrollments</p>
          </div>
          <div className="card-body">
            <div className="max-w-md">
              <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <select
                id="class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={loading || classes.length === 0}
                className="select select-bordered w-full"
              >
                <option value="">-- Select a Class --</option>
                {classes.map((cls) => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.name} ({cls.course_code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedClass && selectedClassData && (
          <>
            {/* Enrolled Students */}
            <div className="card mb-8">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">
                  Enrolled Students ({enrolledStudents.length})
                </h2>
                <p className="text-gray-600">
                  Students currently enrolled in "{selectedClassData.name}"
                </p>
              </div>
              <div className="card-body">
                {loading && (
                  <div className="text-center py-8">
                    <div className="loading mb-4"></div>
                    <p className="text-gray-600">Loading students...</p>
                  </div>
                )}
                
                {!loading && enrolledStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Matric No</th>
                          <th>Department</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrolledStudents.map((student) => (
                          <tr key={student.user_id}>
                            <td className="font-mono text-sm">{student.user_id}</td>
                            <td className="font-medium">
                              {student.first_name} {student.last_name}
                            </td>
                            <td className="text-gray-600">{student.email}</td>
                            <td>
                              {student.profile?.matric_no ? (
                                <span className="badge badge-info">{student.profile.matric_no}</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="text-sm text-gray-600">
                              {student.profile?.department || '—'}
                            </td>
                            <td>
                              <button
                                onClick={() => handleUnenrollStudent(student.user_id)}
                                disabled={loading}
                                className="btn btn-danger btn-sm"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Unenroll
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : !loading && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Enrolled</h3>
                    <p className="text-gray-600">No students are currently enrolled in this class.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Enroll New Student */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Enroll New Student</h2>
                <p className="text-gray-600">Add students to "{selectedClassData.name}"</p>
              </div>
              <div className="card-body">
                {loading && (
                  <div className="text-center py-4">
                    <div className="loading mb-2"></div>
                    <p className="text-gray-600">Loading available students...</p>
                  </div>
                )}

                {!loading && availableStudents.length > 0 ? (
                  <div className="max-w-md">
                    <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Student to Enroll
                    </label>
                    <select
                      id="student-select"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleEnrollStudent(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      disabled={loading}
                      className="select select-bordered w-full"
                    >
                      <option value="">-- Select a Student --</option>
                      {availableStudents.map((student) => (
                        <option key={student.user_id} value={student.user_id}>
                          {student.first_name} {student.last_name} ({student.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-2">
                      {availableStudents.length} student(s) available for enrollment
                    </p>
                  </div>
                ) : !loading && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All Students Enrolled</h3>
                    <p className="text-gray-600">All available students are already enrolled in this class.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!selectedClass && classes.length > 0 && (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Class</h3>
              <p className="text-gray-600">Choose a class from the dropdown above to manage student enrollments.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherEnrollmentPage;
