Database initialization instructions
===============================

1) Set up credentials

 - Ensure you have MySQL/MariaDB installed and a user with CREATE privileges.
 - Update your `.env` file in the project root (or set env vars) to match the DB user:

  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=your_password
  DB_NAME=smart_medical_store

2) Create the database and tables

Run (replace user if needed):

```bash
mysql -u root -p < db/schema.sql
```

Or open `db/schema.sql` in a GUI client (MySQL Workbench, phpMyAdmin) and execute it.

3) Configure the app

 - Ensure `DB_*` variables in `.env` match the DB you created.
 - Start the server:

```bash
node server.js
```

4) Notes & next steps

 - The seed admin user is `admin` with password `admin` (plaintext). For security, replace this immediately or enable password hashing (recommended).
 - If you want the sales chart to show real weekly aggregates, I can add an endpoint that groups `sales` by day and returns `weeklySales`/`weeklyLabels`.
