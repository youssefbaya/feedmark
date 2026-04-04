import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAssignments } from '../context/AssignmentContext';
import './AssignmentDetails.css';
import PageTransition from '../components/PageTransition';

function AssignmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAssignment } = useAssignments();
  
  const assignment = getAssignment(parseInt(id));

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

  const totalPossibleMarks = assignment.sections.reduce((total, section) =>
    total + section.criteria.reduce((sum, criterion) => 
      sum + (parseFloat(criterion.maxMarks) || 0), 0
    ), 0
  );

  return (
  <PageTransition>
    <div className="page">
      <div className="details-header">
        <div>
          <h1>{assignment.name}</h1>
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
                <span className="section-marks">
                  {section.criteria.reduce((sum, c) => 
                    sum + (parseFloat(c.maxMarks) || 0), 0
                  )} marks
                </span>
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
                        <td className="criterion-marks">{criterion.maxMarks}</td>
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
        <button className="btn-mark" onClick={() => navigate(`/mark/${assignment.id}`)}>Mark Students</button>
        <button className="btn-export">Export to CSV</button>
        <button className="btn-edit">Edit Assignment</button>
      </div>
    </div>
    </PageTransition>
  );
}

export default AssignmentDetails;