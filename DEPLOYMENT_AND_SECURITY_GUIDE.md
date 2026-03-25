# DEPLOYMENT & SECURITY GUIDE

## Quick Start: Deploy in 30 Minutes

### Prerequisites
- GitHub account with repository pushed
- Vercel account (free tier available)
- Railway account (or alternative: Render, Heroku)
- PostgreSQL database (Railway provides one)

---

## BACKEND DEPLOYMENT (Railway.app Recommended)

### Step 1: Prepare Repository
```bash
# Make sure all code is committed and pushed to GitHub
git add .
git commit -m "Production ready: hashtag support, API integration"
git push origin main
```

### Step 2: Railway Setup (5 minutes)
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "Start a New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway auto-detects Node.js and creates a service
7. Click "Add" → "PostgreSQL" to add database
8. Railway automatically sets `DATABASE_URL`

### Step 3: Environment Variables
In Railway dashboard, under "Variables" tab:

```
NODE_ENV=production
PORT=4000
JWT_SECRET=<generate-secure-32-char-key>
CORS_ORIGIN=https://yourdomain.com
FORCE_HTTPS=true
TRUST_PROXY=1
PUBLIC_BASE_URL=https://api.yourdomain.com  # From Railway's domain
```

**Generate JWT_SECRET safely:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Deploy
1. Click "Deploy" in Railway dashboard
2. Monitor build logs (should complete in 2-3 minutes)
3. Once "Deployment Successful", note your API URL

### Step 5: Database Migration
```bash
# In Railway's terminal or via SSH:
cd server && npx prisma migrate deploy
```

---

## FRONTEND DEPLOYMENT (Vercel.app Recommended)

### Step 1: Build Configuration
Root `package.json` build script:
```json
{
  "build": "npm run build"
}
```

Vite will build React + TypeScript app automatically.

### Step 2: Vercel Setup (3 minutes)
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New → Project"
4. Select your repository
5. Vercel auto-detects Vite (no extra config needed)
6. Accept default build settings

### Step 3: Environment Variables
In Vercel dashboard, "Settings" → "Environment Variables":

```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_ANON_KEY=your-public-key
```

### Step 4: Deploy
1. Click "Deploy"
2. Build completes in 1-2 minutes
3. Get your Vercel URL (e.g., https://app-123.vercel.app)

### Step 5: Custom Domain
1. Add your domain in Vercel dashboard
2. Update DNS records to point to Vercel
3. SSL certificate auto-provisioned (free)

---

## DATABASE SETUP (Critical!)

### Option A: Railway PostgreSQL (Recommended)
- **Pros**: Automatically created, managed backups, free tier
- **Steps**: 
  1. In Railway project, add PostgreSQL plugin
  2. `DATABASE_URL` auto-populated
  3. Run migrations automatically on deploy

### Option B: Managed PostgreSQL (Render.com)
```bash
# Create free PostgreSQL instance
# Copy DATABASE_URL to Railway/Vercel environment
```

### Option C: Self-Hosted
```bash
# Install PostgreSQL locally or on VPS
# Create database: createdb thev
# Set DATABASE_URL in environment
```

### First-Time Database Setup
```bash
# After setting DATABASE_URL in production environment:
npx prisma migrate deploy  # Apply all pending migrations
npx prisma db push        # Or sync schema directly
```

---

## SECURITY CHECKLIST

### Environment Variables
- [ ] `JWT_SECRET` changed to random 32-char string
- [ ] `CORS_ORIGIN` set to your domain (not "*")
- [ ] `FORCE_HTTPS` = true in production
- [ ] No sensitive keys in code (all in .env)
- [ ] Use Railway's encrypted secret storage

### Database Security
- [ ] Use strong PostgreSQL password
- [ ] Enable at-rest encryption (Railway default)
- [ ] Regular backups enabled (Railway auto does this)
- [ ] IP whitelist if possible (Railway handles this)
- [ ] Avoid test data in production

### API Security
- [ ] Rate limiting enabled (✅ already implemented)
- [ ] Input validation on all endpoints (✅ Zod)
- [ ] SQL injection prevention (✅ Prisma ORM)
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Helmet.js enabled (✅ already implemented)

### Frontend Security
- [ ] JWT tokens stored securely (localStorage okay for web)
- [ ] No credentials logged to console
- [ ] Protect sensitive routes with auth checks
- [ ] Error messages don't leak internal details
- [ ] Content Security Policy headers set

### Monitoring & Alerting
- [ ] Error logging configured (Sentry recommended)
- [ ] Performance monitoring enabled
- [ ] Daily log checks
- [ ] Setup alerts for database/API failures

---

## PRODUCTION READINESS CHECKLIST

### Code Quality
- [ ] All TODO comments removed
- [ ] No console.log() in production code
- [ ] No dangling API endpoints
- [ ] Error boundaries on all pages
- [ ] Loading states on all async operations

### Testing
- [ ] Smoke test: signup → login → create post
- [ ] Test feed loading and pagination
- [ ] Test messaging with 2 accounts
- [ ] Test image uploads
- [ ] Test hashtag search and trending
- [ ] Test 404 and error pages

### Performance
- [ ] Bundle size < 500KB gzipped
- [ ] Lazy load non-critical components
- [ ] Image optimization enabled
- [ ] Code splitting for routes
- [ ] Database queries optimized (indexes present)

### Data
- [ ] Database backups configured
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] User data GDPR compliant
- [ ] Delete account functionality works

