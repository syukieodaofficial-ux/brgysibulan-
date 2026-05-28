-- Database Schema for Barangay Sibulan

-- Users table for Officials and CpE Admin logins
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('official', 'cpe-admin')) NOT NULL,
    status TEXT CHECK(status IN ('pending', 'active')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Barangay Officials table (for the list of officials displayed on the public site)
CREATE TABLE IF NOT EXISTS officials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    img TEXT, -- Stores Base64 image data or file path
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Certificate Requests table
CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    purpose TEXT NOT NULL,
    contact TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Site Settings table (for footer contact info)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);