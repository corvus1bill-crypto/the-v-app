import { useState, useEffect, useMemo } from 'react';
import { Search, X, Sparkles, Hash, TrendingUp, UserPlus, AtSign, Video, Image, Loader2 } from 'lucide-react';
import { Post } from '../types';
import { explorePosts, topPosts } from '../data/posts';
import { projectId, publicAnonKey } from '../supabaseClient';
import { CommentsModal } from './CommentsModal';
import { FullScreenPostView } from './FullScreenPostView';

const categories = ['Trending', 'Photos', 'Videos', 'Debates', 'New'];

interface VenturePageProps {
  onViewProfile?: (userId: string, postId?: string) => void;
  initialSearchQuery?: string;
  initialSearchResults?: any[];
  onSearchStateChange?: (query: string, results: any[]) => void;
  userPosts?: Post[];
  reopenSearchTrigger?: number;
  onHashtagClick?: (tag: string) => void;
  currentUserId?: string;
  currentUsername?: string;
  currentUserAvatar?: string;
  onSharePost?: (post: Post) => void;
}

export function VenturePage({ onViewProfile, initialSearchQuery = '', initialSearchResults = [], onSearchStateChange, userPosts = [], reopenSearchTrigger, onHashtagClick, currentUserId, currentUsername, currentUserAvatar, onSharePost }: VenturePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('Trending');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState<any[]>(initialSearchResults);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [extraPosts, setExtraPosts] = useState<Post[]>([]);

  // Merge explore posts with user-created posts that meet Venture criteria
  // Venture-worthy: has media (image/video), public visibility, not expired, not a draft
  const posts = useMemo(() => {
    const ventureWorthy = userPosts.filter(p => {
      // Must have visual content
      const hasMedia = !!(p.imageUrl || (p.imageUrls && p.imageUrls.length > 0) || p.videoUrl);
      if (!hasMedia) return false;
      // Skip drafts, archived, anonymous, expired
      if (p.isDraft || p.isArchived || p.isAnonymous) return false;
      if (p.visibility === 'followers') return false;
      if (p.expiresAt && new Date(p.expiresAt).getTime() < Date.now()) return false;
      return true;
    });

    // Merge: user posts first (newest), then explore posts, then extras, deduplicated
    const seen = new Set<string>();
    const merged: Post[] = [];
    for (const p of [...ventureWorthy, ...explorePosts, ...extraPosts]) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        merged.push(p);
      }
    }
    return merged;
  }, [userPosts, extraPosts]);

  // Debug: Log when component receives initial props
  useEffect(() => {
    console.log('🔍 [VenturePage] Mounted with initialSearchQuery:', initialSearchQuery, 'initialSearchResults:', initialSearchResults.length);
  }, []);

  // Search for users when query changes (debounced)
  useEffect(() => {
    let stale = false;

    const doSearch = async () => {
      const query = searchQuery.trim();
      if (!query) {
        setSearchedUsers([]);
        if (onSearchStateChange) onSearchStateChange('', []);
        return;
      }
      setIsSearchingUsers(true);
      try {
        const searchUrl = `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/users/search?q=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        });
        if (stale) return;
        if (response.ok) {
          const users = await response.json();
          if (stale) return;
          const mappedUsers = (users || []).map((user: any) => ({
            userId: user.userId,
            username: user.username,
            userAvatar: user.avatar,
            email: user.email,
            bio: user.bio
          }));
          setSearchedUsers(mappedUsers);
          if (onSearchStateChange) onSearchStateChange(query, mappedUsers);
        }
      } catch (error: any) {
        if (!stale) {
          setSearchedUsers([]);
          if (onSearchStateChange) onSearchStateChange(searchQuery.trim(), []);
        }
      } finally {
        if (!stale) setIsSearchingUsers(false);
      }
    };

    const debounce = setTimeout(doSearch, 350);
    return () => {
      clearTimeout(debounce);
      stale = true;
    };
  }, [searchQuery, onSearchStateChange]);

  const handleLoadMore = () => {
    setIsLoading(true);
    // Simulate loading more posts
    setTimeout(() => {
      const newPosts = explorePosts.map(p => ({
        ...p,
        id: `v-${Date.now()}-${p.id}`,
        timestamp: 'Just now'
      }));
      setExtraPosts(prev => [...prev, ...newPosts]);
      setIsLoading(false);
    }, 1000);
  };

  // Advanced Search Algorithm
  const filteredPosts = useMemo(() => {
    // Helper: parse timestamps into epoch ms for sorting
    const now = Date.now();
    const parsePostTime = (p: Post): number => {
      if ((p as any).createdAt) {
        const d = new Date((p as any).createdAt).getTime();
        if (!isNaN(d)) return d;
      }
      const lower = (p.timestamp || '').toLowerCase();
      if (lower.includes('now') || lower === 'just now') return now;
      const numMatch = lower.match(/(\d+)/);
      const n = numMatch ? parseInt(numMatch[1]) : 0;
      if (lower.includes('m ago') || lower.includes('min')) return now - n * 60000;
      if (lower.includes('h ago') || lower.includes('hour')) return now - n * 3600000;
      if (lower.includes('d ago') || lower.includes('day')) return now - n * 86400000;
      if (lower.includes('w ago') || lower.includes('week')) return now - n * 604800000;
      return now - 86400000;
    };

    // Engagement score for ranking
    const engagementScore = (p: Post): number => {
      const likes = p.likes || 0;
      const comments = p.comments || 0;
      const shares = p.shares || 0;
      const reactions = p.reactions ? Object.values(p.reactions).reduce((a, b) => a + b, 0) : 0;
      return likes * 1 + comments * 3 + shares * 5 + reactions * 2;
    };

    // ── Step 1: Category filter ──
    let result = posts.filter(post => {
      // Category-specific filters
      switch (selectedCategory) {
        case 'Trending':
          // Trending: must have minimum engagement (50+ score) OR be a user post less than 24h old
          {
            const score = engagementScore(post);
            const age = now - parsePostTime(post);
            const isRecent = age < 24 * 60 * 60 * 1000;
            // User-created posts get a grace period: show them on Trending if < 24h old
            const isUserPost = post.id.startsWith('post-');
            if (isUserPost && isRecent) return true;
            return score >= 50;
          }
        case 'Photos':
          return post.type === 'image' || (!post.type && !post.videoUrl && (post.imageUrl || post.imageUrls?.length));
        case 'Videos':
          return post.type === 'video' || (!post.type && !!post.videoUrl);
        case 'Debates':
          return !!post.poll;
        case 'New':
          // New: posts within the last 48 hours
          {
            const age = now - parsePostTime(post);
            return age < 48 * 60 * 60 * 1000;
          }
        default:
          return true;
      }
    });

    // ── Step 2: Search query filter ──
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      if (query === 'video' || query === 'videos') {
        result = result.filter(p => p.type === 'video' || p.videoUrl);
      } else if (query === 'photo' || query === 'photos' || query === 'image' || query === 'images') {
        result = result.filter(p => p.type === 'image' || (!p.videoUrl && (p.imageUrl || p.imageUrls?.length)));
      } else {
        const normalizedQuery = query.replace(/^#/, '');
        result = result.filter(p => {
          const matchesText =
            p.username.toLowerCase().includes(query) ||
            p.caption.toLowerCase().includes(query);
          const matchesTags = p.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery));
          const matchesHashtags = p.hashtags?.some(ht => ht.toLowerCase().includes(normalizedQuery));
          const matchesLocation = p.location?.toLowerCase().includes(query);
          return matchesText || matchesTags || matchesHashtags || matchesLocation;
        });
      }
    }

    // ── Step 3: Category-specific sorting ──
    switch (selectedCategory) {
      case 'Trending':
        // Sort by engagement score (highest first), with recency tiebreaker
        result.sort((a, b) => {
          const scoreA = engagementScore(a);
          const scoreB = engagementScore(b);
          if (scoreB !== scoreA) return scoreB - scoreA;
          return parsePostTime(b) - parsePostTime(a);
        });
        break;
      case 'New':
        // Sort newest first
        result.sort((a, b) => parsePostTime(b) - parsePostTime(a));
        break;
      default:
        // Default: mix of engagement + recency
        result.sort((a, b) => {
          const timeA = parsePostTime(a);
          const timeB = parsePostTime(b);
          const ageHoursA = (now - timeA) / 3600000;
          const ageHoursB = (now - timeB) / 3600000;
          // Decay engagement by age: score / (1 + ageHours * 0.1)
          const decayedA = engagementScore(a) / (1 + ageHoursA * 0.1);
          const decayedB = engagementScore(b) / (1 + ageHoursB * 0.1);
          return decayedB - decayedA;
        });
        break;
    }

    return result;
  }, [posts, selectedCategory, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-transparent scrollbar-hide">
      {/* Industrial Header */}
      <div className="shrink-0 z-40 bg-background border-b-4 border-foreground shadow-[0px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
        <div style={{
          paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
          paddingRight: 'calc(1rem + env(safe-area-inset-right))',
          paddingTop: '1rem',
          paddingBottom: '1rem'
        }}>
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-foreground border-2 border-foreground shadow-[2px_2px_0px_0px_var(--background)]"
               style={{ animation: 'badgePop 0.5s cubic-bezier(.22,.68,0,1.2) 0.1s both' }}>
                <Sparkles className="text-background dark:text-white animate-gentle-wobble" size={24} fill="currentColor" strokeWidth={3} />
             </div>
             <h1 className="text-2xl font-black text-foreground tracking-tight uppercase italic"
               style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) 0.15s both' }}>VENTURE DB</h1>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-4 group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-foreground text-background border border-foreground">
                <Search size={16} strokeWidth={3} />
            </div>
            <input
              type="text"
              placeholder="SEARCH DATABASE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border-4 border-foreground outline-none text-sm font-black text-foreground placeholder:text-foreground/40 shadow-[4px_4px_0px_0px_var(--foreground)] focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all uppercase font-mono"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            {categories.map((category, i) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-black whitespace-nowrap border-2 border-foreground transition-all uppercase ${
                  selectedCategory === category
                    ? 'bg-black text-background dark:text-white shadow-[2px_2px_0px_0px_var(--background)] translate-x-[1px] translate-y-[1px]'
                    : 'bg-background text-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)]'
                }`}
                style={{ animation: `springUp 0.4s cubic-bezier(.22,.68,0,1.2) ${i * 50 + 200}ms both` }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{
        paddingBottom: 'calc(80px + 1rem + env(safe-area-inset-bottom))'
      }}>
        {/* Users Section - Show only when searching */}
        {searchQuery && searchedUsers.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-black text-foreground uppercase mb-3 flex items-center gap-2"
              style={{ animation: 'fadeSlideUp 0.35s cubic-bezier(.22,.68,0,1.2) both' }}>
              <div className="px-2 py-1 bg-foreground text-background border-2 border-foreground">USERS</div>
            </h2>
            <div className="space-y-2">
              {searchedUsers.map((user, idx) => (
                <button
                  key={user.userId}
                  onClick={() => onViewProfile?.(user.userId)}
                  className="w-full flex items-center gap-3 p-3 bg-card border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  style={{ animation: `springUp 0.4s cubic-bezier(.22,.68,0,1.2) ${idx * 60}ms both` }}
                >
                  <div className="w-12 h-12 border-2 border-foreground overflow-hidden">
                    <img
                      src={user.userAvatar}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-black text-foreground uppercase text-sm">{user.username}</p>
                    <p className="text-xs text-foreground/60 font-mono font-bold">{user.bio}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Posts Section */}
        {searchQuery && searchedUsers.length > 0 && filteredPosts.length > 0 && (
          <h2 className="text-lg font-black text-foreground uppercase mb-3 flex items-center gap-2">
            <div className="px-2 py-1 bg-foreground text-background border-2 border-foreground">POSTS</div>
          </h2>
        )}

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredPosts.map((post, idx) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="relative aspect-square border-4 border-foreground bg-card group cursor-pointer shadow-[6px_6px_0px_0px_var(--foreground)] hover:shadow-[3px_3px_0px_0px_var(--foreground)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all overflow-hidden"
                style={{ animation: `fadeSlideUp 0.35s cubic-bezier(.22,.68,0,1.2) ${idx * 45}ms both` }}
              >
                <div className="absolute inset-0 p-0.5 bg-black">
                    {post.videoUrl && !post.imageUrl ? (
                      <video
                        src={post.videoUrl}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={post.imageUrl || post.imageUrls?.[0]}
                        alt={post.caption}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                      />
                    )}
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 border border-white bg-black overflow-hidden">
                          <img
                            src={post.userAvatar}
                            alt={post.username}
                            className="w-full h-full object-cover"
                          />
                      </div>
                      <p className="text-xs font-black text-white uppercase truncate">{post.username}</p>
                    </div>
                    <p className="text-xs text-white/90 line-clamp-2 mb-2 font-mono font-bold leading-tight">{post.caption}</p>
                    <div className="flex items-center gap-3 text-xs text-background dark:text-white font-black font-mono uppercase border-t border-white/20 pt-2">
                      <span className="flex items-center gap-1">
                        <TrendingUp size={12} strokeWidth={3} />
                        {post.likes > 1000 ? `${(post.likes / 1000).toFixed(1)}K` : post.likes}
                      </span>
                      <span>{post.comments} CMT</span>
                    </div>
                </div>

                {/* Top Badge */}
                <div className="absolute top-2 right-2 px-1.5 py-1 bg-background border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)]">
                   {post.type === 'video' ? <Video size={12} className="text-foreground" /> : <Image size={12} className="text-foreground" />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border-4 border-dashed border-foreground/20 bg-foreground/5"
            style={{ animation: 'cardEntrance 0.6s cubic-bezier(.22,.68,0,1.2) both' }}>
            <div className="opacity-20 mb-4 animate-gentle-wobble">
                <Search size={48} strokeWidth={3} className="text-foreground" />
            </div>
            <h3 className="text-lg font-black text-foreground uppercase">No results found</h3>
            <p className="text-sm text-foreground/60 font-mono font-bold">Try searching for a different tag or keyword</p>
          </div>
        )}

        {/* Load More - Only show if not searching or if search yields results */}
        {!searchQuery && (
          <div className="flex justify-center mt-8 mb-4">
            <button 
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-8 py-3 bg-card border-4 border-foreground text-foreground font-black uppercase shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  LOADING...
                </>
              ) : (
                'LOAD MORE DATA'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <FullScreenPostView
          posts={filteredPosts}
          initialPostId={selectedPost.id}
          onClose={() => setSelectedPost(null)}
          onLike={() => {}}
          onSave={() => {}}
          onComment={() => setShowComments(true)}
          onNavigateToProfile={(userId, postId) => onViewProfile?.(userId, postId)}
          onHashtagClick={onHashtagClick}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
          currentUserAvatar={currentUserAvatar}
          onSharePost={onSharePost}
        />
      )}

      {/* Comments Modal */}
      {showComments && selectedPost && (
        <CommentsModal
          post={selectedPost}
          onClose={() => setShowComments(false)}
          onAddComment={() => {}}
          onDeleteComment={() => {}}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
          currentUserAvatar={currentUserAvatar}
        />
      )}
    </div>
  );
}