import { createContext, useState, useContext } from 'react';
import { useEffect } from 'react';


const AssignmentContext = createContext();

export function AssignmentProvider({ children }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch assignments from backend on mount
  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/assignments');
      const data = await response.json();
      setAssignments(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setLoading(false);
    }
  };


  const addAssignment = async (assignment) => {
    try {
      const response = await fetch('http://localhost:5001/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment)
      });

      if (response.ok) {
        fetchAssignments();
      }
    } catch (error) {
      console.error('Error adding assignment:', error);
    }
  };

  const updateAssignment = async (id, assignment) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/assignments/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(assignment)
        }
      );

      if (response.ok) {
        fetchAssignments();
      }

    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const deleteAssignment = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/assignments/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchAssignments();
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  const getAssignment = (id) => {
    return assignments.find(a => a.id === parseInt(id));
  };

  return (
    <AssignmentContext.Provider value={{
      assignments,
      addAssignment,
      updateAssignment,
      deleteAssignment,
      getAssignment,
      loading
    }}>
      {children}
    </AssignmentContext.Provider>
  );
}

export function useAssignments() {
  const context = useContext(AssignmentContext);
  if (!context) {
    throw new Error('useAssignments must be used within AssignmentProvider');
  }
  return context;
}