const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

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

// Get all students
router.get('/', (req, res) => {
  try {
    const students = db.prepare(`
      SELECT 
        students.*,
        assignments.name AS assignment_name,
        assignments.total_marks AS assignment_total
      FROM students
      JOIN assignments ON students.assignment_id = assignments.id
      ORDER BY students.created_at DESC
    `).all();

    res.json(toCamelCase(students));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
router.post('/', upload.single('submission'), (req, res) => {
  try {
    const { assignmentId, studentName, studentId } = req.body;
    const marks = JSON.parse(req.body.marks || '[]');
    for (const mark of marks) {
      const criterion = db.prepare('SELECT max_marks FROM criteria WHERE id = ?').get(mark.criterionId);

      if (!criterion) {
        return res.status(400).json({ error: 'Invalid criterion selected' });
      }

      const awarded = parseFloat(mark.marksAwarded || 0);
      const maxMarks = parseFloat(criterion.max_marks || 0);

      if (awarded < 0 || awarded > maxMarks) {
        return res.status(400).json({
          error: `Marks for criterion ${mark.criterionId} must be between 0 and ${maxMarks}`
        });
      }
    }
    const now = new Date().toISOString();

    // Calculate total marks
    const totalMarks = marks.reduce((sum, mark) => sum + parseFloat(mark.marksAwarded || 0), 0);

    // Insert student
    const insertStudent = db.prepare(`
      INSERT INTO students (
      assignment_id,
      student_name,
      student_id,
      submission_file_name,
      submission_file_path,
      total_marks,
      created_at
     )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const fileName = req.file ? req.file.originalname : null;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    const result = insertStudent.run(
      assignmentId,
      studentName,
      studentId,
      fileName,
      filePath,
      totalMarks,
      now
    );
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

// Update student marking
router.put('/:id', upload.single('submission'), (req, res) => {
  try {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const { studentName, studentId } = req.body;
    const marks = JSON.parse(req.body.marks || '[]');

    for (const mark of marks) {
      const criterion = db.prepare('SELECT max_marks FROM criteria WHERE id = ?').get(mark.criterionId);

      if (!criterion) {
        return res.status(400).json({ error: 'Invalid criterion selected' });
      }

      const awarded = parseFloat(mark.marksAwarded || 0);
      const maxMarks = parseFloat(criterion.max_marks || 0);

      if (awarded < 0 || awarded > maxMarks) {
        return res.status(400).json({
          error: `Marks for criterion ${mark.criterionId} must be between 0 and ${maxMarks}`
        });
      }
    }

    const totalMarks = marks.reduce((sum, mark) => sum + parseFloat(mark.marksAwarded || 0), 0);

    const fileName = req.file ? req.file.originalname : student.submission_file_name;
    const filePath = req.file ? `/uploads/${req.file.filename}` : student.submission_file_path;

    db.prepare(`
      UPDATE students
      SET student_name = ?,
          student_id = ?,
          submission_file_name = ?,
          submission_file_path = ?,
          total_marks = ?
      WHERE id = ?
    `).run(
      studentName,
      studentId,
      fileName,
      filePath,
      totalMarks,
      req.params.id
    );

    db.prepare('DELETE FROM criterion_marks WHERE student_id = ?').run(req.params.id);

    const insertMark = db.prepare(`
      INSERT INTO criterion_marks (student_id, criterion_id, marks_awarded, feedback_text)
      VALUES (?, ?, ?, ?)
    `);

    marks.forEach(mark => {
      insertMark.run(req.params.id, mark.criterionId, mark.marksAwarded, mark.feedbackText || null);
    });

    res.json({ message: 'Student marking updated successfully' });

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