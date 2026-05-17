const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Get all tasks
app.get('/api/tasks', (req, res) => {
    const sql = "SELECT * FROM tasks";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Create a new task
app.post('/api/tasks', (req, res) => {
    const { title, description, date, priority, section } = req.body;
    const sql = 'INSERT INTO tasks (title, description, date, priority, section) VALUES (?,?,?,?,?)';
    const params = [title, description, date, priority || 'Medium', section || 'Daily'];
    
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": {
                id: this.lastID,
                title,
                description,
                date,
                priority: priority || 'Medium',
                section: section || 'Daily',
                completed: 0
            }
        });
    });
});

// Update a task (for editing or marking completed)
app.put('/api/tasks/:id', (req, res) => {
    const { title, description, date, priority, section, completed } = req.body;
    const sql = `UPDATE tasks set 
        title = COALESCE(?,title), 
        description = COALESCE(?,description), 
        date = COALESCE(?,date), 
        priority = COALESCE(?,priority), 
        section = COALESCE(?,section), 
        completed = COALESCE(?,completed) 
        WHERE id = ?`;
    const params = [title, description, date, priority, section, completed, req.params.id];
    
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({"error": res.message});
            return;
        }
        res.json({
            message: "success",
            data: req.body,
            changes: this.changes
        });
    });
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
    const sql = "DELETE FROM tasks WHERE id = ?";
    const params = [req.params.id];
    
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({"error": res.message});
            return;
        }
        res.json({"message":"deleted", changes: this.changes});
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
