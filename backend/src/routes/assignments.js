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