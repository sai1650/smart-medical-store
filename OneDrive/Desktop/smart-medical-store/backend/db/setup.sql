-- Setup script for Smart Medical Store
-- Run with: mysql -u root -p < db/setup.sql
-- Default root password is usually empty, so just press Enter when asked

-- Create database
CREATE DATABASE IF NOT EXISTS smart_medical_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_medical_store;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create medicines table
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

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  medicine_id INT NOT NULL,
  qty INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  sold_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  total_amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert users
INSERT IGNORE INTO users (username, password, role) VALUES
  ('admin', 'admin', 'admin'),
  ('staff', 'staff', 'staff');

-- Insert medicines
INSERT IGNORE INTO medicines (name, company, price, quantity, rack, shelf) VALUES
  ('Paracetamol 500mg', 'Acme Pharma', 20.00, 50, 'R1', 'S1'),
  ('Amoxicillin 250mg', 'HealthCorp', 45.00, 30, 'R1', 'S2'),
  ('Cough Syrup 100ml', 'Wellness Ltd', 90.00, 10, 'R2', 'S1'),
  ('Aspirin 500mg', 'Acme Pharma', 15.00, 25, 'R2', 'S2'),
  ('Ibuprofen 200mg', 'HealthCorp', 25.00, 40, 'R3', 'S1');

-- Create or grant permissions to nodeuser
CREATE USER IF NOT EXISTS 'nodeuser'@'localhost' IDENTIFIED BY 'node123';
GRANT ALL PRIVILEGES ON smart_medical_store.* TO 'nodeuser'@'localhost';
FLUSH PRIVILEGES;

SELECT 'Setup Complete!' as Status;
