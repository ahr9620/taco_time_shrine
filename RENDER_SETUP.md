# Deploy to Render.com (Alternative to Railway)

Since Railway is having issues, let's use Render.com instead. It has a free tier that's perfect for this project.

## Quick Setup Steps:

### 1. Create Account
- Go to https://render.com
- Sign up with GitHub (free)

### 2. Create PostgreSQL Database
- Dashboard → "New" → "PostgreSQL"
- Name it: `taco-time-db`
- Plan: Free
- Click "Create Database"
- Wait for it to provision (2-3 minutes)

### 3. Create Web Service
- Dashboard → "New" → "Web Service"
- Connect your GitHub repo: `ahr9620/taco_time_shrine`
- Settings:
  - **Name**: `taco-time-shrine`
  - **Environment**: `Node`
  - **Build Command**: `npm install`
  - **Start Command**: `node server.js`
  - **Plan**: Free
- Click "Advanced" and add environment variable:
  - **Key**: `DATABASE_URL`
  - **Value**: Copy from your PostgreSQL service (in the Render dashboard)
- Click "Create Web Service"

### 4. Deploy
- Render will automatically deploy
- Wait 5-7 minutes for first deployment
- Your site will be live at: `https://taco-time-shrine.onrender.com`

### 5. Done!
That's it! The database table will auto-create on first startup.

---

## Alternative: Use Vercel (Easiest but no PostgreSQL)

If Render also has issues, use Vercel for hosting + separate database:

1. **Deploy to Vercel**:
   - Go to https://vercel.com
   - Import your GitHub repo
   - Deploy! (takes 2 minutes)

2. **Database Options**:
   - **Supabase** (free PostgreSQL): https://supabase.com
   - **Neon** (free PostgreSQL): https://neon.tech
   - Or keep in-memory mode (data doesn't persist)

---

## What's Different from Railway?

**Railway Issues:**
- Database connection problems
- Build failures

**Render Advantages:**
- Free tier is more stable
- Simple PostgreSQL setup
- Better documentation
- Your code already works with it!

---

The app is already configured to work with any PostgreSQL provider. Just point it to a `DATABASE_URL` and it works!

