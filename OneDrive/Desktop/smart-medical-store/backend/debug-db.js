const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) return console.error('DB connect error:', err.message);
  console.log('DB connected');
  db.query('SELECT id, username, password, role FROM users LIMIT 20', (err, rows) => {
    if (err) return console.error('Query error:', err.message);
    console.table(rows);
    db.end();
  });
});