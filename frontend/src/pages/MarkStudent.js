import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssignments } from '../context/AssignmentContext';
import { useFeedback } from '../context/FeedbackContext';
import PageTransition from '../components/PageTransition';
import toast from 'react-hot-toast';
import './MarkStudent.css';


function MarkStudent() {
  const { id, studentRecordId } = useParams();

  const isEditMode = Boolean(studentRecordId);
  const navigate = useNavigate();
  const { getAssignment } = useAssignments();
  const { feedbackComments } = useFeedback();

  const assignment = getAssignment(parseInt(id));

  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [marks, setMarks] = useState({});
  const [selectedBands, setSelectedBands] = useState({});
  const [feedback, setFeedback] = useState({});
  const [showFeedbackLibrary, setShowFeedbackLibrary] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (assignment && !isEditMode) {
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

    if (assignment && isEditMode) {
      const initialShowLibrary = {};

      assignment.sections.forEach(section => {
        section.criteria.forEach(criterion => {
          initialShowLibrary[criterion.id] = false;
        });
      });

      setShowFeedbackLibrary(initialShowLibrary);
    }
  }, [assignment, isEditMode]);

  useEffect(() => {
    if (!isEditMode || !assignment) {
      return;
    }

    fetch(`http://localhost:5001/api/students/${studentRecordId}`)
      .then(response => response.json())
      .then(data => {
        setStudentName(data.studentName || '');
        setStudentId(data.studentId || '');

        const loadedMarks = {};
        const loadedFeedback = {};

        assignment.sections.forEach(section => {
          section.criteria.forEach(criterion => {
            const existingMark = (data.marks || []).find(mark =>
              mark.criterion_id === criterion.id || mark.criterionId === criterion.id
            );

            loadedMarks[criterion.id] = existingMark
              ? existingMark.marks_awarded || existingMark.marksAwarded
              : '';

            loadedFeedback[criterion.id] = existingMark
              ? existingMark.feedback_text || existingMark.feedbackText || ''
              : '';
          });
        });

        setMarks(loadedMarks);
        setFeedback(loadedFeedback);
      })
      .catch(error => console.error('Error loading student marking:', error));
  }, [isEditMode, studentRecordId, assignment]);

  if (!assignment) {
    return (
      <PageTransition>
        <div className="page">
          <h1>Assignment Not Found</h1>
        </div>
      </PageTransition>
    );
  }

  const handleMarkChange = (criterionId, value, maxMarks) => {
    const numberValue = parseFloat(value);

    if (value === '') {
      setMarks({ ...marks, [criterionId]: '' });
      return;
    }

    if (numberValue < 0) {
      setMarks({ ...marks, [criterionId]: 0 });
      return;
    }

    if (numberValue > maxMarks) {
      setMarks({ ...marks, [criterionId]: maxMarks });
      return;
    }

    setMarks({ ...marks, [criterionId]: value });
  };

  const applyGradeBand = (criterion, band) => {
    const maxMarks = Number(criterion.maxMarks || criterion.max_marks || 0);

    const bandPercentages = {
      first: 0.85,
      '21': 0.65,
      '22': 0.55,
      third: 0.47,
      pass: 0.42,
      fail: 0.25
    };

    const calculatedMark =
      Math.round(maxMarks * bandPercentages[band] * 10) / 10;

    setMarks({
      ...marks,
      [criterion.id]: calculatedMark
    });

    setSelectedBands({
      ...selectedBands,
      [criterion.id]: band
    });
  };

  const getSelectedBand = (criterion) => {
    return selectedBands[criterion.id] || '';
  };

  const isCriterionCompleted = (criterion) => {
    return (
      marks[criterion.id] !== undefined &&
      marks[criterion.id] !== '' &&
      !isNaN(marks[criterion.id])
    );
  };

  const getBandDescription = (band) => {
    const descriptions = {
      first: 'Excellent standard with strong evidence of understanding.',
      '21': 'Good standard with minor issues or gaps.',
      '22': 'Satisfactory work meeting the main requirements.',
      third: 'Basic work with several areas needing improvement.',
      pass: 'Minimum acceptable standard.',
      fail: 'Does not meet the required standard.'
    };

    return descriptions[band];
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

  const filteredFeedback = feedbackComments.filter(comment => {
    const matchesCategory =
      selectedCategory === 'all' || comment.category === selectedCategory;

    const tagsText = Array.isArray(comment.tags)
      ? comment.tags.join(' ')
      : comment.tags || '';

    const matchesSearch =
      comment.text.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      tagsText.toLowerCase().includes(feedbackSearch.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const calculateTotal = () => {
    return Object.values(marks).reduce((sum, mark) => {
      return sum + (parseFloat(mark) || 0);
    }, 0);
  };

  const totalMarks = calculateTotal();

  const totalCriteria = assignment.sections.reduce(
    (total, section) => total + section.criteria.length,
    0
  );

  const markedCriteria = Object.values(marks).filter(
    mark => mark !== '' && !isNaN(parseFloat(mark))
  ).length;

  const progress =
    totalCriteria > 0
      ? Math.round((markedCriteria / totalCriteria) * 100)
      : 0;

  const percentage =
    assignment.totalMarks > 0
      ? Math.round((totalMarks / assignment.totalMarks) * 100)
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const marksArray = Object.entries(marks).map(([criterionId, marksAwarded]) => ({
      criterionId: parseInt(criterionId),
      marksAwarded: parseFloat(marksAwarded) || 0,
      feedbackText: feedback[criterionId] || ''
    }));

    const formData = new FormData();

    formData.append('assignmentId', assignment.id);
    formData.append('studentName', studentName);
    formData.append('studentId', studentId);
    formData.append('marks', JSON.stringify(marksArray));

    if (submissionFile) {
      formData.append('submission', submissionFile);
    }

    try {
      const url = isEditMode
        ? `http://localhost:5001/api/students/${studentRecordId}`
        : 'http://localhost:5001/api/students';

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        body: formData
      });

      if (response.ok) {
        toast.success(
          isEditMode
            ? 'Marking updated successfully'
            : 'Student marked successfully'
        );
        setSaving(false);
        navigate(`/marked/${assignment.id}`);
      } else {
        const errorData = await response.json();
        setSaving(false);
        toast.error(errorData.error || 'Failed to save marks');
      }
    } catch (error) {
      console.error('Error saving marks:', error);
      setSaving(false);
      toast.error('Something went wrong while saving marks');
    }
  };

  return (
    <PageTransition>
      <div className="page">
        <div className="mark-header">
          <div>
            <span className="page-kicker">{isEditMode ? 'Update Record' : 'New Marking'}</span>
            <h1 className="page-title">{isEditMode ? 'Edit Marking' : 'Mark Student'}</h1>
          </div>
          <button onClick={() => navigate(`/assignments/${assignment.id}`)} className="btn-back">
            ← Back
          </button>
        </div>

        <div className="assignment-info">
          <div>
            <h2>{assignment.name}</h2>
            <p>Total Available: {assignment.totalMarks} marks</p>
          </div>

          <div className="mark-progress-box">
            <span>
              {markedCriteria} of {totalCriteria} criteria marked
            </span>

            <div className="mark-progress-bar">
              <div style={{ width: `${progress}%` }}></div>
            </div>
          </div>
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
              <div className="form-group">
                <label>Submission File</label>
                <input
                  type="file"
                  onChange={(e) => setSubmissionFile(e.target.files[0])}
                />
              </div>
            </div>
          </div>

          <div className="marking-sections">
            {assignment.sections.map((section, sectionIndex) => (
              <div key={section.id} className="marking-section">
                <h3>{section.name || `Section ${sectionIndex + 1}`}</h3>

                {section.criteria.map((criterion, criterionIndex) => (
                  <div
                    key={criterion.id}
                    className={`criterion-marking ${isCriterionCompleted(criterion) ? 'completed' : ''
                      }`}
                  >
                    <div className="criterion-header">
                      <span className="criterion-number">{criterionIndex + 1}.</span>
                      <span className="criterion-name">{criterion.name}</span>
                      <span className="criterion-max">/ {criterion.maxMarks}</span>
                      {getSelectedBand(criterion) && (
                        <span className="selected-band-label">
                          {getSelectedBand(criterion).replace('21', '2:1').replace('22', '2:2')}
                        </span>
                      )}
                    </div>

                    <div className="grade-band-row">
                      {[
                        { key: 'first', label: 'First' },
                        { key: '21', label: '2:1' },
                        { key: '22', label: '2:2' },
                        { key: 'third', label: 'Third' },
                        { key: 'pass', label: 'Pass' },
                        { key: 'fail', label: 'Fail' }
                      ].map(band => (
                        <button
                          key={band.key}
                          type="button"
                          className={`grade-band-card ${band.key} ${getSelectedBand(criterion) === band.key ? 'selected' : ''
                            }`}
                          onClick={() => applyGradeBand(criterion, band.key)}
                        >
                          <strong>{band.label}</strong>
                          <span>{getBandDescription(band.key)}</span>
                        </button>
                      ))}
                    </div>
                    <div className="marking-inputs">
                      <div className="marks-input-group">
                        <label>Marks</label>
                        <input
                          type="number"
                          min="0"
                          max={criterion.maxMarks}
                          step="0.5"
                          value={marks[criterion.id] ?? ''}
                          onChange={(e) => handleMarkChange(criterion.id, e.target.value, criterion.maxMarks)}
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
                            {showFeedbackLibrary[criterion.id] ? 'Hide Comments' : '+ Insert Feedback'}
                          </button>
                        </div>

                        {showFeedbackLibrary[criterion.id] && (
                          <div className="feedback-library-panel">
                            <div className="library-controls">
                              <input
                                type="text"
                                placeholder="Search comments or tags..."
                                value={feedbackSearch}
                                onChange={(e) => setFeedbackSearch(e.target.value)}
                                className="feedback-search"
                              />
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

          <div className="sticky-summary-wrapper">
            <div className="marking-summary">
              <div className="total-marks">
                <span>Total Marks:</span>
                <strong>{totalMarks} / {assignment.totalMarks}</strong>
                <small>{percentage}%</small>
              </div>

              <button
                type="submit"
                className="btn-submit-marks"
                disabled={saving}
              >
                {saving
                  ? (isEditMode ? 'Updating...' : 'Saving...')
                  : (isEditMode ? 'Update Marking' : 'Save Marking')}
              </button>
            </div>
          </div>
        </form>

      </div>
    </PageTransition>
  );
}

export default MarkStudent;