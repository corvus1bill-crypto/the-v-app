import { restApiBase } from '../config/restApi';
import { useAuthStore } from '../store/authStore';

export type RestFeedPost = {
  id: string;
  userId: string;
  caption: string | null;
  location: string | null;
  createdAt: string;
  user: { username: string; fullName: string | null; avatarUrl: string | null } | null;
  post_media: { id: string; media_url: string; thumb_url?: string | null; media_type: string; position: number }[];
  likes: number;
  comments: number;
  isLiked: boolean;
};

export type MeResponse = {
  id: string;
  email: string;
  role: string;
  profile: {
    username: string;
    fullName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    website: string | null;
  };
};

async function rawFetch(path: string, init: RequestInit = {}, withAuth: boolean): Promise<Response> {
  const base = restApiBase();
  console.log('🌐 Fetching:', `${base}${path}`);
  const headers = new Headers(init.headers);
  if (
    !headers.has('Content-Type') &&
    init.body &&
    !(init.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }
  if (withAuth) {
    const token = useAuthStore.getState().token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(`${base}${path}`, { ...init, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout (10s) - Backend not responding. Check API_URL: ' + base);
    }
    console.error('🔴 Fetch error:', error);
    throw error;
  }
}

export async function restJson<T>(path: string, init: RequestInit = {}, withAuth = true): Promise<T> {
  const res = await rawFetch(path, init, withAuth);
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error || res.statusText || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function authRegister(body: {
  email: string;
  password: string;
  username: string;
}): Promise<{ token: string; user: { id: string } }> {
  return restJson('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body) }, false);
}

export async function authLogin(body: {
  email: string;
  password: string;
}): Promise<{ token: string; user: { id: string } }> {
  return restJson('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(body) }, false);
}

export async function authMe(): Promise<MeResponse> {
  return restJson('/api/v1/auth/me', { method: 'GET' }, true);
}

export async function getFeed(limit = 50, offset = 0): Promise<{ posts: RestFeedPost[] }> {
  const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return restJson(`/api/v1/posts/feed?${q}`, { method: 'GET' }, true);
}

export async function getExplore(limit = 50, offset = 0): Promise<{ posts: RestFeedPost[] }> {
  const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return restJson(`/api/v1/posts/explore?${q}`, { method: 'GET' }, true);
}

export async function checkUsername(username: string): Promise<{ available: boolean }> {
  return restJson(`/api/v1/users/username/check/${encodeURIComponent(username)}`, { method: 'GET' }, false);
}

export async function patchMyProfile(body: {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  username?: string;
}): Promise<unknown> {
  return restJson('/api/v1/users/me', { method: 'PATCH', body: JSON.stringify(body) }, true);
}

export async function uploadImage(file: Blob, filename = 'upload.jpg'): Promise<{ url: string; thumbnailUrl: string }> {
  const base = restApiBase();
  const fd = new FormData();
  fd.append('file', file, filename);
  const headers = new Headers();
  const token = useAuthStore.getState().token;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${base}/api/v1/uploads`, { method: 'POST', body: fd, headers });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error || res.statusText);
  }
  return res.json();
}

export async function followUser(targetUserId: string): Promise<void> {
  await restJson(`/api/v1/users/${targetUserId}/follow`, { method: 'POST' }, true);
}

export async function unfollowUser(targetUserId: string): Promise<void> {
  await restJson(`/api/v1/users/${targetUserId}/follow`, { method: 'DELETE' }, true);
}

export type RestConversation = {
  id: string;
  otherUserId?: string;
  username: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastAt: string;
};

export type RestMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  seen: boolean;
  created_at: string;
  profiles?: { username?: string; avatar_url?: string | null; id?: string } | null;
};

export async function listConversations(): Promise<{ conversations: RestConversation[] }> {
  return restJson('/api/v1/messages/conversations', { method: 'GET' }, true);
}

export async function ensureConversationWith(otherUserId: string): Promise<{ id: string }> {
  return restJson(`/api/v1/messages/conversations/with/${otherUserId}`, { method: 'POST' }, true);
}

export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  offset = 0
): Promise<{ messages: RestMessageRow[] }> {
  const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return restJson(`/api/v1/messages/conversations/${conversationId}/messages?${q}`, { method: 'GET' }, true);
}

export async function sendConversationMessage(
  conversationId: string,
  content: string,
  mediaUrl?: string
): Promise<RestMessageRow> {
  return restJson(`/api/v1/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, mediaUrl }),
  });
}

export type RestNotifRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: { username: string; avatar_url: string | null } | null;
};

export async function listNotificationsApi(): Promise<{ notifications: RestNotifRow[] }> {
  return restJson('/api/v1/notifications', { method: 'GET' }, true);
}

export async function markNotificationReadApi(id: string): Promise<void> {
  await restJson(`/api/v1/notifications/${id}/read`, { method: 'PATCH' }, true);
}

export async function getFollowersCount(userId: string): Promise<{ count: number }> {
  return restJson(`/api/v1/users/${userId}/followers/count`, { method: 'GET' }, true);
}

export type FollowingUser = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
};

export async function getFollowingList(userId: string): Promise<FollowingUser[]> {
  return restJson(`/api/v1/users/${userId}/following`, { method: 'GET' }, true);
}

export async function createPostApi(body: {
  caption?: string;
  location?: string;
  mediaUrls: string[];
}): Promise<RestFeedPost> {
  return restJson('/api/v1/posts', { method: 'POST', body: JSON.stringify(body) }, true);
}

export async function getUserPostsApi(userId: string, limit = 50): Promise<{ posts: RestFeedPost[] }> {
  return restJson(`/api/v1/users/${userId}/posts?limit=${limit}`, { method: 'GET' }, true);
}

export async function getUserProfile(userId: string): Promise<any> {
  return restJson(`/api/v1/users/${userId}`, { method: 'GET' }, true);
}

// Hashtag API endpoints
export type Hashtag = {
  id: string;
  tag: string;
  postCount: number;
};

export async function searchHashtags(query: string, limit = 20): Promise<{ hashtags: Hashtag[] }> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return restJson(`/api/v1/hashtags/search?${params}`, { method: 'GET' }, false);
}

export async function getTrendingHashtags(limit = 20): Promise<{ hashtags: Hashtag[] }> {
  const params = new URLSearchParams({ limit: String(limit) });
  return restJson(`/api/v1/hashtags/trending?${params}`, { method: 'GET' }, false);
}

export async function getHashtagPosts(
  hashtagId: string,
  limit = 50,
  offset = 0
): Promise<{ hashtag: Hashtag; posts: RestFeedPost[] }> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return restJson(`/api/v1/hashtags/${hashtagId}/posts?${params}`, { method: 'GET' }, false);
}
