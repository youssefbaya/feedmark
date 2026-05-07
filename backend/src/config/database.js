const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../feedmark.db');
const db = new Database(dbPath);

console.log('Connected to SQLite database');

const initializeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      total_marks INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      name TEXT,
      position INTEGER NOT NULL,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS criteria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      max_marks REAL NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feedback_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_name TEXT NOT NULL,
      student_id TEXT,
      submission_file_name TEXT,
      submission_file_path TEXT,
      total_marks REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS criterion_marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      criterion_id INTEGER NOT NULL,
      marks_awarded REAL NOT NULL,
      feedback_text TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE CASCADE
    );
  `);

  try {
    db.prepare('ALTER TABLE students ADD COLUMN submission_file_name TEXT').run();
  } catch (error) { }

  try {
    db.prepare('ALTER TABLE students ADD COLUMN submission_file_path TEXT').run();
  } catch (error) { }

  console.log('Database tables initialized');
};

module.exports = { db, initializeDatabase };