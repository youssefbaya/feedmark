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
    let csv = 'Student,ID,Score,Percentage,Grade Band,Comments,Exported At\n';

    // Add each student
    students.forEach(student => {
      const name = `"${student.student_name}"`;
      const id = student.student_id || '';
      const score = Number(student.total_marks || 0);

      const percentage = assignment.total_marks > 0
        ? ((score / assignment.total_marks) * 100).toFixed(1)
        : 0;

      let gradeBand = 'Fail';

      if (percentage >= 70) {
        gradeBand = 'First';
      } else if (percentage >= 60) {
        gradeBand = '2:1';
      } else if (percentage >= 50) {
        gradeBand = '2:2';
      } else if (percentage >= 40) {
        gradeBand = 'Third';
      }

      // Collect all feedback
      const marksData = student.marks_data
        ? student.marks_data.split(';;;')
        : [];

      const uniqueFeedback = [
        ...new Set(
          marksData
            .map(data => data.split('|')[1])
            .filter(text =>
              text &&
              text !== 'null' &&
              text.trim() !== ''
            )
            .map(text => text.trim())
        )
      ];

      const feedbackTexts = uniqueFeedback.join(' | ');

      const comments = feedbackTexts
        ? `"${feedbackTexts}"`
        : '""';

      const exportedAt = new Date().toLocaleString();

      csv += `${name},${id},${score},${percentage}%,${gradeBand},${comments},"${exportedAt}"\n`;
    });

    return csv;
  } catch (error) {
    throw error;
  }
};

module.exports = { generateCanvasCSV };