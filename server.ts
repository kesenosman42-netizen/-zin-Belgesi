import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';

const app = express();
const PORT = 3000;

// Initialize Database
const db = new Database('students.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    schoolNumber TEXT NOT NULL,
    name TEXT NOT NULL,
    className TEXT NOT NULL
  )
`);

app.use(express.json());

// API Routes

// Get all students
app.get('/api/students', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM students ORDER BY name ASC');
    const students = stmt.all();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Add a single student
app.post('/api/students', (req, res) => {
  try {
    const { id, schoolNumber, name, className } = req.body;
    const stmt = db.prepare('INSERT INTO students (id, schoolNumber, name, className) VALUES (?, ?, ?, ?)');
    stmt.run(id, schoolNumber, name, className);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Bulk add students (for file upload)
// This will merge with existing students, avoiding duplicates by ID if possible, or just insert.
// Since ID is generated on client or server, let's assume client sends ID for now or we generate it.
// Actually, for bulk upload, we might want to clear existing or append. The user said "eklediğim öğrenciler kaybolmasın ben silmeden", so append.
app.post('/api/students/bulk', (req, res) => {
  try {
    const students = req.body; // Array of students
    const insert = db.prepare('INSERT OR IGNORE INTO students (id, schoolNumber, name, className) VALUES (?, ?, ?, ?)');
    const update = db.prepare('UPDATE students SET schoolNumber = ?, name = ?, className = ? WHERE id = ?');
    
    const transaction = db.transaction((students) => {
      for (const student of students) {
        // Try to insert, if fails (id conflict), update? 
        // Or maybe check if schoolNumber exists?
        // Let's just use INSERT OR REPLACE logic if ID is provided, or generate ID.
        // The client parser generates IDs.
        insert.run(student.id, student.schoolNumber, student.name, student.className);
      }
    });
    
    transaction(students);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to bulk add students' });
  }
});

// Update a student
app.put('/api/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { schoolNumber, name, className } = req.body;
    const stmt = db.prepare('UPDATE students SET schoolNumber = ?, name = ?, className = ? WHERE id = ?');
    stmt.run(schoolNumber, name, className, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete a student
app.delete('/api/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM students WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});


// Vite Middleware
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
