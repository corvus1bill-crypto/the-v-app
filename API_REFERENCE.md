# API REFERENCE & DOCUMENTATION

**Base URL**: `https://api.yourdomain.com/api/v1`

All endpoints return JSON. Timestamps are ISO 8601 format.

---

## AUTHENTICATION

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123!",
  "username": "johndoe"
}
```

**Response** (201):
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "profile": {
      "username": "johndoe",
      "fullName": null,
      "bio": null,
      "avatarUrl": null,
      "website": null
    }
  }
}
```

**Errors**:
- 400: Invalid input
- 409: Email or username already registered

---

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Response** (200): Same as register

**Errors**:
- 400: Invalid input
- 401: Invalid credentials

---

### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "USER",
  "profile": {
    "username": "johndoe",
    "fullName": "John Doe",
    "bio": "Travel enthusiast",
    "avatarUrl": "https://...",
    "website": "https://..."
  }
}
```

**Errors**:
- 401: Unauthorized

---

## POSTS

### Get Feed (Following + Your Posts)
```http
GET /posts/feed?limit=50&offset=0
Authorization: Bearer {token}
```

**Parameters**:
- `limit` (int, default 50, max 200): Posts per page
- `offset` (int, default 0): Pagination offset

**Response** (200):
```json
{
  "posts": [
    {
      "id": "uuid",
      "userId": "uuid",
      "caption": "Amazing sunset #nature #travel",
      "location": "Hawaii",
      "createdAt": "2026-03-23T10:00:00Z",
      "user": {
        "username": "traveler",
        "fullName": "Jane Smith",
        "avatarUrl": "https://..."
      },
      "post_media": [
        {
          "id": "uuid",
          "media_url": "https://...",
          "thumb_url": "https://...",
          "media_type": "image",
          "position": 0
        }
      ],
      "likes": 245,
      "comments": 18,
      "isLiked": false
    }
  ]
}
```

---

### Get Explore (All Trending Posts)
```http
GET /posts/explore?limit=50&offset=0
```

**Response**: Same as feed

---

### Create Post
```http
POST /posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "caption": "Check out this amazing place! #travel #adventure",
  "location": "Paris, France",
  "mediaUrls": [
    "https://your-cdn.com/image1.jpg",
    "https://your-cdn.com/image2.jpg"
  ]
}
```

**Response** (201): Single post object

**Errors**:
- 400: Invalid input
- 401: Unauthorized

**Note**: Upload images first using `/uploads`, then include URLs

---

### Delete Post
```http
DELETE /posts/{postId}
Authorization: Bearer {token}
```

**Response** (204): No content

**Errors**:
- 401: Unauthorized
- 403: Not post owner
- 404: Post not found

---

### Toggle Like
```http
POST /posts/{postId}/like
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "liked": true
}
```

**Errors**:
- 404: Post not found

---

### Get Comments
```http
GET /posts/{postId}/comments
```

**Response** (200):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "postId": "uuid",
  "username": "commenter",
  "avatarUrl": "https://...",
  "content": "Great shot!",
  "createdAt": "2026-03-23T10:00:00Z",
  "replies": []
}
```

---

### Create Comment
```http
POST /posts/{postId}/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Amazing! Love it 🔥",
  "parentId": null
}
```

**Response** (201): Comment object

---

## USERS

### Check Username Availability
```http
GET /users/username/check/johndoe
```

**Response** (200):
```json
{
  "available": true
}
```

---

### Get User Profile
```http
GET /users/{userId}
```

**Response** (200): User profile object

---

### Get Following Count
```http
GET /users/{userId}/followers/count
```

**Response** (200):
```json
{
  "count": 245
}
```

---

### Get Following List
```http
GET /users/{userId}/following
```

**Response** (200):
```json
[
  {
    "id": "uuid",
    "username": "follower",
    "name": "Follower Name",
    "avatar": "https://...",
    "bio": "Bio text"
  }
]
```

---

### Get User Posts
```http
GET /users/{userId}/posts?limit=50
```

**Response**: Posts array

---

### Update Profile
```http
PATCH /users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "John Doe",
  "bio": "Travel lover | Photographer",
  "website": "https://johndo.com",
  "avatarUrl": "https://cdn.com/avatar.jpg",
  "username": "johndoe"
}
```

**Response** (200): Updated profile

---

### Follow User
```http
POST /users/{userId}/follow
Authorization: Bearer {token}
```

**Response** (201): Created follow relationship

---

### Unfollow User
```http
DELETE /users/{userId}/follow
Authorization: Bearer {token}
```

**Response** (204): No content

---

## HASHTAGS

### Search Hashtags
```http
GET /hashtags/search?q=travel&limit=20
```

**Response** (200):
```json
{
  "hashtags": [
    {
      "id": "uuid",
      "tag": "travel",
      "postCount": 5234
    },
    {
      "id": "uuid",
      "tag": "travelgram",
      "postCount": 3421
    }
  ]
}
```

**Parameters**:
- `q` (string, required): Search query
- `limit` (int, default 20, max 100): Results per page

---

### Get Trending Hashtags
```http
GET /hashtags/trending?limit=20
```

**Response**: Hashtags array sorted by post count

**Parameters**:
- `limit` (int, default 20, max 100): Top N hashtags

