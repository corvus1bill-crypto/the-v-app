import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Grid, Heart, MessageCircle, MoreVertical, Settings, Share2, UserPlus, UserCheck, Zap, Sparkles, Users, TrendingUp, ImageIcon, Search, X, Trophy, ThumbsDown, Award, Crown, Bookmark, Plus, Smile, Archive } from 'lucide-react';
import { Post, Story } from "../types";
import { FullScreenPostView } from "./FullScreenPostView";
import { CommentsModal } from "./CommentsModal";
import { ShareModal } from "./ShareModal";
import { StoryViewer } from "./StoryViewer";
import { projectId, publicAnonKey } from '../../../utils/supabase/info.tsx';
import * as db from '../db';

// --- Types & Mock Data ---

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isFollowing: boolean;
}

// No mock data — followers fetched from backend, following from parent props

const defaultUserPosts: Post[] = [
  { id: '1', userId: 'user123', username: 'YourUsername', userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&h=800&fit=crop', caption: 'Amazing sunset', likes: 2847, comments: 156, shares: 42, timestamp: '2 days ago', isLiked: false, isSaved: false },
  { id: '2', userId: 'user123', username: 'YourUsername', userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&h=800&fit=crop', caption: 'City vibes', likes: 5234, comments: 289, shares: 94, timestamp: '4 days ago', isLiked: false, isSaved: false },
  { id: '3', userId: 'user123', username: 'YourUsername', userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1682687221080-5cb261c645cb?w=800&h=800&fit=crop', caption: 'Coffee time', likes: 3421, comments: 198, shares: 56, timestamp: '1 week ago', isLiked: false, isSaved: false },
  { id: '4', userId: 'user123', username: 'YourUsername', userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1682687220923-c58b9a4592ae?w=800&h=800&fit=crop', caption: 'Weekend adventure', likes: 6782, comments: 334, shares: 103, timestamp: '1 week ago', isLiked: false, isSaved: false },
  { id: '5', userId: 'user123', username: 'YourUsername', userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', caption: 'Nature beauty', likes: 8923, comments: 421, shares: 187, timestamp: '2 weeks ago', isLiked: false, isSaved: false },
  { id: '6', userId: 'user123', username: 'YourUsername', userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1682687218147-9806132dc697?w=800&h=800&fit=crop', caption: 'Urban exploration', likes: 4321, comments: 198, shares: 72, timestamp: '2 weeks ago', isLiked: false, isSaved: false },
];

const mockUserStats = {
  badges: [
    { id: 1, name: 'Early Adopter', icon: '🚀', color: '#9ACD32' },
    { id: 2, name: '100 Posts', icon: '💯', color: '#FFC107' },
    { id: 3, name: 'Trending Master', icon: '🔥', color: '#ff7a2e' },
  ],
  globalLiked: 2,
  globalDisliked: null as number | null,
  friendsLiked: 1,
  friendsDisliked: 3,
};

// --- Sub-Components ---

function UserListModal({
  title,
  users,
  onClose,
  onToggleFollow,
  onNavigateToProfile,
  isLoading
}: {
  title: string;
  users: User[];
  onClose: () => void;
  onToggleFollow: (userId: string) => void;
  onNavigateToProfile: (userId: string) => void;
  isLoading?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-label="Close modal" />
      <div className="relative w-full max-w-md bg-card border-4 border-foreground shadow-[8px_8px_0px_0px_var(--foreground)] flex flex-col max-h-[70%] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b-4 border-foreground bg-background">
          <h2 className="text-lg font-black text-foreground uppercase italic">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 bg-foreground text-background flex items-center justify-center border-2 border-foreground hover:bg-card hover:text-foreground transition-colors shadow-[2px_2px_0px_0px_var(--background)]">
            <X size={20} strokeWidth={3} />
          </button>
        </div>
        <div className="p-4 border-b-4 border-foreground bg-foreground/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground" size={16} strokeWidth={3} />
            <input
              type="text"
              placeholder="SEARCH USER..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border-2 border-foreground text-foreground font-bold font-mono text-sm py-2 pl-10 pr-4 outline-none placeholder:text-foreground/40 focus:shadow-[4px_4px_0px_0px_var(--foreground)] transition-all uppercase"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 bg-card">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-foreground/50 font-mono font-bold">
              <div className="w-8 h-8 border-4 border-foreground border-t-transparent animate-spin mb-3" />
              <p>LOADING...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 border-b-2 border-foreground/10 last:border-0 hover:bg-foreground/5 transition-colors group">
                <button 
                  onClick={() => {
                    onClose();
                    onNavigateToProfile(user.id);
                  }}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="w-12 h-12 border-2 border-foreground bg-foreground overflow-hidden shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-none transition-all">
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-foreground uppercase truncate">{user.name}</p>
                    <p className="text-xs font-mono font-bold text-foreground/50 truncate">@{user.username}</p>
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFollow(user.id); }}
                  className={`px-4 py-1.5 text-xs font-black uppercase border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ${user.isFollowing ? 'bg-card text-foreground' : 'bg-foreground text-background'}`}
                >
                  {user.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-foreground/50 font-mono font-bold">
              <p>NO FOLLOWERS YET</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

interface ProfilePageProps {
  userId: string;
  userProfile?: { name: string; username: string; bio: string; avatar: string; };
  posts?: Post[];
  stories?: Story[];
  allPosts?: Post[];
  friendsPosts?: Post[];
  followersCount?: number;
  followingCount?: number;
  followedUsers?: User[];
  onOpenSettings?: () => void;
  onNavigateToPost?: (postId: string) => void;
  onStoryView?: (storyId: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  onFollowToggle?: (userId: string) => void;
  onNavigateToRecap?: () => void;
}

export function ProfilePage({ userId, userProfile, posts, stories, allPosts, friendsPosts, followersCount, followingCount, followedUsers, onOpenSettings, onNavigateToPost, onStoryView, onNavigateToProfile, onFollowToggle, onNavigateToRecap }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'leaderboard' | 'saved' | 'archived'>('posts');
  const [savedCollections, setSavedCollections] = useState<Array<{ id: string; name: string; emoji: string; postIds: string[] }>>([
    { id: 'all', name: 'All Saved', emoji: '🔖', postIds: [] },
    { id: 'travel', name: 'Travel', emoji: '✈️', postIds: [] },
    { id: 'food', name: 'Food', emoji: '🍜', postIds: [] },
  ]);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [moodEmoji, setMoodEmoji] = useState<string>(() => localStorage.getItem('vibeMood') || '');
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const MOODS = ['😊', '🔥', '😎', '🥳', '😴', '🤔', '💪', '🎨', '✈️', '🎵', '😍', '🤯'];
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedPostTab, setSelectedPostTab] = useState<'posts' | 'saved' | 'archived'>('posts');
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeUserList, setActiveUserList] = useState<'followers' | 'following' | null>(null);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [localFollowersCount, setLocalFollowersCount] = useState(followersCount ?? 0);
  const [localFollowingCount, setLocalFollowingCount] = useState(followingCount ?? 0);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [archivedPostIds, setArchivedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vibe_archived_posts');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [savedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vibe_saved_posts_data');
      const parsed = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed)) return [];
      // vibe_saved_posts_data stores Post objects; extract ids
      return parsed.map((p: any) => (typeof p === 'string' ? p : p?.id)).filter(Boolean);
    } catch { return []; }
  });
  const [deletedPostIds, setDeletedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vibe_deleted_posts');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Use real followed users from parent props (empty array fallback)
  const following = followedUsers || [];

  // Update local counts when props change
  useEffect(() => {
    if (followersCount !== undefined) setLocalFollowersCount(followersCount);
    if (followingCount !== undefined) setLocalFollowingCount(followingCount);
  }, [followersCount, followingCount]);

  // Fetch real followers from backend when the followers modal opens
  useEffect(() => {
    if (activeUserList !== 'followers') return;
    if (!userId || userId === 'user123') return;

    let cancelled = false;
    setLoadingFollowers(true);

    const fetchFollowers = async () => {
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/users/${userId}/followers`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        if (!res.ok || cancelled) return;
        const data: User[] = await res.json();
        if (Array.isArray(data) && !cancelled) {
          setFollowers(data);
          console.log(`✅ Loaded ${data.length} real followers`);
        }
      } catch (err: any) {
        console.error('❌ Error fetching followers list:', err);
      } finally {
        if (!cancelled) setLoadingFollowers(false);
      }
    };

    fetchFollowers();
    return () => { cancelled = true; };
  }, [activeUserList, userId]);

  const isOwnProfile = true; // ProfilePage is only rendered for the current user's own profile
  const displayProfile = userProfile || { name: 'Your Display Name', username: 'YourUsername', bio: 'WIP User Bio', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop' };
  const displayPosts = posts || defaultUserPosts;
  const displayStories = stories || [];

  // Saved posts: pull from allPosts (app-wide) filtered by savedPostIds from localStorage,
  // then fall back to own posts that have isSaved flag set.
  const savedPosts = (() => {
    const allPostsPool = allPosts && allPosts.length > 0 ? allPosts : displayPosts;
    if (savedPostIds.length > 0) {
      const fromPool = allPostsPool.filter(p => savedPostIds.includes(p.id));
      if (fromPool.length > 0) return fromPool;
    }
    return allPostsPool.filter(p => p.isSaved);
  })();

  const calculateBadges = () => {
    const badges: any[] = [];
    if (displayPosts.length > 0) badges.push({ id: 1, name: 'Early Adopter', icon: '🚀', color: '#9ACD32' });
    const totalLikes = displayPosts.reduce((sum, post) => sum + post.likes, 0);
    const maxLikes = displayPosts.length > 0 ? Math.max(...displayPosts.map(p => p.likes)) : 0;
    if (maxLikes >= 10000) badges.push({ id: 7, name: 'Viral Post', icon: '💥', color: '#EF4444' });
    else if (maxLikes >= 5000) badges.push({ id: 5, name: 'Trending Master', icon: '🔥', color: '#ff7a2e' });
    else if (maxLikes >= 1000) badges.push({ id: 22, name: 'Rising Star', icon: '🌠', color: '#F59E0B' });
    if (displayPosts.length >= 100) badges.push({ id: 2, name: '100 Posts', icon: '💯', color: '#FFC107' });
    else if (displayPosts.length >= 10) badges.push({ id: 4, name: '10 Posts', icon: '✨', color: '#A78BFA' });
    else if (displayPosts.length >= 1) badges.push({ id: 51, name: 'First Post', icon: '🌱', color: '#4ADE80' });
    if (displayPosts.length > 0 || followers.length > 0) badges.push({ id: 81, name: 'Active Member', icon: '⚡', color: '#A3E635' });
    if (totalLikes >= 10000) badges.push({ id: 25, name: 'Fan Favorite', icon: '💕', color: '#FBCFE8' });
    else if (totalLikes >= 1000) badges.push({ id: 57, name: '1K Likes', icon: '💗', color: '#FBE4E4' });
    const totalComments = displayPosts.reduce((sum, post) => sum + post.comments, 0);
    if (totalComments >= 1000) badges.push({ id: 6, name: 'Social Butterfly', icon: '💬', color: '#EC4899' });
    return badges.slice(0, 9);
  };

  const calculateRankings = () => {
    const rankings = { globalLiked: null as number | null, globalDisliked: null as number | null, friendsLiked: null as number | null, friendsDisliked: null as number | null };
    const userTopLikedPost = displayPosts.length > 0 ? displayPosts.reduce((max, post) => post.likes > max.likes ? post : max, displayPosts[0]) : null;
    if (allPosts && allPosts.length > 0 && userTopLikedPost) {
      const top10 = [...allPosts].sort((a, b) => b.likes - a.likes).slice(0, 10);
      const userRank = top10.findIndex(post => post.userId === userId) + 1;
      rankings.globalLiked = userRank > 0 && userRank <= 3 ? userRank : null;
    }
    if (friendsPosts && friendsPosts.length > 0 && userTopLikedPost) {
      const top10 = [...displayPosts, ...friendsPosts].sort((a, b) => b.likes - a.likes).slice(0, 10);
      const userRank = top10.findIndex(post => post.userId === userId) + 1;
      rankings.friendsLiked = userRank > 0 && userRank <= 3 ? userRank : null;
    }
    return rankings;
  };

  const userBadges = displayPosts.length > 0 ? calculateBadges() : mockUserStats.badges;
  const userRankings = (allPosts || friendsPosts) ? calculateRankings() : mockUserStats;
  const allBadges = [...userBadges];
  if (userRankings.globalLiked) allBadges.push({ id: 100 + userRankings.globalLiked, name: `Global #${userRankings.globalLiked} Liked`, icon: 'trophy', color: userRankings.globalLiked === 1 ? '#FFC107' : userRankings.globalLiked === 2 ? '#CBD5E1' : '#34D399', rank: userRankings.globalLiked, type: 'liked' });
  if (userRankings.globalDisliked) allBadges.push({ id: 200 + userRankings.globalDisliked, name: `Global #${userRankings.globalDisliked} Disliked`, icon: 'shame', color: '#9ACD32', rank: userRankings.globalDisliked, type: 'disliked' });
  if (userRankings.friendsLiked) allBadges.push({ id: 300 + userRankings.friendsLiked, name: `Friends #${userRankings.friendsLiked} Liked`, icon: 'trophy', color: userRankings.friendsLiked === 1 ? '#FFC107' : '#CBD5E1', rank: userRankings.friendsLiked, type: 'liked' });
  if (userRankings.friendsDisliked) allBadges.push({ id: 400 + userRankings.friendsDisliked, name: `Friends #${userRankings.friendsDisliked} Disliked`, icon: 'shame', color: '#8B4513', rank: userRankings.friendsDisliked, type: 'disliked' });

  const handlePostClick = (post: Post) => {
    if (onNavigateToPost) onNavigateToPost(post.id);
    else {
      setSelectedPost(post);
      setSelectedPostTab('posts');
    }
  };

  const handleToggleFollowUser = async (listType: 'followers' | 'following', targetUserId: string) => {
    // Delegate to the parent's real follow toggle handler for persistent follow/unfollow
    if (onFollowToggle) {
      onFollowToggle(targetUserId);
    }
    // Optimistically update local followers list UI
    setFollowers(prev => prev.map(u =>
      u.id === targetUserId ? { ...u, isFollowing: !u.isFollowing } : u
    ));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const profileViews = useMemo(() => {
    let h = 0;
    for (let i = 0; i < (userId || 'x').length; i++) h = ((userId || 'x').charCodeAt(i) + ((h << 5) - h)) | 0;
    return Math.abs(h) % 2800 + 400;
  }, [userId]);

  const renderBio = (bio: string) => {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = bio.split(urlRegex);
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a key={i} href={part.startsWith('http') ? part : `https://${part}`} target="_blank" rel="noopener noreferrer"
          className="text-background underline underline-offset-2 decoration-2 font-black hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
        >{part}</a>
      ) : part
    );
  };

  return (
    <>
      <div className="h-full flex flex-col bg-transparent">
        {/* Header */}
        <div className="shrink-0 z-40 bg-background border-b-4 border-foreground shadow-[0px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_10%,transparent)]" style={{
          paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
          paddingRight: 'calc(1rem + env(safe-area-inset-right))',
          paddingTop: '1rem',
          paddingBottom: '1rem'
        }}>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-foreground uppercase italic tracking-tight"
              style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) both' }}>MY PROFILE</h1>
            {isOwnProfile && (
              <button onClick={onOpenSettings} className="w-10 h-10 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all active:scale-95">
                <Settings className="text-foreground" size={20} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable area: Profile Info + Tabs + Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide" style={{
          paddingBottom: 'calc(80px + 1rem + env(safe-area-inset-bottom))'
        }}>
        {/* Profile Info */}
        <div className="px-4 py-6 bg-background" style={{ animation: 'springUp 0.5s cubic-bezier(.22,.68,0,1.2) 0.05s both' }}>
          <div className="flex items-start gap-5 mb-6">
            <div className="relative">
              {displayStories.length > 0 ? (
                <button
                  onClick={() => setViewingStoryIndex(0)}
                  className="relative cursor-pointer group"
                >
                  <div className={`p-[3px] ${displayStories.every(s => s.viewed) ? 'bg-foreground/30' : 'bg-gradient-to-tr from-background via-background/70 to-background'} shadow-[4px_4px_0px_0px_var(--foreground)] group-hover:shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all`}
                    style={displayStories.some(s => !s.viewed) ? { animation: 'storyRingPulse 2s ease-in-out infinite' } : undefined}
                  >
                    <div className="w-[90px] h-[90px] border-[3px] border-white bg-black overflow-hidden">
                      <img src={displayProfile.avatar} alt={displayProfile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  </div>
                </button>
              ) : (
                <div className="w-24 h-24 border-4 border-foreground bg-foreground shadow-[4px_4px_0px_0px_var(--foreground)] overflow-hidden">
                  <img src={displayProfile.avatar} alt={displayProfile.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] z-10"
                style={{ animation: 'badgePop 0.5s cubic-bezier(.22,.68,0,1.2) 0.3s both' }}>
                <span className="text-foreground font-black text-xs">ME</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2 text-center pt-2">
              <div className="py-2 border-2 border-transparent">
                <p className="text-xl font-black text-foreground">{formatNumber(displayPosts.length)}</p>
                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wide">Posts</p>
              </div>
              <button onClick={() => setActiveUserList('followers')} className="py-2 hover:bg-foreground/5 border-2 border-transparent hover:border-foreground/10 transition-colors">
                <p className="text-xl font-black text-foreground">{formatNumber(localFollowersCount)}</p>
                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wide">Followers</p>
              </button>
              <button onClick={() => setActiveUserList('following')} className="py-2 hover:bg-foreground/5 border-2 border-transparent hover:border-foreground/10 transition-colors">
                <p className="text-xl font-black text-foreground">{formatNumber(localFollowingCount)}</p>
                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wide">Following</p>
              </button>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-black text-lg text-foreground uppercase leading-none">{displayProfile.name}</p>
              {moodEmoji && (
                <span className="text-xl cursor-pointer hover:scale-110 transition-transform" title="Current mood"
                  onClick={() => isOwnProfile && setShowMoodPicker(!showMoodPicker)}
                  style={{ animation: 'heartPop 0.4s cubic-bezier(.22,.68,0,1.2) both' }}
                >{moodEmoji}</span>
              )}
              {isOwnProfile && (
                <button onClick={() => setShowMoodPicker(!showMoodPicker)}
                  className="flex items-center gap-1 px-2 py-0.5 border-2 border-foreground/20 text-[9px] font-black text-foreground/40 uppercase hover:border-foreground hover:text-foreground transition-all"
                >
                  <Smile size={10} strokeWidth={3} />
                  {moodEmoji ? 'Change' : 'Set Mood'}
                </button>
              )}
            </div>
            {showMoodPicker && isOwnProfile && (
              <div className="flex flex-wrap gap-2 p-3 bg-card border-2 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] mb-3"
                style={{ animation: 'scaleIn 0.18s cubic-bezier(.22,.68,0,1.3) both' }}
              >
                <p className="w-full text-[9px] font-black text-foreground/40 uppercase mb-1">Pick a mood:</p>
                {MOODS.map(m => (
                  <button key={m} onClick={() => { const next = moodEmoji === m ? '' : m; setMoodEmoji(next); localStorage.setItem('vibeMood', next); setShowMoodPicker(false); }}
                    className={`text-2xl hover:scale-125 transition-transform ${moodEmoji === m ? 'scale-125 ring-2 ring-foreground' : ''}`}
                  >{m}</button>
                ))}
              </div>
            )}
            <div className="p-3 bg-foreground/5 border-l-4 border-foreground">
              <p className="text-sm text-foreground font-mono font-bold whitespace-pre-line leading-relaxed">{renderBio(displayProfile.bio)}</p>
            </div>
            {isOwnProfile && (
              null
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-3 border-b-0">
            <button onClick={onOpenSettings} className="flex-1 py-3 bg-background border-2 border-foreground text-foreground font-black uppercase shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] active:scale-[0.98] transition-all">
              Edit Profile
            </button>
            <button onClick={onOpenSettings} className="flex-1 py-3 bg-foreground border-2 border-foreground text-background font-black uppercase shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] active:scale-[0.98] transition-all">
              Settings
            </button>
          </div>
          
          {/* Vibe Recap Button */}
          {isOwnProfile && onNavigateToRecap && (
            null
          )}
          
          {/* Vibe Stories Section */}
          {displayStories.length > 0 && (
            <div className="px-4 py-4 border-b-4 border-foreground border-dashed">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} strokeWidth={3} className="text-foreground" />
                <h3 className="text-sm font-black text-foreground uppercase">Vibes</h3>
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
        </div>

        {/* Tabs */}
        <div className="z-30 bg-card border-b-4 border-foreground">
          <div className="flex p-1 gap-1 bg-background">
            <button onClick={() => setActiveTab('posts')} className={`flex-1 flex items-center justify-center gap-2 py-3 transition-colors ${activeTab === 'posts' ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-foreground/5'}`}>
              <Grid size={18} strokeWidth={3} />
              <span className="text-sm font-black uppercase">Posts</span>
            </button>
            <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 flex items-center justify-center gap-2 py-3 transition-colors ${activeTab === 'leaderboard' ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-foreground/5'}`}>
              <TrendingUp size={18} strokeWidth={3} />
              <span className="text-sm font-black uppercase">Stats</span>
            </button>
            <button onClick={() => setActiveTab('saved')} className={`flex-1 flex items-center justify-center gap-2 py-3 transition-colors ${activeTab === 'saved' ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-foreground/5'}`}>
              <Bookmark size={18} strokeWidth={3} />
              <span className="text-sm font-black uppercase">Saved</span>
            </button>
            <button onClick={() => setActiveTab('archived')} className={`flex-1 flex items-center justify-center gap-2 py-3 transition-colors ${activeTab === 'archived' ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-foreground/5'}`}>
              <Archive size={18} strokeWidth={3} />
              <span className="text-sm font-black uppercase">Archived</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 bg-background min-h-full pb-24">
          {activeTab === 'posts' && (
            <div className="grid grid-cols-3 gap-3">
              {displayPosts.filter(p => p.userId === userId && !archivedPostIds.includes(p.id) && !deletedPostIds.includes(p.id)).map((post, postIdx) => (
                <div key={post.id} onClick={() => handlePostClick(post)}
                  className="aspect-square bg-foreground border-2 border-foreground overflow-hidden cursor-pointer group relative hover:border-background transition-colors"
                  style={{ animation: `cardEntrance 0.4s cubic-bezier(.22,.68,0,1.2) ${postIdx * 40}ms both` }}
                >
                  <img src={post.imageUrl || 'https://images.unsplash.com/photo-1643473218649-7b3e02239423?w=800&q=80'} alt={post.caption}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <div className="flex justify-between text-white text-[10px] font-bold font-mono">
                      <span className="flex items-center gap-1"><Heart size={10} fill="white" /> {formatNumber(post.likes)}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={10} /> {formatNumber(post.comments)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Award className="text-foreground" size={20} strokeWidth={3} />
                  <h2 className="text-lg font-black text-foreground uppercase">My Badges</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {allBadges.map((badge: any) => (
                    <motion.div key={badge.id}
                      whileHover={{ scale: 1.05 }}
                      className="aspect-square bg-card border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col items-center justify-center p-2 cursor-pointer"
                      style={{ backgroundColor: badge.color + '20' }}
                    >
                      {badge.icon === 'trophy' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground mb-1">
                          <ellipse cx="12" cy="21" rx="6" ry="2" fill={badge.color} stroke="currentColor" />
                          <path d="M12 21C10.5 17 9 11 5 3L8 3C10 8 11 11 12 13C13 11 14 8 16 3L19 3C15 11 13.5 17 12 21Z" fill={badge.color} stroke="currentColor" />
                        </svg>
                      ) : badge.icon === 'shame' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground mb-1">
                          <rect x="7" y="7" width="10" height="14" rx="1" fill={badge.color} stroke="currentColor" strokeWidth="2" />
                          <path d="M6 7h12" stroke="currentColor" strokeWidth="2" />
                          <rect x="8" y="4" width="8" height="3" fill={badge.color} stroke="currentColor" strokeWidth="2" />
                        </svg>
                      ) : (
                        <div className="text-4xl mb-1">{badge.icon}</div>
                      )}
                      <p className="text-[9px] font-black text-foreground uppercase text-center leading-tight">{badge.name}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="text-foreground" size={20} strokeWidth={3} />
                  <h2 className="text-lg font-black text-foreground uppercase">Global Rankings</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart size={16} strokeWidth={3} className="text-foreground" />
                      <p className="text-xs font-black uppercase">Most Liked</p>
                    </div>
                    {userRankings.globalLiked ? (
                      <div className="flex flex-col items-center">
                        <div className="bg-foreground text-background px-3 py-1 border-2 border-foreground">
                          <p className="text-2xl font-black">#{userRankings.globalLiked}</p>
                        </div>
                        <p className="text-[10px] font-bold text-foreground/60 uppercase mt-1 text-center">Top 10 Weekly</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-[10px] font-bold text-foreground/40 uppercase">Not Ranked</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-background border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsDown size={16} strokeWidth={3} className="text-foreground" />
                      <p className="text-xs font-black uppercase">Most Disliked</p>
                    </div>
                    {userRankings.globalDisliked ? (
                      <div className="flex flex-col items-center">
                        <div className="bg-foreground text-background px-3 py-1 border-2 border-foreground">
                          <p className="text-2xl font-black">#{userRankings.globalDisliked}</p>
                        </div>
                        <p className="text-[10px] font-bold text-foreground/60 uppercase mt-1 text-center">Hall of Shame</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-[10px] font-bold text-foreground/40 uppercase">Not Ranked</p>
                        <p className="text-[9px] font-mono text-foreground/30 mt-1">Lucky you!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="text-foreground" size={20} strokeWidth={3} />
                  <h2 className="text-lg font-black text-foreground uppercase">Friends Rankings</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart size={16} strokeWidth={3} className="text-foreground" />
                      <p className="text-xs font-black uppercase">Most Liked</p>
                    </div>
                    {userRankings.friendsLiked ? (
                      <div className="flex flex-col items-center">
                        <div className="bg-foreground text-background px-3 py-1 border-2 border-foreground">
                          <p className="text-2xl font-black">#{userRankings.friendsLiked}</p>
                        </div>
                        <p className="text-[10px] font-bold text-foreground/60 uppercase mt-1 text-center">Among Friends</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-[10px] font-bold text-foreground/40 uppercase">Not Ranked</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-background border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsDown size={16} strokeWidth={3} className="text-foreground" />
                      <p className="text-xs font-black uppercase">Most Disliked</p>
                    </div>
                    {userRankings.friendsDisliked ? (
                      <div className="flex flex-col items-center">
                        <div className="bg-foreground text-background px-3 py-1 border-2 border-foreground">
                          <p className="text-2xl font-black">#{userRankings.friendsDisliked}</p>
                        </div>
                        <p className="text-[10px] font-bold text-foreground/60 uppercase mt-1 text-center">Friend Shame</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-[10px] font-bold text-foreground/40 uppercase">Not Ranked</p>
                        <p className="text-[9px] font-mono text-foreground/30 mt-1">Your friends love you!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-4" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
              <div className="grid grid-cols-2 gap-3">
                {savedCollections.map((col, i) => (
                  <div key={col.id}
                    className="border-4 border-foreground bg-background shadow-[4px_4px_0px_0px_var(--foreground)] p-4 cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all"
                    style={{ animation: `fadeSlideUp 0.3s ease ${i * 60}ms both` }}
                  >
                    <div className="text-3xl mb-2">{col.emoji}</div>
                    <p className="font-black text-sm text-foreground uppercase">{col.name}</p>
                    <p className="text-[10px] font-mono text-foreground/40 mt-1">{col.postIds.length} items</p>
                  </div>
                ))}
                {isOwnProfile && (
                  <button onClick={() => setShowNewCollection(true)}
                    className="border-4 border-dashed border-foreground/30 p-4 flex flex-col items-center justify-center gap-2 hover:border-foreground hover:bg-foreground/5 transition-all"
                  >
                    <div className="w-10 h-10 border-2 border-foreground flex items-center justify-center">
                      <Plus size={20} strokeWidth={3} className="text-foreground" />
                    </div>
                    <p className="text-xs font-black text-foreground/40 uppercase">New Collection</p>
                  </button>
                )}
              </div>

              {showNewCollection && (
                <div className="border-4 border-foreground p-4 bg-card shadow-[4px_4px_0px_0px_var(--foreground)]" style={{ animation: 'scaleIn 0.2s ease both' }}>
                  <p className="text-xs font-black text-foreground uppercase mb-3">New Collection</p>
                  <div className="flex gap-2">
                    <input type="text" placeholder="COLLECTION NAME..." value={newColName} onChange={(e) => setNewColName(e.target.value)}
                      className="flex-1 px-3 py-2 border-2 border-foreground font-bold font-mono text-sm placeholder:text-foreground/30 outline-none uppercase" autoFocus
                    />
                    <button onClick={() => { if (!newColName.trim()) return; setSavedCollections(prev => [...prev, { id: `col-${Date.now()}`, name: newColName.trim(), emoji: '📁', postIds: [] }]); setNewColName(''); setShowNewCollection(false); }}
                      className="px-4 py-2 bg-foreground text-background border-2 border-foreground font-black uppercase text-xs shadow-[2px_2px_0px_0px_var(--background)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                    >CREATE</button>
                    <button onClick={() => setShowNewCollection(false)} className="px-3 py-2 border-2 border-foreground font-black uppercase text-xs hover:bg-foreground/5 transition-colors">✕</button>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-black text-foreground/40 uppercase mb-3">All Saved Posts</p>
                {savedPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 border-4 border-dashed border-foreground/20">
                    <Bookmark size={40} strokeWidth={2} className="text-foreground/20 mb-3" />
                    <p className="text-sm font-black text-foreground/40 uppercase">Nothing saved yet</p>
                    <p className="text-xs font-mono text-foreground/30 mt-1">Tap 🔖 on any post to save it</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {savedPosts.map((post, idx) => (
                      <div key={post.id} onClick={() => { setSelectedPost(post); setSelectedPostTab('saved'); }}
                        className="aspect-square border-2 border-foreground overflow-hidden cursor-pointer group relative hover:border-background transition-colors"
                        style={{ animation: `fadeSlideUp 0.3s ease ${idx * 50}ms both` }}
                      >
                        <img src={post.imageUrl || ''} alt={post.caption} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Bookmark size={20} className="text-white fill-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'archived' && (
            <div className="space-y-4" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
              <div className="flex items-center gap-2 mb-1">
                <Archive size={20} strokeWidth={3} className="text-foreground" />
                <h2 className="text-lg font-black text-foreground uppercase">Archived Posts</h2>
              </div>
              <p className="text-[10px] font-mono text-foreground/40 mb-3">Only visible to you</p>
              {displayPosts.filter(p => archivedPostIds.includes(p.id)).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border-4 border-dashed border-foreground/20">
                  <Archive size={40} strokeWidth={2} className="text-foreground/20 mb-3" />
                  <p className="text-sm font-black text-foreground/40 uppercase">Nothing archived yet</p>
                  <p className="text-xs font-mono text-foreground/30 mt-1">Archive posts from the post options menu</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {displayPosts.filter(p => archivedPostIds.includes(p.id)).map((post, idx) => (
                    <div key={post.id} onClick={() => { setSelectedPost(post); setSelectedPostTab('archived'); }}
                      className="aspect-square border-2 border-foreground overflow-hidden cursor-pointer group relative hover:border-background transition-colors"
                      style={{ animation: `fadeSlideUp 0.3s ease ${idx * 50}ms both` }}
                    >
                      <img src={post.imageUrl || ''} alt={post.caption} className="w-full h-full object-cover transition-all" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Archive size={20} className="text-white" />
                      </div>
                      <div className="absolute top-1 right-1 bg-black/70 px-1.5 py-0.5">
                        <Archive size={10} className="text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>{/* end scrollable area */}

        {/* Full Screen Post View Modal */}
        {selectedPost && (() => {
          const feedPosts = selectedPostTab === 'archived'
            ? displayPosts.filter(p => archivedPostIds.includes(p.id))
            : selectedPostTab === 'saved'
            ? savedPosts
            : displayPosts.filter(p => p.userId === userId && !archivedPostIds.includes(p.id) && !deletedPostIds.includes(p.id));
          return (
          <FullScreenPostView
            posts={feedPosts}
            initialPostId={selectedPost.id}
            onClose={() => setSelectedPost(null)}
            onLike={() => {}}
            onSave={() => {}}
            onComment={() => setShowComments(true)}
            onNavigateToProfile={(userId, postId) => {
              setSelectedPost(null);
              onNavigateToProfile?.(userId);
            }}
            isArchived={selectedPostTab === 'archived'}
            currentUserId={userId}
            currentUsername={displayProfile.username}
            currentUserAvatar={displayProfile.avatar}
            onDelete={(postId) => {
              const updated = [...deletedPostIds, postId];
              setDeletedPostIds(updated);
              localStorage.setItem('vibe_deleted_posts', JSON.stringify(updated));
              setSelectedPost(null);
            }}
            onArchive={(postId) => {
              const isAlreadyArchived = archivedPostIds.includes(postId);
              const updated = isAlreadyArchived
                ? archivedPostIds.filter(id => id !== postId)
                : [...archivedPostIds, postId];
              setArchivedPostIds(updated);
              localStorage.setItem('vibe_archived_posts', JSON.stringify(updated));
              setSelectedPost(null);
            }}
          />
          );
        })()}
        
        {/* Comments Modal */}
        {showComments && selectedPost && (
          <CommentsModal
            post={selectedPost}
            onClose={() => setShowComments(false)}
            onAddComment={(postId, comment) => { console.log('Added comment:', comment); }}
            onDeleteComment={(postId, commentId) => { console.log('Deleted comment:', commentId); }}
            currentUserId={userId}
            currentUsername={displayProfile.username}
            currentUserAvatar={displayProfile.avatar}
          />
        )}

        {/* Followers Modal */}
        {activeUserList === 'followers' && (
          <UserListModal 
            title="FOLLOWERS" 
            users={followers} 
            onClose={() => setActiveUserList(null)}
            onToggleFollow={(id) => handleToggleFollowUser('followers', id)}
            onNavigateToProfile={(userId) => {
              if (onNavigateToProfile) {
                onNavigateToProfile(userId);
              }
            }}
            isLoading={loadingFollowers}
          />
        )}

        {/* Following Modal */}
        {activeUserList === 'following' && (
          <UserListModal 
            title="FOLLOWING" 
            users={following} 
            onClose={() => setActiveUserList(null)}
            onToggleFollow={(id) => handleToggleFollowUser('following', id)}
            onNavigateToProfile={(userId) => {
              if (onNavigateToProfile) {
                onNavigateToProfile(userId);
              }
            }}
          />
        )}

        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          postUrl={`https://vibe.app/p/${userId}?u=${displayProfile.username}`}
          currentUserId={userId}
          currentUsername={displayProfile.username}
          currentUserAvatar={displayProfile.avatar}
        />

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
    </>
  );
}