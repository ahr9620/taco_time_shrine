# Taco Time Shrine - Digital Altar

A real-time digital altar where visitors can leave offerings (emojis) with their personal messages. Built with Node.js, Express, and Socket.IO for real-time communication.

## Features

- 🌯 **Multiple Offering Types**: Choose from burrito, candle, taco, prayer hands, dove, or flower emojis
- 🎯 **Click to Place**: Click anywhere on the altar background to place your offering
- 👤 **Personal Information**: Each offering includes name, age, location, and a personal message
- 🔄 **Real-time Updates**: See all offerings from other visitors in real-time
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🚫 **One Offering Per Session**: Each visitor can only place one offering per session
- 💬 **Interactive Popups**: Click on any offering to see the visitor's information

## Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and go to:
```
http://localhost:3000
```

## How to Use

1. **Select an Emoji**: Click on one of the emoji buttons in the top-left panel
2. **Place Your Offering**: Click anywhere on the altar background image
3. **Fill Out the Form**: Enter your name, age, location, and optional message
4. **Submit**: Click "Place Offering" to add your offering to the altar
5. **View Others' Offerings**: Click on any emoji on the altar to see the visitor's information

## Technical Details

- **Backend**: Node.js with Express and Socket.IO
- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Real-time Communication**: Socket.IO for live updates
- **Session Management**: Each visitor gets a unique session ID
- **Data Storage**: In-memory storage (offerings reset when server restarts)

## File Structure

```
taco-time-shrine/
├── server.js          # Node.js server with Socket.IO
├── index.html         # Main HTML page
├── style.css          # CSS styling
├── script.js          # Client-side JavaScript
├── package.json       # Node.js dependencies
├── altar-TT.png       # Background image
└── README.md          # This file
```

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## Customization

- **Background Image**: Replace `altar-TT.png` with your own image
- **Emoji Options**: Modify the emoji buttons in `index.html`
- **Styling**: Update `style.css` to change colors, fonts, and layout
- **Port**: Change the PORT variable in `server.js` to use a different port

Enjoy your digital altar! 🙏
