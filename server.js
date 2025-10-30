const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// MongoDB client
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
let mongoClient = null;
let db = null;

// In-memory cache for active sessions (for faster lookups)
const activeSessions = new Set();

// Fallback in-memory storage if no database
const offerings = new Map();
const sessions = new Set();

// JSON file storage (simple, no database needed)
const DATA_FILE = path.join(__dirname, 'offerings.json');

function loadFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(data);
      
      // Load offerings
      parsed.offerings?.forEach(off => {
        offerings.set(off.id, off);
        sessions.add(off.sessionId);
      });
      
      console.log(`Loaded ${offerings.size} offerings from file`);
    }
  } catch (err) {
    console.log('No existing data file, starting fresh');
  }
}

function saveToFile() {
  try {
    const data = {
      offerings: Array.from(offerings.values()),
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('Saved offerings to file');
  } catch (err) {
    console.error('Error saving to file:', err);
  }
}

// Load existing data on startup
loadFromFile();

// Initialize MongoDB connection
async function initDatabase() {
  console.log('MONGODB_URI present:', !!MONGODB_URI);
  if (!MONGODB_URI) {
    console.log('Running in in-memory mode (no MongoDB configured)');
    return;
  }
  
  try {
    console.log('Attempting to connect to MongoDB...');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('MongoDB client connected');
    
    // Extract database name from connection string or use default
    const urlParts = new URL(MONGODB_URI);
    const dbName = urlParts.pathname.substring(1) || 'tacotime'; // Remove leading slash, default to 'tacotime'
    db = mongoClient.db(dbName);
    console.log(`Using database: ${dbName}`);
    
    console.log('MongoDB connected successfully');
    
    // Ensure indexes
    const collection = db.collection('offerings');
    await collection.createIndex({ id: 1 }, { unique: true });
    await collection.createIndex({ sessionId: 1 }, { unique: true });
    await collection.createIndex({ timestamp: -1 });
    
    // Load active sessions from database
    try {
      const sessionsFromDb = await collection.distinct('sessionId');
      sessionsFromDb.forEach(sessionId => activeSessions.add(sessionId));
      console.log(`Loaded ${activeSessions.size} existing sessions from database`);
      
      // Load all offerings into memory
      const allOfferings = await collection.find({}).toArray();
      allOfferings.forEach(offering => {
        offerings.set(offering.id, offering);
      });
      console.log(`Loaded ${offerings.size} offerings from database`);
    } catch (queryErr) {
      console.log('Could not load existing sessions:', queryErr.message);
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', err);
    console.log('Server will use in-memory storage for now');
  }
}

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', async (req, res) => {
  if (db) {
    try {
      await db.command({ ping: 1 });
      res.status(200).json({ status: 'healthy', database: 'mongodb', timestamp: new Date().toISOString() });
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
    if (db) {
      // Database mode: check both in-memory cache and database
      if (activeSessions.has(sessionId)) {
        console.log('Session already has an offering:', sessionId);
        socket.emit('offering-error', { message: 'You have already placed an offering' });
        return;
      }
      
      // Double-check in database
      try {
        const collection = db.collection('offerings');
        const existing = await collection.findOne({ sessionId: sessionId });
        if (existing) {
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
    if (db) {
      try {
        const collection = db.collection('offerings');
        await collection.insertOne(offering);
        activeSessions.add(sessionId);
        offerings.set(offering.id, offering);
        console.log('Offering saved to MongoDB successfully');
        io.emit('new-offering', offering);
      } catch (err) {
        console.error('Error saving offering to MongoDB:', err.message);
        console.error('Full error:', err);
        socket.emit('offering-error', { message: 'Failed to save offering' });
      }
    } else {
      // In-memory storage + save to JSON file
      offerings.set(offering.id, offering);
      sessions.add(sessionId);
      console.log('Total offerings now:', offerings.size);
      
      // Save to JSON file for persistence
      saveToFile();
      
      io.emit('new-offering', offering);
    }
  });
  
  // Handle offering removal (if needed)
  socket.on('remove-offering', async (offeringId) => {
    if (db) {
      try {
        const collection = db.collection('offerings');
        const result = await collection.findOneAndDelete({ id: offeringId });
        if (result.value) {
          activeSessions.delete(result.value.sessionId);
          offerings.delete(offeringId);
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
    if (db) {
      try {
        const collection = db.collection('offerings');
        const result = await collection.find({}).sort({ timestamp: -1 }).toArray();
        socket.emit('existing-offerings', result);
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
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    if (mongoClient) {
      mongoClient.close().then(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
      }).catch(() => process.exit(0));
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
    console.log(`Database: ${db ? 'MongoDB Connected' : 'In-memory mode'}`);
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
