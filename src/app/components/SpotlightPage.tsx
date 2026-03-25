import { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowLeft, Crown, Star, TrendingUp, Heart, MessageCircle, Eye, ChevronRight, Sparkles, Award, Flame, Zap, Users, Calendar, ArrowUpRight, Bookmark, Play, X, Plus, Check, Image } from 'lucide-react';
import { Post } from '../types';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface Creator {
  id: string;
  username: string;
  avatar: string;
  followers: string;
  category: string;
  isFollowing: boolean;
  vibeScore: number;
  topPost: string;
}

interface Collection {
  id: string;
  title: string;
  emoji: string;
  description: string;
  postCount: number;
  coverImage: string;
  color: string;
}

const CURATED_COLLECTIONS: Collection[] = [
  { id: 'col1', title: 'Golden Hour Magic', emoji: '🌅', description: 'The best sunset shots this week', postCount: 42, coverImage: 'https://images.unsplash.com/photo-1572083027104-2824abeab84b?w=600&h=400&fit=crop', color: '#F59E0B' },
  { id: 'col2', title: 'Street Art Vibes', emoji: '🎨', description: 'Urban creativity at its finest', postCount: 38, coverImage: 'https://images.unsplash.com/photo-1581534996068-427fb0ac027f?w=600&h=400&fit=crop', color: '#EC4899' },
  { id: 'col3', title: 'Cozy Aesthetics', emoji: '☕', description: 'Warm, moody, perfect', postCount: 56, coverImage: 'https://images.unsplash.com/photo-1671038988310-083c9d0942b1?w=600&h=400&fit=crop', color: '#8B5CF6' },
  { id: 'col4', title: 'Adventure Awaits', emoji: '⛰️', description: 'Epic landscapes and thrills', postCount: 31, coverImage: 'https://images.unsplash.com/photo-1673505413397-0cd0dc4f5854?w=600&h=400&fit=crop', color: '#10B981' },
];

interface WeeklyHighlight {
  id: string;
  title: string;
  stat: string;
  icon: React.ReactNode;
  color: string;
}

const WEEKLY_HIGHLIGHTS: WeeklyHighlight[] = [
  { id: 'wh1', title: 'Total Vibes Shared', stat: '1.2M', icon: <Sparkles size={20} strokeWidth={3} />, color: '#ff7a2e' },
  { id: 'wh2', title: 'New Creators Joined', stat: '8.4K', icon: <Users size={20} strokeWidth={3} />, color: '#10B981' },
  { id: 'wh3', title: 'Posts Gone Viral', stat: '342', icon: <TrendingUp size={20} strokeWidth={3} />, color: '#EF4444' },
  { id: 'wh4', title: 'Stories Posted', stat: '45K', icon: <Play size={20} strokeWidth={3} />, color: '#8B5CF6' },
];

interface SpotlightPageProps {
  onBack: () => void;
  onViewProfile?: (userId: string) => void;
  onFollowToggle?: (userId: string) => void;
  onViewPost?: (postId: string) => void;
  currentUserId?: string;
  posts?: Post[];
}

