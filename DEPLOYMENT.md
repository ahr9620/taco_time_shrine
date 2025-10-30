# Deployment Guide - Taco Time Digital Altar

This guide will walk you through deploying your digital altar with maximum uptime.

## 🚀 Recommended: Railway.app

Railway offers excellent uptime, automatic HTTPS, zero-config deployments, and includes PostgreSQL.

### Setup Steps:

#### 1. Create Railway Account
- Go to https://railway.app
- Sign up with GitHub (free tier includes $5/month credit)

#### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Connect your repository (or upload manually)

#### 3. Add PostgreSQL Database
- In your Railway project, click "+ New"
- Select "Database" → "Add PostgreSQL"
- Railway automatically provides connection string in `DATABASE_URL`

#### 4. Configure Environment Variables
In your Railway project settings, add:
```
NODE_ENV=production
PORT=3000
```

#### 5. Update Deployment
- Railway auto-detects your `package.json` and `server.js`
- **IMPORTANT**: Rename or backup your current `server.js` and `server-db.js` to `server.js`
- Railway will auto-deploy on every git push

#### 6. Run Database Schema
In Railway's PostgreSQL database section:
- Click "Open in TablePlus" or use the built-in query runner
- Run the SQL from `database.sql` file

#### 7. Custom Domain (Optional)
- In Railway project → Settings → "Generate Domain"
- Or add your own custom domain
- SSL/HTTPS is automatic and free

---

## 🎁 Alternative: Render.com (Free Tier Available)

### Setup Steps:

#### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub

#### 2. Create PostgreSQL Database
- Dashboard → "New" → "PostgreSQL"
- Select free tier
- Save the connection string

#### 3. Create Web Service
- Dashboard → "New" → "Web Service"
- Connect your GitHub repository
- Settings:
  - **Build Command**: `npm install`
  - **Start Command**: `node server-db.js`
  - **Environment**: `Node`

#### 4. Add Environment Variables
```
DATABASE_URL=<your-postgres-connection-string>
NODE_ENV=production
PORT=3000
```

#### 5. Deploy
- Click "Create Web Service"
- Render auto-deploys on every push

#### 6. Run Database Schema
- Use Render's built-in PostgreSQL admin or connect via psql
- Run SQL from `database.sql`

---

## 🔒 Security & Performance

### Environment Variables to Set:
```bash
DATABASE_URL=<provided-by-host>
NODE_ENV=production
PORT=3000
```

### Health Check
Both hosts support health checks:
- Add this to your deployment settings:
- **Health Check Path**: `/health`

### Scaling
For high traffic:
1. **Railway**: Auto-scales based on usage
2. **Render**: Can upgrade to higher tier
3. Consider adding Redis for session management at scale

---

## 📊 Monitoring Recommendations

### Essential:
1. **Uptime Monitoring**: UptimeRobot.com (free tier)
   - Monitor your `/health` endpoint
   - Get alerts if server goes down

2. **Error Tracking**: Sentry.io (free tier)
   - Track JavaScript and server errors

### Nice to Have:
- Log aggregation (Papertrail, LogDNA)
- Performance monitoring (New Relic, DataDog)

---

## 🛠️ Pre-Deployment Checklist

- [ ] Replace `server.js` with `server-db.js` (or merge changes)
- [ ] Run `npm install` locally to update package-lock.json
- [ ] Test database connection locally
- [ ] Add all image files (.avif files) to repository
- [ ] Update any hardcoded localhost URLs
- [ ] Test on multiple devices/browsers
- [ ] Run database schema SQL
- [ ] Set up health check endpoint
- [ ] Configure uptime monitoring
- [ ] Share your deployed URL!

---

## 🔄 Deployment Workflow

### First Time:
```bash
# 1. Commit your changes
git add .
git commit -m "Add database support"

# 2. Push to GitHub
git push origin main

# 3. Railway/Render will auto-deploy
# 4. Run database schema manually
# 5. Test your live site
```

### Updates:
```bash
# Just push to deploy!
git add .
git commit -m "Update feature X"
git push origin main
```

---

## 💰 Cost Estimate

### Railway:
- **Free tier**: $5/month credit (plenty for starting)
- **Paid**: ~$5-20/month depending on usage
- Database included in free tier

### Render:
- **Free tier**: Limited hours, spins down after inactivity
- **Paid**: $7-25/month for always-on + database

**Recommendation**: Start with Railway for better uptime and simpler setup.

---

## 🆘 Troubleshooting

### Common Issues:

**Database connection errors:**
```bash
# Check DATABASE_URL is set correctly
echo $DATABASE_URL

# Verify SSL is allowed in production
```

**Socket.IO not working:**
- Ensure WebSocket support is enabled on your hosting
- Both Railway and Render support WebSockets by default

**Static files not loading:**
- Check image paths are relative
- Verify all files are committed to git

**High memory usage:**
- Sessions are cached in-memory for speed
- At scale, consider Redis for session management

---

## 🎯 Next Steps After Deployment

1. **Test thoroughly**: Try leaving offerings from multiple devices
2. **Set up monitoring**: Configure UptimeRobot alerts
3. **Share your shrine**: Post the URL!
4. **Monitor traffic**: Watch logs for any issues
5. **Backup strategy**: Consider periodic database backups

---

## 📞 Support

If you run into issues:
- Railway support: support@railway.app
- Render support: Available in dashboard
- Check logs in your hosting dashboard

Good luck with your deployment! 🌮✨

