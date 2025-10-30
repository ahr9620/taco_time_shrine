# Deploy Taco Time Shrine to Render.com

## Step 1: Create Render Account (2 minutes)
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with your GitHub account
4. Authorize Render to access your repositories

## Step 2: Create Web Service (3 minutes)

1. In Render dashboard, click **"New +"** button (top right)
2. Select **"Web Service"**

3. Connect your repository:
   - Click "Connect account" or "Connect repository"
   - Select **ahr9620/taco_time_shrine**
   - Click "Connect"

4. Configure the service:
   - **Name**: `taco-time-shrine` (or any name you like)
   - **Region**: Choose closest to you (Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

5. Click **"Create Web Service"**

## Step 3: Wait for Deployment (5-7 minutes)

- Render will automatically:
  - Clone your repository
  - Install dependencies (`npm install`)
  - Start your server
  - Show you a URL like: `https://taco-time-shrine.onrender.com`

## Step 4: Test Your Site!

1. Visit the URL Render gave you
2. Try leaving an offering
3. Refresh the page - offerings should persist!

## That's it! You're live! 🎉

Your shrine is now deployed with JSON file storage. No database needed!

---

## What Storage Are You Using?

✅ **JSON File Storage** - Data persists in a file on Render's servers
- Simple and reliable
- No database connection issues
- Works on free tier
- Data survives server restarts

---

## Future: Add PostgreSQL (Optional)

If you want even better data persistence later:
1. In Render dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Connect it to your web service
4. That's it! Your code will auto-detect it

But for now, JSON files work perfectly! 🚀

---

## Troubleshooting

**"Application failed to respond"**
- Check the logs in Render dashboard
- Wait 2-3 minutes, Render's free tier is slower

**"Build failed"**
- Check that Node.js version is set (the .node-version file should auto-detect it)

**Data not persisting**
- Make sure the site has been up for a bit (Render spins down free tier after inactivity)
- Try leaving a new offering

---

## Your Live URL

Once deployed, you'll get a URL like:
**https://taco-time-shrine.onrender.com**

Share this with friends! 🌮✨

