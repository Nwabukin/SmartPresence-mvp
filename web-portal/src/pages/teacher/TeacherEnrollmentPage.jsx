import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
// We might need a Modal and a specific form for enrollment, or a way to select students.

function TeacherEnrollmentPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // To populate a list of students to enroll
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch teacher's classes to populate a selector
  useEffect(() => {
    const fetchTeacherClasses = async () => {
      if (user?.role === 'teacher') {
        setLoading(true);
        try {
          const fetchedClasses = await apiRequest('/classes'); // Assuming this fetches classes for the logged-in teacher
          setClasses(fetchedClasses || []);
          if (fetchedClasses && fetchedClasses.length > 0) {
            // setSelectedClass(fetchedClasses[0].class_id); // Optionally pre-select the first class
          }
        } catch (err) {
          setError('Failed to fetch classes: ' + err.message);
          setClasses([]);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTeacherClasses();
  }, [user]);

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
  
  // Fetch all students (or students not yet enrolled in the selected class) for the enrollment UI
  useEffect(() => {
    const fetchAllStudentsForEnrollment = async () => {
      // This is a simplified approach. Ideally, you might fetch all students 
      // and then filter out already enrolled ones, or have a dedicated backend endpoint.
      if (user?.role === 'teacher' && selectedClass) { // Only fetch if a class is selected
        setLoading(true);
        try {
          // Assuming an endpoint like /users?role=student or a more specific one 
          // like /classes/:classId/unenrollable-students
          const allStudentUsers = await apiRequest('/users?role=student');
          setAllStudents(allStudentUsers || []);
        } catch (err) {
          console.error("Error fetching all students:", err);
          //setError('Failed to fetch students for enrollment: ' + err.message);
          setAllStudents([]);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAllStudentsForEnrollment();
  }, [user, selectedClass]);


  const handleEnrollStudent = async (studentId) => {
    if (!selectedClass || !studentId) {
      setError("Please select a class and a student to enroll.");
      return;
    }
    setLoading(true);
    try {
      // API endpoint: POST /classes/:classId/students
      await apiRequest(`/classes/${selectedClass}/students`, 'POST', { student_id: studentId });
      // Re-fetch enrolled students for the selected class
      const updatedEnrolledStudents = await apiRequest(`/classes/${selectedClass}/students`);
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
      setError("Please select a class and a student to unenroll.");
      return;
    }
    if (!window.confirm("Are you sure you want to remove this student from the class?")) return;

    setLoading(true);
    try {
      // API endpoint: DELETE /classes/:classId/students/:studentId
      await apiRequest(`/classes/${selectedClass}/students/${studentId}`, 'DELETE');
      // Re-fetch enrolled students
      const updatedEnrolledStudents = await apiRequest(`/classes/${selectedClass}/students`);
      setEnrolledStudents(updatedEnrolledStudents || []);
      setError(null);
    } catch (err) {
      setError('Failed to unenroll student: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  if (user?.role !== 'teacher') {
    return <div>Access Denied: Requires Teacher privileges.</div>;
  }

  return (
    <div>
      <h1>Manage Student Enrollments</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div>
        <label htmlFor="class-select">Select Class:</label>
        <select 
          id="class-select" 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
          disabled={loading || classes.length === 0}
        >
          <option value="">-- Select a Class --</option>
          {classes.map(cls => (
            <option key={cls.class_id} value={cls.class_id}>
              {cls.name} ({cls.course_code})
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading...</p>}

      {selectedClass && !loading && (
        <>
          <h2>Enrolled Students in "{classes.find(c=>c.class_id === parseInt(selectedClass))?.name}"</h2>
          {enrolledStudents.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map(student => (
                  <tr key={student.user_id}>
                    <td>{student.user_id}</td>
                    <td>{student.first_name} {student.last_name}</td>
                    <td>{student.email}</td>
                    <td>
                      <button onClick={() => handleUnenrollStudent(student.user_id)} disabled={loading}>
                        Unenroll
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No students are currently enrolled in this class.</p>
          )}

          <hr style={{margin: '20px 0'}} />

          <h3>Enroll New Student</h3>
          {allStudents.length > 0 ? (
            <div>
              <label htmlFor="student-select">Select Student to Enroll:</label>
              <select 
                id="student-select" 
                // Consider a more robust way to manage selected student for enrollment
                // This is a simplified example; you might use a controlled component for the selection.
                onChange={(e) => { if(e.target.value) handleEnrollStudent(e.target.value); e.target.value = '';}} // enroll and reset
                disabled={loading}
              >
                <option value="">-- Select a Student --</option>
                {allStudents
                  .filter(student => !enrolledStudents.some(enrolled => enrolled.user_id === student.user_id))
                  .map(student => (
                  <option key={student.user_id} value={student.user_id}>
                    {student.first_name} {student.last_name} ({student.email})
                  </option>
                ))}
              </select>
               {allStudents.filter(student => !enrolledStudents.some(enrolled => enrolled.user_id === student.user_id)).length === 0 && <p>All students are already enrolled or no students available.</p>}
            </div>
          ) : (
            <p>Loading students or no students available to enroll.</p>
          )}
        </>
      )}
    </div>
  );
}

export default TeacherEnrollmentPage; 