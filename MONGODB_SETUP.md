# MongoDB Setup for Taco Time Shrine

## Environment Variable Setup

You need to set the `MONGODB_URI` environment variable in your deployment platform.

### Your MongoDB Connection String:
```
mongodb+srv://ashhreeder_db_user:PhskKI5UzEXtNAJ7@cluster0.ke5ddrl.mongodb.net/?appName=Cluster0
```

## Render.com Setup

1. **Add Environment Variable**:
   - Go to your Render Dashboard
   - Select your Web Service
   - Go to "Environment" tab
   - Add a new environment variable:
     - Key: `MONGODB_URI`
     - Value: `mongodb+srv://ashhreeder_db_user:PhskKI5UzEXtNAJ7@cluster0.ke5ddrl.mongodb.net/?appName=Cluster0`
   - Save changes

2. **Deploy**:
   - Render will automatically redeploy when you push to GitHub
   - Or manually trigger a deploy from the dashboard

## MongoDB Atlas IP Whitelist

For MongoDB Atlas to accept connections:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click "Network Access" in the left sidebar
3. Click "Add IP Address"
4. Add `0.0.0.0/0` to allow all IPs (for development/testing)
   - Or add specific Render IP addresses for production

## Database Collections

The application will automatically create a collection called `offerings` with the following structure:

```javascript
{
  id: String,              // Unique offering ID
  sessionId: String,       // Unique session ID (indexed, unique)
  image: String,           // AVIF image filename
  name: String,            // Offering type name
  x: Number,               // X position on altar
  y: Number,               // Y position on altar
  visitorName: String,     // Visitor's name
  age: String,             // Visitor's age
  location: String,        // Visitor's location
  message: String,         // Visitor's message
  timestamp: String        // ISO timestamp
}
```

## Fallback to JSON Storage

If MongoDB is not configured, the application will automatically:
- Use in-memory storage
- Fall back to `offerings.json` file for persistence
- No manual configuration needed

