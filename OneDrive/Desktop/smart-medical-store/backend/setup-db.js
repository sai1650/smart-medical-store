const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: "root",  // Use root to create the database and user
  password: "",  // Default MySQL root has no password on Windows
});

db.connect(err => {
  if (err) {
    console.log("❌ MySQL Connection Error:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL");
  setupDatabase();
});

function setupDatabase() {
  // Create database
  db.query("CREATE DATABASE IF NOT EXISTS smart_medical_store", (err) => {
    if (err) {
      console.log("❌ Error creating database:", err.message);
      process.exit(1);
    }
    console.log("✅ Database created");
    
    // Connect to the new database
    db.changeUser({ database: 'smart_medical_store' }, (err) => {
      if (err) {
        console.log("❌ Error switching database:", err.message);
        process.exit(1);
      }
      console.log("✅ Connected to smart_medical_store");
      createTables();
    });
  });
}

function createTables() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'staff',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `;

  const createMedicinesTable = `
    CREATE TABLE IF NOT EXISTS medicines (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      quantity INT NOT NULL DEFAULT 0,
      rack VARCHAR(50),
      shelf VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX(name),
      INDEX(company)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `;

  const createSalesTable = `
    CREATE TABLE IF NOT EXISTS sales (
      id INT PRIMARY KEY AUTO_INCREMENT,
      medicine_id INT NOT NULL,
      qty INT NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      sold_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `;

  db.query(createUsersTable, (err) => {
    if (err) console.log("Error creating users table:", err.message);
    else console.log("✅ Users table created");
  });

  db.query(createMedicinesTable, (err) => {
    if (err) console.log("Error creating medicines table:", err.message);
    else console.log("✅ Medicines table created");
  });

  db.query(createSalesTable, (err) => {
    if (err) console.log("Error creating sales table:", err.message);
    else console.log("✅ Sales table created");
    
    // Now insert data
    setTimeout(() => insertData(), 500);
  });
}

function insertData() {
  // Insert users
  db.query("INSERT IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
    ["admin", "admin", "admin"], (err) => {
      if (err) console.log("Error inserting admin:", err.message);
      else console.log("✅ Admin user created");
    });

  db.query("INSERT IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
    ["staff", "staff", "staff"], (err) => {
      if (err) console.log("Error inserting staff:", err.message);
      else console.log("✅ Staff user created");
    });

  // Insert medicines
  const medicines = [
    ["Paracetamol 500mg", "Acme Pharma", 20.00, 50, "R1", "S1"],
    ["Amoxicillin 250mg", "HealthCorp", 45.00, 30, "R1", "S2"],
    ["Cough Syrup 100ml", "Wellness Ltd", 90.00, 10, "R2", "S1"],
    ["Aspirin 500mg", "Acme Pharma", 15.00, 25, "R2", "S2"],
    ["Ibuprofen 200mg", "HealthCorp", 25.00, 40, "R3", "S1"]
  ];

  medicines.forEach((med, index) => {
    db.query("INSERT IGNORE INTO medicines (name, company, price, quantity, rack, shelf) VALUES (?, ?, ?, ?, ?, ?)",
      med, (err) => {
        if (err) console.log(`Error inserting ${med[0]}:`, err.message);
        else console.log(`✅ ${med[0]} added`);
        
        if (index === medicines.length - 1) {
          setTimeout(() => {
            createNodeUser();
          }, 500);
        }
      });
  });
}

function createNodeUser() {
  db.query("CREATE USER IF NOT EXISTS 'nodeuser'@'localhost' IDENTIFIED BY 'node123'", (err) => {
    if (err && err.message.indexOf("exists") === -1) {
      console.log("Note on nodeuser:", err.message);
    } else {
      console.log("✅ nodeuser created/verified");
    }
    
    db.query("GRANT ALL PRIVILEGES ON smart_medical_store.* TO 'nodeuser'@'localhost'", (err) => {
      if (err) console.log("Error granting privileges:", err.message);
      else console.log("✅ Permissions granted to nodeuser");
      
      db.query("FLUSH PRIVILEGES", (err) => {
        if (err) console.log("Error flushing privileges:", err.message);
        else console.log("✅ Privileges flushed");
        
        console.log("\n✅ Setup Complete!\n");
        console.log("Login Credentials:");
        console.log("  Admin - username: admin, password: admin");
        console.log("  Staff - username: staff, password: staff");
        console.log("\nYou can now start the server with: npm start");
        
        db.end();
      });
    });
  });
}
