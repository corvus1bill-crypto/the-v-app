# QUICK REFERENCE: DEVELOPER CHEAT SHEET

## START HERE

1. **Local Setup**
   ```bash
   npm install && cd server && npm install
   npm run db:up  # Start PostgreSQL
   npx prisma migrate deploy
   npm run dev    # Frontend :5173
   cd server && npm run dev  # Backend :4000
   ```

2. **Important URLs**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:4000
   - API Docs: http://localhost:4000/api-docs
   - Prisma Studio: `npx prisma studio`

3. **Documentation Files**
   - **PRODUCTION_READY_ROADMAP.md** ← Start here for launch checklist
   - **API_REFERENCE.md** ← All 50+ endpoints documented
   - **DEPLOYMENT_AND_SECURITY_GUIDE.md** ← Deploy to production
   - **ARCHITECTURE_AND_CODE_QUALITY.md** ← System design
   - **PRODUCTION_IMPLEMENTATION_GUIDE.md** ← Component integration

---

## FRONTEND COMMON TASKS

### Fetch Data from API
```typescript
import { useFeed, useCreatePost, useHashtagSearch } from './hooks/useApi';

// In component:
const { posts, loading, error } = useFeed();
const { createPost } = useCreatePost();
const { hashtags } = useHashtagSearch(query);
```

### Handle Authentication
```typescript
import { useAuthStore } from './store/authStore';

const token = useAuthStore(s => s.token);
const logged_in = !!token;

// Logout
const logout = useAuthStore(s => s.logout);
```

### Show Toast Notification
```typescript
import { useToast } from './hooks/useToast';

const { showToast } = useToast();
showToast({ type: 'success', message: 'Post created!' });
```

### Upload Image
```typescript
import { useUploadMedia } from './hooks/useApi';

const { uploadMedia, loading } = useUploadMedia();
const result = await uploadMedia(file);
console.log(result.url); // Use this URL in POST request
```

### Create Post with Images
```typescript
const { uploadMedia } = useUploadMedia();
const { createPost } = useCreatePost();

const mediaUrls = [];
for (const file of selectedFiles) {
  const { url } = await uploadMedia(file);
  mediaUrls.push(url);
}

await createPost({
  caption: 'My post #hashtag',
  mediaUrls,
  location: 'NYC'
});
```

### Lazy Load Component
```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

export function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

---

## BACKEND COMMON TASKS

### Add New API Endpoint
```typescript
// 1. Add route in server/src/routes/example.routes.ts
router.get('/example', async (req, res, next) => {
  try {
    const data = await exampleService.getData();
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// 2. Register in server/src/app.ts
app.use('/api/v1/examples', apiLimiter, exampleRoutes);
```

### Add Service Logic
```typescript
// In server/src/services/example.service.ts
export async function getData() {
  if (!someCondition) {
    throw new HttpError(400, 'Invalid input');
  }
  return await prisma.example.findMany();
}
```

### Add Database Model
```typescript
// In server/prisma/schema.prisma
model Example {
  id        String   @id @default(uuid())
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())

  @@index([userId])
}

// Then migrate:
npx prisma migrate dev --name add_example
```

### Validate Input
```typescript
// In server/src/validation/schemas.ts
export const exampleSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

// In route:
const data = exampleSchema.parse(req.body); // Throws if invalid
```

### Query with Pagination
```typescript
const items = await prisma.example.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: limit,
  skip: offset,
  include: { user: true }
});
```

### Run Database Migrations
```bash
# Create new migration
npx prisma migrate dev --name add_feature

# Apply pending migrations (production)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (dev only!)
npx prisma migrate reset
```

### Debug Database Issues
```bash
# Open Prisma Studio
npx prisma studio

# Check schema
cat prisma/schema.prisma

# View generated client
cat node_modules/.prisma/client/index.d.ts

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

---

## DATABASE QUERIES

### Find Records
```typescript
// Find one
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// Find first matching
const post = await prisma.post.findFirst({
  where: { userId, published: true }
});

// Find many
const posts = await prisma.post.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

### Create Records
```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: hashedPassword,
    profile: {
      create: {
        username: 'user',
      }
    }
  }
});
```

### Update Records
```typescript
await prisma.post.update({
  where: { id: postId },
  data: { caption: 'New caption' }
});

// Update multiple
await prisma.notification.updateMany({
  where: { userId },
  data: { isRead: true }
});
```

### Delete Records
```typescript
await prisma.post.delete({
  where: { id: postId }
});

// Delete cascades automatically!
```

### Count Records
```typescript
const count = await prisma.post.count({
  where: { userId }
});
```

### Join Relations
```typescript
const posts = await prisma.post.findMany({
  include: {
    user: true,              // Include related user
    media: true,             // Include related media
    _count: {
      select: {
        likes: true,         // Count without fetching
        comments: true
      }
    }
  }
});
```

---

## GIT WORKFLOW

```bash
# Before starting
git pull origin main

# Create feature branch
git checkout -b feature/my-feature

