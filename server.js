require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();

// --- EMAIL CONFIGURATION ---
// Palitan ang mga ito ng totoong Barangay email credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// I-verify ang email connection pagka-start ng server
transporter.verify(function (error, success) {
    if (error) {
        console.log("Email Server Error: Pakisuri ang iyong App Password.", error.message);
    } else {
        console.log("Email Server is ready to send notifications.");
    }
});

const dbPath = path.join(__dirname, 'mysql.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to the database:', err.message);
    } else {
        console.log('Connected to mysql.db SQLite database.');
        db.run("PRAGMA foreign_keys = ON");
    }
});

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Request Logger for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Security: Block direct browser access to the database file
app.use('/mysql.db', (req, res) => res.status(403).send('Forbidden: Direct access to database is not allowed.'));

app.use(express.static(__dirname)); // Serve HTML files

// --- AUTHENTICATION ---
app.post('/api/register', (req, res) => {
    const { username, password, role } = req.body;
    const full_name = req.body.full_name || username; // Default if not provided

    if (!username || !password || !role) {
        return res.status(400).json({ success: false, message: "Please provide all required fields." });
    }
    
    // Step 1: Check if username already exists (case-insensitive)
    db.get("SELECT id FROM users WHERE LOWER(username) = LOWER(?)", [username], (err, row) => {
        if (err) return res.status(500).json({ success: false, message: "Server error" });
        if (row) {
            return res.status(400).json({ success: false, message: "Username is already taken." });
        }

        // Step 2: Insert as 'active' directly
        const query = `INSERT INTO users (username, password, full_name, role, status) VALUES (?, ?, ?, ?, 'active')`;
        db.run(query, [username, password, full_name, role], function(err) {
            if (err) {
                console.error('Registration Error:', err.message);
                return res.status(400).json({ success: false, message: "Invalid data provided." });
            }
            res.json({ success: true, message: "Registration successful! You can now log in." });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Find user by username AND password
    db.get(`SELECT id, username, full_name, role, status FROM users WHERE LOWER(username) = LOWER(?) AND password = ?`, 
    [username, password], (err, user) => {
        if (err || !user) return res.status(401).json({ success: false, message: "Invalid credentials" });
        res.json({ success: true, user });
    });
});

// --- USER MANAGEMENT (For CpE Admin) ---
app.get('/api/users', (req, res) => {
    db.all("SELECT username, full_name, role, status FROM users", [], (err, rows) => {
        if (err) return res.status(500).json([]);
        res.json(rows);
    });
});

app.delete('/api/users/:username', (req, res) => {
    db.run("DELETE FROM users WHERE username = ?", req.params.username, (err) => {
        res.json({ success: !err });
    });
});

app.patch('/api/users/:username/password', (req, res) => {
    db.run("UPDATE users SET password = ? WHERE username = ?", [req.body.password, req.params.username], (err) => {
        res.json({ success: !err });
    });
});

app.patch('/api/users/:username/approve', (req, res) => {
    db.run("UPDATE users SET status = 'active' WHERE username = ?", [req.params.username], (err) => {
        res.json({ success: !err });
    });
});

app.patch('/api/users/:username/role', (req, res) => {
    db.get("SELECT role FROM users WHERE username = ?", req.params.username, (err, row) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        
        if (row) {
            const newRole = row.role === 'cpe-admin' ? 'official' : 'cpe-admin';
            db.run("UPDATE users SET role = ? WHERE username = ?", [newRole, req.params.username], (updateErr) => {
                if (updateErr) return res.status(500).json({ success: false, message: "Update failed" });
                res.json({ success: true });
            });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    });
});

// --- OFFICIALS ---
app.get('/api/officials', (req, res) => {
    db.all("SELECT * FROM officials", [], (err, rows) => {
        if (err) return res.status(500).json([]);
        res.json(rows);
    });
});

app.post('/api/officials', (req, res) => {
    const { name, position, img } = req.body;
    db.run(`INSERT INTO officials (name, position, img) VALUES (?, ?, ?)`, [name, position, img], (err) => {
        res.json({ success: !err });
    });
});

app.patch('/api/officials/:id', (req, res) => {
    const { name, position, img } = req.body;
    db.run(`UPDATE officials SET name = ?, position = ?, img = COALESCE(?, img) WHERE id = ?`, [name, position, img, req.params.id], (err) => {
        res.json({ success: !err });
    });
});

app.delete('/api/officials/:id', (req, res) => {
    db.run(`DELETE FROM officials WHERE id = ?`, req.params.id, () => res.json({ success: true }));
});

// --- REQUESTS ---
app.get('/api/requests', (req, res) => {
    db.all("SELECT * FROM requests ORDER BY created_at DESC", [], (err, rows) => res.json(rows));
});

app.post('/api/requests', (req, res) => {
    const { date, name, type, purpose, contact } = req.body;
    db.run(`INSERT INTO requests (date, name, type, purpose, contact) VALUES (?, ?, ?, ?, ?)`, 
    [date, name, type, purpose, contact], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });

        // Automatically send email notification for new requests
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, 
            subject: `New Request: ${type} - ${name}`,
            text: `New request received:\n\nType: ${type}\nName: ${name}\nPurpose: ${purpose}\nContact: ${contact}\nDate: ${date}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.error("Notification Email Error:", error.message);
            else console.log("Notification Email Sent:", info.response);
        });

        res.json({ success: true });
    });
});

app.patch('/api/requests/:id', (req, res) => {
    db.run(`UPDATE requests SET status = ? WHERE id = ?`, [req.body.status, req.params.id], () => res.json({ success: true }));
});

app.delete('/api/requests/:id', (req, res) => {
    db.run(`DELETE FROM requests WHERE id = ?`, req.params.id, () => res.json({ success: true }));
});

// --- SETTINGS ---
app.get('/api/settings', (req, res) => {
    db.all("SELECT * FROM settings", [], (err, rows) => {
        const settings = {};
        rows.forEach(row => settings[row.key] = row.value);
        res.json(settings);
    });
});

app.post('/api/settings', (req, res) => {
    const data = req.body;
    const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    Object.keys(data).forEach(key => stmt.run(key, data[key]));
    stmt.finalize(() => res.json({ success: true }));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log('==============================================');
    console.log(`Barangay Sibulan Server is now ACTIVE`);
    console.log(`URL: http://localhost:${PORT}/index.html`);
    console.log(`Serving files from: ${__dirname}`);
    console.log('Keep this window open while using the site.');
    console.log('==============================================');
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`ERROR: Port ${PORT} is already in use by another program.`);
    } else {
        console.error('Server failed to start:', err);
    }
});

// Export for Vercel
module.exports = app;