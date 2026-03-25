import { useState, useRef, useEffect, useMemo } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Search, Bell, Plus, RefreshCw, Loader2, TrendingUp, Hash, UserPlus, AtSign, Sparkles, X, Zap, Clock, Trash2, Home, Compass, PlusSquare, Flame, ArrowLeft, Share2, Smile, Star } from 'lucide-react';
import { Post, Story } from '../types';
import { CommentsModal } from './CommentsModal';
import { StoryViewer } from './StoryViewer';
import { projectId, publicAnonKey } from '../supabaseClient';
import * as db from '../db';
import { explorePosts } from '../data/posts';
import { useSounds } from '../hooks/useSounds';
import { useFeed, useExplorePosts } from '../hooks/useApi';
import { SettingsPage } from './SettingsPage';
import { PostCard } from './PostCard';
import { Stories } from './Stories';
import { UserProfile } from './UserProfile';
import { FullScreenPostView } from './FullScreenPostView';
import { VibeStreak } from './VibeStreak';
import { TrendingTicker } from './TrendingTicker';
import { VibeDailyPrompt } from './VibeDailyPrompt';
import { FollowSuggestions } from './FollowSuggestions';
import { AnimatedBell } from './AnimatedBell';
import { OnlineNowBanner } from './OnlineNowBanner';
import { Screen } from '../App';

// Mock data for posts
const mockPosts: Post[] = [
  {
    id: '1',
    userId: 'user1',
    username: 'TravelDreamer',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&h=1350&fit=crop',
    caption: 'Mountain vibes hitting different today 🏔️✨',
    likes: 2847,
    comments: 156,
    shares: 42,
    timestamp: '2h ago',
    isLiked: false,
    isSaved: false,
  },
  {
    id: '2',
    userId: 'user2',
    username: 'FoodieHeaven',
    userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1080&h=1350&fit=crop',
    caption: 'City lights never looked so good 🌃',
    likes: 5234,
    comments: 289,
    shares: 94,
    timestamp: '4h ago',
    isLiked: false,
    isSaved: false,
  },
  {
    id: '3',
    userId: 'user3',
    username: 'UrbanExplorer',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1080&h=1350&fit=crop',
    caption: 'Homemade pasta from scratch! Recipe in bio 🍝👨‍🍳',
    likes: 8923,
    comments: 421,
    shares: 187,
    timestamp: '6h ago',
    isLiked: true,
    isSaved: false,
  },
  {
    id: '4',
    userId: 'user4',
    username: 'NaturePhotos',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1080&h=1350&fit=crop',
    caption: 'Morning workout done! Who else crushed their goals today? 💪',
    likes: 3421,
    comments: 198,
    shares: 56,
    timestamp: '8h ago',
    isLiked: false,
    isSaved: true,
  },
  {
    id: '5',
    userId: 'user5',
    username: 'PortraitPro',
    userAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&h=1350&fit=crop',
    caption: 'Paradise found 🏝️ Can you guess where this is?',
    likes: 6782,
    comments: 334,
    shares: 203,
    timestamp: '12h ago',
    isLiked: false,
    isSaved: false,
  },
  {
    id: '6',
    userId: 'user6',
    username: 'FitnessLife',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1080&h=1350&fit=crop',
    caption: 'No excuses! 💪',
    likes: 7432,
    comments: 278,
    shares: 87,
    timestamp: '3 days ago',
    isLiked: false,
    isSaved: false,
  },
];

