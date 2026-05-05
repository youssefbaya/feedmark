import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAssignments } from '../context/AssignmentContext';
import PageTransition from '../components/PageTransition';
import './MarkedStudents.css';
import { useFeedback } from '../context/FeedbackContext';

function MarkedStudents() {
  const { id } = useParams();
  const { getAssignment } = useAssignments();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  
  const assignment = getAssignment(parseInt(id));
  
  useEffect(() => {
    fetchMarkedStudents();
  }, [id]);
  
  const fetchMarkedStudents = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/students/assignment/${id}`);
      const data = await response.json();
      setStudents(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setLoading(false);
    }
  };
  
  const handleDelete = async (studentId, studentName) => {
    if (window.confirm(`Delete marking for ${studentName}?`)) {
      try {
        const response = await fetch(`http://localhost:5001/api/students/${studentId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          fetchMarkedStudents();
        }
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };
  
  if (!assignment) {
    return (
      <PageTransition>
        <div className="page">
          <h1>Assignment Not Found</h1>
        </div>
      </PageTransition>
    );
  }
  
  return (
    <PageTransition>
      <div className="page">
        <div className="marked-header">
          <h1>Marked Students</h1>
          <Link to={`/assignments/${id}`} className="btn-back">
            ← Back to Assignment
          </Link>
        </div>
        
        <div className="assignment-info">
          <h2>{assignment.name}</h2>
          <p>Total marked: {students.length} student{students.length !== 1 ? 's' : ''}</p>
        </div>
        
        {loading ? (
          <p>Loading...</p>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <p>No students marked yet.</p>
            <Link to={`/mark/${id}`} className="btn-primary">Mark First Student</Link>
          </div>
        ) : (
          <div className="students-table">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Total Marks</th>
                  <th>Marked On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td>{student.studentName}</td>
                    <td>{student.studentId || '-'}</td>
                    <td className="marks-cell">{student.totalMarks} / {assignment.totalMarks}</td>
                    <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button 
                        className="btn-delete-small"
                        onClick={() => handleDelete(student.id, student.studentName)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="marked-actions">
          <Link to={`/mark/${id}`} className="btn-mark-another">
            + Mark Another Student
          </Link>
          <button 
            className="btn-export"
            onClick={() => window.location.href = `http://localhost:5001/api/assignments/${id}/export`}
          >
            Export to CSV
          </button>
        </div>
      </div>
    </PageTransition>
  );
}

export default MarkedStudents;