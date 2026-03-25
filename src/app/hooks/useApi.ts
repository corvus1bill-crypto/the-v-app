import { useState, useEffect, useCallback } from 'react';
import * as backendApi from '../services/backendApi';
import { useAuthStore } from '../store/authStore';

// Hook for fetching feed with pagination
export function useFeed(limit = 50) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const token = useAuthStore(s => s.token);

  const loadFeed = useCallback(async (pageOffset: number = 0) => {
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await backendApi.getFeed(limit, pageOffset);
      setPosts(pageOffset === 0 ? response.posts : prev => [...prev, ...response.posts]);
      setOffset(pageOffset + limit);
      setHasMore(response.posts.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [token, limit]);

  useEffect(() => {
    loadFeed(0);
  }, [token]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadFeed(offset);
  }, [offset, hasMore, loading, loadFeed]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await loadFeed(0);
  }, [loadFeed]);

  return { posts, loading, error, hasMore, loadMore, refresh };
}

// Hook for fetching explore/trending posts
export function useExplorePosts(limit = 50) {
  const [posts, setPosts] = useState<backendApi.RestFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadExplore = useCallback(async (pageOffset: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await backendApi.getExplore(limit, pageOffset);
      setPosts(pageOffset === 0 ? response.posts : prev => [...prev, ...response.posts]);
      setOffset(pageOffset + limit);
      setHasMore(response.posts.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load explore');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadExplore(0);
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadExplore(offset);
  }, [offset, hasMore, loading, loadExplore]);

  return { posts, loading, error, hasMore, loadMore };
}

// Hook for searching hashtags
export function useHashtagSearch(query: string) {
  const [hashtags, setHashtags] = useState<backendApi.Hashtag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 1) {
      setHashtags([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await backendApi.searchHashtags(query);
        setHashtags(response.hashtags);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 300); // Debounce
    return () => clearTimeout(timer);
  }, [query]);

  return { hashtags, loading, error };
}

// Hook for trending hashtags
export function useTrendingHashtags(limit = 20) {
  const [hashtags, setHashtags] = useState<backendApi.Hashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrending = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await backendApi.getTrendingHashtags(limit);
        setHashtags(response.hashtags);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trending');
      } finally {
        setLoading(false);
      }
    };

    loadTrending();
  }, [limit]);

  return { hashtags, loading, error };
}

// Hook for getting posts with a specific hashtag
export function useHashtagPosts(hashtagId: string, limit = 50) {
  const [hashtag, setHashtag] = useState<backendApi.Hashtag | null>(null);
  const [posts, setPosts] = useState<backendApi.RestFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async (pageOffset: number = 0) => {
    if (!hashtagId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await backendApi.getHashtagPosts(hashtagId, limit, pageOffset);
      setHashtag(response.hashtag);
      setPosts(pageOffset === 0 ? response.posts : prev => [...prev, ...response.posts]);
      setOffset(pageOffset + limit);
      setHasMore(response.posts.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [hashtagId, limit]);

  useEffect(() => {
    if (hashtagId) {
      loadPosts(0);
    }
  }, [hashtagId]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadPosts(offset);
  }, [offset, hasMore, loading, loadPosts]);

  return { hashtag, posts, loading, error, hasMore, loadMore };
}

// Hook for creating a post
export function useCreatePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = useCallback(async (
    caption: string,
    mediaUrls: string[],
    location?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const post = await backendApi.createPostApi({
        caption,
        mediaUrls,
        location,
      });
      return post;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create post';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createPost, loading, error };
}

// Hook for uploading media
export function useUploadMedia() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMedia = useCallback(async (file: Blob, filename?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await backendApi.uploadImage(file, filename);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { uploadMedia, loading, error };
}

// Hook for getting conversations
export function useConversations() {
  const [conversations, setConversations] = useState<backendApi.RestConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    if (!token) return;

    const loadConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await backendApi.listConversations();
        setConversations(response.conversations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [token]);

  return { conversations, loading, error };
}

// Hook for getting conversation messages
export function useConversationMessages(conversationId: string, limit = 50) {
  const [messages, setMessages] = useState<backendApi.RestMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMessages = useCallback(async (pageOffset: number = 0) => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await backendApi.getConversationMessages(conversationId, limit, pageOffset);
      setMessages(pageOffset === 0 ? response.messages : prev => [...prev, ...response.messages]);
      setOffset(pageOffset + limit);
      setHasMore(response.messages.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, limit]);

  useEffect(() => {
    if (conversationId) {
      loadMessages(0);
    }
  }, [conversationId]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadMessages(offset);
  }, [offset, hasMore, loading, loadMessages]);

  return { messages, loading, error, hasMore, loadMore };
}

// Hook for getting notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<backendApi.RestNotifRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    if (!token) return;

    const loadNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await backendApi.listNotificationsApi();
        setNotifications(response.notifications);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [token]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await backendApi.markNotificationReadApi(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }, []);

  return { notifications, loading, error, markAsRead };
}
