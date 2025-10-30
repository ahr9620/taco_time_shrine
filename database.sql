-- Database schema for Taco Time Digital Altar
-- Run this SQL in your PostgreSQL database

CREATE TABLE IF NOT EXISTS offerings (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    x DECIMAL(10, 2) NOT NULL,
    y DECIMAL(10, 2) NOT NULL,
    visitor_name VARCHAR(255) NOT NULL,
    age VARCHAR(50),
    location VARCHAR(255),
    message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_id ON offerings(session_id);
CREATE INDEX IF NOT EXISTS idx_timestamp ON offerings(timestamp);

-- This ensures each session can only place one offering
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_session ON offerings(session_id);

