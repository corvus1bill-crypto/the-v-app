# ⚡ Quick Deployment (TL;DR)

**30 minutes to production**

---

## 1️⃣ Push to GitHub (2 min)

```powershell
cd "c:\Users\shame\Downloads\THE V"
git remote add origin https://github.com/YOUR_USERNAME/the-v-app.git
git branch -M main
git push -u origin main
```

---

## 2️⃣ Deploy Backend on Railway (10 min)

1. Go to https://railway.app
2. Sign in with GitHub
3. **New Project** → **Deploy from GitHub** → Select `the-v-app`
4. Click on `server` service
5. Add PostgreSQL plugin: **+ Add Plugin**
6. Set environment vars:
   ```
   DATABASE_URL=auto-populated
   JWT_SECRET=your_secret_key_here
   CORS_ORIGIN=https://the-v-app.vercel.app
   NODE_ENV=production
   ```
7. Wait for ✅ Deployed
8. **Copy the deployment URL** (e.g., `https://the-v-app-prod.up.railway.app`)

---

## 3️⃣ Deploy Frontend on Vercel (10 min)

1. Go to https://vercel.com
2. Sign in with GitHub
3. **Add New** → **Project**
4. **Import Git Repository** → Select `the-v-app`
5. Framework: **Vite**
6. Environment variables:
   ```
   VITE_API_BASE_URL=https://YOUR_RAILWAY_URL/api/v1
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_key
   VITE_JWT_STORAGE_KEY=auth_token
   ```
7. Click **Deploy**
8. Wait for ✅ Production

---

## 4️⃣ Test (5 min)

Open: `https://the-v-app.vercel.app`
- Sign up ✅
- Create post ✅
- Post appears in feed ✅
- View profile ✅

---

## 🎉 Done!

Your app is live!

**Frontend:** https://the-v-app.vercel.app  
**API:** Your Railway URL

---

## 📝 If Deployment Fails

| Error | Fix |
|-------|-----|
| "Cannot find module" | Run `npm install` in project root |
| "Database connection error" | Check `DATABASE_URL` in Railway env |
| "404 on API calls" | Update `VITE_API_BASE_URL` to correct Railway URL |
| "CORS error" | Update `CORS_ORIGIN` in Railway to your Vercel URL |

---

## 📚 Full Guides

- **Detailed Deployment:** See `DEPLOYMENT_CHECKLIST.md`
- **Component Wiring:** See `COMPONENT_WIRING_GUIDE.md`
- **API Reference:** See `API_REFERENCE.md`
- **Architecture:** See `ARCHITECTURE_AND_CODE_QUALITY.md`

