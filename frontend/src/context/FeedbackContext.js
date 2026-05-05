import { createContext, useState, useContext, useEffect } from 'react';

const FeedbackContext = createContext();

export function FeedbackProvider({ children }) {
  const [feedbackComments, setFeedbackComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/feedback');
      const data = await response.json();
      setFeedbackComments(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setLoading(false);
    }
  };

  const addFeedback = async (feedback) => {
    try {
      const response = await fetch('http://localhost:5001/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });
      
      if (response.ok) {
        fetchFeedback();
      }
    } catch (error) {
      console.error('Error adding feedback:', error);
    }
  };

  const deleteFeedback = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/feedback/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchFeedback();
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  const updateFeedback = async (id, updatedFeedback) => {
    try {
      const response = await fetch(`http://localhost:5001/api/feedback/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFeedback)
      });
      
      if (response.ok) {
        fetchFeedback();
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  return (
    <FeedbackContext.Provider value={{ 
      feedbackComments, 
      addFeedback, 
      deleteFeedback, 
      updateFeedback,
      loading
    }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return context;
}