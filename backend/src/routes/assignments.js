const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { generateCanvasCSV } = require('../utils/exportCSV');


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

// Get all assignments
router.get('/', (req, res) => {
  try {
    const assignments = db.prepare('SELECT * FROM assignments ORDER BY created_at DESC').all();

    // For each assignment, get its sections and criteria
    const assignmentsWithDetails = assignments.map(assignment => {
      const sections = db.prepare('SELECT * FROM sections WHERE assignment_id = ? ORDER BY position').all(assignment.id);

      const sectionsWithCriteria = sections.map(section => {
        const criteria = db.prepare('SELECT * FROM criteria WHERE section_id = ? ORDER BY position').all(section.id);
        return { ...section, criteria };
      });

      return { ...assignment, sections: sectionsWithCriteria };
    });

    res.json(toCamelCase(assignmentsWithDetails));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get simple stats for one assignment
router.get('/:id/stats', (req, res) => {
  try {
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const students = db.prepare(`
      SELECT total_marks
      FROM students
      WHERE assignment_id = ?
    `).all(req.params.id);

    const totalMarked = students.length;
    const totalMarks = Number(assignment.total_marks) || 0;

    if (totalMarked === 0) {
      return res.json({
        totalMarked: 0,
        averageMark: 0,
        highestMark: 0,
        lowestMark: 0,
        passRate: 0
      });
    }

    const marks = students.map(student => Number(student.total_marks) || 0);
    const averageMark = marks.reduce((sum, mark) => sum + mark, 0) / totalMarked;
    const highestMark = Math.max(...marks);
    const lowestMark = Math.min(...marks);
    const passed = marks.filter(mark => totalMarks > 0 && (mark / totalMarks) * 100 >= 40).length;
    const passRate = Math.round((passed / totalMarked) * 100);

    const distribution = {
      fail: 0,
      third: 0,
      lowerSecond: 0,
      upperSecond: 0,
      first: 0
    };

    marks.forEach(mark => {
      const percentage = totalMarks > 0
        ? (mark / totalMarks) * 100
        : 0;

      if (percentage < 40) {
        distribution.fail++;
      } else if (percentage < 50) {
        distribution.third++;
      } else if (percentage < 60) {
        distribution.lowerSecond++;
      } else if (percentage < 70) {
        distribution.upperSecond++;
      } else {
        distribution.first++;
      }
    });

    res.json({
      totalMarked,
      averageMark: Number(averageMark.toFixed(1)),
      highestMark,
      lowestMark,
      passRate,
      distribution
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get common feedback used in an assignment
router.get('/:id/common-feedback', (req, res) => {
  try {
    const feedback = db.prepare(`
      SELECT cm.feedback_text
      FROM criterion_marks cm
      JOIN students s ON cm.student_id = s.id
      WHERE s.assignment_id = ?
      AND cm.feedback_text IS NOT NULL
      AND TRIM(cm.feedback_text) != ''
    `).all(req.params.id);

    const feedbackCounts = {};

    feedback.forEach(item => {
      const text = item.feedback_text.trim();

      if (text.length > 0) {
        feedbackCounts[text] =
          (feedbackCounts[text] || 0) + 1;
      }
    });

    const commonFeedback = Object.entries(feedbackCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({
        text,
        count
      }));

    res.json(commonFeedback);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get criterion performance for an assignment
router.get('/:id/criterion-analytics', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        c.id,
        c.name AS criterion_name,
        c.max_marks,
        s.name AS section_name,
        AVG(cm.marks_awarded) AS average_mark,
        COUNT(cm.id) AS marked_count
      FROM criteria c
      JOIN sections s ON c.section_id = s.id
      LEFT JOIN criterion_marks cm ON c.id = cm.criterion_id
      LEFT JOIN students st ON cm.student_id = st.id
      WHERE s.assignment_id = ?
      GROUP BY c.id
      ORDER BY s.position, c.position
    `).all(req.params.id);

    const analytics = rows.map(row => {
      const averageMark = Number(row.average_mark || 0);
      const maxMarks = Number(row.max_marks || 0);

      const percentage = maxMarks > 0
        ? Math.round((averageMark / maxMarks) * 100)
        : 0;

      let performance = 'Weak';

      if (percentage >= 70) {
        performance = 'Strong';
      } else if (percentage >= 50) {
        performance = 'Good';
      }

      return {
        criterionId: row.id,
        criterionName: row.criterion_name,
        sectionName: row.section_name || 'General',
        averageMark: Number(averageMark.toFixed(1)),
        maxMarks,
        percentage,
        markedCount: row.marked_count,
        performance
      };
    });

    res.json(analytics);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single assignment
router.get('/:id', (req, res) => {
  try {
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const sections = db.prepare('SELECT * FROM sections WHERE assignment_id = ? ORDER BY position').all(assignment.id);

    const sectionsWithCriteria = sections.map(section => {
      const criteria = db.prepare('SELECT * FROM criteria WHERE section_id = ? ORDER BY position').all(section.id);
      return { ...section, criteria };
    });

    res.json(toCamelCase({ ...assignment, sections: sectionsWithCriteria }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create assignment
router.post('/', (req, res) => {
  try {
    const { name, description, totalMarks, sections } = req.body;
    const now = new Date().toISOString();

    const insertAssignment = db.prepare(`
      INSERT INTO assignments (name, description, total_marks, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertAssignment.run(name, description, totalMarks, now, now);
    const assignmentId = result.lastInsertRowid;

    // Insert sections and criteria
    if (sections && sections.length > 0) {
      const insertSection = db.prepare(`
        INSERT INTO sections (assignment_id, name, position)
        VALUES (?, ?, ?)
      `);

      const insertCriterion = db.prepare(`
        INSERT INTO criteria (section_id, name, max_marks, position)
        VALUES (?, ?, ?, ?)
      `);

      sections.forEach((section, sectionIndex) => {
        const sectionResult = insertSection.run(assignmentId, section.name, sectionIndex);
        const sectionId = sectionResult.lastInsertRowid;

        if (section.criteria && section.criteria.length > 0) {
          section.criteria.forEach((criterion, criterionIndex) => {
            insertCriterion.run(sectionId, criterion.name, criterion.maxMarks, criterionIndex);
          });
        }
      });
    }

    res.status(201).json({ id: assignmentId, message: 'Assignment created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update assignment
router.put('/:id', (req, res) => {
  try {
    const { name, description, totalMarks, sections } = req.body;
    const now = new Date().toISOString();

    const assignment = db.prepare(
      'SELECT * FROM assignments WHERE id = ?'
    ).get(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        error: 'Assignment not found'
      });
    }

    db.prepare(`
      UPDATE assignments
      SET name = ?, description = ?, total_marks = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name,
      description,
      totalMarks,
      now,
      req.params.id
    );

    // delete old sections + criteria
    const oldSections = db.prepare(
      'SELECT id FROM sections WHERE assignment_id = ?'
    ).all(req.params.id);

    oldSections.forEach(section => {
      db.prepare(
        'DELETE FROM criteria WHERE section_id = ?'
      ).run(section.id);
    });

    db.prepare(
      'DELETE FROM sections WHERE assignment_id = ?'
    ).run(req.params.id);

    // recreate sections + criteria
    const insertSection = db.prepare(`
      INSERT INTO sections (assignment_id, name, position)
      VALUES (?, ?, ?)
    `);

    const insertCriterion = db.prepare(`
      INSERT INTO criteria (section_id, name, max_marks, position)
      VALUES (?, ?, ?, ?)
    `);

    sections.forEach((section, sectionIndex) => {
      const sectionResult = insertSection.run(
        req.params.id,
        section.name,
        sectionIndex
      );

      const sectionId = sectionResult.lastInsertRowid;

      section.criteria.forEach((criterion, criterionIndex) => {
        insertCriterion.run(
          sectionId,
          criterion.name,
          criterion.maxMarks,
          criterionIndex
        );
      });
    });

    res.json({
      message: 'Assignment updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Delete assignment
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/export', (req, res) => {
  try {
    const csv = generateCanvasCSV(req.params.id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=assignment-${req.params.id}-marks.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;