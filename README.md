# Taco Time Digital Altar 🎉

A real-time collaborative digital altar where visitors can leave offerings in memory of Taco Time NW in Gig Harbor, WA.

## Features

- ✨ Real-time offerings visible to all visitors
- 📸 Multiple offering types with beautiful AVIF images
- 💬 Personal messages, prayers, and memories
- 🎨 Beautiful medieval-themed UI
- 📱 Fully responsive design
- 🗄️ MongoDB integration for persistent storage

## Tech Stack

- **Backend**: Node.js + Express
- **Real-time**: Socket.IO
- **Database**: MongoDB Atlas (with fallback to JSON storage)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Images**: AVIF format for optimal performance

## Setup

### Environment Variables

Create a `.env` file or set these in your hosting environment:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tacotime?retryWrites=true&w=majority&appName=Cluster0
```

### Installation

```bash
npm install
npm start
```

The server will run on port 3000 by default, or the PORT specified in your environment.

## Deployment

This app is designed to run on [Render.com](https://render.com) with MongoDB Atlas.

### Render Setup

1. Create a new Web Service
2. Connect your GitHub repository
3. Set environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
4. Build command: `npm install`
5. Start command: `node server.js`

### MongoDB Atlas Setup

1. Create a cluster on [MongoDB Atlas](https://cloud.mongodb.com/)
2. Add your IP address to Network Access (or use 0.0.0.0/0 for testing)
3. Create a database user
4. Get your connection string from the "Connect" button

See `MONGODB_SETUP.md` for detailed instructions.

## Health Check

Visit `/health` to check if MongoDB is connected:
- `{"status":"healthy","database":"mongodb"}` - MongoDB connected
- `{"status":"healthy (in-memory)"}` - Using JSON fallback

## Project Structure

```
taco time shrine/
├── server.js          # Express + Socket.IO server
├── index.html         # Main page
├── style.css          # Styling
├── script.js          # Client-side logic
├── package.json       # Dependencies
├── offerings.json     # Fallback storage (auto-generated)
└── altar-TT.png       # Background image
```

## License

MIT
