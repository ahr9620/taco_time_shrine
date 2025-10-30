const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
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
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// In-memory cache for active sessions (for faster lookups)
const activeSessions = new Set();

// Initialize database connection
async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
    
    // Load active sessions from database
    const result = await pool.query('SELECT DISTINCT session_id FROM offerings');
    result.rows.forEach(row => activeSessions.add(row.session_id));
    console.log(`Loaded ${activeSessions.size} existing sessions from database`);
  } catch (err) {
    console.error('Database connection error:', err);
    // In production, you might want to exit here or use a fallback
  }
}

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
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
  pool.query('SELECT * FROM offerings ORDER BY timestamp DESC')
    .then(result => {
      socket.emit('existing-offerings', result.rows);
    })
    .catch(err => {
      console.error('Error fetching offerings:', err);
      socket.emit('existing-offerings', []);
    });
  
  // Handle new offering placement
  socket.on('place-offering', async (offeringData) => {
    console.log('Received offering data:', offeringData);
    const sessionId = offeringData.sessionId;
    
    // Check if this session has already placed an offering (in-memory check for speed)
    if (activeSessions.has(sessionId)) {
      console.log('Session already has an offering:', sessionId);
      socket.emit('offering-error', { message: 'You have already placed an offering' });
      return;
    }
    
    // Double-check in database (race condition protection)
    try {
      const existing = await pool.query('SELECT id FROM offerings WHERE session_id = $1', [sessionId]);
      if (existing.rows.length > 0) {
        console.log('Session already has offering in database:', sessionId);
        activeSessions.add(sessionId); // Sync cache
        socket.emit('offering-error', { message: 'You have already placed an offering' });
        return;
      }
    } catch (err) {
      console.error('Error checking existing offering:', err);
      socket.emit('offering-error', { message: 'Database error' });
      return;
    }
    
    // Create offering object
    const offering = {
      id: uuidv4(),
      session_id: sessionId,
      image: offeringData.image || 'bowl.avif',
      name: offeringData.name || 'Offering',
      x: offeringData.x,
      y: offeringData.y,
      visitor_name: offeringData.visitorName || 'Anonymous',
      age: offeringData.age || '',
      location: offeringData.location || '',
      message: offeringData.message || '',
      timestamp: new Date().toISOString()
    };
    
    console.log('Created offering object:', offering);
    
    // Insert into database
    try {
      await pool.query(
        `INSERT INTO offerings (id, session_id, image, name, x, y, visitor_name, age, location, message, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [offering.id, offering.session_id, offering.image, offering.name, offering.x, offering.y,
         offering.visitor_name, offering.age, offering.location, offering.message, offering.timestamp]
      );
      
      // Add to in-memory cache
      activeSessions.add(sessionId);
      
      console.log('Offering saved to database. Total offerings:', (await pool.query('SELECT COUNT(*) FROM offerings')).rows[0].count);
      
      // Broadcast to all clients
      io.emit('new-offering', offering);
    } catch (err) {
      console.error('Error saving offering:', err);
      socket.emit('offering-error', { message: 'Failed to save offering' });
    }
  });
  
  // Handle offering removal (if needed)
  socket.on('remove-offering', async (offeringId) => {
    try {
      const result = await pool.query('DELETE FROM offerings WHERE id = $1 RETURNING session_id', [offeringId]);
      if (result.rows.length > 0) {
        activeSessions.delete(result.rows[0].session_id);
        io.emit('offering-removed', offeringId);
      }
    } catch (err) {
      console.error('Error removing offering:', err);
    }
  });
  
  // Handle get-offerings request
  socket.on('get-offerings', async () => {
    try {
      const result = await pool.query('SELECT * FROM offerings ORDER BY timestamp DESC');
      socket.emit('existing-offerings', result.rows);
    } catch (err) {
      console.error('Error fetching offerings:', err);
      socket.emit('existing-offerings', []);
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
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

// Initialize and start server
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Taco Time Shrine server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});

