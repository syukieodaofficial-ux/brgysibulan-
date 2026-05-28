const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'mysql.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// Create and connect to the database file
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to the mysql.db database.');
});

// Read the schema file and execute it
const schema = fs.readFileSync(schemaPath, 'utf8');

db.serialize(() => {
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error initializing schema:', err.message);
        } else {
            console.log('Database tables created successfully.');
            
            // Insert default accounts for initial login
            const insertUser = 'INSERT OR IGNORE INTO users (username, password, full_name, role, status) VALUES (?, ?, ?, ?, ?)';
            
            // Default Official Account
            db.run(insertUser, ['admin', 'admin123', 'Barangay Official', 'official', 'active']);
            
            // Default CpE Admin Account
            db.run(insertUser, ['cpe_admin', 'cpe123', 'CpE Administrator', 'cpe-admin', 'active'], (err) => {
                if (err) {
                    console.error('Error inserting default users:', err.message);
                } else {
                    console.log('Default accounts created:');
                    console.log('- Official: admin / admin123');
                    console.log('- CpE: cpe_admin / cpe123');
                }
            });
        }
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database initialization complete.');
    }
});