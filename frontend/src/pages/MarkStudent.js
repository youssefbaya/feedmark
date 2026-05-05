import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssignments } from '../context/AssignmentContext';
import { useFeedback } from '../context/FeedbackContext';
import PageTransition from '../components/PageTransition';
import './MarkStudent.css';

function MarkStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAssignment } = useAssignments();
  const { feedbackComments } = useFeedback();
  
  const assignment = getAssignment(parseInt(id));
  
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [marks, setMarks] = useState({});
  const [feedback, setFeedback] = useState({});
  const [showFeedbackLibrary, setShowFeedbackLibrary] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  useEffect(() => {
    if (assignment) {
      const initialMarks = {};
      const initialFeedback = {};
      const initialShowLibrary = {};
      
      assignment.sections.forEach(section => {
        section.criteria.forEach(criterion => {
          initialMarks[criterion.id] = '';
          initialFeedback[criterion.id] = '';
          initialShowLibrary[criterion.id] = false;
        });
      });
      
      setMarks(initialMarks);
      setFeedback(initialFeedback);
      setShowFeedbackLibrary(initialShowLibrary);
    }
  }, [assignment]);
  
  if (!assignment) {
    return (
      <PageTransition>
        <div className="page">
          <h1>Assignment Not Found</h1>
        </div>
      </PageTransition>
    );
  }
  
  const handleMarkChange = (criterionId, value) => {
    setMarks({ ...marks, [criterionId]: value });
  };
  
  const handleFeedbackChange = (criterionId, value) => {
    setFeedback({ ...feedback, [criterionId]: value });
  };
  
  const toggleFeedbackLibrary = (criterionId) => {
    setShowFeedbackLibrary({ 
      ...showFeedbackLibrary, 
      [criterionId]: !showFeedbackLibrary[criterionId] 
    });
  };
  
  const insertFeedback = (criterionId, feedbackText) => {
    const currentFeedback = feedback[criterionId] || '';
    const newFeedback = currentFeedback 
      ? `${currentFeedback}\n${feedbackText}` 
      : feedbackText;
    setFeedback({ ...feedback, [criterionId]: newFeedback });
  };
  
  const filteredFeedback = selectedCategory === 'all' 
    ? feedbackComments 
    : feedbackComments.filter(f => f.category === selectedCategory);
  
  const calculateTotal = () => {
    return Object.values(marks).reduce((sum, mark) => {
      return sum + (parseFloat(mark) || 0);
    }, 0);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const marksArray = Object.entries(marks).map(([criterionId, marksAwarded]) => ({
      criterionId: parseInt(criterionId),
      marksAwarded: parseFloat(marksAwarded) || 0,
      feedbackText: feedback[criterionId] || ''
    }));
    
    const data = {
      assignmentId: assignment.id,
      studentName,
      studentId,
      marks: marksArray
    };
    
    try {
      const response = await fetch('http://localhost:5001/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        alert('Marking saved successfully!');
        navigate(`/marked/${assignment.id}`);
      }
    } catch (error) {
      console.error('Error saving marks:', error);
      alert('Failed to save marks');
    }
  };
  
  return (
    <PageTransition>
      <div className="page">
        <div className="mark-header">
          <h1>Mark Student</h1>
          <button onClick={() => navigate(`/assignments/${assignment.id}`)} className="btn-back">
            ← Back
          </button>
        </div>
        
        <div className="assignment-info">
          <h2>{assignment.name}</h2>
          <p>Total Available: {assignment.totalMarks} marks</p>
        </div>
        
        <form onSubmit={handleSubmit} className="marking-form">
          <div className="student-details">
            <h3>Student Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Student Name *</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Student ID</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="marking-sections">
            {assignment.sections.map((section, sectionIndex) => (
              <div key={section.id} className="marking-section">
                <h3>{section.name || `Section ${sectionIndex + 1}`}</h3>
                
                {section.criteria.map((criterion, criterionIndex) => (
                  <div key={criterion.id} className="criterion-marking">
                    <div className="criterion-header">
                      <span className="criterion-number">{criterionIndex + 1}.</span>
                      <span className="criterion-name">{criterion.name}</span>
                      <span className="criterion-max">/ {criterion.maxMarks}</span>
                    </div>
                    
                    <div className="marking-inputs">
                      <div className="marks-input-group">
                        <label>Marks</label>
                        <input
                          type="number"
                          min="0"
                          max={criterion.maxMarks}
                          step="0.5"
                          value={marks[criterion.id] || ''}
                          onChange={(e) => handleMarkChange(criterion.id, e.target.value)}
                          className="marks-input"
                        />
                      </div>
                      
                      <div className="feedback-input-group">
                        <div className="feedback-header">
                          <label>Feedback</label>
                          <button 
                            type="button"
                            className="btn-feedback-library"
                            onClick={() => toggleFeedbackLibrary(criterion.id)}
                          >
                            {showFeedbackLibrary[criterion.id] ? 'Hide' : 'Show'} Library
                          </button>
                        </div>
                        
                        {showFeedbackLibrary[criterion.id] && (
                          <div className="feedback-library-panel">
                            <div className="library-controls">
                              <select 
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="category-filter"
                              >
                                <option value="all">All Categories</option>
                                <option value="general">General</option>
                                <option value="positive">Positive</option>
                                <option value="improvement">Needs Improvement</option>
                                <option value="critical">Critical Issue</option>
                                <option value="excellent">Excellent Work</option>
                              </select>
                            </div>
                            
                            <div className="feedback-items">
                              {filteredFeedback.length === 0 ? (
                                <p className="no-feedback">No feedback comments in this category</p>
                              ) : (
                                filteredFeedback.map(fb => (
                                  <div 
                                    key={fb.id} 
                                    className="feedback-item"
                                    onClick={() => insertFeedback(criterion.id, fb.text)}
                                  >
                                    <span className={`feedback-badge ${fb.category}`}>
                                      {fb.category}
                                    </span>
                                    <p>{fb.text}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                        
                        <textarea
                          value={feedback[criterion.id] || ''}
                          onChange={(e) => handleFeedbackChange(criterion.id, e.target.value)}
                          placeholder="Optional feedback for this criterion..."
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <div className="marking-summary">
            <div className="total-marks">
              <span>Total Marks:</span>
              <strong>{calculateTotal()} / {assignment.totalMarks}</strong>
            </div>
            
            <button type="submit" className="btn-submit-marks">
              Save Marking
            </button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}

export default MarkStudent;