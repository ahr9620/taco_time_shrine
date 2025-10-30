const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Require pg
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Database connection pool
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}) : null;

// In-memory cache for active sessions (for faster lookups)
const activeSessions = new Set();

// Fallback in-memory storage if no database
const offerings = new Map();
const sessions = new Set();

// Initialize database connection
async function initDatabase() {
  if (!pool) {
    console.log('Running in in-memory mode (no database configured)');
    return;
  }
  
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    
    // Create table if it doesn't exist
    await client.query(`
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
      )
    `);
    
    // Create indexes if they don't exist
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_session_id ON offerings(session_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_timestamp ON offerings(timestamp)');
      await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_session ON offerings(session_id)');
      console.log('Database table and indexes created/verified');
    } catch (idxErr) {
      console.log('Index creation skipped (might already exist):', idxErr.message);
    }
    
    client.release();
    
    // Load active sessions from database
    try {
      const result = await pool.query('SELECT DISTINCT session_id FROM offerings');
      result.rows.forEach(row => activeSessions.add(row.session_id));
      console.log(`Loaded ${activeSessions.size} existing sessions from database`);
    } catch (queryErr) {
      console.log('Could not load existing sessions:', queryErr.message);
    }
  } catch (err) {
    console.error('Database connection error:', err.message);
    console.log('Server will use in-memory storage for now');
    // Don't prevent server from starting
  }
}

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', async (req, res) => {
  if (pool) {
    try {
      await pool.query('SELECT 1');
      res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ status: 'unhealthy', error: err.message });
    }
  } else {
    res.status(200).json({ status: 'healthy (in-memory)', timestamp: new Date().toISOString() });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New visitor connected:', socket.id);
  
  // Send existing offerings to new visitor
  if (pool) {
    pool.query('SELECT * FROM offerings ORDER BY timestamp DESC')
      .then(result => {
        socket.emit('existing-offerings', result.rows);
      })
      .catch(err => {
        console.error('Error fetching offerings:', err);
        socket.emit('existing-offerings', Array.from(offerings.values()));
      });
  } else {
    socket.emit('existing-offerings', Array.from(offerings.values()));
  }
  
  // Handle new offering placement
  socket.on('place-offering', async (offeringData) => {
    console.log('Received offering data:', offeringData);
    const sessionId = offeringData.sessionId;
    
    // Check if this session has already placed an offering
    if (pool) {
      // Database mode: check both in-memory cache and database
      if (activeSessions.has(sessionId)) {
        console.log('Session already has an offering:', sessionId);
        socket.emit('offering-error', { message: 'You have already placed an offering' });
        return;
      }
      
      // Double-check in database
      try {
        const existing = await pool.query('SELECT id FROM offerings WHERE session_id = $1', [sessionId]);
        if (existing.rows.length > 0) {
          console.log('Session already has offering in database:', sessionId);
          activeSessions.add(sessionId);
          socket.emit('offering-error', { message: 'You have already placed an offering' });
          return;
        }
      } catch (err) {
        console.error('Error checking existing offering:', err);
      }
    } else {
      // In-memory mode
      if (sessions.has(sessionId)) {
        console.log('Session already has an offering:', sessionId);
        socket.emit('offering-error', { message: 'You have already placed an offering' });
        return;
      }
    }
    
    // Create offering object
    const offering = {
      id: uuidv4(),
      sessionId: sessionId,
      image: offeringData.image || 'bowl.avif',
      name: offeringData.name || 'Offering',
      x: offeringData.x,
      y: offeringData.y,
      visitorName: offeringData.visitorName || 'Anonymous',
      age: offeringData.age || '',
      location: offeringData.location || '',
      message: offeringData.message || '',
      timestamp: new Date().toISOString()
    };
    
    console.log('Created offering object:', offering);
    
    // Store offering
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO offerings (id, session_id, image, name, x, y, visitor_name, age, location, message, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [offering.id, offering.sessionId, offering.image, offering.name, offering.x, offering.y,
           offering.visitorName, offering.age, offering.location, offering.message, offering.timestamp]
        );
        activeSessions.add(sessionId);
        console.log('Offering saved to database');
        io.emit('new-offering', offering);
      } catch (err) {
        console.error('Error saving offering:', err);
        socket.emit('offering-error', { message: 'Failed to save offering' });
      }
    } else {
      // In-memory storage
      offerings.set(offering.id, offering);
      sessions.add(sessionId);
      console.log('Total offerings now:', offerings.size);
      io.emit('new-offering', offering);
    }
  });
  
  // Handle offering removal (if needed)
  socket.on('remove-offering', async (offeringId) => {
    if (pool) {
      try {
        const result = await pool.query('DELETE FROM offerings WHERE id = $1 RETURNING session_id', [offeringId]);
        if (result.rows.length > 0) {
          activeSessions.delete(result.rows[0].session_id);
          io.emit('offering-removed', offeringId);
        }
      } catch (err) {
        console.error('Error removing offering:', err);
      }
    } else {
      if (offerings.has(offeringId)) {
        const offering = offerings.get(offeringId);
        offerings.delete(offeringId);
        sessions.delete(offering.sessionId);
        io.emit('offering-removed', offeringId);
      }
    }
  });
  
  // Handle get-offerings request
  socket.on('get-offerings', async () => {
    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM offerings ORDER BY timestamp DESC');
        socket.emit('existing-offerings', result.rows);
      } catch (err) {
        console.error('Error fetching offerings:', err);
        socket.emit('existing-offerings', Array.from(offerings.values()));
      }
    } else {
      socket.emit('existing-offerings', Array.from(offerings.values()));
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Visitor disconnected:', socket.id);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    if (pool) {
      pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});

// Initialize and start server
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Taco Time Shrine server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${pool ? 'Connected' : 'In-memory mode'}`);
  });
}).catch(err => {
  console.error('Failed to initialize database, starting in-memory mode:', err);
  // Start anyway in in-memory mode
  server.listen(PORT, () => {
    console.log(`Taco Time Shrine server running in in-memory mode on http://localhost:${PORT}`);
  });
});

// Catch unhandled errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
