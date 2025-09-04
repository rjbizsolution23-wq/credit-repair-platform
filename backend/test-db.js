const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'credit_repair_platform.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to SQLite database');
});

// Check if users table exists
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='users';", (err, rows) => {
  if (err) {
    console.error('Error checking users table:', err);
  } else {
    console.log('Users table exists:', rows.length > 0);
    if (rows.length > 0) {
      // Get table schema
      db.all("PRAGMA table_info(users);", (err, schema) => {
        if (err) {
          console.error('Error getting table schema:', err);
        } else {
          console.log('Users table schema:', schema);
        }
        db.close();
      });
    } else {
      db.close();
    }
  }
});