# 🚀 Deployment Checklist - The V App

**Estimated Time:** 30 minutes  
**Status:** Ready to Deploy  
**Last Updated:** Production Build Complete

---

## ✅ Pre-Deployment Verification

- [x] Git repository initialized
- [x] All 3 main pages wired to API (HomePageView, CreatePostPage, UserProfile)
- [x] 12 custom hooks created and tested
- [x] Backend API fully implemented (50+ endpoints)
- [x] Database schema with migrations ready
- [x] Environment configuration templates created
- [x] All production dependencies installed
- [x] Code committed to git (master branch)

---

## 🔧 Step 1: Create GitHub Repository (5 minutes)

### 1.1 Create Repository on GitHub
1. Go to https://github.com/new
2. **Repository name:** `the-v-app`
3. **Description:** Social media platform with real-time features
4. **Visibility:** Public
5. Click **Create Repository**

### 1.2 Push Local Code to GitHub
```powershell
cd "c:\Users\shame\Downloads\THE V"

# Add your GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/the-v-app.git

# Rename branch if needed (GitHub defaults to 'main')
git branch -M main

# Push code
git push -u origin main
```

**Verify:** Visit `https://github.com/YOUR_USERNAME/the-v-app` and confirm all files appear.

---

## ⚡ Step 2: Deploy Backend to Railway.app (10 minutes)

### 2.1 Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (recommended)
3. Authorize Railway to access your GitHub account

### 2.2 Create New Project
1. Click **+ New Project**
2. Select **Deploy from GitHub**
3. Select your repository: `the-v-app`
4. Select `server` directory as root

### 2.3 Configure PostgreSQL Database
1. Click **+ Add Plugin**
2. Search for and select **PostgreSQL**
3. Click **Create**
4. Railway automatically provisions database

### 2.4 Set Environment Variables

Environment variables → Edit variables on Railway:

```env
# Database (auto-populated by Railway)
DATABASE_URL=your_database_url_here

# Auth
JWT_SECRET=your_very_secure_jwt_secret_key_min_32_chars

# CORS
CORS_ORIGIN=https://the-v-app.vercel.app

# Deployment
NODE_ENV=production
FORCE_HTTPS=true
PORT=3003
```

### 2.5 Deploy
1. Railway auto-detects `server/` as Node.js service
2. Builds and deploys automatically
3. **Note the deployment URL** (e.g., `https://the-v-app-backend.up.railway.app`)
4. Wait for "✅ Deployment successful"

---

## 🌐 Step 3: Deploy Frontend to Vercel (10 minutes)

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### 3.2 Import Project
1. Click **Add New** → **Project**
2. **Import Git Repository**
3. Select: `the-v-app`
4. Click **Import**

### 3.3 Configure Project

**Framework:** Vite  
**Root Directory:** ./  
**Build Command:** `npm run build`  
**Output Directory:** `dist`

### 3.4 Set Environment Variables

In **Settings** → **Environment Variables**, add:

```env
VITE_API_BASE_URL=https://the-v-app-backend.up.railway.app/api/v1
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_KEY=your_supabase_anon_key_here
VITE_JWT_STORAGE_KEY=auth_token
```

**Get Supabase credentials:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy **URL** and **anon key**

### 3.5 Deploy
1. Click **Deploy**
2. Vercel builds and deploys frontend
3. **Note the deployment URL** (e.g., `https://the-v-app.vercel.app`)
4. Wait for "✅ Production"

---

## 📱 Step 4: Test Deployment

### 4.1 Test Frontend
```
URL: https://the-v-app.vercel.app
- Load home page → verify no blank state
- Create account → should work
- Create post → should save to API
- View profile → should load from API
```

### 4.2 Test Backend API
```
# Get trending hashtags
curl https://the-v-app-backend.up.railway.app/api/v1/hashtags/trending?limit=20

# Search hashtags
curl https://the-v-app-backend.up.railway.app/api/v1/hashtags/search?q=tech&limit=20

# Create post (with auth token)
curl -X POST https://the-v-app-backend.up.railway.app/api/v1/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"caption":"Test post","visibility":"public"}'
```

### 4.3 Test Real-time Features
- Open two browser tabs (same app)
- Create a post in tab 1
- Verify it appears in tab 2 (within seconds)
- Test messaging between users

---

## 🔐 Step 5: Security Checklist

- [ ] CORS origin updated to `https://the-v-app.vercel.app`
- [ ] JWT_SECRET is strong (32+ characters, random)
- [ ] Database backups enabled in Railway
- [ ] HTTPS enforced (should be automatic)
- [ ] Environment variables not in code
- [ ] API rate limiting active (enabled in code)
- [ ] SQL injection prevention (Prisma prevents this)
- [ ] CSRF protection ready (Express middleware configured)

---

## 📊 Step 6: Monitor & Scale

### 6.1 Railway Dashboard
- CPU & Memory usage
- Database connections
- Network I/O
- Logs → check for errors

### 6.2 Vercel Dashboard
- Page performance
- Build times
- Errors & exception tracking

### 6.3 Alerts to Set Up
- [ ] High error rates (>5% of requests)
- [ ] Database connections near limit
- [ ] API response time > 1 second
- [ ] Build failures

---

## 🆘 Troubleshooting

### Issue: API calls fail with 404
**Solution:**
1. Check `VITE_API_BASE_URL` in Vercel environment
2. Verify Railway backend URL is correct
3. Check `/api/v1/posts` endpoint exists in `server/src/routes/`

### Issue: Database connection errors
**Solution:**
1. Check `DATABASE_URL` in Railway environment
2. Verify PostgreSQL plugin is active
3. Run migrations: `npx prisma migrate deploy`

### Issue: CORS errors in browser console
**Solution:**
1. Update `CORS_ORIGIN` in Railway to match Vercel frontend URL
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart Railway deployment

### Issue: Static files 404
**Solution:**
1. Verify build output in Vercel logs
2. Check `dist/` folder contains files
3. Ensure Vite build is set as output directory

---

## 📈 Next Steps After Deployment

1. **Add Custom Domain**
   - Vercel: Settings → Domains → Add custom domain
   - Point DNS records as instructed

2. **Enable Analytics**
   - Enable Vercel Web Analytics
   - Or integrate Sentry (error tracking)

3. **Database Backups**
   - Railway: Settings → Backups → Enable daily backups

4. **Monitor Performance**
   - Watch real-time metrics on Railroad & Vercel dashboards
   - Set up uptime monitoring (Uptimerobot.com)

5. **Add More Users**
   - Share deployment link: `https://the-v-app.vercel.app`
   - Collect feedback on features
   - Iterate and push updates

---

## 🎉 Deployment Complete!

Your app is now **live in production** with:
- ✅ Real-time database (PostgreSQL)
- ✅ Real-time messaging (Socket.io)
- ✅ Image uploads & processing
- ✅ Hashtag search & trending
- ✅ JWT authentication
- ✅ Auto-deployed CI/CD pipeline

**Production URL:** `https://the-v-app.vercel.app`  
**API URL:** `https://the-v-app-backend.up.railway.app/api/v1`

---

## 📝 Quick Reference

| Component | Service | Status |
|-----------|---------|--------|
| Frontend | Vercel | ✅ Deployed |
| Backend API | Railway | ✅ Deployed |
| Database | Railway PostgreSQL | ✅ Running |
| Auth | JWT + Bcrypt | ✅ Active |
| Real-time | Socket.io | ✅ Connected |
| Hashtags | API + React Hooks | ✅ Working |
| File Uploads | Sharp + S3-ready | ✅ Configured |

