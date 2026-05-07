import { useState, useEffect } from 'react';
import { useFeedback } from '../context/FeedbackContext';
import FeedbackForm from '../components/FeedbackForm';
import './FeedbackLibrary.css';
import PageTransition from '../components/PageTransition';

function FeedbackLibrary() {
  const { feedbackComments, deleteFeedback } = useFeedback();
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [stats, setStats] = useState(null);

  const handleDelete = (id, text) => {
    if (window.confirm(`Delete this feedback: "${text.substring(0, 50)}..."?`)) {
      deleteFeedback(id);
    }
  };

  const handleEdit = (feedback) => {
    setEditingFeedback(feedback);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetch('http://localhost:5001/api/feedback/stats/overview')
      .then(response => response.json())
      .then(data => setStats(data))
      .catch(error => console.error('Error loading feedback stats:', error));
  }, []);

  const filteredComments = filterCategory === 'all'
    ? feedbackComments
    : feedbackComments.filter(f => f.category === filterCategory);

  const getCategoryBadgeClass = (category) => {
    const classes = {
      positive: 'badge-positive',
      improvement: 'badge-improvement',
      critical: 'badge-critical',
      excellent: 'badge-excellent',
      general: 'badge-general'
    };
    return classes[category] || 'badge-general';
  };

  return (
    <PageTransition>
      <div className="page">
        <span className="page-kicker">Reusable Comments</span>
        <h1 className="page-title">Feedback Library</h1>
        <p className="page-subtitle">Create and manage reusable feedback comments for marking.</p>

        {stats && (
          <div className="feedback-stats">
            <div className="feedback-stat-card">
              <span>Total Comments</span>
              <strong>{stats.totalComments}</strong>
            </div>

            <div className="feedback-stat-card">
              <span>Most Used Category</span>
              <strong>{stats.mostUsedCategory}</strong>
            </div>

            <div className="feedback-stat-card tags-card">
              <span>Top Tags</span>

              <div className="top-tags">
                {stats.topTags.map(([tag, count]) => (
                  <div key={tag} className="top-tag">
                    #{tag} ({count})
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <FeedbackForm
          editingFeedback={editingFeedback}
          onCancel={() => setEditingFeedback(null)}
        />

        <div className="feedback-controls">
          <h2>Your Feedback Comments ({filteredComments.length})</h2>
          <div className="filter-controls">
            <label>Filter by category:</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="positive">Positive</option>
              <option value="improvement">Needs Improvement</option>
              <option value="critical">Critical Issue</option>
              <option value="excellent">Excellent Work</option>
            </select>
          </div>
        </div>

        {filteredComments.length === 0 ? (
          <div className="empty-state">
            <p>No feedback comments yet. Create your first one above!</p>
          </div>
        ) : (
          <div className="feedback-list">
            {filteredComments.map((feedback) => (
              <div key={feedback.id} className="feedback-item">
                <div className="feedback-header">
                  <span className={`category-badge ${getCategoryBadgeClass(feedback.category)}`}>
                    {feedback.category}
                  </span>
                  <div className="feedback-actions">
                    <button onClick={() => handleEdit(feedback)} className="btn-edit-small">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(feedback.id, feedback.text)} className="btn-delete-small">
                      Delete
                    </button>
                  </div>
                </div>

                <p className="feedback-text">{feedback.text}</p>

                <div className="feedback-meta">
                  <span className="feedback-category-badge">
                    {feedback.category}
                  </span>

                  {feedback.tags && (
                    <div className="feedback-tags-inline-wrapper">
                      {(Array.isArray(feedback.tags)
                        ? feedback.tags
                        : feedback.tags.split(',')
                      ).map((tag, index) => (
                        <span key={index} className="feedback-tags-inline">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="feedback-footer">
                  <span className="feedback-date">
                    {feedback.updatedAt !== feedback.createdAt ? 'Updated' : 'Created'}: {' '}
                    {new Date(feedback.updatedAt || feedback.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default FeedbackLibrary;