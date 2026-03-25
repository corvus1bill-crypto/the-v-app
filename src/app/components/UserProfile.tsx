import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, MoreVertical, Grid, Heart, MessageCircle, Settings, UserPlus, UserMinus, Bell, Share2, Link2, Flag, Ban, BellOff, X, Sparkles } from "lucide-react";
import { PostCard } from "./PostCard";
import { CommentsModal } from "./CommentsModal";
import { FullScreenPostView } from "./FullScreenPostView";
import { FullScreenImageViewer } from "./FullScreenImageViewer";
import { StoryViewer } from "./StoryViewer";
import { Post, Story } from "../types";
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useUserProfile, useUserPosts } from '../hooks/useApi';

interface ListUser {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  isFollowing: boolean;
}

interface UserListModalProps {
  title: string;
  users: ListUser[];
  onClose: () => void;
  onNavigateToProfile: (userId: string) => void;
  onFollowToggle: (userId: string) => void;
  isLoading?: boolean;
}

function UserListModal({ title, users, onClose, onNavigateToProfile, onFollowToggle, isLoading }: UserListModalProps) {
  return (
    <div className="absolute inset-0 z-[70] bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-card border-4 border-foreground shadow-[8px_8px_0px_0px_var(--foreground)] flex flex-col max-h-[70%] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b-4 border-foreground flex items-center justify-between bg-background">
          <h3 className="font-black text-lg text-foreground uppercase italic">{title}</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-foreground border-2 border-foreground flex items-center justify-center hover:bg-card hover:text-foreground text-background transition-colors shadow-[2px_2px_0px_0px_var(--card)]"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2 bg-card">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black text-foreground/50 uppercase">Loading...</p>
            </div>
          ) : (
            <>
              {users.map((user, index) => (
                <div 
                  key={user.userId} 
                  className="flex items-center justify-between p-3 hover:bg-foreground/5 transition-colors group border-b-2 border-foreground/10 last:border-0"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <button 
                    className="flex items-center gap-3 flex-1 text-left"
                    onClick={() => {
                      onClose();
                      onNavigateToProfile(user.userId);
                    }}
                  >
                    <div className="w-12 h-12 border-2 border-foreground bg-foreground overflow-hidden shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-none transition-all">
                        <img 
                        src={user.avatar} 
                        alt={user.username} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0" 
                        onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.username}&background=random`;
                        }}
                        />
                    </div>
                    <div>
                      <p className="font-black text-sm text-foreground uppercase">{user.displayName}</p>
                      <p className="text-xs font-mono font-bold text-foreground/50">@{user.username}</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => onFollowToggle(user.userId)}
                    className={`px-4 py-1.5 text-xs font-black uppercase border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ${
                      user.isFollowing 
                        ? 'bg-card text-foreground' 
                        : 'bg-foreground text-background'
                    }`}
                  >
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
              {users.length === 0 && (
                 <div className="text-center py-8 text-foreground/50 font-mono font-bold">
                   <p>NO USERS FOUND IN DATABASE</p>
                 </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

interface UserProfileProps {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  postsCount: number;
  isFollowing: boolean;
  posts: Post[];
  stories?: Story[];
  onBack: () => void;
  isOwnProfile?: boolean;
  onNavigateToSettings?: () => void;
  onNavigateToMessages?: (user?: { userId: string, username: string, userAvatar: string }) => void;
  initialPostId?: string | null;
  onFollowToggle?: () => void;
  onStoryView?: (storyId: string) => void;
  onViewProfile?: (userId: string) => void;
  currentUserId?: string;
  currentUsername?: string;
  currentUserAvatar?: string;
  onHashtagClick?: (tag: string) => void;
  onSharePost?: (post: Post) => void;
  onLike?: (postId: string) => void;
  onSave?: (postId: string) => void;
}

export function UserProfile({
  userId,
  username,
  displayName,
  avatar,
  bio,
  followers,
  following,
  postsCount,
  isFollowing: initialIsFollowing,
  posts,
  stories,
  onBack,
  isOwnProfile = false,
  onNavigateToSettings,
  onNavigateToMessages,
  initialPostId,
  onFollowToggle,
  onStoryView,
  onViewProfile,
  currentUserId,
  currentUsername,
  currentUserAvatar,
  onHashtagClick,
  onSharePost,
  onLike,
  onSave,
}: UserProfileProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  
  const [followersCount, setFollowersCount] = useState(followers);
  const [followingCount, setFollowingCount] = useState(following);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  
  const displayStories = stories || [];
  
  const [activeUserList, setActiveUserList] = useState<'followers' | 'following' | null>(null);
  const [followersList, setFollowersList] = useState<ListUser[]>([]);
  const [followingList, setFollowingList] = useState<ListUser[]>([]);
  const [loadingUserList, setLoadingUserList] = useState(false);

  // API Hooks for user profile and posts
  const { userProfile: apiProfile, loading: profileLoading } = useUserProfile(userId);
  const { posts: userPostsApi, loading: postsLoading } = useUserPosts(userId);

  // Use API data if available, fall back to props
  const displayPosts = userPostsApi.length > 0 ? userPostsApi : posts;

  // Fetch real follower/following counts from backend on mount
  useEffect(() => {
    let cancelled = false;
    const base = `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d`;
    const headers = { Authorization: `Bearer ${publicAnonKey}` };

    const fetchCounts = async () => {
      try {
        // Fetch both counts in parallel
        const [followersRes, followingRes] = await Promise.all([
          fetch(`${base}/users/${userId}/followers/count`, { headers }).catch(() => null),
          fetch(`${base}/users/${userId}/following/count`, { headers }).catch(() => null),
        ]);
        if (cancelled) return;
        if (followersRes?.ok) {
          const data = await followersRes.json();
          if (typeof data.count === 'number' && !cancelled) {
            setFollowersCount(data.count);
            console.log(`📊 [UserProfile] ${userId} follower count: ${data.count}`);
          }
        }
        if (followingRes?.ok) {
          const data = await followingRes.json();
          if (typeof data.count === 'number' && !cancelled) {
            setFollowingCount(data.count);
            console.log(`📊 [UserProfile] ${userId} following count: ${data.count}`);
          }
        }
      } catch (err) {
        console.error('❌ [UserProfile] Error fetching counts:', err);
      }
    };

    fetchCounts();
    return () => { cancelled = true; };
  }, [userId]);

  // Hard-reset everything ONLY when switching to a completely different user
  useEffect(() => {
    setFollowersCount(followers);
    setFollowingCount(following);
    setIsFollowing(initialIsFollowing);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Sync follow state from parent without resetting counts (avoids race condition
  // where toggling follow would override backend-fetched counts with stale 0 values)
  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  // Sync prop counts when they change from 0 to a real value (backend fetch completed in parent)
  useEffect(() => {
    if (followers > 0) setFollowersCount(prev => prev === 0 ? followers : prev);
  }, [followers]);
  useEffect(() => {
    if (following > 0) setFollowingCount(prev => prev === 0 ? following : prev);
  }, [following]);

  // Fetch real followers/following list when modal opens
  useEffect(() => {
    if (!activeUserList) return;
    let cancelled = false;
    setLoadingUserList(true);

    const base = `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d`;
    const headers = { Authorization: `Bearer ${publicAnonKey}` };
    const endpoint = activeUserList === 'followers'
      ? `${base}/users/${userId}/followers`
      : `${base}/users/${userId}/following`;

    const fetchList = async () => {
      try {
        console.log(`👥 [UserProfile] Fetching ${activeUserList} list for ${userId}`);
        const res = await fetch(endpoint, { headers });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && !cancelled) {
            const mapped: ListUser[] = data.map((u: any) => ({
              userId: u.id || u.userId,
              username: u.username || u.name || u.id,
              displayName: u.name || u.username || u.id,
              avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
              isFollowing: u.isFollowing ?? false,
            }));
            if (activeUserList === 'followers') setFollowersList(mapped);
            else setFollowingList(mapped);
            console.log(`✅ [UserProfile] Loaded ${mapped.length} real ${activeUserList}`);
          }
        } else {
          console.warn(`⚠️ [UserProfile] Failed to fetch ${activeUserList}, status:`, res.status);
        }
      } catch (err) {
        console.error(`❌ [UserProfile] Error fetching ${activeUserList} list:`, err);
      } finally {
        if (!cancelled) setLoadingUserList(false);
      }
    };

    fetchList();
    return () => { cancelled = true; };
  }, [activeUserList, userId]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPostId) {
      const postExists = posts.some(p => p.id === initialPostId);
      if (postExists) {
        setHighlightedPostId(initialPostId);
        setTimeout(() => {
          const element = document.getElementById(`profile-post-${initialPostId}`);
          if (element && scrollContainerRef.current) {
            // Use direct scrollTop instead of scrollIntoView to avoid parent-scroll bug inside scaled container
            const containerRect = scrollContainerRef.current.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const offset = elementRect.top - containerRect.top + scrollContainerRef.current.scrollTop - (containerRect.height / 2) + (elementRect.height / 2);
            scrollContainerRef.current.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
            setTimeout(() => {
              setHighlightedPostId(null);
            }, 2000);
          }
        }, 300);
      }
    }
  }, [initialPostId, posts]);

  const handleMainFollowToggle = () => {
    if (onFollowToggle) {
      onFollowToggle();
    }
    
    if (isFollowing) {
      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } else {
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    }
  };

  const handleListFollowToggle = (listType: 'followers' | 'following', targetUserId: string) => {
    const updateList = (list: ListUser[]) => 
      list.map(u => u.userId === targetUserId ? { ...u, isFollowing: !u.isFollowing } : u);

    let isNowFollowing = false;

    if (listType === 'followers') {
      setFollowersList(prev => {
        const updated = updateList(prev);
        const user = updated.find(u => u.userId === targetUserId);
        if (user) isNowFollowing = user.isFollowing;
        return updated;
      });
    } else {
      setFollowingList(prev => {
        const updated = updateList(prev);
        const user = updated.find(u => u.userId === targetUserId);
        if (user) isNowFollowing = user.isFollowing;
        return updated;
      });
    }

    if (isOwnProfile) {
      if (isNowFollowing) {
        setFollowingCount(prev => prev + 1);
      } else {
        setFollowingCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const copyToClipboard = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'absolute';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert('Profile link copied to clipboard!');
      } else {
        throw new Error('Copy command failed');
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      alert(`Copy this link: ${text}`);
    }
    document.body.removeChild(textarea);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="h-full flex flex-col bg-transparent scrollbar-hide">
      {/* Header */}
      <div className="shrink-0 z-40">
        <div className="bg-background border-b-4 border-foreground px-4 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-background border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] flex items-center justify-center hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all active:scale-95"
            >
              <ArrowLeft className="text-foreground" size={20} strokeWidth={3} />
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-lg font-black text-foreground uppercase tracking-tight"
                style={{ animation: 'fadeSlideUp 0.35s cubic-bezier(.22,.68,0,1.2) both' }}>@{username}</h2>
            </div>
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="w-10 h-10 bg-background border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] flex items-center justify-center hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all active:scale-95"
            >
              <MoreVertical className="text-foreground" size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 pb-4 bg-background">
        <div className="max-w-2xl mx-auto space-y-6 pt-6">
          {/* Profile Info Card */}
          <div className="bg-background" style={{ animation: 'springUp 0.5s cubic-bezier(.22,.68,0,1.2) 0.05s both' }}>
            <div className="pb-6 border-b-4 border-foreground border-dashed">
              {/* Avatar & Action */}
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <div className="w-28 h-28 border-4 border-foreground bg-foreground shadow-[4px_4px_0px_0px_var(--foreground)] overflow-hidden">
                    <img
                      src={avatar}
                      alt={username}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setViewingImage(avatar)}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)]"
                    style={{ animation: 'badgePop 0.5s cubic-bezier(.22,.68,0,1.2) 0.3s both' }}>
                    <span className="text-foreground font-black text-xs">V</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 flex justify-end gap-4 pt-2">
                   <button 
                    className="text-center group"
                    onClick={() => setActiveUserList('followers')}
                  >
                    <p className="text-xl font-black text-foreground group-hover:text-background transition-colors">{formatNumber(followersCount)}</p>
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wide">Followers</p>
                  </button>
                  <button 
                    className="text-center group"
                    onClick={() => setActiveUserList('following')}
                  >
                    <p className="text-xl font-black text-foreground group-hover:text-background transition-colors">{formatNumber(followingCount)}</p>
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wide">Following</p>
                  </button>
                  <div className="text-center opacity-60">
                    <p className="text-xl font-black text-foreground">{formatNumber(postsCount)}</p>
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wide">Posts</p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-black text-foreground uppercase tracking-tighter leading-none mb-1">{displayName}</h1>
                  {bio && (
                    <div className="p-3 bg-foreground/5 border-l-4 border-foreground">
                        <p className="text-sm text-foreground font-mono font-bold leading-relaxed whitespace-pre-line">{bio}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={onNavigateToSettings}
                        className="flex-1 py-3 bg-background border-2 border-foreground text-foreground font-black uppercase shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <Settings size={18} strokeWidth={3} />
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => {
                          const url = `https://vibe.app/p/${userId}?u=${username}`;
                          if (navigator.share) {
                            navigator.share({ title: `Check out ${username}`, url: url }).catch(() => {});
                          } else {
                            copyToClipboard(url);
                          }
                        }}
                        className="w-14 bg-foreground border-2 border-foreground text-background flex items-center justify-center shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] active:scale-[0.98] transition-all"
                      >
                        <Share2 size={20} strokeWidth={3} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleMainFollowToggle}
                        className={`flex-1 py-3 border-2 border-foreground font-black uppercase shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                          isFollowing
                            ? "bg-background text-foreground"
                            : "bg-foreground text-background"
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus size={18} strokeWidth={3} />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={18} strokeWidth={3} />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => onNavigateToMessages?.({ userId, username, userAvatar: avatar })}
                        className="w-14 bg-background border-2 border-foreground text-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] active:scale-[0.98] transition-all"
                      >
                        <MessageCircle size={20} strokeWidth={3} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Vibe Stories Section */}
          {displayStories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-foreground text-background p-2 border-2 border-foreground w-fit shadow-[4px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_20%,transparent)]">
                <Sparkles size={20} strokeWidth={3} />
                <h3 className="font-black text-sm uppercase">VIBES</h3>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {displayStories.map((story, index) => (
                  <button
                    key={story.id}
                    onClick={() => setViewingStoryIndex(index)}
                    className="flex-shrink-0 group"
                  >
                    <div className={`w-20 h-20 border-4 ${story.viewed ? 'border-foreground/30' : 'border-background'} bg-foreground shadow-[4px_4px_0px_0px_var(--foreground)] overflow-hidden group-hover:border-foreground transition-all`}>
                      {story.videoUrl ? (
                        <video src={story.videoUrl} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={story.imageUrl} alt="Vibe" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-foreground/60 mt-1 text-center truncate max-w-[80px]">{story.timestamp}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Posts Grid */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-foreground text-background p-2 border-2 border-foreground w-fit shadow-[4px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_20%,transparent)]">
              <Grid size={20} strokeWidth={3} />
              <h3 className="font-black text-sm uppercase">POST DATABASE</h3>
            </div>

            {displayPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {displayPosts.map((post) => (
                  <button
                    key={post.id}
                    id={`profile-post-${post.id}`}
                    onClick={() => setSelectedPost(post)}
                    className={`relative aspect-square border-2 border-foreground bg-foreground transition-all group overflow-hidden ${
                      highlightedPostId === post.id 
                        ? 'ring-4 ring-background z-10' 
                        : 'hover:border-background'
                    }`}
                  >
                    {post.videoUrl && !post.imageUrl && !(post.imageUrls && post.imageUrls.length > 0) ? (
                      <video
                        src={post.videoUrl}
                        className="w-full h-full object-cover transition-all duration-300"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={post.imageUrls?.[0] || post.imageUrl || ""}
                        alt={post.caption}
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                        <div className="flex justify-between text-background text-[10px] font-bold font-mono">
                            <span className="flex items-center gap-1"><Heart size={10} fill="currentColor" /> {formatNumber(post.likes)}</span>
                            <span className="flex items-center gap-1"><MessageCircle size={10} /> {formatNumber(post.comments)}</span>
                        </div>
                    </div>
                    {/* Video indicator */}
                    {post.videoUrl && (
                      <div className="absolute top-1 left-1 w-5 h-5 bg-foreground/80 flex items-center justify-center">
                        <span className="text-background text-[8px] font-black">▶</span>
                      </div>
                    )}
                    {/* Multiple images indicator */}
                    {post.imageUrls && post.imageUrls.length > 1 && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-background border border-foreground flex items-center justify-center">
                        <span className="text-foreground text-[10px] font-black">{post.imageUrls.length}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 border-4 border-foreground border-dashed opacity-50">
                <Grid className="text-foreground mb-4" size={48} strokeWidth={1} />
                <p className="font-black text-xl text-foreground uppercase">No Data Found</p>
                <p className="text-sm font-mono font-bold text-foreground">
                  {isOwnProfile ? "INITIATE FIRST POST" : "USER HAS NO LOGS"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Options Menu Dropdown */}
      {showOptionsMenu && (
        <>
          <div 
            className="absolute inset-0 z-50"
            onClick={() => setShowOptionsMenu(false)}
          />
          <div className="absolute right-4 top-16 z-[60] w-64 bg-card border-4 border-foreground shadow-[8px_8px_0px_0px_var(--foreground)]">
            <button
              onClick={() => {
                setShowOptionsMenu(false);
                copyToClipboard(`https://vibe.app/@${username}`);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background hover:text-foreground transition-all group border-b-2 border-foreground"
            >
              <Link2 size={18} strokeWidth={2.5} />
              <div className="flex-1 text-left">
                <p className="font-black text-sm uppercase">Copy Link</p>
              </div>
            </button>

            <button
              onClick={() => {
                setShowOptionsMenu(false);
                if (navigator.share) {
                  navigator.share({
                    title: `${displayName} (@${username})`,
                    text: `Check out ${displayName}'s profile on Vibe!`,
                    url: `https://vibe.app/@${username}`
                  });
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background hover:text-foreground transition-all group"
            >
              <Share2 size={18} strokeWidth={2.5} />
              <div className="flex-1 text-left">
                <p className="font-black text-sm uppercase">Share Profile</p>
              </div>
            </button>

            {!isOwnProfile && (
              <>
                <div className="h-2 bg-foreground/10 border-t-2 border-b-2 border-foreground" />

                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    alert('Notifications muted for this user');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground hover:text-background transition-all group border-b-2 border-foreground"
                >
                  <BellOff size={18} strokeWidth={2.5} />
                  <div className="flex-1 text-left">
                    <p className="font-black text-sm uppercase">Mute</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    if (confirm(`Report @${username}?`)) {
                      alert('Report submitted.');
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500 hover:text-white transition-all group border-b-2 border-foreground text-red-600"
                >
                  <Flag size={18} strokeWidth={2.5} />
                  <div className="flex-1 text-left">
                    <p className="font-black text-sm uppercase">Report</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    if (confirm(`Block @${username}?`)) {
                      alert(`@${username} has been blocked.`);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500 hover:text-white transition-all group text-red-600"
                >
                  <Ban size={18} strokeWidth={2.5} />
                  <div className="flex-1 text-left">
                    <p className="font-black text-sm uppercase">Block User</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Post Modal */}
      {selectedPost && (
        <FullScreenPostView
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={(postId) => { onLike?.(postId); }}
          onSave={(postId) => { onSave?.(postId); }}
          onComment={() => setShowComments(true)}
          onNavigateToProfile={(userId, postId) => {
             setSelectedPost(null);
             onViewProfile?.(userId);
          }}
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

      {/* Followers Modal */}
      {activeUserList === 'followers' && (
        <UserListModal 
          title="FOLLOWERS" 
          users={followersList} 
          onClose={() => setActiveUserList(null)}
          onNavigateToProfile={(id) => {
             setActiveUserList(null);
             onViewProfile?.(id);
          }}
          onFollowToggle={(id) => handleListFollowToggle('followers', id)}
          isLoading={loadingUserList}
        />
      )}

      {/* Following Modal */}
      {activeUserList === 'following' && (
        <UserListModal 
          title="FOLLOWING" 
          users={followingList} 
          onClose={() => setActiveUserList(null)}
          onNavigateToProfile={(id) => {
             setActiveUserList(null);
             onViewProfile?.(id);
          }}
          onFollowToggle={(id) => handleListFollowToggle('following', id)}
          isLoading={loadingUserList}
        />
      )}
      
      {viewingImage && (
        <FullScreenImageViewer
          images={[viewingImage]}
          initialIndex={0}
          onClose={() => setViewingImage(null)}
        />
      )}

      {/* Story Viewer Modal */}
      {viewingStoryIndex !== null && displayStories.length > 0 && (
        <StoryViewer
          stories={displayStories}
          initialIndex={viewingStoryIndex}
          onClose={() => setViewingStoryIndex(null)}
          onStoryView={(storyId) => {
            if (onStoryView) {
              onStoryView(storyId);
            }
          }}
        />
      )}
    </div>
  );
}