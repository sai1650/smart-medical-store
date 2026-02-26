const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.log("❌ MySQL Connection Error:", err);
    process.exit(1);
  }
  console.log("✅ MySQL Connected");
  createUsers();
});

function createUsers() {
  // Create admin user
  db.query(
    "INSERT IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
    ["admin", "admin", "admin"],
    (err) => {
      if (err) {
        console.log("❌ Error creating admin:", err);
      } else {
        console.log("✅ Admin user created (username: admin, password: admin)");
      }
    }
  );

  // Create staff user
  db.query(
    "INSERT IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
    ["staff", "staff", "staff"],
    (err) => {
      if (err) {
        console.log("❌ Error creating staff:", err);
      } else {
        console.log("✅ Staff user created (username: staff, password: staff)");
      }
      
      // Close connection after both inserts
      setTimeout(() => {
        db.end();
        console.log("\n✅ Setup complete!");
      }, 500);
    }
  );
}
