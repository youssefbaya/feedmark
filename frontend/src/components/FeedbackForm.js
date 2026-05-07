import { useState } from 'react';
import { useFeedback } from '../context/FeedbackContext';
import toast from 'react-hot-toast';
import './FeedbackForm.css';


function FeedbackForm({ editingFeedback, onCancel }) {
  const { addFeedback, updateFeedback } = useFeedback();

  const [text, setText] = useState(editingFeedback?.text || '');
  const [category, setCategory] = useState(editingFeedback?.category || 'general');
  const [tags, setTags] = useState(editingFeedback?.tags || '');

  const handleSubmit = (e) => {
    e.preventDefault();

    const feedback = {
      id: editingFeedback?.id || Date.now(),
      text,
      category,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      createdAt: editingFeedback?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingFeedback) {
      updateFeedback(editingFeedback.id, feedback);
      toast.success('Feedback updated successfully');
    } else {
      addFeedback(feedback);
      toast.success('Feedback added successfully');
    }

    setText('');
    setCategory('general');
    setTags('');

    if (onCancel) onCancel();
  };

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Feedback Text *</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your feedback comment..."
          rows="4"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Category *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="general">General</option>
            <option value="positive">Positive</option>
            <option value="improvement">Needs Improvement</option>
            <option value="critical">Critical Issue</option>
            <option value="excellent">Excellent Work</option>
          </select>
        </div>

        <div className="form-group">
          <label>Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., code quality, documentation, testing"
          />
        </div>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
        )}
        <button type="submit" className="btn-submit">
          {editingFeedback ? 'Update Feedback' : 'Add Feedback'}
        </button>
      </div>
    </form>
  );
}

export default FeedbackForm;