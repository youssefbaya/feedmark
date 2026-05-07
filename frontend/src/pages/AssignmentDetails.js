import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAssignments } from '../context/AssignmentContext';
import './AssignmentDetails.css';
import PageTransition from '../components/PageTransition';
import toast from 'react-hot-toast';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function AssignmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAssignment } = useAssignments();

  const assignment = getAssignment(parseInt(id));

  const [stats, setStats] = useState(null);
  const [criterionAnalytics, setCriterionAnalytics] = useState([]);
  const [commonFeedback, setCommonFeedback] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5001/api/assignments/${id}/stats`)
      .then(response => response.json())
      .then(data => setStats(data))
      .catch(error => console.error('Error loading assignment stats:', error));
    fetch(`http://localhost:5001/api/assignments/${id}/common-feedback`)
      .then(response => response.json())
      .then(data => setCommonFeedback(data))
      .catch(error => console.error('Error loading feedback report:', error));
    fetch(`http://localhost:5001/api/assignments/${id}/criterion-analytics`)
      .then(response => response.json())
      .then(data => setCriterionAnalytics(data))
      .catch(error => console.error('Error loading criterion analytics:', error));
  }, [id]);

  if (!assignment) {
    return (
      <div className="page">
        <h1>Assignment Not Found</h1>
        <p>This assignment doesn't exist.</p>
        <Link to="/assignments" className="btn-primary">Back to Assignments</Link>
      </div>
    );
  }

  const totalCriteria = assignment.sections.reduce((total, section) =>
    total + section.criteria.length, 0
  );

  const totalPossibleMarks = assignment.sections.reduce(
    (total, section) => {
      const sectionTotal = section.criteria.reduce(
        (sum, criterion) =>
          sum + Number(criterion.maxMarks || criterion.max_marks || 0),
        0
      );

      return total + sectionTotal;
    },
    0
  );

  const distribution = stats?.distribution || {
    fail: 0,
    third: 0,
    lowerSecond: 0,
    upperSecond: 0,
    first: 0
  };

  const chartData = [
    { name: '0-39', students: distribution.fail },
    { name: '40-49', students: distribution.third },
    { name: '50-59', students: distribution.lowerSecond },
    { name: '60-69', students: distribution.upperSecond },
    { name: '70+', students: distribution.first }
  ];



  return (
    <PageTransition>
      <div className="page">
        <div className="details-header">
          <div>
            <span className="page-kicker">Assignment Overview</span>
            <h1 className="page-title">{assignment.name}</h1>
            {assignment.description && (
              <p className="assignment-description">{assignment.description}</p>
            )}
          </div>
          <div className="header-actions">
            <button onClick={() => navigate('/assignments')} className="btn-back">
              ← Back to Assignments
            </button>
          </div>
        </div>

        <div className="assignment-meta">
          <div className="meta-item">
            <span className="meta-label">Total Marks:</span>
            <span className="meta-value">{assignment.totalMarks}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Sections:</span>
            <span className="meta-value">{assignment.sections.length}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Criteria:</span>
            <span className="meta-value">{totalCriteria}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Sum of Criteria Marks:</span>
            <span className="meta-value">{totalPossibleMarks}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Created:</span>
            <span className="meta-value">
              {new Date(assignment.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {stats && (
          <div className="assignment-stats">
            <div className="stat-card">
              <span>Students Marked</span>
              <strong>{stats.totalMarked}</strong>
            </div>

            <div className="stat-card">
              <span>Average Mark</span>
              <strong>{stats.averageMark}</strong>
            </div>

            <div className="stat-card">
              <span>Highest Mark</span>
              <strong>{stats.highestMark}</strong>
            </div>

            <div className="stat-card">
              <span>Lowest Mark</span>
              <strong>{stats.lowestMark}</strong>
            </div>

            <div className="stat-card">
              <span>Pass Rate</span>
              <strong>{stats.passRate}%</strong>
            </div>
          </div>
        )}

        {stats && (
          <div className="completion-panel">
            <div>
              <h3>Marking Progress</h3>
              <p>
                {stats.totalMarked} student{stats.totalMarked === 1 ? '' : 's'} marked for this assignment
              </p>
            </div>

            <div className="completion-status">
              <span className={stats.totalMarked > 0 ? 'status-ready' : 'status-empty'}>
                {stats.totalMarked > 0 ? 'Ready to export' : 'No marks yet'}
              </span>
            </div>
          </div>
        )}

        {stats && (
          <div className="distribution-chart">
            <div className="chart-header">
              <h2>Mark Distribution</h2>
              <p>Student performance overview</p>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="students"
                  fill="#E43D12"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {commonFeedback.length > 0 && (
          <div className="common-feedback-panel">
            <div className="chart-header">
              <h2>Common Feedback</h2>
              <p>Most repeated comments used while marking</p>
            </div>

            <div className="common-feedback-list">
              {commonFeedback.map((item, index) => (
                <div key={index} className="common-feedback-item">
                  <div className="feedback-count">
                    {item.count}x
                  </div>

                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {criterionAnalytics.length > 0 && (
          <div className="criterion-analytics-panel">
            <div className="chart-header">
              <h2>Criterion Performance</h2>
              <p>Average student performance across each marking criterion</p>
            </div>

            <div className="criterion-heatmap">
              {criterionAnalytics.map(item => (
                <div key={item.criterionId} className={`heatmap-row ${item.performance.toLowerCase()}`}>
                  <div className="heatmap-info">
                    <span className="heatmap-section">{item.sectionName}</span>
                    <strong>{item.criterionName}</strong>
                    <small>{item.markedCount} marked</small>
                  </div>

                  <div className="heatmap-score">
                    <span>{item.averageMark} / {item.maxMarks}</span>
                    <strong>{item.percentage}%</strong>
                  </div>

                  <div className="heatmap-bar">
                    <div style={{ width: `${item.percentage}%` }}></div>
                  </div>

                  <span className="heatmap-label">{item.performance}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="marking-scheme">
          <h2>Marking Scheme</h2>

          {assignment.sections.length === 0 ? (
            <p className="empty-message">No sections defined.</p>
          ) : (
            assignment.sections.map((section, sectionIndex) => (
              <div key={section.id} className="section-detail">
                <div className="section-header-detail">
                  <h3>
                    {section.name || `Section ${sectionIndex + 1}`}
                  </h3>
                  {section.criteria.reduce((sum, c) =>
                    sum + (parseFloat(c.maxMarks) || 0), 0
                  ) > 0 && (
                      <span className="section-marks">
                        {section.criteria.reduce((sum, c) =>
                          sum + (parseFloat(c.maxMarks) || 0), 0
                        )} marks
                      </span>
                    )}
                </div>

                {section.criteria.length === 0 ? (
                  <p className="empty-criteria">No criteria in this section.</p>
                ) : (
                  <table className="criteria-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>#</th>
                        <th>Criterion</th>
                        <th style={{ width: '100px' }}>Max Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.criteria.map((criterion, criterionIndex) => (
                        <tr key={criterion.id}>
                          <td className="criterion-number">{criterionIndex + 1}</td>
                          <td className="criterion-name">{criterion.name}</td>
                          <td className="criterion-marks">{Number(criterion.maxMarks || criterion.max_marks || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          )}
        </div>

        <div className="details-actions">
          <Link to={`/marked/${assignment.id}`} className="btn-view-marked">
            View Marked Students
          </Link>
          <button className="btn-mark" onClick={() => navigate(`/mark/${assignment.id}`)}>Mark Students</button>
          <button
            className="btn-export"
            onClick={() => {
              toast.success('CSV export started');
              window.location.href = `http://localhost:5001/api/assignments/${assignment.id}/export`;
            }}
          >
            Export to CSV
          </button>
          <button
            className="btn-edit"
            onClick={() => navigate(`/edit-assignment/${assignment.id}`)}
          >
            Edit Assignment
          </button>
        </div>
      </div>
    </PageTransition>
  );
}

export default AssignmentDetails;