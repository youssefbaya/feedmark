const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// Helper to convert snake_case to camelCase
const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  const camelObj = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    camelObj[camelKey] = obj[key];
  }
  return camelObj;
};

// Get all students for an assignment
router.get('/assignment/:assignmentId', (req, res) => {
  try {
    const students = db.prepare('SELECT * FROM students WHERE assignment_id = ? ORDER BY created_at DESC').all(req.params.assignmentId);
    res.json(toCamelCase(students));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student with all their marks
router.get('/:id', (req, res) => {
  try {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const marks = db.prepare('SELECT * FROM criterion_marks WHERE student_id = ?').all(req.params.id);
    
    res.json(toCamelCase({ ...student, marks }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create student marking
router.post('/', (req, res) => {
  try {
    const { assignmentId, studentName, studentId, marks } = req.body;
    const now = new Date().toISOString();
    
    // Calculate total marks
    const totalMarks = marks.reduce((sum, mark) => sum + parseFloat(mark.marksAwarded || 0), 0);
    
    // Insert student
    const insertStudent = db.prepare(`
      INSERT INTO students (assignment_id, student_name, student_id, total_marks, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = insertStudent.run(assignmentId, studentName, studentId, totalMarks, now);
    const studentDbId = result.lastInsertRowid;
    
    // Insert criterion marks
    const insertMark = db.prepare(`
      INSERT INTO criterion_marks (student_id, criterion_id, marks_awarded, feedback_text)
      VALUES (?, ?, ?, ?)
    `);
    
    marks.forEach(mark => {
      insertMark.run(studentDbId, mark.criterionId, mark.marksAwarded, mark.feedbackText || null);
    });
    
    res.status(201).json({ id: studentDbId, message: 'Student marking saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete student marking
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ message: 'Student marking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;