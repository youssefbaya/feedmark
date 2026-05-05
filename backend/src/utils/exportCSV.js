const { db } = require('../config/database');

const generateCanvasCSV = (assignmentId) => {
  try {
    // Get assignment details
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignmentId);
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    // Get all students for this assignment
    const students = db.prepare(`
      SELECT s.*, GROUP_CONCAT(cm.marks_awarded || '|' || cm.feedback_text, ';;;') as marks_data
      FROM students s
      LEFT JOIN criterion_marks cm ON s.id = cm.student_id
      WHERE s.assignment_id = ?
      GROUP BY s.id
      ORDER BY s.student_name
    `).all(assignmentId);
    
    if (students.length === 0) {
      throw new Error('No students marked for this assignment');
    }
    
    // CSV Header
    let csv = 'Student,ID,Score,Comments\n';
    
    // Add each student
    students.forEach(student => {
      const name = `"${student.student_name}"`;
      const id = student.student_id || '';
      const score = student.total_marks;
      
      // Collect all feedback
      const marksData = student.marks_data ? student.marks_data.split(';;;') : [];
      const feedbackTexts = marksData
        .map(data => data.split('|')[1])
        .filter(text => text && text !== 'null' && text.trim() !== '')
        .join(' | ');
      
      const comments = feedbackTexts ? `"${feedbackTexts}"` : '""';
      
      csv += `${name},${id},${score},${comments}\n`;
    });
    
    return csv;
  } catch (error) {
    throw error;
  }
};

module.exports = { generateCanvasCSV };