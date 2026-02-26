-- Schema for Smart Medical Store
-- Run with: mysql -u root -p < db/schema.sql

CREATE DATABASE IF NOT EXISTS smart_medical_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE smart_medical_store;

-- Users table (staff and admin)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Medicines table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sales table (records of bills / sold items)
CREATE TABLE IF NOT EXISTS sales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  medicine_id INT NOT NULL,
  qty INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  sold_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional: simple bills table linking multiple sale rows (if needed)
CREATE TABLE IF NOT EXISTS bills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  total_amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed: create a default admin user (change password after first login)
INSERT IGNORE INTO users (username, password, role) VALUES
  ('admin', 'admin', 'admin');

-- Seed: a few medicines for testing
INSERT IGNORE INTO medicines (name, company, price, quantity, rack, shelf) VALUES
  ('Paracetamol 500mg', 'Acme Pharma', 20.00, 50, 'R1', 'S1'),
  ('Amoxicillin 250mg', 'HealthCorp', 45.00, 30, 'R1', 'S2'),
  ('Cough Syrup 100ml', 'Wellness Ltd', 90.00, 10, 'R2', 'S1');

-- Example: optional weekly sales data for development testing
-- (Admins can remove or replace this with live aggregated data)
INSERT IGNORE INTO sales (medicine_id, qty, total) VALUES
  (1, 5, 100.00),
  (2, 3, 135.00),
  (1, 2, 40.00);

-- End of schema
