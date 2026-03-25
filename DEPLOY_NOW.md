# 🚀 Deploy in 3 Easy Steps

Just follow these exactly. Don't think, just copy-paste and click.

---

## STEP 1: Push to GitHub (5 minutes)

### 1.1 Create a GitHub account (if you don't have one)
Go to: https://github.com/signup

### 1.2 Run these commands ONE BY ONE

**Command 1:**
```
git remote add origin https://github.com/YOUR_USERNAME/the-v-app.git
```
(Replace YOUR_USERNAME with your GitHub username)

**Command 2:**
```
git branch -M main
```

**Command 3:**
```
git push -u origin main
```

When it asks for authentication, just follow the browser popup.

✅ **Done!** Your code is now on GitHub.

---

## STEP 2: Deploy Backend (10 minutes)

1. Go to: **https://railway.app**
2. Click **Sign up with GitHub**
3. Click **Authorize**
4. Click **+ New Project**
5. Click **Deploy from GitHub**
6. Find and click **the-v-app**
7. Wait 10 seconds... click the **server** folder/service that appears
8. Click **Variables** at the top
9. Add these 4 variables:

```
JWT_SECRET=your_super_secret_key_min_32_chars_123456
CORS_ORIGIN=https://the-v-app.vercel.app
NODE_ENV=production
FORCE_HTTPS=true
```

10. Railway automatically adds `DATABASE_URL` (don't touch it)
11. Wait for green checkmark ✅

✅ **Copy this URL** (you'll need it in Step 3):
```
https://your-railway-deployment-url.up.railway.app
```

---

## STEP 3: Deploy Frontend (10 minutes)

1. Go to: **https://vercel.com**
2. Click **Sign up with GitHub**
3. Click **Authorize**
4. Click **Add New** → **Project**
5. Click **Import Git Repository**
6. Find and click **the-v-app**
7. Click **Import**
8. Scroll down → Click **Environment Variables**
9. Add these 4 variables:

```
VITE_API_BASE_URL=https://your-railway-deployment-url.up.railway.app/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_anon_key_here
VITE_JWT_STORAGE_KEY=auth_token
```

**Getting Supabase values:**
- Go to: https://app.supabase.com
- Click your project
- Click **Settings** → **API**
- Copy **URL** and **anon key**

10. Click **Deploy**
11. Wait for "Production ✅"

✅ **Your app is now LIVE!**

---

## Test It Works

Open: **https://the-v-app.vercel.app**

Try:
- Sign up ✅
- Create a post ✅  
- Check your profile ✅

If it works → **YOU'RE DONE! 🎉**

---

## If Something Goes Wrong

| Issue | Fix |
|-------|-----|
| "Can't find the-v-app repo" | Make sure you pushed code (Step 1 Command 3) |
| "Deployment fails" | Wait 2 minutes and redeploy |
| "API calls fail" | Check `VITE_API_BASE_URL` matches Railway URL exactly |
| "Sign up doesn't work" | Check Supabase credentials are correct |

**Still stuck?** Message me with the specific error.

---

That's it! No fancy stuff, just 3 steps.