### Documentation
- [ ] API docs updated (Swagger at /api-docs)
- [ ] Deployment instructions written
- [ ] Environment variables documented
- [ ] Troubleshooting guide created

---

## MONITORING & MAINTENANCE

### Log Into Applications
**Vercel**: https://vercel.com/dashboard
**Railway**: https://railway.app/dashboard
**PostgreSQL**: Via Railway or Render dashboard

### Monitor Performance
```bash
# Check API response times
curl -w '\nTime: %{time_total}s\n' https://api.yourdomain.com/health

# View database connections
SELECT datname, usename, count(*) FROM pg_stat_activity GROUP BY datname, usename;
```

### Scaling (When Needed)
- **Railway**: Upgrade plan in dashboard (automatic scaling)
- **Vercel**: No action needed (scales automatically)
- **Database**: Upgrade instance size if needed

### Backups
- **Railway PostgreSQL**: Automatic daily backups (last 30 days)
- **Vercel**: Code backed up in GitHub
- **Manual backup**: `pg_dump DATABASE_URL > backup.sql`

---

## TROUBLESHOOTING

### API Returns 502 Bad Gateway
```bash
# Check Railway health
1. Go to Railway dashboard
2. Check build logs for errors
3. Verify DATABASE_URL is set
4. Check storage for uploads directory
5. Restart deployment
```

### Database Connection Error
```bash
# Verify DATABASE_URL format:
postgresql://user:password@host:port/database
# Check in Railway: Copy "Database URL" exactly as shown
```

### Frontend Won't Connect to API
```bash
# Check CORS_ORIGIN in backend .env
# Check VITE_API_BASE_URL in frontend .env
# Ensure no trailing slash in VITE_API_BASE_URL
# Check browser console for specific error
```

### Images Not Uploading
```bash
# Ensure UPLOAD_DIR exists and is writable
# Check PUBLIC_BASE_URL is accessible
# Verify mime types in validation
# Check upload size limit in backend (Express: 1MB default)
```

### Migrations Failed
```bash
# Check database is running
# Verify credentials in DATABASE_URL
# Check migration files exist
# Run: npx prisma migrate status
```

---

## OPTIMIZATION TIPS

### Frontend
- Use `<img loading="lazy">` for below-fold images
- Code split routes with `React.lazy()`
- Enable gzip compression (Vercel default)
- Cache static assets (Vercel CDN)

### Backend
- Add database indexes (included in schema)
- Use connection pooling (Prisma default)
- Implement Redis caching for frequent queries
- Use CDN for image serving (S3 + CloudFront)

### Database
- Regular VACUUM and ANALYZE
- Monitor slow queries
- Archive old data periodically
- Use read replicas for scaling

---

## ROLLBACK PROCEDURE

If deployment breaks production:

### Frontend (Vercel)
1. Click "Deployments" in Vercel
2. Find last working deployment
3. Click "Promote to Production"

### Backend (Railway)
1. Click "Deployments" in Railway
2. Click last successful deployment
3. Click "Redeploy"

---

## Support & Help

- **Railway docs**: https://docs.railway.app
- **Vercel docs**: https://vercel.com/docs
- **Prisma docs**: https://www.prisma.io/docs
- **PostgreSQL docs**: https://www.postgresql.org/docs

---

## Next Steps After Deployment

1. ✅ Monitor error tracking in Sentry
2. ✅ Monitor performance in Vercel Analytics
3. ✅ Monitor database usage in Railway
4. ✅ Set up automated backups
5. ✅ Enable analytics in frontend
6. ✅ Plan feature releases for next iteration
