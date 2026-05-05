const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

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

router.get('/', (req, res) => {
  try {
    const feedback = db.prepare('SELECT * FROM feedback_comments ORDER BY created_at DESC').all();
    
    const feedbackWithParsedTags = feedback.map(f => ({
      ...f,
      tags: f.tags ? f.tags.split(',') : []
    }));
    
    res.json(toCamelCase(feedbackWithParsedTags));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { text, category, tags } = req.body;
    const now = new Date().toISOString();
    const tagsString = Array.isArray(tags) ? tags.join(',') : tags;
    
    const insert = db.prepare(`
      INSERT INTO feedback_comments (text, category, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(text, category, tagsString, now, now);
    
    res.status(201).json({ id: result.lastInsertRowid, message: 'Feedback created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { text, category, tags } = req.body;
    const now = new Date().toISOString();
    const tagsString = Array.isArray(tags) ? tags.join(',') : tags;
    
    const update = db.prepare(`
      UPDATE feedback_comments 
      SET text = ?, category = ?, tags = ?, updated_at = ?
      WHERE id = ?
    `);
    
    const result = update.run(text, category, tagsString, now, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    res.json({ message: 'Feedback updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM feedback_comments WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;