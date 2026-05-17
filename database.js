const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            date TEXT,
            priority TEXT DEFAULT 'Medium',
            section TEXT DEFAULT 'Daily',
            completed INTEGER DEFAULT 0
        )`, (err) => {
            if (err) {
                console.error('Error creating tasks table:', err.message);
            }
        });
    }
});

module.exports = db;
