import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAssignments } from '../context/AssignmentContext';
import PageTransition from '../components/PageTransition';
import './MarkedStudents.css';
import { useFeedback } from '../context/FeedbackContext';
import toast from 'react-hot-toast';

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
          toast.success('Student deleted');
          fetchMarkedStudents();
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error('Failed to delete student');
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

  const getGradeBand = (score) => {
    const percentage = (score / assignment.totalMarks) * 100;

    if (percentage >= 70) return 'First';
    if (percentage >= 60) return '2:1';
    if (percentage >= 50) return '2:2';
    if (percentage >= 45) return 'Third';
    if (percentage >= 40) return 'Pass';

    return 'Fail';
  };

  return (
    <PageTransition>
      <div className="page">
        <div className="marked-header">
          <div>
            <span className="page-kicker">Student Marks</span>
            <h1 className="page-title">Marked Students</h1>
          </div>
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
                  <th>Submission</th>
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
                    <td>
                      {student.submissionFilePath ? (
                        <a
                          href={`http://localhost:5001${student.submissionFilePath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="submission-link"
                        >
                          Open Submission
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <div className="marks-wrapper">
                        <span className="marks-cell">
                          {student.totalMarks} / {assignment.totalMarks}
                        </span>

                        <span className={`grade-badge ${getGradeBand(student.totalMarks)
                          .toLowerCase()
                          .replace(':', '')
                          .replace('2', 'two')
                          }`}>
                          {getGradeBand(student.totalMarks)}
                        </span>
                      </div>
                    </td>
                    <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <Link
                        to={`/mark/${id}/edit/${student.id}`}
                        className="btn-edit-small"
                      >
                        Edit
                      </Link>

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