// Dynamically compute trending topics from actual post content + comments
function computeTrending(allPosts: Post[]) {
  const topicMap = new Map<string, { engagement: number; postCount: number; commentMentions: number }>();

  const stopWords = new Set(['the', 'a', 'an', 'is', 'in', 'it', 'of', 'to', 'and', 'for', 'on', 'at', 'my', 'no', 'so', 'who', 'can', 'you', 'this', 'from', 'never', 'else', 'done', 'found', 'today', 'looked', 'good', 'best', 'recipe', 'bio', 'goals', 'their', 'how', 'what', 'that', 'with', 'your', 'just', 'but', 'not', 'was', 'are', 'been', 'have', 'has', 'had', 'its', 'too', 'also', 'very', 'much', 'such', 'like', 'love', 'really', 'yeah', 'yes', 'wow', 'omg', 'lol', 'haha']);

  const addTopic = (topic: string, engagement: number, isComment: boolean) => {
    const entry = topicMap.get(topic) || { engagement: 0, postCount: 0, commentMentions: 0 };
    entry.engagement += engagement;
    if (isComment) {
      entry.commentMentions += 1;
    } else {
      entry.postCount += 1;
    }
    topicMap.set(topic, entry);
  };

  const extractTopics = (text: string, engagement: number, isComment: boolean) => {
    // Extract #hashtags
    const hashtags = text.match(/#(\w+)/g);
    if (hashtags) {
      for (const tag of hashtags) {
        addTopic(tag.replace('#', '').toLowerCase(), engagement, isComment);
      }
    }
    // Extract meaningful keywords
    const words = text.replace(/#\w+/g, '').replace(/[^\w\s]/g, '').split(/\s+/);
    for (const word of words) {
      const clean = word.toLowerCase().trim();
      if (clean.length >= 3 && !stopWords.has(clean)) {
        addTopic(clean, engagement, isComment);
      }
    }
  };

  for (const post of allPosts) {
    const postEngagement = (post.likes || 0) + (post.comments || 0) * 3 + (post.shares || 0) * 5;

    // Scan caption
    extractTopics(post.caption || '', postEngagement, false);

    // Scan tags if available
    if (post.tags) {
      for (const tag of post.tags) {
        addTopic(tag.toLowerCase(), postEngagement, false);
      }
    }

    // Scan comments — each comment contributes its own likes as engagement boost
    if (post.commentsList) {
      for (const comment of post.commentsList) {
        const commentEngagement = (comment.likes || 0) * 2 + postEngagement * 0.3;
        if (comment.text) {
          extractTopics(comment.text, commentEngagement, true);
        }
      }
    }
  }

  // Sort by engagement score, take top 8
  return Array.from(topicMap.entries())
    .sort((a, b) => b[1].engagement - a[1].engagement)
    .slice(0, 8)
    .map(([topic, data], i) => {
      const formatted = data.engagement >= 1000
        ? `${(data.engagement / 1000).toFixed(1)}K`
        : `${data.engagement}`;
      return {
        id: String(i + 1),
        text: topic.charAt(0).toUpperCase() + topic.slice(1),
        count: formatted,
        postCount: data.postCount,
        commentMentions: data.commentMentions,
        engagement: data.engagement,
        heat: i < 3 ? 'hot' as const : i < 5 ? 'warm' as const : 'normal' as const,
      };
    });
}

interface HomePageProps {
  onNavigateToMessages: (user?: { userId: string; username: string; userAvatar: string }) => void;
  posts: Post[];
  setPosts: (posts: Post[] | ((prev: Post[]) => Post[])) => void;
  setForYouPosts?: (posts: Post[] | ((prev: Post[]) => Post[])) => void;
  stories?: Story[];
  setStories?: React.Dispatch<React.SetStateAction<Story[]>>;
  onAddStory?: (story: Story) => void;
  viewingProfileId: string | null;
  onViewProfile: (id: string | null) => void;
  userProfile?: {
    name: string;
    username: string;
    bio: string;
    avatar: string;
  };
  currentUserId?: string;
  initialPostId?: string | null;
  onClearInitialPost?: () => void;
  onOverlayStateChange?: (isOpen: boolean) => void;
  onNavigateToNotifications?: () => void;
  unreadNotificationCount?: number;
  onManualRefresh?: () => void;
  isRefreshing?: boolean;
  forYouPosts?: Post[];
  initialSearchQuery?: string;
  initialSearchResults?: any[];
  reopenSearchTrigger?: number;
  onSearchStateChange?: (query: string, results: any[]) => void;
  onNavigateToCreate?: (prompt: string) => void;
  onShowNotification?: (notif: any) => void;
  onSharePost?: (post: Post) => void;
  onNavigate?: (screen: Screen) => void;
  currentScreen?: Screen;
  onNavigateToDiscover?: () => void;
  scrollToTopTrigger?: number;
  followedUserIds?: Set<string>;
  onFollowToggle?: (userId: string) => void;
  onHashtagClick?: (tag: string) => void;
  feedLoading?: boolean;
  feedError?: string | null;
}

export function HomePage({ 
  onNavigateToMessages, 
  posts, 
  setPosts,
  setForYouPosts,
  stories,
  setStories,
  onAddStory,
  viewingProfileId, 
  onViewProfile, 
  userProfile, 
  currentUserId,
  initialPostId,
  onClearInitialPost,
  onOverlayStateChange,
  onNavigateToNotifications,
  unreadNotificationCount = 0,
  onManualRefresh,
  isRefreshing = false,
  forYouPosts = explorePosts,
  initialSearchQuery = '',
  initialSearchResults = [],
  reopenSearchTrigger = 0,
  onSearchStateChange,
  onNavigateToCreate,
  onShowNotification,
  onSharePost,
  onNavigate,
  currentScreen = 'home',
  onNavigateToDiscover,
  scrollToTopTrigger = 0,
  followedUserIds = new Set(),
  onFollowToggle,
  onHashtagClick,
  feedLoading = false,
  feedError = null,
}: HomePageProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [lastStoryUserId, setLastStoryUserId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vibe-search-history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [profileHistory, setProfileHistory] = useState<{ userId: string; username: string; userAvatar: string }[]>(() => {
    try {
      const saved = localStorage.getItem('vibe-profile-history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [fullScreenPostId, setFullScreenPostId] = useState<string | null>(null);
  const [searchPreviewPostId, setSearchPreviewPostId] = useState<string | null>(null);
  const [profileReturnPostId, setProfileReturnPostId] = useState<string | null>(null);
  const [commentsReturnPostId, setCommentsReturnPostId] = useState<string | null>(null);
  const searchPreviewPost = searchPreviewPostId ? (posts.find(p => p.id === searchPreviewPostId) || forYouPosts?.find(p => p.id === searchPreviewPostId) || explorePosts.find(p => p.id === searchPreviewPostId) || null) : null;
  const [searchedUsers, setSearchedUsers] = useState<any[]>(initialSearchResults);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  
  // Track child overlay states
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [isImageFullScreen, setIsImageFullScreen] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const [feedTab, setFeedTab] = useState<'following' | 'forYou'>('forYou');
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);

  // API Hooks for real data
  const { 
    posts: apiPosts, 
    loading: feedLoadingApi, 
    error: feedErrorApi, 
    loadMore: loadMoreFeed 
  } = useFeed(currentUserId || '');
  
  const { 
    posts: exploreFeedPosts, 
    loading: exploreLoading 
  } = useExplorePosts();

  // Use API data if available, fall back to props
  const feedPosts = apiPosts.length > 0 ? apiPosts : (posts || []);
  const exploreFeeds = exploreFeedPosts.length > 0 ? exploreFeedPosts : (forYouPosts || explorePosts);
  const isLoading = feedLoadingApi || exploreLoading || feedLoading;
  const loadError = feedErrorApi || feedError || null;

  // Pull-to-refresh
  const [pullY, setPullY] = useState(0);
  const pullStartYRef = useRef(0);
  const isPullingRef = useRef(false);
  const PULL_THRESHOLD = 72;

  const handlePullTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      pullStartYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };
  const handlePullTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current) return;
    if (scrollRef.current && scrollRef.current.scrollTop > 0) { isPullingRef.current = false; setPullY(0); return; }
    const delta = e.touches[0].clientY - pullStartYRef.current;
    if (delta > 0) setPullY(Math.min(110, delta * 0.55));
  };
  const handlePullTouchEnd = () => {
    if (isPullingRef.current && pullY >= PULL_THRESHOLD && onManualRefresh) {
      onManualRefresh();
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      if (navigator.vibrate) navigator.vibrate(30);
    }
    isPullingRef.current = false;
    setPullY(0);
  };

  // Initialize sounds
  const sounds = useSounds();

  // Compute trending from actual posts in the app
  const trendingSearches = useMemo(() => {
    const allPosts = [...feedPosts, ...exploreFeeds];
    // Deduplicate by post id
    const seen = new Set<string>();
    const uniquePosts = allPosts.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    return computeTrending(uniquePosts);
  }, [feedPosts, exploreFeeds]);

  const addToSearchHistory = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 20);
      localStorage.setItem('vibe-search-history', JSON.stringify(updated));
      return updated;
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('vibe-search-history');
    setProfileHistory([]);
    localStorage.removeItem('vibe-profile-history');
  };

  const addToProfileHistory = (profile: { userId: string; username: string; userAvatar: string }) => {
    setProfileHistory(prev => {
      const filtered = prev.filter(p => p.userId !== profile.userId);
      const updated = [profile, ...filtered].slice(0, 10);
      localStorage.setItem('vibe-profile-history', JSON.stringify(updated));
      return updated;
    });
  };

  // Reopen search modal if trigger changes (batched state update for performance)
  useEffect(() => {
    if (reopenSearchTrigger > 0) {
      console.log('🔄 [HomePage] Reopening search modal. Trigger:', reopenSearchTrigger);
      // Batch all state updates using React's automatic batching
      setShowSearch(true);
      if (initialSearchQuery) setSearchQuery(initialSearchQuery);
      if (initialSearchResults) setSearchedUsers(initialSearchResults);
    }
  }, [reopenSearchTrigger]);

  // Notify parent about overlay state
  useEffect(() => {
    if (onOverlayStateChange) {
      const isOverlayOpen = 
        !!selectedPostId || 
        showSettings || 
        showSearch || 
        showNotifications || 
        !!fullScreenPostId || 
        isStoryViewerOpen || 
        isImageFullScreen ||
        isShareSheetOpen;
      
      onOverlayStateChange(isOverlayOpen);
    }
  }, [
    selectedPostId, 
    showSettings, 
    showSearch, 
    showNotifications, 
    fullScreenPostId, 
    isStoryViewerOpen, 
    isImageFullScreen, 
    isShareSheetOpen,
    onOverlayStateChange
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const scrollTop = scrollRef.current.scrollTop;
            setIsScrolled(scrollTop > 50);
            if (scrollTop === 0) setShowNewPostsBanner(false);
          }
          ticking = false;
        });
      }
    };
    
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Scroll to top when trigger fires (e.g. tapping Home while already on Home)
  useEffect(() => {
    if (scrollToTopTrigger > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [scrollToTopTrigger]);

  // Simulate "new posts available" banner every ~45 seconds when scrolled down
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current && scrollRef.current.scrollTop > 200) {
        const count = Math.floor(Math.random() * 4) + 1;
        setNewPostsCount(count);
        setShowNewPostsBanner(true);
      }
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // Handle deep linking to specific post
  useEffect(() => {
    if (initialPostId) {
      // Small timeout to ensure DOM is ready and layout is stable
      const timer = setTimeout(() => {
        const element = document.getElementById(`post-${initialPostId}`);
        if (element && scrollRef.current) {
          // Use direct scrollTop instead of scrollIntoView to avoid parent-scroll bug inside scaled container
          const containerRect = scrollRef.current.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const offset = elementRect.top - containerRect.top + scrollRef.current.scrollTop - (containerRect.height / 2) + (elementRect.height / 2);
          scrollRef.current.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
          // Clear the target so we don't scroll again on re-renders
          if (onClearInitialPost) onClearInitialPost();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialPostId, onClearInitialPost]);

  // Helper to update a post in both posts and forYouPosts state arrays
  const updatePostInBothFeeds = (postId: string, updater: (p: Post) => Post) => {
    setPosts(prev => prev.map(p => p.id === postId ? updater(p) : p));
    if (setForYouPosts) {
      setForYouPosts(prev => prev.map(p => p.id === postId ? updater(p) : p));
    }
  };

  const handleLike = async (postId: string) => {
    // Search both feeds to find the post
    const post = posts.find(p => p.id === postId) || forYouPosts.find(p => p.id === postId);
    if (!post || !currentUserId) return;
    
    const wasLiked = post.isLiked;
    
    // Optimistic update — update both feeds so For You + Following stay in sync
    updatePostInBothFeeds(postId, (p) => ({
      ...p,
      isLiked: !wasLiked,
      likes: wasLiked ? p.likes - 1 : p.likes + 1,
    }));
    
    try {
      // Call real database function
      if (wasLiked) {
        await db.unlikePost(postId, currentUserId);
      } else {
        await db.likePost(postId, currentUserId);
      }
      console.log(`✅ Post ${wasLiked ? 'unliked' : 'liked'} successfully`);
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      // Rollback on error
      updatePostInBothFeeds(postId, (p) => ({
        ...p,
        isLiked: wasLiked,
        likes: wasLiked ? p.likes + 1 : p.likes - 1,
      }));
    }
  };

  const handleSave = async (postId: string) => {
    const post = posts.find(p => p.id === postId) || forYouPosts.find(p => p.id === postId);
    const wasSaved = post?.isSaved ?? false;

    // Optimistic update — update both feeds
    updatePostInBothFeeds(postId, (p) => ({ ...p, isSaved: !p.isSaved }));

    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/posts/${postId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ userId: currentUserId }),
      });
      console.log(`✅ Post ${wasSaved ? 'unsaved' : 'saved'} successfully`);
    } catch (error) {
      console.error('❌ Error toggling save:', error);
      updatePostInBothFeeds(postId, (p) => ({ ...p, isSaved: wasSaved }));
    }
  };

  const handleDeletePost = async (postId: string) => {
    // Optimistic remove from both feeds
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (setForYouPosts) setForYouPosts(prev => prev.filter(p => p.id !== postId));
    setFullScreenPostId(null);
    setSelectedPostId(null);
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${publicAnonKey}`, 'X-User-Id': currentUserId || '' },
      });
      console.log(`✅ Post ${postId} deleted from server`);
    } catch (error) {
      console.error('❌ Error deleting post from server (local already removed):', error);
    }
  };

  const handleDislike = async (postId: string) => {
    const post = posts.find(p => p.id === postId) || forYouPosts.find(p => p.id === postId);
    if (!post) return;
    
    const wasDisliked = post.isDisliked;
    const wasLiked = post.isLiked;
    
    // Optimistic update — both feeds
    const dislikeUpdater = (p: Post): Post => {
      if (p.id !== postId) return p;
      const newIsDisliked = !wasDisliked;
      const newDislikes = newIsDisliked 
        ? (p.dislikes || 0) + 1 
        : Math.max((p.dislikes || 0) - 1, 0);
      return {
        ...p,
        isDisliked: newIsDisliked,
        dislikes: newDislikes,
        isLiked: newIsDisliked ? false : p.isLiked,
        likes: newIsDisliked && p.isLiked ? p.likes - 1 : p.likes,
      };
    };
    setPosts(prev => prev.map(dislikeUpdater));
    if (setForYouPosts) setForYouPosts(prev => prev.map(dislikeUpdater));
    
    try {
      // Call backend
      if (wasDisliked) {
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/posts/${postId}/dislike/${currentUserId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${publicAnonKey}` }
        });
      } else {
        // If post was liked, unlike it first
        if (wasLiked) {
          await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/posts/${postId}/like/${currentUserId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${publicAnonKey}` }
          });
        }
        
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/posts/${postId}/dislike`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ userId: currentUserId })
        });
      }
      console.log(`✅ Post ${wasDisliked ? 'undisliked' : 'disliked'} successfully`);
    } catch (error) {
      console.error('❌ Error toggling dislike:', error);
      // Rollback on error
      const rollbackUpdater = (p: Post): Post => {
        if (p.id !== postId) return p;
        return {
          ...p,
          isDisliked: wasDisliked,
          dislikes: wasDisliked ? (p.dislikes || 0) + 1 : Math.max((p.dislikes || 0) - 1, 0),
          isLiked: wasLiked,
          likes: wasLiked ? p.likes + 1 : p.likes,
        };
      };
      setPosts(prev => prev.map(rollbackUpdater));
      if (setForYouPosts) setForYouPosts(prev => prev.map(rollbackUpdater));
    }
  };

  const handleAddComment = async (postId: string, comment: Comment) => {
    const post = posts.find(p => p.id === postId) || forYouPosts.find(p => p.id === postId);
    
    // Optimistic update - both feeds
    const addCommentUpdater = (p: Post): Post => {
      if (p.id !== postId) return p;
      const updatedCommentsList = [...(p.commentsList || []), comment];
      return { ...p, commentsList: updatedCommentsList, comments: updatedCommentsList.length };
    };
    setPosts(prev => prev.map(addCommentUpdater));
    if (setForYouPosts) setForYouPosts(prev => prev.map(addCommentUpdater));
    
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify(comment)
      });
      console.log('✅ Comment added successfully');
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      const rollbackCommentUpdater = (p: Post): Post => {
        if (p.id !== postId) return p;
        const updatedCommentsList = (p.commentsList || []).filter(c => c.id !== comment.id);
        return { ...p, commentsList: updatedCommentsList, comments: updatedCommentsList.length };
      };
      setPosts(prev => prev.map(rollbackCommentUpdater));
      if (setForYouPosts) setForYouPosts(prev => prev.map(rollbackCommentUpdater));
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const post = posts.find(p => p.id === postId) || forYouPosts.find(p => p.id === postId);
    const originalCommentsList = post?.commentsList || [];
    
    // Optimistic update - both feeds
    const deleteCommentUpdater = (p: Post): Post => {
      if (p.id !== postId) return p;
      const updatedCommentsList = (p.commentsList || []).filter(c => c.id !== commentId);
      return { ...p, commentsList: updatedCommentsList, comments: updatedCommentsList.length };
    };
    setPosts(prev => prev.map(deleteCommentUpdater));
    if (setForYouPosts) setForYouPosts(prev => prev.map(deleteCommentUpdater));
    
    try {
      // Call backend
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/posts/${postId}/comment/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      });
      console.log('✅ Comment deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      // Rollback on error - both feeds
      const rollbackUpdater = (p: Post): Post => {
        if (p.id !== postId) return p;
        return { ...p, commentsList: originalCommentsList, comments: originalCommentsList.length };
      };
      setPosts(prev => prev.map(rollbackUpdater));
      if (setForYouPosts) setForYouPosts(prev => prev.map(rollbackUpdater));
    }
  };

  const selectedPost = posts.find(p => p.id === selectedPostId) || forYouPosts.find(p => p.id === selectedPostId) || explorePosts.find(p => p.id === selectedPostId);

  // Get unique users from posts
  const postsUsers = Array.from(
    new Map(
      posts.map(post => [
        post.userId,
        {
          userId: post.userId,
          username: post.username,
          userAvatar: post.userAvatar,
        }
      ])
    ).values()
  );

  // Combine with current user profile if available
  const uniqueUsers = [...postsUsers];
  
  if (userProfile && currentUserId) {
    const existingIndex = uniqueUsers.findIndex(u => u.userId === currentUserId);
    const currentUserData = {
      userId: currentUserId,
      username: userProfile.username,
      userAvatar: userProfile.avatar,
    };

    if (existingIndex >= 0) {
      // Update existing user entry with latest profile data
      uniqueUsers[existingIndex] = currentUserData;
    } else {
      // Add current user if not in the list
      uniqueUsers.push(currentUserData);
    }
  }

  // Search for users from backend when query changes (debounced, no AbortController)
  useEffect(() => {
    let stale = false;

    const doSearch = async () => {
      const query = searchQuery.trim();
      if (!query) {
        setSearchedUsers([]);
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
  }, [searchQuery]);

  // Combine local users with backend searched users, removing duplicates
  const allUsers = [...uniqueUsers];
  for (const backendUser of searchedUsers) {
    const exists = allUsers.some(u => u.userId === backendUser.userId);
    if (!exists) {
      allUsers.push({
        userId: backendUser.userId,
        username: backendUser.username,
        userAvatar: backendUser.userAvatar,
      });
    }
  }

  // Filter users based on search query
  const filteredUsers = searchQuery.trim()
    ? allUsers.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Combine local feed posts and explore posts for global search
  const allSearchablePosts = [...posts, ...explorePosts];
  
  // Filter posts based on search query (using Venture Page advanced logic)
  const filteredPosts = searchQuery.trim()
    ? allSearchablePosts.filter(post => {
        const query = searchQuery.toLowerCase().trim();
        const normalizedQuery = query.replace(/^#/, '');

        const matchesText = 
          (post.caption || '').toLowerCase().includes(query) ||
          (post.username || '').toLowerCase().includes(query);

        // Check tags (if available)
        const matchesTags = post.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery));

        return matchesText || matchesTags;
      })
    : posts;

  if (showSettings) {
    return (
      <SettingsPage 
        onBack={() => setShowSettings(false)} 
        onLogout={() => {}} 
        savedPosts={posts.filter(p => p.isSaved)}
        userProfile={userProfile}
      />
    );
  }

  // If viewing a user profile, render it as a full page
  if (viewingProfileId) {
    const userFromPosts = posts.find(p => p.userId === viewingProfileId);
    const userPosts = posts.filter(p => p.userId === viewingProfileId);
    
    // Determine user data to display
    let displayUser;
    if (userFromPosts) {
        displayUser = {
            userId: userFromPosts.userId,
            username: userFromPosts.username,
            avatar: userFromPosts.userAvatar,
            bio: `${userFromPosts.username} shares amazing content on Vibe!`
        };
    } else if (viewingProfileId === currentUserId && userProfile) {
        displayUser = {
            userId: currentUserId,
            username: userProfile.username,
            avatar: userProfile.avatar,
            bio: userProfile.bio
        };
    }
    
    if (!displayUser) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-background p-4 text-center">
            <h2 className="text-xl font-bold mb-2">User not found</h2>
            <button 
                onClick={() => onViewProfile(null)}
                className="px-4 py-2 bg-accent text-white rounded-xl"
            >
                Go Back
            </button>
        </div>
      );
    }
    
    return (
      <div className="h-full bg-gradient-to-br from-background via-secondary/20 to-background overflow-hidden">
        <UserProfile
          userId={displayUser.userId}
          username={displayUser.username}
          displayName={displayUser.username}
          avatar={displayUser.avatar}
          bio={displayUser.bio}
          followers={0}
          following={0}
          postsCount={userPosts.length}
          isFollowing={false}
          posts={userPosts}
          onBack={() => {
            if (profileReturnPostId) {
              onViewProfile(null);
              setShowSearch(true);
              setSearchPreviewPostId(profileReturnPostId);
              setProfileReturnPostId(null);
            } else {
              onViewProfile(null);
            }
          }}
          isOwnProfile={viewingProfileId === currentUserId}
          initialPostId={initialPostId}
          onNavigateToMessages={(user) => {
            // Keep viewingProfileId set so we can return to it
            onNavigateToMessages(user);
          }}
          onNavigateToSettings={() => setShowSettings(true)}
          onViewProfile={(userId) => onViewProfile(userId)}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Industrial / WIP Header */}
      <div className={`shrink-0 z-40 bg-background border-b-4 border-foreground transition-all duration-300 ${isScrolled ? 'max-h-0 py-0 border-b-0 overflow-hidden opacity-0' : 'max-h-24 opacity-100'}`}
        style={{
          paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
          paddingRight: 'calc(1rem + env(safe-area-inset-right))',
          paddingTop: '0.75rem',
          paddingBottom: '0.75rem'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             {/* Profile Avatar with hard border */}
            <div className="relative group cursor-pointer" onClick={() => onViewProfile(currentUserId || null)}>
              <div className="w-12 h-12 bg-card border-2 border-foreground rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all">
                <img 
                  key={userProfile?.avatar}
                  src={userProfile?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-2xl font-black text-foreground tracking-tighter uppercase italic leading-none">
                VIBE
              </span>
              <VibeStreak />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onManualRefresh && (
              <button 
                onClick={() => {
                  onManualRefresh?.();
                  scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={isRefreshing}
                className="w-10 h-10 bg-background border-2 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--foreground)] active:translate-y-1 active:shadow-none transition-all rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? (
                  <Loader2 className="text-foreground animate-spin" size={20} strokeWidth={3} />
                ) : (
                  <RefreshCw className="text-foreground" size={20} strokeWidth={3} />
                )}
              </button>
            )}
            
            <button
              onClick={() => {
                sounds.search();
                setShowSearch(true);
              }}
              className="w-10 h-10 bg-background border-2 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--foreground)] active:translate-y-1 active:shadow-none transition-all rounded-md"
            >
              <Search className="text-foreground" size={20} strokeWidth={3} />
            </button>
            
            <AnimatedBell
              count={unreadNotificationCount}
              onClick={() => {
                sounds.notification();
                if (onNavigateToNotifications) {
                  onNavigateToNotifications();
                } else {
                  setShowNotifications(true);
                }
              }}
              hasNewActivity={unreadNotificationCount > 0}
            />
            
            <button
              onClick={() => {
                sounds.message();
                onViewProfile(null);
                onNavigateToMessages();
              }}
              className="relative w-10 h-10 bg-background border-2 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--foreground)] active:translate-y-1 active:shadow-none transition-all rounded-md"
            >
              <MessageCircle className="text-foreground" size={20} strokeWidth={3} />
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-foreground text-background text-[10px] font-bold flex items-center justify-center border-2 border-foreground rounded-full animate-status-pulse">
                5
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Trending ticker strip */}
      <div className={`transition-all duration-300 ${isScrolled ? 'opacity-0 -translate-y-full pointer-events-none max-h-0 overflow-hidden' : 'opacity-100 translate-y-0 max-h-20'}`}>
        <TrendingTicker onTagClick={(tag) => {
          setSearchQuery(tag.replace(/^#/, ''));
          setShowSearch(true);
        }} />
      </div>

      {/* Quick Access Bar */}
      <div className={`flex gap-2 px-4 py-2 bg-background border-b-4 border-foreground overflow-x-auto scrollbar-hide transition-all duration-300 ${isScrolled ? 'opacity-0 -translate-y-full pointer-events-none max-h-0 py-0 border-b-0 overflow-hidden' : 'opacity-100 translate-y-0 max-h-20'}`}>
        <button
          onClick={() => onNavigate?.('vibecheck' as Screen)}
          className="flex items-center gap-1.5 px-3 py-2 bg-background border-2 border-foreground text-foreground shadow-[3px_3px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_var(--foreground)] active:scale-95 transition-all whitespace-nowrap"
        >
          <Smile size={14} strokeWidth={3} className="animate-gentle-wobble" />
          <span className="text-[10px] font-black uppercase">Vibe Check</span>
        </button>
        <button
          onClick={() => onNavigate?.('spotlight' as Screen)}
          className="flex items-center gap-1.5 px-3 py-2 bg-background border-2 border-foreground text-foreground shadow-[3px_3px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_var(--foreground)] active:scale-95 transition-all whitespace-nowrap"
        >
          <Star size={14} strokeWidth={3} style={{ animation: 'crownFloat 2.5s ease-in-out infinite' }} />
          <span className="text-[10px] font-black uppercase">Spotlight</span>
        </button>
      </div>

      {/* New Posts Banner */}
      {showNewPostsBanner && (
        <div className="shrink-0 flex justify-center py-2 bg-background border-b-2 border-foreground/10 z-30">
          <button
            onClick={() => {
              setShowNewPostsBanner(false);
              setNewPostsCount(0);
              if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              if (onManualRefresh) onManualRefresh();
            }}
            className="flex items-center gap-2 px-5 py-2 bg-foreground text-background text-xs font-black uppercase border-2 border-foreground shadow-[3px_3px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:scale-95"
            style={{ animation: 'springUp 0.4s cubic-bezier(.22,.68,0,1.2) both' }}
          >
            ↑ {newPostsCount} new post{newPostsCount !== 1 ? 's' : ''} — tap to refresh
          </button>
        </div>
      )}

      {/* Feed with Unique Card Design */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto px-4 overscroll-none touch-pan-y select-none [&::-webkit-scrollbar]:hidden relative"
        style={{ 
          paddingBottom: 'calc(80px + 1rem + env(safe-area-inset-bottom))'
        }}
        onTouchStart={handlePullTouchStart}
        onTouchMove={handlePullTouchMove}
        onTouchEnd={handlePullTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        {pullY > 0 && (
          <div
            className="flex items-center justify-center z-40 overflow-hidden transition-none"
            style={{ height: `${pullY}px` }}
          >
            <div
              className="w-10 h-10 border-2 border-foreground bg-background flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)]"
              style={{
                transform: `rotate(${Math.min(360, (pullY / PULL_THRESHOLD) * 360)}deg)`,
                opacity: Math.min(1, pullY / (PULL_THRESHOLD * 0.6)),
                background: pullY >= PULL_THRESHOLD ? 'var(--foreground)' : 'var(--background)',
                color: pullY >= PULL_THRESHOLD ? 'var(--background)' : 'var(--foreground)',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {isRefreshing ? (
                <Loader2 size={20} strokeWidth={3} className="animate-spin" />
              ) : (
                <RefreshCw size={20} strokeWidth={3} />
              )}
            </div>
          </div>
        )}
        <div className="max-w-2xl mx-auto flex flex-col space-y-6">
          {/* Stories Section - Scrolls away like posts */}
          <div className="shrink-0 border-b-4 border-foreground bg-background -mx-4 px-0">
            <Stories 
                stories={stories}
                onAddStory={onAddStory}
                onStoryView={(storyId) => {
                if (setStories && stories) {
                    setStories(stories.map(s => s.id === storyId ? { ...s, viewed: true } : s));
                }
                }}
                onViewProfile={(userId, storyUserId) => {
                onViewProfile(userId);
                }}
                initialUserId={null}
                onViewerStateChange={setIsStoryViewerOpen}
                isVisible={true}
            />
          </div>

          {/* ── Feed Tab Bar ── */}
          <div className={`shrink-0 -mx-4 z-20 flex border-b-4 border-foreground bg-background transition-all duration-300 ${isShareSheetOpen ? 'opacity-0 pointer-events-none' : ''} ${isScrolled ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}`}>
            <button
              onClick={() => setFeedTab('following')}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-widest transition-all border-r-2 border-foreground
                ${feedTab === 'following'
                  ? 'bg-foreground text-background shadow-[inset_0_-4px_0_0_var(--background)]'
                  : 'bg-background text-foreground hover:bg-foreground/5'
                }`}
            >
              Following
            </button>
            <button
              onClick={() => setFeedTab('forYou')}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5
                ${feedTab === 'forYou'
                  ? 'bg-foreground text-background shadow-[inset_0_-4px_0_0_var(--background)]'
                  : 'bg-background text-foreground hover:bg-foreground/5'
                }`}
            >
              <Sparkles size={13} strokeWidth={3} className={feedTab === 'forYou' ? 'text-background' : 'text-foreground'} />
              For You
            </button>
          </div>

          {feedTab === 'following' ? (
            /* ── Following Feed ── */
            (() => {
              // Filter to posts from followed accounts, within 7-day window
              const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
              const now = Date.now();

              // Parse relative timestamps like "2h ago", "3 days ago" into approximate ms-ago
              const parseTimestamp = (ts: string, createdAt?: string): number => {
                if (createdAt) {
                  const d = new Date(createdAt).getTime();
                  if (!isNaN(d)) return d;
                }
                const lower = (ts || '').toLowerCase();
                if (lower.includes('now') || lower === 'just now') return now;
                const numMatch = lower.match(/(\d+)/);
                const n = numMatch ? parseInt(numMatch[1]) : 0;
                if (lower.includes('m ago') || lower.includes('min')) return now - n * 60000;
                if (lower.includes('h ago') || lower.includes('hour')) return now - n * 3600000;
                if (lower.includes('d ago') || lower.includes('day')) return now - n * 86400000;
                if (lower.includes('w ago') || lower.includes('week')) return now - n * 604800000;
                return now - 86400000; // Default: 1 day ago
              };

              const followingPosts = feedPosts
                .filter(p => {
                  const postTime = parseTimestamp(p.timestamp, (p as any).createdAt);
                  return (now - postTime) <= SEVEN_DAYS_MS;
                })
                .sort((a, b) => {
                  const ta = parseTimestamp(a.timestamp, (a as any).createdAt);
                  const tb = parseTimestamp(b.timestamp, (b as any).createdAt);
                  return tb - ta; // Newest first
                });

              return (
                <>
                  {isLoading && (
                    <div className="flex justify-center py-8" aria-busy="true">
                      <Loader2 className="w-10 h-10 animate-spin text-foreground" strokeWidth={2.5} />
                    </div>
                  )}
                  {loadError && (
                    <div
                      className="mx-4 mb-4 p-3 border-2 border-destructive bg-destructive/10 text-destructive text-sm font-bold text-center uppercase font-mono"
                      role="alert"
                    >
                      {loadError}
                    </div>
                  )}
                  {/* Daily Vibe Prompt */}
                  <VibeDailyPrompt 
                    onNavigateToCreate={(prompt) => {
                      if (onNavigateToCreate) onNavigateToCreate(prompt);
                    }}
                  />

                  {/* Follow Suggestions */}
                  <FollowSuggestions
                    onViewProfile={onViewProfile}
                    onFollowToggle={onFollowToggle}
                    followedUserIds={followedUserIds}
                    currentUserId={currentUserId}
                    posts={posts}
                    forYouPosts={forYouPosts}
                  />

                  {followingPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <div className="w-20 h-20 border-4 border-foreground bg-card flex items-center justify-center shadow-[6px_6px_0px_0px_var(--foreground)]">
                        <UserPlus className="text-foreground" size={32} strokeWidth={3} />
                      </div>
                      <p className="font-black text-xl uppercase text-foreground text-center">No posts yet</p>
                      <p className="text-sm font-bold font-mono text-foreground/50 uppercase text-center">Follow people to see their posts here</p>
                    </div>
                  ) : (
                    followingPosts.map((post, index) => (
                      <div
                        key={post.id}
                        id={`post-${post.id}`}
                        className="animate-in fade-in slide-in-from-bottom-4"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <PostCard
                          post={post}
                          onLike={handleLike}
                          onSave={handleSave}
                          onSharePost={onSharePost}
                          onDislike={handleDislike}
                          onComment={() => setSelectedPostId(post.id)}
                          onNavigateToMessages={() => onNavigateToMessages()}
                          onNavigateToProfile={(userId) => {
                            setLastStoryUserId(null);
                            onViewProfile(userId);
                          }}
                          onHide={(postId) => {
                            setPosts(prev => prev.filter(p => p.id !== postId));
                            if (setForYouPosts) setForYouPosts(prev => prev.filter(p => p.id !== postId));
                          }}
                          onDelete={currentUserId && post.userId === currentUserId ? handleDeletePost : undefined}
                          onImageFullScreenToggle={setIsImageFullScreen}
                          onShareSheetToggle={setIsShareSheetOpen}
                          currentUserId={currentUserId}
                          onHashtagClick={onHashtagClick}
                        />
                      </div>
                    ))
                  )}
                </>
              );
            })()
          ) : (
            /* ── For You Feed ── */
            (() => {
              // Build "For You" pool: forYouPosts + trending, ranked by engagement
              const engagementScore = (p: Post) =>
                p.likes * 1 + p.comments * 2 + p.shares * 3;

              const followedIds = new Set(feedPosts.map(p => p.userId));

              // Separate explore/discovery posts from followed-user posts
              const discoveryPosts = exploreFeeds
                .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
                .sort((a, b) => engagementScore(b) - engagementScore(a));

              const followedPosts = feedPosts
                .filter(p => p.userId !== currentUserId)
                .sort((a, b) => engagementScore(b) - engagementScore(a));

              // Inject followed content every 5-10 posts into the discovery feed
              const forYouPool: Post[] = [];
              let followedInsertIndex = 0;
              const INJECT_INTERVAL = 7; // Insert a followed post roughly every 7 posts

              discoveryPosts.forEach((post, i) => {
                forYouPool.push(post);
                // Every INJECT_INTERVAL posts, insert a followed-user post
                if ((i + 1) % INJECT_INTERVAL === 0 && followedInsertIndex < followedPosts.length) {
                  const followedPost = followedPosts[followedInsertIndex];
                  // Only inject if not already in the pool
                  if (!forYouPool.some(p => p.id === followedPost.id)) {
                    forYouPool.push(followedPost);
                  }
                  followedInsertIndex++;
                }
              });

              // If there are remaining followed posts, append them
              while (followedInsertIndex < followedPosts.length && forYouPool.length < discoveryPosts.length + 10) {
                const followedPost = followedPosts[followedInsertIndex];
                if (!forYouPool.some(p => p.id === followedPost.id)) {
                  forYouPool.push(followedPost);
                }
                followedInsertIndex++;
              }

              return (
                <>
                  {/* Daily Vibe Prompt (also in For You) */}
                  <VibeDailyPrompt 
                    onNavigateToCreate={(prompt) => {
                      if (onNavigateToCreate) onNavigateToCreate(prompt);
                    }}
                  />

                  {/* Algo label */}
                  <div className="flex items-center gap-2 -mx-0 px-3 py-2 bg-foreground border-2 border-foreground">
                    <Sparkles className="text-background" size={14} strokeWidth={3} />
                    <span className="text-xs font-black text-background uppercase tracking-widest">Picked for you · based on your likes</span>
                  </div>

                  {forYouPool.map((post, index) => {
                    const isFromFollowed = followedIds.has(post.userId);
                    return (
                      <div key={`fy-${post.id}`} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 40}ms` }}>
                        {/* Contextual labels */}
                        {index > 0 && index % 4 === 0 && !isFromFollowed && (
                          <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-background/10 border-l-4 border-background">
                            <Zap size={13} strokeWidth={3} className="text-background" />
                            <span className="text-[11px] font-black uppercase text-background tracking-wider">Trending in your area</span>
                          </div>
                        )}
                        {isFromFollowed && (
                          <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-foreground/5 border-l-4 border-foreground">
                            <UserPlus size={13} strokeWidth={3} className="text-foreground" />
                            <span className="text-[11px] font-black uppercase text-foreground/60 tracking-wider">From someone you follow</span>
                          </div>
                        )}
                        <PostCard
                          post={post}
                          onLike={handleLike}
                          onSave={handleSave}
                          onSharePost={onSharePost}
                          onDislike={handleDislike}
                          onComment={() => setSelectedPostId(post.id)}
                          onNavigateToMessages={() => onNavigateToMessages()}
                          onNavigateToProfile={(userId) => {
                            setLastStoryUserId(null);
                            onViewProfile(userId);
                          }}
                          onHide={(postId) => {
                            setPosts(prev => prev.filter(p => p.id !== postId));
                            if (setForYouPosts) setForYouPosts(prev => prev.filter(p => p.id !== postId));
                          }}
                          onDelete={currentUserId && post.userId === currentUserId ? handleDeletePost : undefined}
                          onImageFullScreenToggle={setIsImageFullScreen}
                          onShareSheetToggle={setIsShareSheetOpen}
                          currentUserId={currentUserId}
                          onHashtagClick={onHashtagClick}
                        />
                      </div>
                    );
                  })}

                  {forYouPool.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <div className="w-20 h-20 border-4 border-foreground bg-card flex items-center justify-center shadow-[6px_6px_0px_0px_var(--foreground)]">
                        <Sparkles className="text-foreground" size={32} strokeWidth={3} />
                      </div>
                      <p className="font-black text-xl uppercase text-foreground text-center">Nothing here yet</p>
                      <p className="text-sm font-bold font-mono text-foreground/50 uppercase text-center">Like more posts to train your feed</p>
                    </div>
                  )}
                </>
              );
            })()
          )}
          
          {/* Load More Indicator */}
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent/10 via-secondary/10 to-accent/10 rounded-full border border-accent/20">
              <Zap className="text-accent animate-pulse" size={16} />
              <span className="text-sm font-medium text-accent">Loading more vibes...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="relative bg-gradient-to-br from-background via-background to-secondary/20 w-full h-full md:max-w-2xl md:h-[90%] md:rounded-[2rem] overflow-hidden flex flex-col border-0 md:border md:border-accent/20 shadow-2xl">
            {/* Search Header */}
            <div className="relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-secondary/20 to-accent/20" />
              <div className="relative px-4 py-4 border-b-4 border-foreground bg-card shadow-[0px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 group-focus-within:text-foreground transition-colors" size={20} strokeWidth={3} />
                    <input
                      type="text"
                      placeholder="SEARCH @USERS, POSTS..."
                      value={searchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSearchQuery(val.startsWith('@') ? val.substring(1) : val);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          addToSearchHistory(searchQuery.trim());
                        }
                      }}
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 bg-card border-4 border-foreground outline-none text-sm font-black text-foreground placeholder:text-foreground/30 shadow-[4px_4px_0px_0px_var(--foreground)] focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all uppercase font-mono"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (searchPreviewPost) {
                        setSearchPreviewPostId(null);
                      } else if (searchQuery.trim()) {
                        setSearchQuery('');
                      } else {
                        setShowSearch(false);
                      }
                    }}
                    className="w-12 h-12 bg-foreground text-background border-2 border-foreground flex items-center justify-center transition-all hover:bg-background hover:text-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)]"
                  >
                    <X size={24} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>

            {/* Search Results / Trending */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-background">
              {!searchQuery.trim() ? (
                // Recent Searches + Trending Section
                <div className="space-y-4">
                  {(searchHistory.length > 0 || profileHistory.length > 0) && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                          <Clock className="text-foreground" size={24} strokeWidth={3} style={{ animation: 'gentleWobble 3s ease-in-out infinite' }} />
                          <h3 className="font-black text-xl text-foreground uppercase italic tracking-tighter">Recent</h3>
                        </div>
                        <button
                          onClick={clearSearchHistory}
                          className="flex items-center gap-1 px-3 py-1.5 bg-foreground text-background border-2 border-foreground hover:bg-red-600 transition-colors shadow-[3px_3px_0px_0px_var(--foreground)] hover:shadow-[1px_1px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px]"
                        >
                          <Trash2 size={14} strokeWidth={3} />
                          <span className="text-[10px] font-black uppercase">Clear</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profileHistory.map((profile) => (
                          <button
                            key={`profile-${profile.userId}`}
                            onClick={() => {
                              setLastStoryUserId(null);
                              setShowSearch(false);
                              onViewProfile(profile.userId);
                            }}
                            className="flex flex-col items-center gap-1 w-[60px] shrink-0 group"
                          >
                            <div className="w-10 h-10 border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-[1px_1px_0px_0px_var(--foreground)] transition-all overflow-hidden bg-secondary">
                              <img
                                src={profile.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=ff7a2e&color=000&bold=true&size=80`}
                                alt={profile.username}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-[10px] font-black text-foreground uppercase truncate w-full text-center leading-tight">{profile.username}</span>
                          </button>
                        ))}
                        {searchHistory.map((query, index) => (
                          <button
                            key={`${query}-${index}`}
                            onClick={() => setSearchQuery(query)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-card border-2 border-foreground shadow-[3px_3px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all group"
                          >
                            <Search className="text-foreground/40 group-hover:text-background" size={12} strokeWidth={3} />
                            <span className="text-xs font-black text-foreground uppercase">{query}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <TrendingUp className="text-foreground" size={24} strokeWidth={3} style={{ animation: 'gentleWobble 3s ease-in-out 0.5s infinite' }} />
                    <h3 className="font-black text-xl text-foreground uppercase italic tracking-tighter">Trending Now</h3>
                  </div>
                  {trendingSearches.map((trending, index) => (
                    <button
                      key={trending.id}
                      onClick={() => setSearchQuery(trending.text)}
                      className="w-full flex items-center justify-between p-3 bg-card border-2 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all group"
                      style={{ animation: `springUp 0.4s cubic-bezier(.22,.68,0,1.2) ${index * 50}ms both` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 border-2 border-foreground bg-background flex items-center justify-center group-hover:bg-foreground transition-colors">
                          <span className="font-black text-sm text-foreground group-hover:text-background">{index + 1}</span>
                          {trending.heat === 'hot' && (
                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 border border-foreground flex items-center justify-center">
                              <Flame className="text-white" size={10} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <Hash className="text-foreground/40" size={14} strokeWidth={3} />
                            <p className="font-black text-sm text-foreground uppercase">{trending.text}</p>
                            {trending.heat === 'hot' && (
                              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase leading-none">HOT</span>
                            )}
                            {trending.heat === 'warm' && (
                              <span className="px-1.5 py-0.5 bg-background text-foreground text-[8px] font-black uppercase leading-none">RISING</span>
                            )}
                          </div>
                          <p className="text-xs font-mono font-bold text-foreground/50">{trending.count} ENGAGEMENT · {trending.postCount} {trending.postCount === 1 ? 'POST' : 'POSTS'}{trending.commentMentions > 0 ? ` · ${trending.commentMentions} ${trending.commentMentions === 1 ? 'COMMENT' : 'COMMENTS'}` : ''}</p>
                        </div>
                      </div>
                      <TrendingUp className="text-foreground/30 group-hover:text-background group-hover:scale-110 transition-all" size={18} strokeWidth={3} />
                    </button>
                  ))}
                </div>
              ) : (
                // Search Results
                <div className="space-y-8">
                  {filteredUsers.length === 0 && filteredPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-20 h-20 border-4 border-foreground bg-background flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_var(--foreground)]">
                        <Search className="text-foreground" size={32} strokeWidth={3} />
                      </div>
                      <p className="font-black text-xl text-foreground uppercase mb-2">No results found</p>
                      <p className="text-sm font-bold font-mono text-foreground/50 uppercase">Try searching for something else</p>
                    </div>
                  ) : (
                    <>
                      {/* Users Section */}
                      {filteredUsers.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-3 px-1">
                            <UserPlus className="text-foreground" size={24} strokeWidth={3} />
                            <h3 className="font-black text-xl text-foreground uppercase italic tracking-tighter">
                              Users ({filteredUsers.length})
                            </h3>
                          </div>
                          {filteredUsers.map((user, index) => (
                            <button
                              key={user.userId}
                              onClick={() => {
                                addToProfileHistory({ userId: user.userId, username: user.username, userAvatar: user.userAvatar });
                                setLastStoryUserId(null);
                                setShowSearch(false); // Close modal so profile can be viewed
                                onViewProfile(user.userId);
                              }}
                              className="w-full flex items-center gap-3 p-3 bg-card border-2 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all group"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <img
                                src={user.userAvatar}
                                alt={user.username}
                                className="w-12 h-12 border-2 border-foreground object-cover bg-secondary"
                              />
                              <div className="flex-1 text-left">
                                <p className="font-black text-base text-foreground uppercase">{user.username}</p>
                                <p className="text-xs font-mono font-bold text-foreground/50">@{user.username.toLowerCase()}</p>
                              </div>
                              <div className="px-3 py-1 bg-foreground text-background border-2 border-foreground group-hover:bg-background group-hover:text-foreground transition-colors">
                                <span className="text-xs font-black uppercase">PROFILE</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Posts Section */}
                      {filteredPosts.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-3 px-1">
                            <Sparkles className="text-foreground" size={24} strokeWidth={3} />
                            <h3 className="font-black text-xl text-foreground uppercase italic tracking-tighter">
                              Posts ({filteredPosts.length})
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {filteredPosts.map((post, index) => (
                              <button
                                key={post.id}
                                onClick={() => setSearchPreviewPostId(post.id)}
                                className="relative aspect-[4/5] border-2 border-foreground bg-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all overflow-hidden group"
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                <img
                                  src={post.imageUrl}
                                  alt={post.caption}
                                  className="w-full h-full object-cover transition-all duration-300"
                                />
                                <div className="absolute inset-0 bg-transparent group-hover:bg-black/20 transition-colors flex flex-col justify-end p-2">
                                  <div className="flex items-center justify-between w-full transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="bg-card border-2 border-foreground p-1 shadow-[2px_2px_0px_0px_var(--foreground)]">
                                      <p className="text-foreground text-[10px] font-black uppercase truncate max-w-[80px]">@{post.username}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div className="bg-card border-2 border-foreground px-1.5 py-0.5 flex items-center gap-1 shadow-[2px_2px_0px_0px_var(--foreground)]">
                                        <Heart className="text-red-500" size={10} strokeWidth={3} fill="currentColor" />
                                        <span className="text-[9px] font-black text-foreground">{post.likes >= 1000 ? `${(post.likes / 1000).toFixed(1)}K` : post.likes}</span>
                                      </div>
                                      <div className="bg-card border-2 border-foreground px-1.5 py-0.5 flex items-center gap-1 shadow-[2px_2px_0px_0px_var(--foreground)]">
                                        <MessageCircle className="text-foreground" size={10} strokeWidth={3} />
                                        <span className="text-[9px] font-black text-foreground">{post.comments >= 1000 ? `${(post.comments / 1000).toFixed(1)}K` : post.comments}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Navigation inside Search */}
            {onNavigate && (
              <div className="flex-shrink-0 bg-card border-t-4 border-foreground shadow-[0px_-4px_0px_0px_color-mix(in_srgb,var(--foreground)_10%,transparent)] px-4 pb-6 pt-4">
                <div className="flex items-center justify-around max-w-xl mx-auto">
                  {([
                    { screen: 'home' as Screen, icon: <Home size={24} strokeWidth={3} /> },
                    { screen: 'leaderboard' as Screen, icon: <Flame size={24} strokeWidth={3} /> },
                    { screen: 'create' as Screen, icon: <PlusSquare size={24} strokeWidth={3} className="text-foreground" /> },
                    { screen: 'venture' as Screen, icon: <Compass size={24} strokeWidth={3} /> },
                  ]).map(({ screen, icon }) => (
                    <button
                      key={screen}
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                        onNavigate(screen);
                      }}
                      className={`relative flex flex-col items-center justify-center w-14 h-14 border-2 border-foreground rounded-xl transition-all active:scale-95 ${
                        screen === 'create'
                          ? 'bg-background shadow-[4px_4px_0px_0px_var(--foreground)]'
                          : currentScreen === screen
                            ? 'bg-foreground text-background shadow-[2px_2px_0px_0px_var(--background)] translate-x-[1px] translate-y-[1px]'
                            : 'bg-card text-foreground shadow-[4px_4px_0px_0px_var(--foreground)]'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                      onNavigate('profile');
                    }}
                    className={`relative flex flex-col items-center justify-center w-14 h-14 border-2 border-foreground rounded-xl transition-all overflow-hidden active:scale-95 ${
                      currentScreen === 'profile'
                        ? 'shadow-[2px_2px_0px_0px_var(--background)] translate-x-[1px] translate-y-[1px] ring-2 ring-background'
                        : 'bg-card text-foreground shadow-[4px_4px_0px_0px_var(--foreground)]'
                    }`}
                  >
                    <img
                      src={userProfile?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Inline Post Preview Overlay */}
            {searchPreviewPost && (
              <div className="absolute inset-0 z-[110] bg-card flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
                {/* Preview Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b-4 border-foreground bg-background">
                  <button
                    onClick={() => setSearchPreviewPostId(null)}
                    className="w-10 h-10 flex items-center justify-center border-2 border-foreground bg-secondary shadow-[3px_3px_0px_0px_var(--foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_var(--foreground)] transition-all"
                  >
                    <ArrowLeft size={20} strokeWidth={3} />
                  </button>
                  <button
                    onClick={() => {
                      setProfileReturnPostId(searchPreviewPost.id);
                      setSearchPreviewPostId(null);
                      setShowSearch(false);
                      onViewProfile(searchPreviewPost.userId);
                    }}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <img
                      src={searchPreviewPost.userAvatar}
                      alt={searchPreviewPost.username}
                      className="w-9 h-9 border-2 border-foreground object-cover bg-secondary shadow-[2px_2px_0px_0px_var(--foreground)]"
                    />
                    <div className="min-w-0">
                      <p className="font-black text-sm text-foreground uppercase truncate">{searchPreviewPost.username}</p>
                      {searchPreviewPost.location && (
                        <p className="text-[10px] font-mono font-bold text-foreground/50 truncate">{searchPreviewPost.location}</p>
                      )}
                    </div>
                  </button>
                </div>

                {/* Post Image */}
                <div className="flex-1 overflow-auto bg-background">
                  {/* Post Image with brutal frame */}
                  <div className="relative w-full aspect-[4/5] bg-black border-b-4 border-foreground">
                    <img
                      src={searchPreviewPost.imageUrl}
                      alt={searchPreviewPost.caption}
                      className="w-full h-full object-cover"
                    />
                    {/* Hot badge */}
                    {searchPreviewPost.likes > 5000 && (
                      <div className="absolute top-3 right-3 bg-foreground text-background px-2.5 py-1 border-2 border-background shadow-[3px_3px_0px_0px_color-mix(in_srgb,var(--background)_50%,transparent)] flex items-center gap-1.5">
                        <Flame size={14} strokeWidth={3} className="text-background" style={{ animation: 'flameDance 1.2s ease-in-out infinite' }} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Hot</span>
                      </div>
                    )}
                  </div>

                  {/* Action Bar — theme-matched */}
                  <div className="flex items-center justify-between px-4 py-3 bg-background border-b-4 border-foreground">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLike(searchPreviewPost.id)}
                        className="flex items-center gap-1.5 bg-secondary border-2 border-foreground px-2.5 py-1.5 shadow-[3px_3px_0px_0px_var(--foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_var(--foreground)] transition-all"
                      >
                        <Heart
                          size={20}
                          strokeWidth={3}
                          className={searchPreviewPost.isLiked ? 'text-red-500 fill-red-500' : 'text-foreground'}
                          style={searchPreviewPost.isLiked ? { animation: 'heartPop 0.4s ease-out' } : undefined}
                        />
                        <span className="text-xs font-black text-foreground">{searchPreviewPost.likes >= 1000 ? `${(searchPreviewPost.likes / 1000).toFixed(1)}K` : searchPreviewPost.likes}</span>
                      </button>
                      <button
                        onClick={() => {
                          setCommentsReturnPostId(searchPreviewPost.id);
                          setSearchPreviewPostId(null);
                          setSelectedPostId(searchPreviewPost.id);
                        }}
                        className="flex items-center gap-1.5 bg-secondary border-2 border-foreground px-2.5 py-1.5 shadow-[3px_3px_0px_0px_var(--foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_var(--foreground)] transition-all"
                      >
                        <MessageCircle size={20} strokeWidth={3} className="text-foreground" />
                        <span className="text-xs font-black text-foreground">{searchPreviewPost.comments >= 1000 ? `${(searchPreviewPost.comments / 1000).toFixed(1)}K` : searchPreviewPost.comments}</span>
                      </button>
                      <button
                        className="flex items-center justify-center w-9 h-9 bg-secondary border-2 border-foreground shadow-[3px_3px_0px_0px_var(--foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_var(--foreground)] transition-all"
                        onClick={() => { if (onSharePost && searchPreviewPost) onSharePost(searchPreviewPost); }}
                      >
                        <Share2 size={18} strokeWidth={3} className="text-foreground" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleSave(searchPreviewPost.id)}
                      className="flex items-center justify-center w-9 h-9 bg-secondary border-2 border-foreground shadow-[3px_3px_0px_0px_var(--foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_var(--foreground)] transition-all"
                      style={searchPreviewPost.isSaved ? { backgroundColor: 'var(--foreground)' } : undefined}
                    >
                      <Bookmark
                        size={20}
                        strokeWidth={3}
                        className={searchPreviewPost.isSaved ? 'text-background fill-current' : 'text-foreground'}
                      />
                    </button>
                  </div>

                  {/* Caption — theme-matched */}
                  <div className="px-4 py-3 bg-background">
                    <p className="text-sm text-foreground">
                      <span className="font-black uppercase mr-1.5 text-foreground">{searchPreviewPost.username}</span>
                      {searchPreviewPost.caption}
                    </p>

                    {searchPreviewPost.comments > 0 && (
                      <button
                        onClick={() => {
                          setCommentsReturnPostId(searchPreviewPost.id);
                          setSearchPreviewPostId(null);
                          setSelectedPostId(searchPreviewPost.id);
                        }}
                        className="mt-3 text-xs font-black text-foreground/60 uppercase tracking-wider hover:text-foreground transition-colors"
                      >
                        View all {searchPreviewPost.comments} comments →
                      </button>
                    )}
                    <p className="mt-1.5 text-[10px] font-mono font-black text-foreground/30 uppercase tracking-widest">{searchPreviewPost.timeAgo}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications are handled via the full NotificationsPage screen */}
      {false && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center">
                    <div className="bg-background w-full h-full md:max-w-2xl md:h-[90%] overflow-hidden flex flex-col border-0 md:border-4 md:border-foreground shadow-[8px_8px_0px_0px_var(--foreground)]">
            <div className="relative px-6 py-4 border-b-4 border-foreground bg-card flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Bell className="text-foreground" size={24} strokeWidth={3} style={{ animation: 'bellRing 1.5s ease 0.3s both' }} />
                <h3 className="font-black text-2xl text-foreground uppercase italic tracking-tighter">Notifications</h3>
                <div className="flex items-center justify-center px-2 py-0.5 bg-red-600 border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)]">
                  <span className="text-white text-xs font-black">3 NEW</span>
                </div>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-10 h-10 bg-card border-2 border-foreground flex items-center justify-center transition-all hover:bg-foreground hover:text-background shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)]"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-background">
              <div className="space-y-4">
                {mockNotifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      setShowNotifications(false);
                      
                      // Navigate based on notification type
                      if (notification.type === 'like') {
                        // For likes, open the post in full-screen view
                        if (notification.postId) {
                          const postExists = posts.find(p => p.id === notification.postId);
                          if (postExists) {
                            setFullScreenPostId(notification.postId);
                          }
                        }
                      } else if (notification.type === 'comment') {
                        // For comments, open the comments modal directly
                        if (notification.postId) {
                          const postExists = posts.find(p => p.id === notification.postId);
                          if (postExists) {
                            setSelectedPostId(notification.postId);
                          }
                        }
                      } else if (notification.type === 'mention') {
                        // For mentions, open the comments modal (where the mention is)
                        if (notification.postId) {
                          const postExists = posts.find(p => p.id === notification.postId);
                          if (postExists) {
                            setSelectedPostId(notification.postId);
                          }
                        }
                      } else if (notification.type === 'follow') {
                        // For follow notifications, go to the user's profile
                        onViewProfile(notification.userId);
                      }
                    }}
                    className={`relative flex items-start gap-4 p-4 transition-all border-2 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] active:scale-[0.98] ${
                      notification.isNew 
                        ? 'bg-card' 
                        : 'bg-card/90 hover:bg-card'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {notification.isNew && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] transform rotate-2">
                        NEW
                      </div>
                    )}

                    <div className="relative flex-shrink-0">
                      <img 
                        src={notification.userAvatar} 
                        alt={notification.username} 
                        className="w-12 h-12 bg-secondary border-2 border-foreground object-cover"
                      />
                      <div className={`absolute -bottom-2 -right-2 w-6 h-6 flex items-center justify-center border-2 border-foreground ${
                        notification.type === 'like' ? 'bg-pink-500' :
                        notification.type === 'comment' ? 'bg-blue-500' :
                        notification.type === 'follow' ? 'bg-green-500' :
                        'bg-purple-500'
                      } shadow-[2px_2px_0px_0px_var(--foreground)]`}>
                        {notification.type === 'like' && <Heart size={12} className="text-white fill-white" strokeWidth={3} />}
                        {notification.type === 'comment' && <MessageCircle size={12} className="text-white fill-white" strokeWidth={3} />}
                        {notification.type === 'follow' && <UserPlus size={12} className="text-white" strokeWidth={3} />}
                        {notification.type === 'mention' && <AtSign size={12} className="text-white" strokeWidth={3} />}
                      </div>
                    </div>
                    
                    <div className="flex-1 pt-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">
                        <span className="font-black hover:underline cursor-pointer uppercase" onClick={(e) => {
                          e.stopPropagation();
                          onViewProfile(notification.userId);
                          setShowNotifications(false);
                        }}>{notification.username}</span>
                        {' '}
                        <span className="font-medium">{notification.message}</span>
                      </p>
                      <p className="text-xs font-mono font-bold text-foreground/50 mt-1 uppercase">{notification.timestamp}</p>
                    </div>

                    {notification.postImage && (
                      <div className="flex-shrink-0">
                        <img 
                          src={notification.postImage} 
                          alt="Post" 
                          className="w-12 h-12 border-2 border-foreground object-cover bg-secondary shadow-[2px_2px_0px_0px_var(--foreground)]"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Post View */}
      {fullScreenPostId && (
        <FullScreenPostView
            posts={(() => {
              const combined = [...posts, ...explorePosts, ...(forYouPosts || [])];
              const seen = new Set<string>();
              return combined.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
            })()}
            initialPostId={fullScreenPostId}
            onClose={() => setFullScreenPostId(null)}
            onLike={handleLike}
            onSave={handleSave}
            onComment={(postId) => {
              setFullScreenPostId(null);
              setSelectedPostId(postId);
            }}
            onNavigateToProfile={(userId) => {
                setFullScreenPostId(null);
                onViewProfile(userId);
            }}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            onDelete={currentUserId ? (postId) => {
              const post = posts.find(p => p.id === postId) || forYouPosts.find(p => p.id === postId);
              if (post && post.userId === currentUserId) handleDeletePost(postId);
            } : undefined}
            onHashtagClick={onHashtagClick}
            currentUserId={currentUserId}
            currentUsername={userProfile?.username}
            currentUserAvatar={userProfile?.avatar}
        />
      )}

      {selectedPostId && selectedPost && (
        <CommentsModal
          onClose={() => {
            if (commentsReturnPostId) {
              setSelectedPostId(null);
              setShowSearch(true);
              setSearchPreviewPostId(commentsReturnPostId);
              setCommentsReturnPostId(null);
            } else {
              setSelectedPostId(null);
            }
          }}
          post={selectedPost}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          currentUserId={currentUserId}
          currentUserAvatar={userProfile?.avatar}
          currentUsername={userProfile?.username}
          onNavigateToProfile={(userId) => {
            setSelectedPostId(null);
            onViewProfile(userId);
          }}
        />
      )}
    </div>
  );
}