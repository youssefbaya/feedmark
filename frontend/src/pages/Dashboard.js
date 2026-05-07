import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import './Dashboard.css';

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
      <div className="dashboard-page">
        <div className="dashboard-hero">
          <div>
            <span className="page-kicker">FeedMark Overview</span>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              Track assignments, marking progress, feedback usage and export readiness from one place.
            </p>
          </div>

          <div className="dashboard-actions">
            <Link to="/create" className="dashboard-primary-btn">
              + Create Assignment
            </Link>
            <Link to="/feedback" className="dashboard-secondary-btn">
              Feedback Library
            </Link>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-main-card">
            <div className="main-card-content">
              <span>Overall Progress</span>
              <h2>{stats.totalStudentsMarked}</h2>
              <p>students marked across all assignments</p>
            </div>

            <div className="main-card-badge">
              {stats.totalAssignments} assignment{stats.totalAssignments === 1 ? '' : 's'}
            </div>
          </div>

          <div className="dashboard-stat orange">
            <span>Total Assignments</span>
            <strong>{stats.totalAssignments}</strong>
            <p>rubrics created</p>
          </div>

          <div className="dashboard-stat pink">
            <span>Marking Criteria</span>
            <strong>{stats.totalCriteria}</strong>
            <p>criteria available</p>
          </div>

          <div className="dashboard-stat yellow">
            <span>Students Marked</span>
            <strong>{stats.totalStudentsMarked}</strong>
            <p>completed records</p>
          </div>
        </div>

        <div className="dashboard-lower">
          <div className="dashboard-panel">
            <h2>Quick Actions</h2>
            <p>Common tasks for marking and feedback management.</p>

            <div className="quick-action-list">
              <Link to="/assignments">View assignments</Link>
              <Link to="/create">Create new assignment</Link>
              <Link to="/feedback">Manage feedback comments</Link>
            </div>
          </div>

          <div className="dashboard-panel soft-panel">
            <h2>Recent Activity</h2>
            <p>
              You have {stats.totalAssignments} assignment{stats.totalAssignments === 1 ? '' : 's'},
              {stats.totalCriteria} criteria and {stats.totalStudentsMarked} marked student record{stats.totalStudentsMarked === 1 ? '' : 's'}.
            </p>

            <div className="status-pill-row">
              <span>{stats.totalAssignments} assignments</span>
              <span>{stats.totalStudentsMarked} marked</span>
              <span>{stats.totalCriteria} criteria</span>
            </div>
          </div>
        </div>

        {stats.totalAssignments === 0 && (
          <div className="dashboard-empty">
            <p>No assignments yet. Create your first one to get started.</p>
            <Link to="/create" className="dashboard-primary-btn">Create Assignment</Link>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default Dashboard;