export function SpotlightPage({ onBack, onViewProfile, onFollowToggle, onViewPost, currentUserId, posts = [] }: SpotlightPageProps) {
  const [activeSection, setActiveSection] = useState<'featured' | 'collections' | 'recap'>('featured');
  const [savedCollections, setSavedCollections] = useState<Set<string>>(new Set());
  const [followedCreatorIds, setFollowedCreatorIds] = useState<Set<string>>(new Set());
  const [expandedCollectionId, setExpandedCollectionId] = useState<string | null>(null);
  const [addToCollectionId, setAddToCollectionId] = useState<string | null>(null);
  // Stores full post snapshots per collection (from backend), so posts from ANY user are visible
  const [collectionSnapshots, setCollectionSnapshots] = useState<Record<string, Partial<Post>[]>>({});
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  // Local post detail view — shows a post directly without navigating away
  const [viewingPost, setViewingPost] = useState<Partial<Post> | null>(null);
  const [viewingPostLiked, setViewingPostLiked] = useState(false);

  // Resolve viewingPost — enrich with local feed data if available
  const resolvedViewingPost = useMemo(() => {
    if (!viewingPost) return null;
    // Try to find full post data from the local posts array
    const localMatch = viewingPost.id ? posts.find(p => p.id === viewingPost.id) : null;
    if (localMatch) return localMatch;
    // Fall back to the snapshot data we already have
    return viewingPost;
  }, [viewingPost, posts]);

  const handleOpenPostDetail = useCallback((post: Partial<Post>) => {
    // Merge with local post data immediately if available
    const localMatch = post.id ? posts.find(p => p.id === post.id) : null;
    setViewingPost(localMatch || post);
    setViewingPostLiked(false);
  }, [posts]);

  const CATEGORIES = ['Lifestyle', 'Art', 'Travel', 'Photo', 'Nature', 'Music', 'Food', 'Fashion', 'Tech', 'Fitness'];

  const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d`;

  // Fetch persisted collection-post mappings on mount
  useEffect(() => {
    let stale = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/collections/posts`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (!stale && res.ok) {
          const data = await res.json();
          if (data.collections) setCollectionSnapshots(data.collections);
        }
      } catch (err) {
        console.error('Failed to load collection data:', err);
      }
    })();
    return () => { stale = true; };
  }, []);

  // Add a post to a collection (persisted with full snapshot)
  const handleAddPostToCollection = useCallback(async (colId: string, post: Post) => {
    setSavingPostId(post.id);
    try {
      // Build a lightweight snapshot with everything needed for rendering
      const snapshot: Partial<Post> = {
        id: post.id,
        userId: post.userId,
        username: post.username,
        userAvatar: post.userAvatar,
        imageUrl: post.imageUrl,
        imageUrls: post.imageUrls,
        caption: post.caption,
        likes: post.likes,
      };
      // Optimistic update
      setCollectionSnapshots(prev => {
        const existing = prev[colId] || [];
        if (existing.some(s => s.id === post.id)) return prev;
        return { ...prev, [colId]: [...existing, snapshot] };
      });
      const res = await fetch(`${BASE_URL}/api/collections/${colId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ postId: post.id, postSnapshot: snapshot }),
      });
      if (res.ok) {
        const data = await res.json();
        setCollectionSnapshots(prev => ({ ...prev, [colId]: data.posts }));
      }
    } catch (err) {
      console.error('Failed to add post to collection:', err);
    } finally {
      setSavingPostId(null);
    }
  }, []);

  // Remove a post from a collection (persisted)
  const handleRemovePostFromCollection = useCallback(async (colId: string, postId: string) => {
    setSavingPostId(postId);
    try {
      // Optimistic update
      setCollectionSnapshots(prev => ({
        ...prev,
        [colId]: (prev[colId] || []).filter(s => s.id !== postId),
      }));
      const res = await fetch(`${BASE_URL}/api/collections/${colId}/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCollectionSnapshots(prev => ({ ...prev, [colId]: data.posts }));
      }
    } catch (err) {
      console.error('Failed to remove post from collection:', err);
    } finally {
      setSavingPostId(null);
    }
  }, []);

  // Derive creators from real posts data
  const creators: Creator[] = useMemo(() => {
    // Group posts by userId and aggregate stats
    const userMap = new Map<string, { userId: string; username: string; avatar: string; totalLikes: number; postCount: number; topPostImage: string }>();
    
    for (const post of posts) {
      const existing = userMap.get(post.userId);
      if (existing) {
        existing.totalLikes += post.likes;
        existing.postCount += 1;
        // Keep the post with the most likes as the top post
        if (post.likes > (existing.totalLikes - post.likes) / (existing.postCount - 1)) {
          existing.topPostImage = post.imageUrl || post.imageUrls?.[0] || existing.topPostImage;
        }
      } else {
        userMap.set(post.userId, {
          userId: post.userId,
          username: post.username,
          avatar: post.userAvatar,
          totalLikes: post.likes,
          postCount: 1,
          topPostImage: post.imageUrl || post.imageUrls?.[0] || post.userAvatar,
        });
      }
    }

    // Sort by total likes (most popular first) and take top 5
    const sorted = Array.from(userMap.values())
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, 5);

    return sorted.map((u, i) => ({
      id: u.userId,
      username: u.username,
      avatar: u.avatar,
      followers: u.totalLikes > 1000 ? `${(u.totalLikes / 1000).toFixed(0)}K` : `${u.totalLikes}`,
      category: CATEGORIES[i % CATEGORIES.length],
      isFollowing: followedCreatorIds.has(u.userId),
      vibeScore: Math.min(99, 80 + Math.floor(u.totalLikes / 100)),
      topPost: u.topPostImage,
    }));
  }, [posts, followedCreatorIds]);

  const handleFollowCreator = (creatorId: string) => {
    setFollowedCreatorIds(prev => {
      const next = new Set(prev);
      if (next.has(creatorId)) next.delete(creatorId);
      else next.add(creatorId);
      return next;
    });
    onFollowToggle?.(creatorId);
  };

  const handleSaveCollection = (colId: string) => {
    setSavedCollections(prev => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  };

  const handleExpandCollection = (colId: string) => {
    setExpandedCollectionId(prev => prev === colId ? null : colId);
  };

  // Map posts to collections — use backend snapshots so ANY user's posts are visible,
  // enriched with local post data when available (for up-to-date likes etc.)
  const collectionPosts = useMemo(() => {
    const postById = new Map(posts.filter(p => p.imageUrl || (p.imageUrls && p.imageUrls.length > 0)).map(p => [p.id, p]));
    const postsWithImages = Array.from(postById.values());
    const map: Record<string, Partial<Post>[]> = {};

    CURATED_COLLECTIONS.forEach((col, colIdx) => {
      const seenIds = new Set<string>();
      const result: Partial<Post>[] = [];

      // 1. Add persisted snapshots first — these include posts from ALL users
      const snapshots = collectionSnapshots[col.id] || [];
      for (const snap of snapshots) {
        if (!snap.id || seenIds.has(snap.id)) continue;
        // Prefer fresh local data if available, otherwise use the snapshot
        const localPost = postById.get(snap.id);
        result.push(localPost || snap);
        seenIds.add(snap.id);
      }

      // 2. Fill with auto-distributed posts only if no persisted snapshots exist
      if (snapshots.length === 0) {
        postsWithImages.forEach((p, postIdx) => {
          if (postIdx % CURATED_COLLECTIONS.length === colIdx && !seenIds.has(p.id)) {
            result.push(p);
            seenIds.add(p.id);
          }
        });
      }

      map[col.id] = result;
    });
    return map;
  }, [posts, collectionSnapshots]);

  // Weekly recap data
  const weeklyRecap = useMemo(() => {
    const userPosts = posts.filter(p => p.userId !== 'user123');
    const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);
    const topPost = userPosts.length > 0 ? userPosts.reduce((max, p) => p.likes > max.likes ? p : max, userPosts[0]) : null;
    return { totalLikes, topPost, postsCount: userPosts.length };
  }, [posts]);

  return (
    <div className="h-full flex flex-col bg-card scrollbar-hide">
      {/* Header */}
      <div className="shrink-0 z-40 bg-background border-b-4 border-foreground px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all active:scale-95">
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
          <div>
            <h1 className="text-lg font-black text-foreground uppercase italic tracking-tight leading-none flex items-center gap-2">
              <Star size={18} strokeWidth={3} className="text-foreground" style={{ animation: 'crownFloat 2s ease infinite' }} />
              Spotlight
            </h1>
            <p className="text-[9px] font-mono font-bold text-foreground/50 uppercase">Curated picks & creator highlights</p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 mt-3">
          {[
            { id: 'featured' as const, label: 'Featured', icon: <Crown size={14} strokeWidth={3} /> },
            { id: 'collections' as const, label: 'Collections', icon: <Bookmark size={14} strokeWidth={3} /> },
            { id: 'recap' as const, label: 'Weekly Recap', icon: <Calendar size={14} strokeWidth={3} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black uppercase transition-all active:scale-95 border-2 border-foreground ${
                activeSection === tab.id
                  ? 'bg-foreground text-background shadow-none translate-x-[1px] translate-y-[1px]'
                  : 'bg-card text-foreground shadow-[2px_2px_0px_0px_var(--foreground)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* FEATURED CREATORS */}
        {activeSection === 'featured' && (
          <div className="p-4 space-y-5" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
            {creators.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 border-4 border-foreground flex items-center justify-center mb-4 bg-background/10">
                  <Star size={28} strokeWidth={3} className="text-foreground/30" />
                </div>
                <h3 className="text-sm font-black text-foreground uppercase mb-1">No Creators Yet</h3>
                <p className="text-[10px] font-mono text-foreground/50">Check back soon for featured creators!</p>
              </div>
            ) : (<>
            {/* Creator of the Week */}
            <div className="border-4 border-foreground overflow-hidden shadow-[6px_6px_0px_0px_var(--foreground)]">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={creators[0].topPost} 
                  alt="" 
                  className="w-full h-full object-cover"
                  style={{ animation: 'storyKenBurns 20s ease-in-out infinite alternate' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-background border-2 border-foreground">
                  <Crown size={12} strokeWidth={3} />
                  <span className="text-[10px] font-black uppercase">Creator of the Week</span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3">
                  <button
                    onClick={() => onViewProfile?.(creators[0].id)}
                    className="w-14 h-14 border-3 border-white bg-black overflow-hidden shrink-0 hover:scale-105 transition-transform"
                    style={{ borderWidth: '3px' }}
                  >
                    <img src={creators[0].avatar} alt="" className="w-full h-full object-cover" />
                  </button>
                  <div className="flex-1">
                    <p className="text-white font-black text-lg uppercase leading-none">{creators[0].username}</p>
                    <p className="text-white/60 text-xs font-mono font-bold">{creators[0].followers} followers</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm border border-white/30">
                    <Zap size={12} className="text-background" />
                    <span className="text-white text-[10px] font-black">{creators[0].vibeScore}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rising Creators */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} strokeWidth={3} />
                <h2 className="text-sm font-black text-foreground uppercase">Rising Creators</h2>
              </div>
              <div className="space-y-2">
                {creators.slice(1).map((creator, i) => (
                  <div
                    key={creator.id}
                    onClick={() => onViewProfile?.(creator.id)}
                    className="flex items-center gap-3 p-3 border-3 border-foreground bg-card shadow-[3px_3px_0px_0px_var(--foreground)] hover:shadow-[1px_1px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer active:scale-[0.98]"
                    style={{ animation: `fadeSlideUp 0.3s ease ${i * 80}ms both`, borderWidth: '3px' }}
                  >
                    <span className="text-lg font-black text-foreground/30 w-6 text-center">#{i + 2}</span>
                    <button
                      onClick={() => onViewProfile?.(creator.id)}
                      className="w-12 h-12 border-2 border-foreground bg-foreground overflow-hidden shrink-0 hover:scale-105 transition-transform relative"
                    >
                      <img src={creator.avatar} alt="" className="w-full h-full object-cover" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => onViewProfile?.(creator.id)} className="text-sm font-black text-foreground uppercase truncate hover:text-[#ff7a2e] transition-colors">
                          {creator.username}
                        </button>
                        <span className="px-1.5 py-0.5 text-[8px] font-black uppercase bg-foreground/10 text-foreground/60 border border-foreground/20">{creator.category}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-foreground/50">{creator.followers}</span>
                        <span className="flex items-center gap-0.5 text-[10px] font-mono font-bold text-background">
                          <Zap size={10} /> {creator.vibeScore}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFollowCreator(creator.id); }}
                      className={`px-4 py-2 text-[10px] font-black uppercase border-2 border-foreground transition-all active:scale-95 ${
                        creator.isFollowing 
                          ? 'bg-card text-foreground shadow-none' 
                          : 'bg-foreground text-background shadow-[2px_2px_0px_0px_var(--background)]'
                      }`}
                    >
                      {creator.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Post Preview */}
            <div className="border-4 border-foreground bg-foreground p-4 shadow-[4px_4px_0px_0px_var(--background)]">
              <div className="flex items-center gap-2 mb-3">
                <Flame size={16} strokeWidth={3} className="text-background" style={{ animation: 'flameDance 1.5s ease infinite' }} />
                <span className="text-xs font-black text-background uppercase">Trending Now</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {creators.slice(0, 3).map((c, i) => (
                  <button 
                    key={c.id} 
                    onClick={() => onViewProfile?.(c.id)}
                    className="aspect-square border-2 border-white/20 overflow-hidden hover:border-background transition-colors group"
                    style={{ animation: `fadeSlideUp 0.3s ease ${i * 100}ms both` }}
                  >
                    <img src={c.topPost} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            </div>
            </>)}
          </div>
        )}

        {/* CURATED COLLECTIONS */}
        {activeSection === 'collections' && (
          <div className="p-4 space-y-4" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
            <div className="flex items-center gap-2 mb-1">
              <Bookmark size={16} strokeWidth={3} />
              <h2 className="text-sm font-black text-foreground uppercase">Curated This Week</h2>
            </div>

            {CURATED_COLLECTIONS.map((col, i) => (
              <div
                key={col.id}
                className="w-full border-4 border-foreground overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-left"
                style={{ animation: `fadeSlideUp 0.3s ease ${i * 100}ms both` }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleExpandCollection(col.id)}
                  className="w-full text-left group cursor-pointer"
                >
                  <div className="relative h-36 overflow-hidden">
                    <img src={col.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{col.emoji}</span>
                        <div>
                          <p className="text-white font-black text-sm uppercase leading-none">{col.title}</p>
                          <p className="text-white/60 text-[10px] font-mono font-bold mt-0.5">{col.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-black border border-white/30">
                        {(collectionPosts[col.id]?.length || 0)} posts
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSaveCollection(col.id); }}
                        className={`w-8 h-8 flex items-center justify-center border-2 transition-all active:scale-90 ${
                          savedCollections.has(col.id)
                            ? 'bg-[#ff7a2e] border-black'
                            : 'bg-white/20 backdrop-blur-sm border-white/30'
                        }`}
                      >
                        <Bookmark size={14} strokeWidth={3} fill={savedCollections.has(col.id) ? 'black' : 'none'} className={savedCollections.has(col.id) ? 'text-black' : 'text-white'} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between" style={{ backgroundColor: col.color + '15' }}>
                    <div className="flex -space-x-1.5">
                      {(collectionPosts[col.id] || []).slice(0, 4).map((p, n) => (
                        <div key={p.id || n} className="w-6 h-6 border border-white bg-black/20 overflow-hidden" style={{ borderRadius: '2px' }}>
                          <img src={p.imageUrl || p.imageUrls?.[0] || ''} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {(collectionPosts[col.id]?.length || 0) < 4 && Array.from({ length: 4 - (collectionPosts[col.id]?.length || 0) }).map((_, n) => (
                        <div key={`placeholder-${n}`} className="w-6 h-6 border border-white bg-black/20 overflow-hidden" style={{ borderRadius: '2px' }}>
                          <div className="w-full h-full" style={{ backgroundColor: col.color + '40' }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-foreground/60 uppercase">
                      {expandedCollectionId === col.id ? 'Collapse' : 'View All'}
                      <ChevronRight size={12} className={`transition-transform duration-200 ${expandedCollectionId === col.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded post grid */}
                {expandedCollectionId === col.id && (
                  <div className="border-t-3 border-foreground" style={{ borderTopWidth: '3px', backgroundColor: col.color + '08' }}>
                    {(collectionPosts[col.id] || []).length > 0 ? (
                      <div className="grid grid-cols-3 gap-[2px] p-[2px]">
                        {(collectionPosts[col.id] || []).slice(0, 9).map((post, pIdx) => (
                          <button
                            key={post.id || pIdx}
                            onClick={() => handleOpenPostDetail(post)}
                            className="relative aspect-square overflow-hidden group/post bg-black"
                            style={{ animation: `fadeSlideUp 0.2s ease ${pIdx * 50}ms both` }}
                          >
                            <img
                              src={post.imageUrl || post.imageUrls?.[0] || ''}
                              alt=""
                              className="w-full h-full object-cover group-hover/post:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/post:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover/post:opacity-100 transition-opacity flex items-center gap-1.5">
                                <Heart size={14} strokeWidth={3} className="text-white" />
                                <span className="text-white text-xs font-black">{post.likes}</span>
                              </div>
                            </div>
                            {/* Creator avatar */}
                            <div className="absolute bottom-1 left-1 w-5 h-5 border border-white bg-black overflow-hidden opacity-80">
                              <img src={post.userAvatar} alt="" className="w-full h-full object-cover" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-[10px] font-black text-foreground/40 uppercase">No posts in this collection yet</p>
                      </div>
                    )}
                    {/* Add Post button */}
                    <button
                      onClick={() => setAddToCollectionId(col.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 border-t-2 border-foreground/20 hover:bg-foreground/5 transition-all active:scale-[0.98]"
                      style={{ backgroundColor: col.color + '10' }}
                    >
                      <Plus size={16} strokeWidth={3} className="text-foreground/60" />
                      <span className="text-[11px] font-black text-foreground/60 uppercase">Add Your Post</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Suggest a collection */}
            <div className="border-4 border-dashed border-foreground/30 p-6 flex flex-col items-center gap-2 hover:border-foreground hover:bg-foreground/5 transition-all cursor-pointer">
              <Sparkles size={24} className="text-foreground/30" />
              <p className="text-xs font-black text-foreground/40 uppercase">Suggest a Collection</p>
              <p className="text-[10px] font-mono text-foreground/30">Think we're missing something? Let us know!</p>
            </div>
          </div>
        )}

        {/* WEEKLY RECAP */}
        {activeSection === 'recap' && (
          <div className="p-4 space-y-5" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
            {/* Hero Stats */}
            <div className="border-4 border-foreground bg-gradient-to-br from-foreground via-foreground to-background/30 p-6 shadow-[6px_6px_0px_0px_var(--background)]">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} strokeWidth={3} className="text-[#ff7a2e]" />
                <span className="text-xs font-black text-[#ff7a2e] uppercase">This Week on Vibe</span>
              </div>
              <p className="text-3xl font-black text-white uppercase leading-tight">
                The Community<br/>
                <span className="text-[#ff7a2e]">Never Sleeps</span>
              </p>
              <p className="text-xs font-mono text-white/50 mt-2">March 8 - March 14, 2026</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {WEEKLY_HIGHLIGHTS.map((stat, i) => (
                <div
                  key={stat.id}
                  className="border-4 border-foreground bg-card p-4 shadow-[4px_4px_0px_0px_var(--foreground)] hover:shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                  style={{ animation: `fadeSlideUp 0.3s ease ${i * 100}ms both` }}
                >
                  <div className="w-10 h-10 border-2 border-foreground flex items-center justify-center mb-3" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-black text-foreground" style={{ animation: i === 0 ? 'statPop 2s ease infinite 1s' : undefined }}>{stat.stat}</p>
                  <p className="text-[9px] font-black text-foreground/50 uppercase mt-1">{stat.title}</p>
                </div>
              ))}
            </div>

            {/* Your Week */}
            <div className="border-4 border-foreground bg-background/10 p-5 shadow-[4px_4px_0px_0px_var(--foreground)]">
              <div className="flex items-center gap-2 mb-4">
                <Award size={18} strokeWidth={3} />
                <h2 className="text-sm font-black text-foreground uppercase">Your Week in Review</h2>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 border-2 border-foreground bg-card">
                  <p className="text-xl font-black text-foreground">{weeklyRecap.postsCount}</p>
                  <p className="text-[8px] font-black text-foreground/50 uppercase">Feed Posts</p>
                </div>
                <div className="p-3 border-2 border-foreground bg-card">
                  <p className="text-xl font-black text-[#ff7a2e]">{weeklyRecap.totalLikes > 1000 ? `${(weeklyRecap.totalLikes/1000).toFixed(1)}K` : weeklyRecap.totalLikes}</p>
                  <p className="text-[8px] font-black text-foreground/50 uppercase">Total Likes</p>
                </div>
                <div className="p-3 border-2 border-foreground bg-card">
                  <p className="text-xl font-black text-foreground">7</p>
                  <p className="text-[8px] font-black text-foreground/50 uppercase">Day Streak</p>
                </div>
              </div>
            </div>

            {/* Top Moments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star size={16} strokeWidth={3} />
                <h2 className="text-sm font-black text-foreground uppercase">Top Moments</h2>
              </div>
              <div className="space-y-2">
                {[
                  { emoji: '🏆', text: 'Your post reached 5K+ likes', detail: 'Top 1% of creators this week' },
                  { emoji: '🤝', text: '12 new followers joined your community', detail: 'Growth rate: +8%' },
                  { emoji: '💬', text: 'Your comment got 200+ likes', detail: 'Most liked reply on a trending post' },
                  { emoji: '🔥', text: 'You maintained a 7-day vibe streak', detail: 'Keep it going!' },
                ].map((moment, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 border-3 border-foreground bg-card shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                    style={{ animation: `fadeSlideUp 0.3s ease ${i * 80}ms both`, borderWidth: '3px' }}
                  >
                    <span className="text-2xl" style={i === 0 ? { animation: 'crownFloat 2s ease infinite' } : undefined}>{moment.emoji}</span>
                    <div>
                      <p className="text-xs font-black text-foreground uppercase">{moment.text}</p>
                      <p className="text-[10px] font-mono text-foreground/50 mt-0.5">{moment.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Add to Collection Modal ── */}
      {addToCollectionId && (() => {
        const col = CURATED_COLLECTIONS.find(c => c.id === addToCollectionId)!;
        const currentIds = new Set((collectionSnapshots[addToCollectionId] || []).map(s => s.id).filter(Boolean) as string[]);
        // Show all posts with images (any user can contribute)
        const availablePosts = posts.filter(p => p.imageUrl || (p.imageUrls && p.imageUrls.length > 0));

        return (
          <div className="absolute inset-0 z-50 flex items-end justify-center" style={{ animation: 'fadeSlideUp 0.2s ease both' }}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={() => setAddToCollectionId(null)} />

            {/* Sheet */}
            <div className="relative w-full max-h-[75%] bg-card border-t-4 border-foreground flex flex-col" style={{ animation: 'fadeSlideUp 0.25s ease both' }}>
              {/* Sheet Header */}
              <div className="flex items-center justify-between p-4 border-b-3 border-foreground shrink-0" style={{ borderBottomWidth: '3px', backgroundColor: col.color + '10' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{col.emoji}</span>
                  <div>
                    <p className="text-sm font-black text-foreground uppercase leading-none">Add to {col.title}</p>
                    <p className="text-[9px] font-mono text-foreground/50 mt-0.5">Tap a post to add or remove it</p>
                  </div>
                </div>
                <button
                  onClick={() => setAddToCollectionId(null)}
                  className="w-9 h-9 border-2 border-foreground bg-card flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all active:scale-90"
                >
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              {/* Post Grid */}
              <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                {availablePosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Image size={32} className="text-foreground/20 mb-3" />
                    <p className="text-xs font-black text-foreground/40 uppercase">No Posts Available</p>
                    <p className="text-[10px] font-mono text-foreground/30 mt-1">Create posts with images to add them here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-[3px]">
                    {availablePosts.map((post, pIdx) => {
                      const isInCollection = currentIds.has(post.id);
                      const isSaving = savingPostId === post.id;
                      return (
                        <button
                          key={post.id}
                          disabled={isSaving}
                          onClick={() => {
                            if (isInCollection) {
                              handleRemovePostFromCollection(addToCollectionId, post.id);
                            } else {
                              handleAddPostToCollection(addToCollectionId, post);
                            }
                          }}
                          className={`relative aspect-square overflow-hidden border-2 transition-all active:scale-95 ${
                            isInCollection
                              ? 'border-[#ff7a2e] shadow-[2px_2px_0px_0px_#ff7a2e]'
                              : 'border-black/20 hover:border-black'
                          } ${isSaving ? 'opacity-50' : ''}`}
                          style={{ animation: `fadeSlideUp 0.2s ease ${pIdx * 30}ms both` }}
                        >
                          <img
                            src={post.imageUrl || post.imageUrls?.[0] || ''}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {/* Selection overlay */}
                          {isInCollection && (
                            <div className="absolute inset-0 bg-[#ff7a2e]/20 flex items-center justify-center">
                              <div className="w-8 h-8 bg-[#ff7a2e] border-2 border-black flex items-center justify-center">
                                <Check size={18} strokeWidth={3} className="text-black" />
                              </div>
                            </div>
                          )}
                          {/* Saving spinner */}
                          {isSaving && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="w-6 h-6 border-3 border-white border-t-transparent animate-spin" style={{ borderWidth: '3px' }} />
                            </div>
                          )}
                          {/* Post info */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 border border-white bg-black overflow-hidden shrink-0">
                                <img src={post.userAvatar} alt="" className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[8px] font-black text-white truncate">{post.username}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Done button */}
              <div className="p-3 border-t-2 border-black/20 shrink-0">
                <button
                  onClick={() => setAddToCollectionId(null)}
                  className="w-full py-3 bg-black text-[#ff7a2e] font-black text-sm uppercase border-2 border-black shadow-[3px_3px_0px_0px_#ff7a2e] hover:shadow-[1px_1px_0px_0px_#ff7a2e] hover:translate-x-[1px] hover:translate-y-[1px] transition-all active:scale-[0.98]"
                >
                  Done ({currentIds.size} selected)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Post Detail Overlay ── */}
      {resolvedViewingPost && (() => {
        const post = resolvedViewingPost;
        const postImage = post.imageUrl || post.imageUrls?.[0] || '';
        const postAvatar = post.userAvatar || '';
        const postUsername = post.username || 'Unknown';
        const postCaption = post.caption || '';
        const postLikes = post.likes || 0;
        const postUserId = post.userId || '';

        return (
        <div className="absolute inset-0 z-[60] bg-black flex flex-col" style={{ animation: 'fadeSlideUp 0.2s ease both' }}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/90 shrink-0">
            <button
              onClick={() => setViewingPost(null)}
              className="w-9 h-9 border-2 border-white/30 bg-white/10 flex items-center justify-center active:scale-90 transition-all"
            >
              <X size={18} strokeWidth={3} className="text-white" />
            </button>
            <span className="text-[10px] font-black text-white/50 uppercase">Collection Post</span>
            <div className="w-9" />
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center overflow-hidden bg-black">
            {postImage ? (
              <img
                src={postImage}
                alt=""
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-white/30">
                <Image size={48} strokeWidth={2} />
                <span className="text-xs font-black uppercase">Image unavailable</span>
              </div>
            )}
          </div>

          {/* Bottom info */}
          <div className="shrink-0 bg-black/90 border-t-2 border-white/10 p-4">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => { if (postUserId) { setViewingPost(null); onViewProfile?.(postUserId); } }}
                className="w-10 h-10 border-2 border-white/30 bg-black overflow-hidden shrink-0"
              >
                {postAvatar ? (
                  <img src={postAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#ff7a2e]/30 flex items-center justify-center">
                    <span className="text-sm font-black text-white">{postUsername.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </button>
              <div className="flex-1">
                <p className="text-sm font-black text-white uppercase">{postUsername}</p>
                {postCaption && (
                  <p className="text-[10px] text-white/60 font-mono line-clamp-2 mt-0.5">{postCaption}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewingPostLiked(prev => !prev)}
                className="flex items-center gap-1.5 active:scale-90 transition-all"
              >
                <Heart
                  size={22}
                  strokeWidth={3}
                  fill={viewingPostLiked ? '#ff7a2e' : 'none'}
                  className={viewingPostLiked ? 'text-[#ff7a2e]' : 'text-white'}
                />
                <span className="text-xs font-black text-white">
                  {postLikes + (viewingPostLiked ? 1 : 0)}
                </span>
              </button>
              {postUserId && (
                <button
                  onClick={() => { setViewingPost(null); onViewProfile?.(postUserId); }}
                  className="ml-auto px-4 py-2 bg-[#ff7a2e] border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all"
                >
                  View Profile
                </button>
              )}
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}