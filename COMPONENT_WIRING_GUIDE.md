# 🎯 Component Wiring Guide

## Overview
Three main pages have been wired to use real API hooks. This guide explains what was done and how to use the hooks.

---

## 🏠 HomePageView - Feed Display

### What Was Changed
1. ✅ Added `useFeed()` hook import
2. ✅ Added `useExplorePosts()` hook import
3. ✅ Creates API calls to fetch real posts
4. ✅ Displays loading state from API
5. ✅ Shows API error messages
6. ✅ Merges API data with prop data (fallback)

### Hook Usage
```typescript
const { 
  posts: apiPosts,           // Array of posts from API
  loading: feedLoadingApi,   // Boolean: is loading?
  error: feedErrorApi,       // String | null: error message
  loadMore: loadMoreFeed     // Function: load next page
} = useFeed(currentUserId || '');

const { 
  posts: exploreFeedPosts,   // Explore/For You posts
  loading: exploreLoading 
} = useExplorePosts();
```

### What It Does
- Fetches user's personalized feed
- Shows posts they're following + trending posts
- Auto-loads from API when component mounts
- Falls back to mock data if API unavailable

### Where Posts Display
- **Following tab:** Uses `useFeed()` posts (personalized feed)
- **For You tab:** Uses `useExplorePosts()` posts (trending/discovery)
- Both tabs show loading spinner during fetch
- Both show error message if API fails

---

## ✏️ CreatePostPage - Post Creation

### What Was Changed
1. ✅ Added `useCreatePost()` hook import
2. ✅ Added `useUploadMedia()` hook import
3. ✅ Replaced `db.createPost()` with `createPost()` API call
4. ✅ Automatically extracts hashtags on post creation
5. ✅ Uploads images via API

### Hook Usage
```typescript
const { 
  createPost,           // Function: create post on API
  loading: createPostLoading,  // Boolean
  error: createPostError        // String | null
} = useCreatePost(currentUserId || '');

const { 
  uploadMedia,          // Function: upload image/video
  loading: uploadLoading // Boolean
} = useUploadMedia();
```

### How It Works
1. User adds caption, images, location
2. User clicks "Post"
3. Component calls `createPost({...})`
4. API automatically:
   - Extracts hashtags from caption (e.g., `#tech` → database)
   - Updates hashtag counts
   - Saves post to database
   - Returns post with ID

5. Post appears in feed immediately

### Hashtag Extraction
The API automatically extracts hashtags using regex:
```regex
#\w{1,30}(?=\s|$|[.,!?])
```

Example:
```
Caption: "Check this #tech #startup #innovation story! 🚀"
Extracted: #tech, #startup, #innovation
```

---

## 👤 UserProfile - Profile View

### What Was Changed
1. ✅ Added `useUserProfile()` hook import
2. ✅ Added `useUserPosts()` hook import
3. ✅ Fetches user profile from API
4. ✅ Loads user posts from API
5. ✅ Falls back to props if API unavailable

### Hook Usage
```typescript
const { 
  userProfile: apiProfile,  // Object: { name, avatar, bio, ... }
  loading: profileLoading   // Boolean
} = useUserProfile(userId);

const { 
  posts: userPostsApi,      // Array of user's posts
  loading: postsLoading
} = useUserPosts(userId);

// Use API data with fallback
const displayPosts = userPostsApi.length > 0 ? userPostsApi : posts;
```

### What It Displays
- **Profile info:** Name, avatar, bio from API
- **Stats:** Followers/following counts (real-time from backend)
- **Posts grid:** User's posts in 3-column grid
- **Interactions:** Like, comment, save buttons all work

### Real-time Follower Counts
The component fetches actual follower/following counts from the API:
```typescript
GET /api/v1/users/{userId}/followers/count    → { count: 123 }
GET /api/v1/users/{userId}/following/count    → { count: 45 }
```

These update whenever a follow/unfollow action happens.

---

## 🪝 All 12 Available Hooks

Located in: `src/app/hooks/useApi.ts`

### 1. useFeed(userId)
Fetches personalized feed for user
```typescript
const { posts, loading, error, loadMore } = useFeed('user123');
```

### 2. useExplorePosts()
Fetches trending/explore posts
```typescript
const { posts, loading, error } = useExplorePosts();
```

### 3. useHashtagSearch(query, limit)
Search hashtags by name
```typescript
const { hashtags, loading, error } = useHashtagSearch('tech', 20);
```

### 4. useTrendingHashtags(limit)
Get trending hashtags by post count
```typescript
const { hashtags, loading } = useTrendingHashtags(10);
```

### 5. useHashtagPosts(hashtagId, limit)
Get all posts tagged with a hashtag
```typescript
const { posts, loading, error, loadMore } = useHashtagPosts('tag123', 50);
```

### 6. useCreatePost(userId)
Create a new post
```typescript
const { createPost, loading, error } = useCreatePost('user123');
await createPost({ caption: "Hello #world", visibility: "public" });
```