---

### Get Posts with Hashtag
```http
GET /hashtags/{hashtagId}/posts?limit=50&offset=0
```

**Response** (200):
```json
{
  "hashtag": {
    "id": "uuid",
    "tag": "travel",
    "postCount": 5234
  },
  "posts": [
    {
      "id": "uuid",
      // ... post object
    }
  ]
}
```

---

## MESSAGES

### List Conversations
```http
GET /messages/conversations
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "conversations": [
    {
      "id": "uuid",
      "username": "otheruser",
      "avatarUrl": "https://...",
      "lastMessage": "Hey! How are you?",
      "lastAt": "2026-03-23T10:00:00Z"
    }
  ]
}
```

---

### Get Or Create Conversation
```http
POST /messages/conversations/with/{userId}
Authorization: Bearer {token}
```

**Response** (201):
```json
{
  "id": "conversationId"
}
```

---

### Get Conversation Messages
```http
GET /messages/conversations/{conversationId}/messages?limit=50&offset=0
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "senderId": "uuid",
      "content": "Hi there!",
      "mediaUrl": null,
      "seen": true,
      "createdAt": "2026-03-23T10:00:00Z"
    }
  ]
}
```

---

### Send Message
```http
POST /messages/conversations/{conversationId}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Hey, how are you?",
  "mediaUrl": null
}
```

**Response** (201): Message object

---

## NOTIFICATIONS

### List Notifications
```http
GET /notifications
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "notifications": [
    {
      "id": "uuid",
      "userId": "uuid",
      "actorId": "uuid",
      "type": "like",
      "postId": "uuid",
      "isRead": false,
      "createdAt": "2026-03-23T10:00:00Z",
      "actor": {
        "username": "liker",
        "avatarUrl": "https://..."
      }
    }
  ]
}
```

**Types**: `like`, `comment`, `follow`, `message`

---

### Mark Notification as Read
```http
PATCH /notifications/{notificationId}/read
Authorization: Bearer {token}
```

**Response** (200): Updated notification

---

### Mark All as Read
```http
POST /notifications/read-all
Authorization: Bearer {token}
```

**Response** (204): No content

---

## UPLOADS

### Upload Image
```http
POST /uploads
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary image data]
```

**Response** (201):
```json
{
  "url": "https://cdn.com/uploads/abc123.jpg",
  "thumbnailUrl": "https://cdn.com/uploads/abc123_thumb.jpg"
}
```

**Constraints**:
- Max file size: 10MB
- Formats: JPEG, PNG, WebP, GIF
- Returns thumbnail URL for preview

**Errors**:
- 400: Invalid file type
- 413: File too large
- 401: Unauthorized

---

## ERROR RESPONSES

All errors follow this format:

```json
{
  "error": "Description of what went wrong",
  "status": 400
}
```

**Common Status Codes**:
- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 429: Too Many Requests (rate limited)
- 500: Server Error

---

## RATE LIMITING

All requests include rate limit headers:

```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 199
X-RateLimit-Reset: 1679561234
```

Limits:
- **Auth**: 30 requests per 15 minutes
- **API**: 200 requests per minute
- **Uploads**: 30 requests per minute

---

## AUTHENTICATION

All protected endpoints require:
```
Authorization: Bearer {jwtToken}
```

JWT expires in 7 days. Re-login for new token.

---

## PAGINATION

Resources that support pagination use:
- `limit`: Items per page (default varies)
- `offset`: Starting position (0-indexed)

**Examples**:
```
GET /posts/feed?limit=20&offset=0    // First 20 posts
GET /posts/feed?limit=20&offset=20   // Next 20 posts
GET /posts/feed?limit=20&offset=40   // Next 20 posts
```

---

## TIMESTAMPS

All timestamps are ISO 8601:
```
2026-03-23T10:30:45.123Z
```

---

## TESTING WITH CURL

### Register
```bash
curl -X POST https://api.yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "username": "testuser"
  }'
```

### Create Post (with token)
```bash
TOKEN="eyJhbGc..."
curl -X POST https://api.yourdomain.com/api/v1/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Test post #testing",
    "mediaUrls": ["https://..."],
    "location": "Test City"
  }'
```

### List Feed
```bash
TOKEN="eyJhbGc..."
curl https://api.yourdomain.com/api/v1/posts/feed \
  -H "Authorization: Bearer $TOKEN"
```

---

## SDK/LIBRARY USAGE

### Frontend (TypeScript)
```typescript
import { getFeed, getExplore, searchHashtags } from './services/backendApi';

// Fetch feed
const { posts } = await getFeed(50, 0);

// Search hashtags
const { hashtags } = await searchHashtags('travel', 20);
```

### React Hooks
```typescript
import { useFeed, useHashtagSearch } from './hooks/useApi';

function MyComponent() {
  const { posts, loading } = useFeed();
  const { hashtags } = useHashtagSearch('travel');
  
  return <div>Render posts...</div>;
}
```

---

## CHANGELOG

### v1.0 (Current)
- User authentication (register, login)
- Posts (CRUD, like, comment)
- Users (profile, follow, following)
- Messages (conversations, messages)
- Notifications (alerts, mark read)
- Uploads (image with thumbnail generation)
- Hashtags (search, trending, posts by hashtag)
