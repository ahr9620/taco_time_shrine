const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Store offerings in memory (in production, use a database)
const offerings = new Map();
const sessions = new Set();

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New visitor connected:', socket.id);
  
  // Send existing offerings to new visitor
  socket.emit('existing-offerings', Array.from(offerings.values()));
  
  // Handle new offering placement
  socket.on('place-offering', (offeringData) => {
    console.log('Received offering data:', offeringData);
    console.log('Image received:', offeringData.image);
    console.log('Name received:', offeringData.name);
    const sessionId = offeringData.sessionId;
    
    // Check if this session has already placed an offering
    if (sessions.has(sessionId)) {
      console.log('Session already has an offering:', sessionId);
      socket.emit('offering-error', { message: 'You have already placed an offering' });
      return;
    }
    
    // Create offering object
    const offering = {
      id: uuidv4(),
      sessionId: sessionId,
      image: offeringData.image || 'bowl.avif', // Ensure image field exists
      name: offeringData.name || 'Offering',
      x: offeringData.x,
      y: offeringData.y,
      visitorName: offeringData.visitorName,
      age: offeringData.age,
      location: offeringData.location,
      message: offeringData.message,
      timestamp: new Date().toISOString()
    };
    
    console.log('Created offering object:', offering);
    console.log('Offering image field:', offering.image);
    
    // Store offering
    offerings.set(offering.id, offering);
    sessions.add(sessionId);
    
    console.log('Total offerings now:', offerings.size);
    console.log('Total sessions:', sessions.size);
    console.log('New offering placed:', offering);
    
    // Broadcast to all clients
    console.log('Broadcasting offering with image:', offering.image);
    io.emit('new-offering', offering);
  });
  
  // Handle offering removal (if needed)
  socket.on('remove-offering', (offeringId) => {
    if (offerings.has(offeringId)) {
      const offering = offerings.get(offeringId);
      offerings.delete(offeringId);
      sessions.delete(offering.sessionId);
      io.emit('offering-removed', offeringId);
    }
  });
  
  // Handle get-offerings request
  socket.on('get-offerings', () => {
    socket.emit('existing-offerings', Array.from(offerings.values()));
  });
  
  socket.on('disconnect', () => {
    console.log('Visitor disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Taco Time Shrine server running on http://localhost:${PORT}`);
});