### 7. useUploadMedia()
Upload images/videos
```typescript
const { uploadMedia, loading } = useUploadMedia();
const url = await uploadMedia(file);
```

### 8. useConversations(userId)
Fetch user's conversations/DMs
```typescript
const { conversations, loading } = useConversations('user123');
```

### 9. useConversationMessages(conversationId, limit)
Fetch messages in a conversation
```typescript
const { messages, loading, loadMore } = useConversationMessages('conv123', 50);
```

### 10. useNotifications(userId)
Fetch user's notifications
```typescript
const { notifications, loading, markAsRead } = useNotifications('user123');
```

### 11. useFollowers(userId)
Get followers of a user
```typescript
const { followers, loading } = useFollowers('user123');
```

### 12. useFollowing(userId)
Get users that a user follows
```typescript
const { following, loading } = useFollowing('user123');
```

---

## 🔌 How to Use Hooks in New Components

### Example: New Hashtag Search Component

```typescript
import { useHashtagSearch } from '../hooks/useApi';

function HashtagSearch() {
  const [query, setQuery] = useState('');
  const { hashtags, loading } = useHashtagSearch(query, 10);

  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
        placeholder="Search hashtags..."
      />
      
      {loading && <p>Loading...</p>}
      
      {hashtags.map(tag => (
        <div key={tag.id}>
          <h3>#{tag.name}</h3>
          <p>{tag.postCount} posts</p>
        </div>
      ))}
    </div>
  );
}
```

### Example: New Messages Component

```typescript
import { useConversations, useConversationMessages } from '../hooks/useApi';

function Messages() {
  const userId = useAuthStore(s => s.currentUserId);
  const { conversations, loading: convLoading } = useConversations(userId);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const { messages, loading: msgLoading } = useConversationMessages(selectedConv || '', 50);

  return (
    <div className="flex gap-4">
      {/* Conversations list */}
      <div className="w-64">
        {convLoading ? <p>Loading...</p> : conversations.map(conv => (
          <button 
            key={conv.id}
            onClick={() => setSelectedConv(conv.id)}
          >
            {conv.name}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1">
        {msgLoading ? <p>Loading...</p> : messages.map(msg => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🐛 Debugging

### Check API Calls in Network Tab
1. Open DevTools (F12)
2. Go to **Network** tab
3. Look for XHR/Fetch requests to `api/v1/`
4. Click each request to see:
   - Status (200 = success)
   - Request body
   - Response body
   - Time taken

### Common Errors

**Error: "Network Error" in hook**
```typescript
// Check backend is running
curl https://your-api-url.com/api/v1/health
```

**Error: "Unauthorized" (401)**
```typescript
// JWT token missing or expired
// Check localStorage for auth_token
localStorage.getItem('auth_token');
```

**Error: "Post count or comments not updating"**
```typescript
// Re-fetch data manually
const { refetch } = useFeed(userId);
await refetch();
```

### View Console Logs
The hooks log actions for debugging:
```
✅ Feed loaded: 15 posts
📊 Hashtags found: 5 tags
🚀 Post created successfully
```

---

## 📊 Data Flow Diagram

```
User Action
    ↓
React Component
    ↓
Hook Function (useFeed, useCreatePost, etc)
    ↓
API Client (backendApi.ts)
    ↓
HTTP Request to Backend ~
    ↓
Backend API (server/src/routes/)
    ↓
Prisma ORM
    ↓
PostgreSQL Database
    ↓
Data returned ← ← ← ← ← ← ← ← ← ← ← ← ← ←
    ↓
Update React State
    ↓
Component Re-renders
```

---

## ✅ Testing Checklist

- [ ] HomePageView loads posts from API
- [ ] CreatePostPage creates post via API
- [ ] Post appears in feed immediately
- [ ] UserProfile shows correct posts
- [ ] Hashtag extraction works (#test post)
- [ ] Follower counts update in real-time
- [ ] Messages load from API
- [ ] Notifications display
- [ ] Images upload successfully
- [ ] All 12 hooks return correct data types

---

## 🚀 Next Features to Wire

**Once deployment is complete:**

1. **Notification Bell** → Use `useNotifications()` hook
2. **Search Page** → Use `useHashtagSearch()` + user search
3. **Chat/Messages** → Use `useConversations()` hook
4. **Trending Page** → Use `useTrendingHashtags()` hook
5. **Follow Suggestions** → Extend with `useFollowers()` hook

Each new component follows the same pattern:
1. Import hook
2. Call hook with params
3. Show loading state
4. Display data
5. Handle errors

---

## 📚 File Locations

```
Frontend Hooks:      src/app/hooks/useApi.ts
API Client:          src/app/services/backendApi.ts
Wired Components:    src/app/components/
  - HomePageView.tsx
  - CreatePostPage.tsx
  - UserProfile.tsx
Backend Routes:      server/src/routes/
Backend Services:    server/src/services/
Database Schema:     server/prisma/schema.prisma
```

