import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import './StudentsOverview.css';

function StudentsOverview() {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/students');
            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const getClassification = (mark, total) => {
        const percentage = total > 0
            ? (mark / total) * 100
            : 0;

        if (percentage >= 70) return 'First';
        if (percentage >= 60) return '2:1';
        if (percentage >= 50) return '2:2';
        if (percentage >= 40) return 'Third';
        return 'Fail';
    };

    const filteredStudents = students.filter(student =>
        student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PageTransition>
            <div className="students-page">
                <div className="students-header">
                    <div>
                        <span className="page-kicker">Student Records</span>
                        <h1 className="page-title">Students</h1>
                        <p className="page-subtitle">
                            Search and manage marked students across all assignments.
                        </p>
                    </div>

                    <div className="students-count">
                        {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                    </div>
                </div>

                <div className="students-stats-grid">
                    <div className="student-stat-card">
                        <span>Total Students</span>
                        <strong>{students.length}</strong>
                    </div>

                    <div className="student-stat-card">
                        <span>Assignments</span>
                        <strong>
                            {[...new Set(students.map(s => s.assignmentName))].length}
                        </strong>
                    </div>

                    <div className="student-stat-card">
                        <span>Average Mark</span>
                        <strong>
                            {students.length > 0
                                ? (
                                    students.reduce((sum, s) => sum + (s.totalMarks || 0), 0) /
                                    students.length
                                ).toFixed(1)
                                : 0}
                        </strong>
                    </div>

                    <div className="student-stat-card">
                        <span>First Class</span>
                        <strong>
                            {
                                students.filter(s =>
                                    getClassification(s.totalMarks, s.assignmentTotal) === 'First'
                                ).length
                            }
                        </strong>
                    </div>
                </div>

                <div className="students-search-panel">
                    <input
                        type="text"
                        placeholder="Search by student name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="students-search"
                    />
                </div>

                <div className="students-table-wrapper">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Assignment</th>
                                <th>Mark</th>
                                <th>Grade</th>
                                <th>Submission</th>
                                <th>Marked On</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student.id}>
                                    <td>
                                        <div className="student-cell">
                                            <strong>{student.studentName}</strong>
                                            <span>{student.studentId || 'No ID'}</span>
                                        </div>
                                    </td>

                                    <td>{student.assignmentName}</td>

                                    <td>
                                        <span className="mark-badge">
                                            {student.totalMarks} / {student.assignmentTotal}
                                        </span>
                                    </td>

                                    <td>
                                        <span className={`grade-badge ${getClassification(student.totalMarks, student.assignmentTotal)
                                            .toLowerCase()
                                            .replace('2:1', 'two-one')
                                            .replace('2:2', 'two-two')
                                            }`}>
                                            {getClassification(student.totalMarks, student.assignmentTotal)}
                                        </span>
                                    </td>

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
                                        {new Date(student.createdAt).toLocaleDateString()}
                                    </td>

                                    <td>
                                        <Link
                                            to={`/mark/${student.assignmentId}/edit/${student.id}`}
                                            className="table-edit-btn"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageTransition>
    );
}

export default StudentsOverview;