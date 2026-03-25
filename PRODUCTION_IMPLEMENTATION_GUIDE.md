# Production Build Implementation Guide

This guide covers all steps needed to make your app production-ready, from API integration to deployment.

## PHASE 1: API INTEGRATION (In Progress)

### Status: ✅ Complete
- [x] Hashtag backend endpoints (routes, services, database models)
- [x] Frontend API client updated with hashtag functions
- [x] Prisma schema updated with Hashtag and PostHashtag models
- [x] Migration file created: `20250323000001_add_hashtags`

### Next Steps: Connect Frontend Pages to API

#### A. HomePageView (Feed Page)
**Location:** `src/app/components/HomePageView.tsx`

**Changes needed:**
1. Replace mock `mockPosts` array with API calls
2. Use `backendApi.getFeed()` and `backendApi.getExplore()`
3. Add infinite scroll pagination
4. Add loading and error states

**Implementation pattern:**
```typescript
import { getFeed, getExplore } from '../services/backendApi';
import { useAuthStore } from '../store/authStore';

export function HomePage(props) {
  const [feed, setFeed] = useState<RestFeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    if (!token) return;
    const loadFeed = async () => {
      setLoading(true);
      try {
        const data = await getFeed(50, 0);
        setFeed(data.posts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feed');
      } finally {
        setLoading(false);
      }
    };
    loadFeed();
  }, [token]);

  // Map RestFeedPost to Post type as needed
  const posts = feed.map(p => ({...}));

  return <div>render posts with feed state</div>;
}
```

#### B. CreatePostPage
**Location:** `src/app/components/CreatePostPage.tsx`

**Changes needed:**
1. Integrate `backendApi.uploadImage()` for media
2. Call `backendApi.createPostApi()` to create post
3. Extract hashtags from caption before sending
4. Add success/error toast notifications

**Implementation:**
```typescript
import { uploadImage, createPostApi } from '../services/backendApi';

async function handlePublishPost(caption: string, selectedImages: File[]) {
  try {
    setLoading(true);
    
    // Upload images
    const mediaUrls: string[] = [];
    for (const image of selectedImages) {
      const result = await uploadImage(image);
      mediaUrls.push(result.url);
    }
    
    // Create post with hashtags (extracted server-side)
    await createPostApi({
      caption,
      mediaUrls,
      location: selectedLocation || undefined
    });
    
    onShowNotification?.({ type: 'success', message: 'Post published!' });
  } catch (err) {
    onShowNotification?.({ type: 'error', message: 'Failed to publish' });
  }
}
```

#### C. UserProfile
**Location:** `src/app/components/UserProfile.tsx`

**Changes needed:**
1. Fetch user profile with `backendApi.getFollowersCount()`
2. Fetch following list with `backendApi.getFollowingList()`
3. Fetch user posts with `backendApi.getUserPostsApi()`
4. Add follow/unfollow functionality

#### D. NotificationsPage
**Location:** `src/app/components/NotificationsPage.tsx`

**Changes needed:**
1. Fetch notifications with `backendApi.listNotificationsApi()`
2. Mark as read with `backendApi.markNotificationReadApi()`
3. Poll for new notifications (or use WebSocket)

---

## PHASE 2: SECURITY & VALIDATION

### Input Sanitization
- **Status**: Needs implementation
- **Action**: Add input validation in all forms
  - UseExample: `zod` schemas in frontend mirroring backend

### HTTPS Enforcement
- **Status**: Configured in backend
- **Env var**: `FORCE_HTTPS=true` (set for production)

### API Rate Limiting
- **Status**: ✅ Implemented in backend
- Limits: Auth (30/15min), API (200/min), Upload (30/min)

---

## PHASE 3: DEPLOYMENT SETUP

### Backend Deployment (Railway/Render)

#### Prerequisites
- PostgreSQL database URL
- Environment variables configured

#### Environment Variables (.env)
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:pass@host:5432/thev
JWT_SECRET=<min-16-char-random-string>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://yourdomain.com
FORCE_HTTPS=true
UPLOAD_DIR=/tmp/uploads
PUBLIC_BASE_URL=https://api.yourdomain.com
```

#### Steps for Railway
1. Create new project on railway.app
2. Add PostgreSQL plugin (creates DATABASE_URL)
3. Connect GitHub repo
4. Add environment variables
5. Deploy from `server/` directory

#### Steps for Render
1. Create new Web Service on render.com
2. Connect GitHub repo
3. Set build command: `cd server && npm install && npm run build`
4. Set start command: `cd server && npm run start`
5. Add PostgreSQL database
6. Set environment variables
7. Deploy

### Frontend Deployment (Vercel)

#### Environment Variables (.env.production)
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_PROJECT_ID=<your-project-id>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

#### Steps for Vercel
1. Push code to GitHub
2. Import project in vercel.com
3. Set Framework: Vite
4. Configure environment variables
5. Deploy automatically on push to main

---

## PHASE 4: TESTING & VALIDATION

### Test Plan
- [ ] Authentication flow (register → login → protected routes)
- [ ] Post creation with images and hashtags
- [ ] Feed loading and pagination
- [ ] Messaging real-time updates
- [ ] Notifications display
- [ ] Error handling (network timeouts, invalid input)

### Recommended Test Tools
- Frontend: Jest + React Testing Library
- Backend: Vitest (already configured)

---

## PHASE 5: MONITORING & LOGGING

### Error Tracking (Sentry)
```typescript
// In main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

### Analytics (Firebase)
```typescript
// Track key events
logEvent(analytics, 'post_created', { hashtag_count });
logEvent(analytics, 'user_signup');
```

---

## PHASE 6: PRODUCTION CHECKLIST

Before launching:
- [ ] All API endpoints tested and working
- [ ] Error boundaries added to all pages
- [ ] Loading and error states for all async operations
- [ ] Input validation on all forms
- [ ] Rate limiting verified
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Sensitive data not logged
- [ ] Performance optimized (lazy loading, code splitting)
- [ ] Mobile responsive on all screens
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Analytics configured
- [ ] Error tracking (Sentry) configured
- [ ] Database backups configured
- [ ] CDN setup for media files

---

## Quick Commands

### Backend
```bash
cd server
npm install
npm run db:generate
npm run db:migrate  # After DB is running
npm run dev         # Development server on :4000
npm run test        # Run tests
```

### Frontend
```bash
npm install
npm run dev         # Development server on :5173
npm run build       # Production build
npm run dev:api     # Run backend simultaneously
```

---

## Database Schema

Hashtag system is fully implemented:
- `Hashtag` table: stores unique hashtags with post counts
- `PostHashtag` table: junction table linking posts to hashtags
- Automatically created on migration application

---

## API Documentation

All endpoints documented at `/api-docs` when backend is running.

Key new endpoints:
- `GET /api/v1/hashtags/search?q=query` - Search hashtags
- `GET /api/v1/hashtags/trending` - Trending hashtags
- `GET /api/v1/hashtags/:id/posts` - Posts with specific hashtag

---

## Next Actions

1. **START HERE**: Connect HomePageView to API
2. Connect CreatePostPage 
3. Connect UserProfile
4. Add error boundaries and loading states
5. Set up deployment environments
6. Run full test pass
7. Deploy to production

See implementation examples above for each component.
