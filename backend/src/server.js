const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./config/database');
const assignmentsRouter = require('./routes/assignments');
const studentsRouter = require('./routes/students');
const feedbackRouter = require('./routes/feedback');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/assignments', assignmentsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/feedback', feedbackRouter);

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'FeedMark API is running' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
initializeDatabase();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;