# Make changes, test locally
git add .
git commit -m "Add hashtag API endpoints"

# Push and create PR
git push origin feature/my-feature

# After merge to main, automatic deployment to:
# - Frontend: Vercel
# - Backend: Railway
```

---

## DEBUGGING

### Frontend Console Errors
1. Open DevTools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for API failures
4. Check Application tab for stored auth token

### Backend Server Errors
```bash
# Check logs
tail -f ~/.pm2/logs/server-error.log

# Or look at Railway dashboard → Logs

# Test endpoint directly
curl http://localhost:4000/api/v1/posts/feed
```

### Database Issues
```bash
# Connect to database
psql $DATABASE_URL

# Check tables
\dt

# Query data
SELECT * FROM "User" LIMIT 5;

# Check indexes
\di
```

### API Response Errors
```bash
# Use curl to test
curl -X GET http://localhost:4000/api/v1/posts/feed \
  -H "Authorization: Bearer $TOKEN"

# Pretty print response
curl ... | jq .
```

---

## TESTING

### Run Backend Tests
```bash
cd server
npm test                 # Run all tests once
npm run test:watch      # Watch mode
npm test -- --run auth  # Run specific test
```

### Write Test Example
```typescript
// In server/src/routes/auth.test.ts
import { describe, it, expect } from 'vitest';
import { registerUser } from '../services/auth.service';

describe('authService', () => {
  it('should register user', async () => {
    const result = await registerUser('test@ex.com', 'pwd123!', 'user');
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('test@ex.com');
  });
});
```

---

## ENVIRONMENT VARIABLES

### Frontend (.env.local or .env.production)
```env
VITE_API_BASE_URL=http://localhost:4000
VITE_SUPABASE_PROJECT_ID=your-id
VITE_SUPABASE_ANON_KEY=your-key
```

### Backend (server/.env)
```env
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/thev
JWT_SECRET=your-secret-min-16-chars
CORS_ORIGIN=http://localhost:5173
```

---

## PERFORMANCE TIPS

### Frontend
- Use `React.memo()` for expensive components
- Lazy load routes with `React.lazy()`
- Use `useCallback` for event handlers
- Use `useMemo` for expensive calculations
- Implement virtual scrolling for long lists

### Backend
- Always paginate large result sets
- Use `select` to fetch only needed fields
- Add database indexes on frequently queried columns
- Cache responses that don't change often
- Use connection pooling (Prisma default)

### Database
- Add indexes on: userId, createdAt, email, username
- Use `INTEGER` for counters, not frequent queries
- Archive old data periodically
- Run `ANALYZE` to update query planner
- Monitor slow queries in logs

---

## COMMON ERROR MESSAGES

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No/invalid token | Login > get new token |
| 404 Not Found | Wrong endpoint URL | Check API_REFERENCE.md |
| 409 Conflict | Email/username taken | Use unique value |
| 429 Too Many Requests | Rate limit exceeded | Wait 60 seconds |
| CORS error | Domain not whitelisted | Check CORS_ORIGIN env var |
| P1001: Can't reach database | DB not running | Start PostgreSQL |
| Migration pending | Migrations not applied | Run `prisma migrate deploy` |

---

## USEFUL COMMANDS

```bash
# Frontend
npm run dev              # Start dev server
npm run build            # Production build
npm run dev:api          # Start backend too

# Backend
cd server
npm run dev              # Start dev server
npm run build            # Compile TypeScript
npm run start            # Run compiled version
npm run db:push          # Push schema to DB
npm run db:migrate       # Create & apply migrations
npm run db:studio        # GUI for database
npm test                 # Run tests

# Docker
npm run db:up            # Start PostgreSQL
docker-compose down      # Stop PostgreSQL

# Git
git log --oneline        # Recent commits
git diff                 # Unstaged changes
git status               # Current status
```

---

## DEPLOY COMMANDS

```bash
# Nothing! Automatic on push to main:
# - Vercel (frontend)
# - Railway (backend)

# But if needed to manually deploy:

# Railway Dashboard: https://railway.app/dashboard
# Vercel Dashboard: https://vercel.com/dashboard
```

---

## USEFUL LINKS

- **API Docs**: http://localhost:4000/api-docs
- **GitHub**: https://github.com/your-repo
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Prisma Docs**: https://www.prisma.io/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## TROUBLESHOOTING QUICK FIXES

1. **App won't start**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

2. **Database errors**
   ```bash
   npx prisma migrate reset  # Dev only!
   ```

3. **Port already in use**
   ```bash
   # Change PORT in .env
   PORT=5001 npm run dev
   ```

4. **Node version issues**
   ```bash
   node --version  # Should be 18+
   nvm use 18      # If using nvm
   ```

5. **Clear browser cache**
   - Dev Tools → Ctrl+Shift+Delete
   - Clear cookies and cache

---

**Last Updated**: March 23, 2026  
**Status**: ✅ Production Ready (90%)  
**Questions?** Check the full docs or search the codebase
