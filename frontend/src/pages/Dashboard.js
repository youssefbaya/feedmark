import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

function Dashboard() {
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalCriteria: 0,
    totalStudentsMarked: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const assignmentsRes = await fetch('http://localhost:5001/api/assignments');
      const assignments = await assignmentsRes.json();
      
      let totalCriteria = 0;
      let totalStudentsMarked = 0;
      
      for (const assignment of assignments) {
        totalCriteria += assignment.sections.reduce((sum, section) => 
          sum + section.criteria.length, 0
        );
        
        const studentsRes = await fetch(`http://localhost:5001/api/students/assignment/${assignment.id}`);
        const students = await studentsRes.json();
        totalStudentsMarked += students.length;
      }
      
      setStats({
        totalAssignments: assignments.length,
        totalCriteria,
        totalStudentsMarked
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <PageTransition>
      <div className="page">
        <h1>Dashboard</h1>
        <p>Welcome to FeedMark. Get started by creating an assignment or managing your feedback library.</p>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>{stats.totalAssignments}</h3>
            <p>Total Assignments</p>
          </div>
          <div className="stat-card">
            <h3>{stats.totalCriteria}</h3>
            <p>Marking Criteria</p>
          </div>
          <div className="stat-card">
            <h3>{stats.totalStudentsMarked}</h3>
            <p>Students Marked</p>
          </div>
        </div>

        {stats.totalAssignments === 0 && (
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '1rem' }}>
              No assignments yet. Create your first one to get started!
            </p>
            <Link to="/create" className="btn-primary">Create Assignment</Link>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default Dashboard;