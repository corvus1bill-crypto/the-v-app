import { useState, useEffect, useMemo, lazy, Suspense, useCallback, useRef, startTransition } from 'react';
import { Post, Story } from "./types";
import { BadgeNotification, useBadgeNotifications } from "./components/BadgeNotification";
import { NotificationPopup } from "./components/NotificationPopup";
import { calculateUserBadges, UserStats } from "./utils/badgeCalculator";
import { useNotifications } from "./components/NotificationToast";
import { supabase, projectId, publicAnonKey } from "./supabaseClient";
import { HomePage } from "./components/HomePageView";
import { UserProfile } from "./components/UserProfile";
import { BottomNav } from "./components/BottomNav";
import { LoginPage } from "./components/LoginPage";
import { explorePosts, topPosts } from "./data/posts";
import * as db from "./db";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastContainer } from "./components/ToastContainer";
import { useToast } from "./hooks/useToast";
import { apiCall, createOptimisticUpdate } from "./utils/apiClient";
import { uploadToStorage } from "./utils/storageUpload";
import { isRestApi } from "./config/restApi";
import { useAuthStore } from "./store/authStore";
import * as backendApi from "./services/backendApi";
import { mapRestFeedPostToPost } from "./utils/mapRestPost";
import { formatDistanceToNow } from "date-fns";
// PageTransition removed — instant screen switches are snappier for social apps
import { ConfettiBurst, useConfetti } from "./components/ConfettiBurst";
import { ShareSheet } from "./components/ShareSheet";
import { incrementStreak } from "./components/VibeStreak";

// Lazy-loaded page components — only fetched when navigated to
const LeaderboardPage = lazy(() => import("./components/LeaderboardPage").then(m => ({ default: m.LeaderboardPage })));
const VenturePage = lazy(() => import("./components/VenturePage").then(m => ({ default: m.VenturePage })));
import { MessagesPage } from "./components/MessagesPage";
import { OnboardingPage } from "./components/OnboardingPage";
import { HashtagPage } from "./components/HashtagPage";
const ProfilePage = lazy(() => import("./components/ProfilePage").then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import("./components/SettingsPage").then(m => ({ default: m.SettingsPage })));
const CreatePostPage = lazy(() => import("./components/CreatePostPage").then(m => ({ default: m.CreatePostPage })));
const NotificationsPage = lazy(() => import("./components/NotificationsPage").then(m => ({ default: m.NotificationsPage })));
const VibeCheckPage = lazy(() => import("./components/VibeCheckPage").then(m => ({ default: m.VibeCheckPage })));
const SpotlightPage = lazy(() => import("./components/SpotlightPage").then(m => ({ default: m.SpotlightPage })));
const DiscoverPage = lazy(() => import("./components/DiscoverPage").then(m => ({ default: m.DiscoverPage })));
const VibeRecapPage = lazy(() => import("./components/VibeRecapPage").then(m => ({ default: m.VibeRecapPage })));
const AnalyticsPage = lazy(() => import("./components/AnalyticsPage").then(m => ({ default: m.AnalyticsPage })));

export type Screen = 'home' | 'leaderboard' | 'venture' | 'messages' | 'profile' | 'create' | 'settings' | 'notifications' | 'vibecheck' | 'spotlight' | 'discover' | 'viberecap' | 'analytics';

const initialStories: Story[] = [
  { id: 'story-1', userId: 'user1', username: 'TravelDreamer', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&h=1350&fit=crop', timestamp: '2h ago', viewed: false, note: '✈️ Tokyo bound!' },
  { id: 'story-2', userId: 'user4', username: 'NaturePhotos', userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&h=1350&fit=crop', timestamp: '4h ago', viewed: false, note: '📸 Golden hour' },
  { id: 'story-3', userId: 'user6', username: 'FitnessLife', userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1080&h=1350&fit=crop', timestamp: '5h ago', viewed: false, isCloseFriends: true, note: '💪 Gym day' },
  { id: 'story-4', userId: 'user1', username: 'TravelDreamer', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1080&h=1350&fit=crop', timestamp: '1h ago', viewed: false },
];

const initialPosts: Post[] = [
  { id: '1', userId: 'user1', username: 'TravelDreamer', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=1000&fit=crop', caption: 'Paradise found! 🏝️', likes: 15420, comments: 892, shares: 234, timestamp: '2 days ago', isLiked: false, isSaved: false },
  { id: '2', userId: 'user2', username: 'FoodieHeaven', userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=1000&fit=crop', caption: 'Homemade perfection 👨‍🍳✨', likes: 12834, comments: 567, shares: 198, timestamp: '3 days ago', isLiked: false, isSaved: false },
  { id: '3', userId: 'user3', username: 'UrbanExplorer', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=1000&fit=crop', caption: 'City lights never disappoint 🌃', likes: 11293, comments: 445, shares: 156, timestamp: '1 day ago', isLiked: false, isSaved: false },
  { id: '4', userId: 'user4', username: 'NaturePhotos', userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1000&fit=crop', caption: 'Mountain magic ⛰️', likes: 9876, comments: 389, shares: 134, timestamp: '4 days ago', isLiked: false, isSaved: false },
  { id: '5', userId: 'user5', username: 'PortraitPro', userAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=1000&fit=crop', caption: 'Golden hour perfection ✨', likes: 8654, comments: 312, shares: 98, timestamp: '5 days ago', isLiked: false, isSaved: false },
  { id: '6', userId: 'user6', username: 'FitnessLife', userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=1000&fit=crop', caption: 'No excuses! 💪', likes: 7432, comments: 278, shares: 87, timestamp: '3 days ago', isLiked: false, isSaved: false },
  { id: '7', userId: 'user7', username: 'PetLover', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=1000&fit=crop', caption: 'Best friend ever 🐕', likes: 6789, comments: 234, shares: 76, timestamp: '2 days ago', isLiked: false, isSaved: false },
  { id: '8', userId: 'user8', username: 'ArchitectureDaily', userAvatar: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800&h=1000&fit=crop', caption: 'Modern design goals 🏢', likes: 5921, comments: 198, shares: 65, timestamp: '6 days ago', isLiked: false, isSaved: false },
  { id: '9', userId: 'user9', username: 'ArtisticSoul', userAvatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=1000&fit=crop', caption: 'Art speaks louder 🎨', likes: 5234, comments: 167, shares: 54, timestamp: '4 days ago', isLiked: false, isSaved: false },
  { id: '10', userId: 'user10', username: 'FashionDaily', userAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=1000&fit=crop', caption: 'Style never fades 👗', likes: 4876, comments: 145, shares: 43, timestamp: '6 days ago', isLiked: false, isSaved: false },
  { id: 'poll-1', userId: 'user3', username: 'UrbanExplorer', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=1000&fit=crop', caption: 'The eternal debate — cast your vote 👇', likes: 3291, comments: 204, shares: 78, timestamp: '3h ago', isLiked: false, isSaved: false, location: 'New York, NY', poll: { question: 'Best city to live in?', options: ['New York 🗽', 'London 🎡', 'Tokyo 🗼', 'Paris 🗼'], votes: [412, 287, 356, 198] } },
  { id: 'collab-1', userId: 'user5', username: 'PortraitPro', userAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=1000&fit=crop', caption: 'Shot together, posted together 📸✨', likes: 6120, comments: 289, shares: 112, timestamp: '5h ago', isLiked: false, isSaved: false, location: 'Brooklyn, NY', collabUserId: 'user9', collabUsername: 'ArtisticSoul', collabUserAvatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=100&h=100&fit=crop', reactions: { '❤️': 342, '🔥': 218, '😮': 45 } },
  { id: 'expiring-1', userId: 'user4', username: 'NaturePhotos', userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=1000&fit=crop', caption: 'This moment only lasts 24 hours ⏳', likes: 1840, comments: 93, shares: 27, timestamp: 'Just now', isLiked: false, isSaved: false, expiresAt: new Date(Date.now() + 23.5 * 3600 * 1000).toISOString() },
  { id: 'anon-1', userId: 'user7', username: 'Anonymous', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=1000&fit=crop', caption: 'Not everything needs a name behind it 🤐', likes: 9340, comments: 512, shares: 203, timestamp: '1h ago', isLiked: false, isSaved: false, isAnonymous: true },
];

function AppContent() {
  const restToken = useAuthStore((s) => s.token);
  const [session, setSession] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => isRestApi() && !!useAuthStore.getState().token);
  const [currentScreen, _setCurrentScreen] = useState<Screen>('home');
  const setCurrentScreen = useCallback((screen: Screen | ((prev: Screen) => Screen)) => {
    startTransition(() => {
      _setCurrentScreen(screen);
    });
  }, []);
  const [currentUserId, setCurrentUserId] = useState<string>('user123'); // Will be updated from session
  
  // Toast system for user feedback
  const toast = useToast();
  const [userProfile, setUserProfile] = useState({
    name: 'Your Name',
    username: 'username',
    bio: 'Creator & Designer\nSan Francisco, CA\nLiving my best life',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [posts, setPosts] = useState<Post[]>(() => (isRestApi() ? [] : initialPosts));
  const [stories, setStories] = useState<Story[]>(() => (isRestApi() ? [] : initialStories));
  const [forYouPosts, setForYouPosts] = useState<Post[]>(() => (isRestApi() ? [] : explorePosts));
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [initialChatUser, setInitialChatUser] = useState<{ userId: string; username: string; userAvatar: string } | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [targetPostId, setTargetPostId] = useState<string | null>(null);
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  const [userFollowerCounts, setUserFollowerCounts] = useState<Record<string, number>>({});
  const [userFollowingCounts, setUserFollowingCounts] = useState<Record<string, number>>({});
  // Cache of profile data for users we follow (keyed by userId)
  const [followedUserProfiles, setFollowedUserProfiles] = useState<Map<string, { name: string; username: string; avatar: string; bio: string }>>(new Map());
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  // Compute initial scaling values immediately to avoid layout flash
  const [scale, setScale] = useState(() => window.innerWidth / 430);
  const [viewingUserProfile, setViewingUserProfile] = useState<any>(null);
  const [isLoadingViewingProfile, setIsLoadingViewingProfile] = useState(false);
  const [fetchedProfilePosts, setFetchedProfilePosts] = useState<Post[]>([]);
  const [cachedConversations, setCachedConversations] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [homeScrollToTopTrigger, setHomeScrollToTopTrigger] = useState(0);
  
  // Add virtualHeight state for proper scaling
  const [virtualHeight, setVirtualHeight] = useState(() => Math.round(window.innerHeight / (window.innerWidth / 430)));
  // Track actual viewport height in px for the outer wrapper (avoids vh/dvh inconsistencies)
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
  // Track the "stable" (no-keyboard) viewport height so keyboard open doesn't shrink the layout
  const stableHeightRef = useRef(window.innerHeight);
  const lastWidthRef = useRef(window.innerWidth);
  const scaledContainerRef = useRef<HTMLDivElement>(null);
  const outerWrapperRef = useRef<HTMLDivElement>(null);
  
  // Navigation context to remember where user came from
  const [navigationContext, setNavigationContext] = useState<{
    from?: string;
    searchQuery?: string;
    searchResults?: any[];
    reopenSearchTrigger?: number; // Add trigger to force search modal reopening
  }>({});

  // Notification popup queue system — only one popup at a time, rest queue up
  const [notificationPopup, setNotificationPopup] = useState<any>(null);
  const notificationQueueRef = useRef<any[]>([]);
  const isShowingNotificationRef = useRef(false);
  
  // Daily prompt state
  const [dailyPrompt, setDailyPrompt] = useState<string | undefined>(undefined);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('vibe_onboarding_complete'));
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const [hashtagSourcePostId, setHashtagSourcePostId] = useState<string | null>(null);

  const handleHashtagClick = (tag: string, sourcePostId?: string) => {
    setActiveHashtag(tag);
    setHashtagSourcePostId(sourcePostId || null);
  };
  
  // Notification system hook
  const { 
    notifications: systemNotifications, 
    toastNotifications, 
    unreadCount,
    addNotification, 
    dismissToast, 
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification,
    clearAll: clearAllNotifications
  } = useNotifications();

  // Track which backend notification IDs we've already ingested so we don't re-show them
  // Persisted to localStorage so unread count survives page reloads
  const [seenBackendNotifIds, setSeenBackendNotifIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('vibe_seen_notif_ids');
      if (stored) return new Set(JSON.parse(stored));
    } catch {}
    return new Set<string>();
  });

  // Persist seenBackendNotifIds to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('vibe_seen_notif_ids', JSON.stringify([...seenBackendNotifIds]));
    } catch {}
  }, [seenBackendNotifIds]);

  // ── Notification queue helpers ──
  const showNextNotification = useCallback(() => {
    if (notificationQueueRef.current.length === 0) {
      isShowingNotificationRef.current = false;
      setNotificationPopup(null);
      return;
    }
    isShowingNotificationRef.current = true;
    const next = notificationQueueRef.current.shift()!;
    setNotificationPopup(next);
  }, []);

  const handleNotificationPopupClose = useCallback(() => {
    setNotificationPopup(null);
    // Small delay before showing next to allow exit animation
    setTimeout(() => {
      showNextNotification();
    }, 350);
  }, [showNextNotification]);

  // ── Notification banner helper ──
  // Adds to persistent notification center AND queues a popup banner (one at a time)
  const showNotificationBanner = (notif: Omit<import("./components/NotificationToast").Notification, 'id' | 'timestamp' | 'read'>) => {
    addNotification(notif);
    // Queue the popup banner
    const popupNotif = {
      ...notif,
      id: `popup_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      read: false,
    };
    notificationQueueRef.current.push(popupNotif);
    // If nothing is currently showing, show the next one
    if (!isShowingNotificationRef.current) {
      showNextNotification();
    }
  };

  // Badge notification system hook
  const { 
    notifications: badgeNotifications, 
    checkForNewBadges, 
    dismissNotification: dismissBadgeNotification, 
    resetBadges
  } = useBadgeNotifications();

  const { burst: confettiBurst, trigger: triggerConfetti } = useConfetti();

  // ── Fetch posts: REST API or Supabase ──
  useEffect(() => {
    if (!currentUserId || !isLoggedIn) return;

    const loadPosts = async () => {
      if (isRestApi()) {
        setFeedLoading(true);
        setFeedError(null);
        try {
          const [feed, explore] = await Promise.all([
            backendApi.getFeed(50, 0),
            backendApi.getExplore(50, 0),
          ]);
          setPosts(feed.posts.map(mapRestFeedPostToPost));
          setForYouPosts(explore.posts.map(mapRestFeedPostToPost));
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to load feed';
          setFeedError(msg);
          toast.error(msg);
        } finally {
          setFeedLoading(false);
        }
        return;
      }

      try {
        const dbPosts = await db.fetchAllPosts(50, 0);
        const transformedPosts: Post[] = dbPosts.map((dbPost: any) => ({
          id: dbPost.id,
          userId: dbPost.user_id,
          username: dbPost.profiles?.username || 'Unknown',
          userAvatar: dbPost.profiles?.avatar_url || 'https://via.placeholder.com/100',
          imageUrl: dbPost.post_media?.[0]?.media_url || 'https://via.placeholder.com/1080',
          caption: dbPost.caption || '',
          location: dbPost.location || undefined,
          likes: 0,
          comments: 0,
          shares: 0,
          timestamp: new Date(dbPost.created_at).toLocaleDateString(),
          isLiked: false,
          isSaved: false,
        }));

        if (transformedPosts.length > 0) {
          setPosts(transformedPosts);
        }
      } catch (error) {
        console.error('Error loading posts from Supabase:', error);
      }
    };

    loadPosts();
  }, [currentUserId, isLoggedIn, restToken]);

  useEffect(() => {
    const handleResize = () => {
      const baseWidth = 430;
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      const widthChanged = Math.abs(currentWidth - lastWidthRef.current) > 1;

      // On iOS, the keyboard opening shrinks innerHeight but NOT width.
      // Only update the "stable" height when width changes (orientation) or
      // when height grows (keyboard closing / initial load).
      if (widthChanged || currentHeight >= stableHeightRef.current) {
        stableHeightRef.current = currentHeight;
      }
      lastWidthRef.current = currentWidth;

      // Always use stable height so the keyboard doesn't reflow the layout
      const h = stableHeightRef.current;
      const s = currentWidth / baseWidth;
      setScale(s);
      setVirtualHeight(Math.round(h / s));
      setViewportHeight(h);
    };

    // Use visualViewport on iOS for more reliable resize events
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleResize);
    }
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial calculation
    return () => {
      if (vv) vv.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Prevent the browser from scrolling the scaled container or outer wrapper
  // (iOS Safari can scroll overflow:hidden elements via focus/scrollIntoView inside transform:scale)
  useEffect(() => {
    const resetScroll = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      if (el.scrollTop !== 0 || el.scrollLeft !== 0) {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      }
    };
    const outer = outerWrapperRef.current;
    const scaled = scaledContainerRef.current;
    if (outer) outer.addEventListener('scroll', resetScroll, { passive: false });
    if (scaled) scaled.addEventListener('scroll', resetScroll, { passive: false });
    return () => {
      if (outer) outer.removeEventListener('scroll', resetScroll);
      if (scaled) scaled.removeEventListener('scroll', resetScroll);
    };
  }, []);

  useEffect(() => {
    if (isRestApi()) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoggedIn(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── REST JWT session (Zustand + /auth/me) ──
  useEffect(() => {
    if (!isRestApi()) return;

    if (!restToken) {
      setIsLoggedIn(false);
      setSession(null);
      setIsLoadingProfile(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const me = await backendApi.authMe();
        if (cancelled) return;
        setSession({ user: { id: me.id, created_at: new Date().toISOString() } });
        setIsLoggedIn(true);
        setCurrentUserId(me.id);
        setUserProfile({
          name: me.profile.fullName || me.profile.username,
          username: me.profile.username,
          bio: me.profile.bio || '',
          avatar:
            me.profile.avatarUrl ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
        });
      } catch {
        useAuthStore.getState().logout();
        if (!cancelled) {
          setIsLoggedIn(false);
          setSession(null);
        }
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [restToken]);

  // Load user profile from Supabase when session changes (skipped when using REST API)
  useEffect(() => {
    if (isRestApi()) return;

    const abortController = new AbortController();

    const loadUserProfile = async () => {
      const userId = session?.user?.id;
      if (!userId) {
        setIsLoadingProfile(false);
        return;
      }

      console.log('👤 Loading profile for user:', userId);
      setCurrentUserId(userId);

      // ── Returning-user check (runs before any API call) ──────────────────
      // Use session.user.created_at (always set by Supabase Auth) instead of
      // profile.createdAt so the check works even when the profile has no
      // username yet. Any account older than 5 minutes is treated as returning.
      const sessionCreatedAt = session?.user?.created_at;
      if (sessionCreatedAt) {
        const accountAgeMs = Date.now() - new Date(sessionCreatedAt).getTime();
        if (accountAgeMs > 5 * 60 * 1000) {
          localStorage.setItem('vibe_onboarding_complete', '1');
          setShowOnboarding(false);
          console.log('⏭️ Returning user (session age check) — skipping onboarding');
        }
      }

      try {
        const profile = await apiCall(
          `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/users/profile/${userId}`,
          { 
            headers: { Authorization: `Bearer ${publicAnonKey}` },
            retry: 2,
            signal: abortController.signal,
          }
        );
        if (abortController.signal.aborted) return;
        console.log('✅ Profile loaded from Supabase:', profile);
        setUserProfile({
          name: profile.username || 'User',
          username: profile.username || 'user',
          bio: profile.bio || 'New to Vibe!',
          avatar: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'
        });
      } catch (error: any) {
        if (error.name === 'AbortError') return; // Silently ignore aborted requests
        console.error('❌ Error loading user profile:', error);
        console.log('⚠️ Profile not found, using defaults');
        // Don't show error toast on profile load - just use defaults
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadUserProfile();

    return () => abortController.abort();
  }, [session]);

  useEffect(() => {
    // Sync user profile updates to all posts and stories owned by the current user
    // Only create new arrays when a post/story actually needs updating (avoids cascading re-renders)
    setPosts(prevPosts => {
      const needsUpdate = prevPosts.some(p => p.userId === currentUserId && (p.username !== userProfile.username || p.userAvatar !== userProfile.avatar));
      if (!needsUpdate) return prevPosts; // Same reference = no re-render
      return prevPosts.map(post =>
        post.userId === currentUserId
          ? { ...post, username: userProfile.username, userAvatar: userProfile.avatar }
          : post
      );
    });
    
    setStories(prevStories => {
      const needsUpdate = prevStories.some(s => s.userId === currentUserId && (s.username !== userProfile.username || s.userAvatar !== userProfile.avatar));
      if (!needsUpdate) return prevStories;
      return prevStories.map(story =>
        story.userId === currentUserId
          ? { ...story, username: userProfile.username, userAvatar: userProfile.avatar }
          : story
      );
    });
  }, [userProfile, currentUserId]);

  // Fetch profile from backend when viewing another user's profile
  useEffect(() => {
    let cancelled = false;
    const fetchViewingUserProfile = async () => {
      if (!viewingProfileId) {
        setViewingUserProfile(null);
        setIsLoadingViewingProfile(false);
        return;
      }

      // If viewing own profile, use current user profile
      if (viewingProfileId === currentUserId) {
        setViewingUserProfile({
          userId: currentUserId,
          username: userProfile.username,
          avatar: userProfile.avatar,
          bio: userProfile.bio
        });
        setIsLoadingViewingProfile(false);
        return;
      }

      // Check if user exists in local posts first
      const localUser = getProfileData(viewingProfileId);
      if (localUser) {
        setViewingUserProfile(localUser);
        setIsLoadingViewingProfile(false);
      } else {
        // Fetch profile from backend
        setIsLoadingViewingProfile(true);
        try {
          console.log('🔍 Fetching profile from Supabase for user:', viewingProfileId);
          const res = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/users/profile/${viewingProfileId}`,
            { headers: { Authorization: `Bearer ${publicAnonKey}` } }
          );
          if (cancelled) return;
          if (res.ok) {
            const profile = await res.json();
            if (!cancelled) {
              setViewingUserProfile({
                userId: viewingProfileId,
                username: profile.username || 'User',
                avatar: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
                bio: profile.bio || 'Vibing on Vibe!'
              });
            }
          } else {
            if (!cancelled) setViewingUserProfile(null);
          }
        } catch (error: any) {
          console.error('❌ Error fetching viewing user profile:', error);
          if (!cancelled) setViewingUserProfile(null);
        } finally {
          if (!cancelled) setIsLoadingViewingProfile(false);
        }
      }

      // Also fetch follower + following counts for this user (non-blocking, parallel)
      if (userFollowerCounts[viewingProfileId] === undefined || userFollowingCounts[viewingProfileId] === undefined) {
        try {
          const base = `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d`;
          const hdrs = { Authorization: `Bearer ${publicAnonKey}` };
          const [followerRes, followingRes] = await Promise.all([
            userFollowerCounts[viewingProfileId] === undefined
              ? fetch(`${base}/users/${viewingProfileId}/followers/count`, { headers: hdrs }).catch(() => null)
              : Promise.resolve(null),
            userFollowingCounts[viewingProfileId] === undefined
              ? fetch(`${base}/users/${viewingProfileId}/following/count`, { headers: hdrs }).catch(() => null)
              : Promise.resolve(null),
          ]);
          if (!cancelled && followerRes?.ok) {
            const data = await followerRes.json();
            if (typeof data.count === 'number' && !cancelled) {
              setUserFollowerCounts(prev => ({ ...prev, [viewingProfileId]: data.count }));
              console.log(`📊 [App] Viewed user ${viewingProfileId} follower count: ${data.count}`);
            }
          }
          if (!cancelled && followingRes?.ok) {
            const data = await followingRes.json();
            if (typeof data.count === 'number' && !cancelled) {
              setUserFollowingCounts(prev => ({ ...prev, [viewingProfileId]: data.count }));
              console.log(`📊 [App] Viewed user ${viewingProfileId} following count: ${data.count}`);
            }
          }
        } catch { /* non-critical */ }
      }
    };

    fetchViewingUserProfile();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingProfileId, currentUserId]);

  // Fetch posts from backend when viewing a user's profile
  useEffect(() => {
    let cancelled = false;
    if (!viewingProfileId) {
      setFetchedProfilePosts([]);
      return;
    }
    // Clear stale posts from previous profile immediately
    setFetchedProfilePosts([]);
    const fetchProfilePosts = async () => {
      try {
        if (isRestApi()) {
          const { posts: raw } = await backendApi.getUserPostsApi(viewingProfileId!);
          if (cancelled) return;
          const mapped = raw.map(mapRestFeedPostToPost);
          setFetchedProfilePosts(mapped);
          if (mapped.length > 0) {
            setPosts((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const newPosts = mapped.filter((p) => !existingIds.has(p.id));
              if (newPosts.length === 0) return prev;
              return [...prev, ...newPosts].slice(0, 200);
            });
            setViewingUserProfile((prev) => {
              if (prev) return prev;
              const firstPost = mapped[0];
              if (firstPost && firstPost.userId === viewingProfileId) {
                return {
                  userId: firstPost.userId,
                  username: firstPost.username || "User",
                  avatar:
                    firstPost.userAvatar ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
                  bio: "Vibing on Vibe!",
                };
              }
              return prev;
            });
          }
          return;
        }

        console.log('📂 [App] Fetching backend posts for profile:', viewingProfileId);
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/users/${viewingProfileId}/posts`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        if (cancelled) return;
        if (res.ok) {
          const backendPosts = await res.json();
          if (!cancelled && Array.isArray(backendPosts)) {
            console.log(`✅ [App] Fetched ${backendPosts.length} backend posts for profile ${viewingProfileId}`);
            setFetchedProfilePosts(backendPosts);
            // Also merge into main posts state so they persist across navigations
            if (backendPosts.length > 0) {
              setPosts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newPosts = backendPosts
                  .filter((p: Post) => !existingIds.has(p.id))
                  .map((p: Post) => ({ ...p, isLiked: false, isSaved: false }));
                if (newPosts.length === 0) return prev;
                console.log(`✅ [App] Merged ${newPosts.length} profile posts into main feed`);
                return [...prev, ...newPosts].slice(0, 200);
              });
              // If viewingUserProfile is still null, construct it from the first post
              setViewingUserProfile(prev => {
                if (prev) return prev; // Already set, don't override
                const firstPost = backendPosts[0];
                if (firstPost && firstPost.userId === viewingProfileId) {
                  console.log('🔧 [App] Constructing profile from fetched posts');
                  return {
                    userId: firstPost.userId,
                    username: firstPost.username || 'User',
                    avatar: firstPost.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
                    bio: 'Vibing on Vibe!'
                  };
                }
                return prev;
              });
            }
          }
        } else {
          console.warn('⚠️ [App] Failed to fetch profile posts, status:', res.status);
        }
      } catch (err) {
        console.error('❌ [App] Error fetching profile posts:', err);
      }
    };
    fetchProfilePosts();
    return () => { cancelled = true; };
  }, [viewingProfileId]);

  // Notifications and conversations are handled locally — no backend fetch needed.

  // ── Sequenced login data fetch ─────────────────────────────────────────────
  // All login-time backend calls are sequenced into one effect with staggered
  // delays, preventing the thundering-herd of concurrent requests that
  // overwhelms the edge function and causes "Failed to fetch" / "connection
  // closed" errors.
  useEffect(() => {
    if (!currentUserId || currentUserId === 'user123' || !isLoggedIn) return;
    if (isRestApi()) return;

    let cancelled = false;

    const headers = { Authorization: `Bearer ${publicAnonKey}` };
    const base = `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d`;
    const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    // Resilient fetch — retries once on network error, returns null on failure
    const safeFetch = async (url: string, retries = 1): Promise<Response | null> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          return await fetch(url, { headers });
        } catch {
          if (attempt < retries && !cancelled) await wait(800);
        }
      }
      return null;
    };

    const bootstrap = async () => {
      // 1. Own posts
      try {
        const res = await safeFetch(`${base}/users/${currentUserId}/posts`);
        if (res?.ok && !cancelled) {
          const ownPosts: Post[] = await res.json();
          if (Array.isArray(ownPosts) && !cancelled) {
            const validPosts = ownPosts.filter(p => !p.videoUrl?.startsWith('blob:'));
            if (validPosts.length > 0) {
              setPosts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newOnes = validPosts.filter(p => !existingIds.has(p.id)).map(p => ({ ...p, isLiked: false, isSaved: false }));
                console.log(`✅ Loaded ${newOnes.length} own posts from Supabase`);
                return [...newOnes, ...prev].slice(0, 150);
              });
            }
          }
        }
      } catch { /* swallow */ }
      if (cancelled) return;
      await wait(400);

      // 2. Following list + their posts (batched 3 at a time)
      try {
        const res = await safeFetch(`${base}/users/${currentUserId}/following`);
        if (res?.ok && !cancelled) {
          const followingList: Array<{ id: string; name: string; username: string; avatar: string; bio: string }> = await res.json();
          if (Array.isArray(followingList) && !cancelled) {
            setFollowedUserIds(new Set(followingList.map(u => u.id)));
            const profileMap = new Map<string, { name: string; username: string; avatar: string; bio: string }>();
            followingList.forEach(u => profileMap.set(u.id, u));
            setFollowedUserProfiles(profileMap);
            console.log(`✅ Loaded ${followingList.length} followed users`);

            if (followingList.length > 0 && !cancelled) {
              const fetchedPosts: Post[] = [];
              for (let i = 0; i < followingList.length && !cancelled; i += 3) {
                const batch = followingList.slice(i, i + 3);
                const results = await Promise.allSettled(batch.map(u => safeFetch(`${base}/users/${u.id}/posts`, 0)));
                for (const r of results) {
                  if (r.status === 'fulfilled' && r.value?.ok && !cancelled) {
                    try { const up: Post[] = await r.value.json(); fetchedPosts.push(...(Array.isArray(up) ? up : [])); } catch {}
                  }
                }
                if (i + 3 < followingList.length) await wait(250);
              }
              if (fetchedPosts.length > 0 && !cancelled) {
                setPosts(prev => {
                  const existingIds = new Set(prev.map(p => p.id));
                  const newPosts = fetchedPosts.filter(p => !existingIds.has(p.id));
                  console.log(`✅ Added ${newPosts.length} posts from followed users`);
                  return [...newPosts, ...prev].slice(0, 150);
                });
              }
            }
          }
        }
      } catch { /* swallow */ }
      if (cancelled) return;
      await wait(400);

      // 3. Conversations
      try {
        const res = await safeFetch(`${base}/conversations/${currentUserId}`);
        if (res?.ok && !cancelled) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && !cancelled) setCachedConversations(data);
        }
      } catch { /* swallow */ }
      if (cancelled) return;
      await wait(400);

      // 4. Follower count
      try {
        const res = await safeFetch(`${base}/users/${currentUserId}/followers/count`);
        if (res?.ok && !cancelled) {
          const data = await res.json();
          const count = typeof data.count === 'number' ? data.count : 0;
          if (!cancelled) setUserFollowerCounts(prev => ({ ...prev, [currentUserId]: count }));
          console.log(`✅ Follower count: ${count}`);
        }
      } catch { /* swallow */ }
      if (cancelled) return;
      await wait(400);

      // 5. Seed notifications
      try {
        const res = await safeFetch(`${base}/notifications/${currentUserId}`);
        if (res?.ok && !cancelled) {
          const existing: any[] = await res.json();
          if (Array.isArray(existing) && !cancelled) {
            setSeenBackendNotifIds(new Set(existing.map((n: any) => n.id).filter(Boolean)));
            console.log(`✅ Seeded ${existing.length} backend notifications`);
          }
        }
      } catch { /* swallow */ }
      if (cancelled) return;
      await wait(400);

      // 6. Saved post IDs — hydrate isSaved on all loaded posts
      try {
        const res = await safeFetch(`${base}/users/${currentUserId}/saves`);
        if (res?.ok && !cancelled) {
          const data = await res.json();
          const savedPostIds: Set<string> = new Set((data.postIds || []) as string[]);
          if (savedPostIds.size > 0 && !cancelled) {
            const hydrate = (p: Post) => ({ ...p, isSaved: savedPostIds.has(p.id) });
            setPosts(prev => prev.map(hydrate));
            setForYouPosts(prev => prev.map(hydrate));
            console.log(`✅ Hydrated isSaved for ${savedPostIds.size} posts`);
          }
        }
      } catch { /* swallow */ }
    };

    bootstrap();

    // Keep conversations fresh via realtime
    const channel = supabase.channel(`user-convos-prefetch:${currentUserId}`)
      .on('broadcast', { event: 'update_conversation' }, () => {
        fetch(`${base}/conversations/${currentUserId}`, { headers })
          .then(r => r.json())
          .then(data => { if (Array.isArray(data) && data.length > 0) setCachedConversations(data); })
          .catch(() => {});
      })
      .subscribe();

    // Poll every 30s for follower count + new notifications (staggered)
    const interval = setInterval(async () => {
      if (cancelled) return;
      try {
        const res = await safeFetch(`${base}/users/${currentUserId}/followers/count`, 0);
        if (res?.ok && !cancelled) {
          const data = await res.json();
          const count = typeof data.count === 'number' ? data.count : 0;
          setUserFollowerCounts(prev => {
            if (prev[currentUserId] !== count) {
              console.log(`🔄 Follower count: ${prev[currentUserId]} → ${count}`);
              return { ...prev, [currentUserId]: count };
            }
            return prev;
          });
        }
      } catch { /* swallow */ }
      if (cancelled) return;
      await wait(600);
      try {
        const res = await safeFetch(`${base}/notifications/${currentUserId}`, 0);
        if (res?.ok && !cancelled) {
          const backendNotifs: any[] = await res.json();
          if (Array.isArray(backendNotifs) && !cancelled) {
            setSeenBackendNotifIds(prevSeen => {
              const newSeen = new Set(prevSeen);
              let hasNew = false;
              for (const bn of backendNotifs) {
                if (!bn.id || prevSeen.has(bn.id)) continue;
                newSeen.add(bn.id);
                hasNew = true;
                if (!bn.read && !cancelled) {
                  const notifType = bn.type === 'follower' ? 'follow' : (bn.type || 'follow');
                  const titleMap: Record<string, string> = { follow: 'New Follower', like: 'New Like', comment: 'New Comment', message: 'New Message', leaderboard: 'Leaderboard' };
                  showNotificationBanner({
                    type: notifType,
                    title: titleMap[notifType] || 'Notification',
                    message: bn.message || `${bn.username || 'Someone'} ${notifType === 'follow' ? 'started following you' : notifType === 'message' ? 'sent you a message' : 'interacted with your post'}`,
                    username: bn.username,
                    avatar: bn.userAvatar, userAvatar: bn.userAvatar, userId: bn.userId, postId: bn.postId,
                  });
                }
              }
              return hasNew ? newSeen : prevSeen;
            });
          }
        }
      } catch { /* swallow */ }
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, isLoggedIn]);

  // REST API: conversations, following, follower count, notification polling
  useEffect(() => {
    if (!isRestApi() || !currentUserId || !isLoggedIn || currentUserId === "user123") return;
    let cancelled = false;

    const bootstrapRest = async () => {
      try {
        const [conv, fcount, following, notifs] = await Promise.all([
          backendApi.listConversations().catch(() => ({ conversations: [] as backendApi.RestConversation[] })),
          backendApi.getFollowersCount(currentUserId).catch(() => ({ count: 0 })),
          backendApi.getFollowingList(currentUserId).catch(() => [] as backendApi.FollowingUser[]),
          backendApi.listNotificationsApi().catch(() => ({ notifications: [] as backendApi.RestNotifRow[] })),
        ]);
        if (cancelled) return;
        if (conv.conversations.length > 0) {
          setCachedConversations(
            conv.conversations.map((c) => ({
              id: c.id,
              userId: c.otherUserId || "",
              username: c.username,
              userAvatar: c.avatarUrl || "",
              lastMessage: c.lastMessage,
              timestamp: formatDistanceToNow(new Date(c.lastAt), { addSuffix: true }),
              unreadCount: 0,
            }))
          );
        }
        setUserFollowerCounts((prev) => ({ ...prev, [currentUserId]: fcount.count }));
        setFollowedUserIds(new Set(following.map((f) => f.id)));
        const pmap = new Map<string, { name: string; username: string; avatar: string; bio: string }>();
        following.forEach((f) =>
          pmap.set(f.id, { name: f.name, username: f.username, avatar: f.avatar, bio: f.bio || "" })
        );
        setFollowedUserProfiles(pmap);
        setSeenBackendNotifIds(new Set(notifs.notifications.map((n) => n.id)));
      } catch (e) {
        console.error("REST bootstrap:", e);
      }
    };

    bootstrapRest();

    const interval = setInterval(async () => {
      if (cancelled) return;
      try {
        const { notifications } = await backendApi.listNotificationsApi();
        if (cancelled) return;
        setSeenBackendNotifIds((prevSeen) => {
          const next = new Set(prevSeen);
          let changed = false;
          for (const bn of notifications) {
            if (!bn.id || prevSeen.has(bn.id)) continue;
            next.add(bn.id);
            changed = true;
            if (!bn.is_read) {
              const t = (bn.type || "follow") as string;
              const titleMap: Record<string, string> = {
                follow: "New Follower",
                like: "New Like",
                comment: "New Comment",
                message: "New Message",
              };
              const uiType =
                t === "like"
                  ? "like"
                  : t === "comment"
                    ? "comment"
                    : t === "message"
                      ? "message"
                      : "follow";
              showNotificationBanner({
                type: uiType,
                title: titleMap[t] || "Notification",
                message:
                  t === "follow"
                    ? `${bn.actor?.username || "Someone"} started following you`
                    : t === "message"
                      ? `${bn.actor?.username || "Someone"} sent you a message`
                      : `${bn.actor?.username || "Someone"} interacted with your content`,
                username: bn.actor?.username,
                avatar: bn.actor?.avatar_url || undefined,
                userAvatar: bn.actor?.avatar_url || undefined,
                userId: bn.actor_id || undefined,
                postId: bn.post_id || undefined,
              });
            }
          }
          return changed ? next : prevSeen;
        });
      } catch {
        /* ignore */
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, isLoggedIn, restToken]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (!currentUserId || !isLoggedIn) return;
    setIsRefreshing(true);
    try {
      if (isRestApi()) {
        setFeedError(null);
        const [feed, explore] = await Promise.all([
          backendApi.getFeed(50, 0),
          backendApi.getExplore(50, 0),
        ]);
        setPosts(feed.posts.map(mapRestFeedPostToPost));
        setForYouPosts(explore.posts.map(mapRestFeedPostToPost));
        setIsRefreshing(false);
        return;
      }

      // Refresh Following feed
      const shuffledPosts = [...posts].sort(() => Math.random() - 0.5).map((post, index) => ({
        ...post,
        likes: post.likes + Math.floor(Math.random() * 50),
        comments: post.comments + Math.floor(Math.random() * 10),
        timestamp: index < 2 ? 'Just now' : post.timestamp,
      }));
      setPosts(shuffledPosts);
      
      // Refresh For You feed
      const shuffledForYouPosts = [...forYouPosts].sort(() => Math.random() - 0.5).map((post, index) => ({
        ...post,
        likes: post.likes + Math.floor(Math.random() * 30),
        comments: post.comments + Math.floor(Math.random() * 8),
        timestamp: index < 3 ? 'Just now' : post.timestamp,
      }));
      setForYouPosts(shuffledForYouPosts);
      
      // Reset stories
      setStories(prev => prev.map(story => ({ ...story, viewed: false })));

      // Re-fetch follower count from backend
      try {
        const countRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/users/${currentUserId}/followers/count`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        if (countRes.ok) {
          const countData = await countRes.json();
          const count = typeof countData.count === 'number' ? countData.count : 0;
          setUserFollowerCounts(prev => ({ ...prev, [currentUserId]: count }));
        }
      } catch (err) {
        console.error('❌ Error refreshing follower count:', err);
      }

      console.log('✅ Manual refresh complete - both feeds refreshed');
    } catch (error) {
      console.error('❌ Error during manual refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Automatically check for new badges whenever posts change (debounced to avoid running on every like/comment)
  useEffect(() => {
    if (!currentUserId || posts.length === 0) return;

    const timer = setTimeout(() => {
      const userPosts = posts.filter(p => p.userId === currentUserId);
      const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0);
      const maxLikesOnSinglePost = userPosts.length > 0 ? Math.max(...userPosts.map(p => p.likes)) : 0;
      const totalComments = userPosts.reduce((sum, post) => sum + post.comments, 0);

      const stats: UserStats = {
        postsCount: userPosts.length,
        totalLikes,
        maxLikesOnSinglePost,
        totalComments,
        followersCount: userFollowerCounts[currentUserId] || 0,
        followingCount: followedUserIds.size,
      };

      const badges = calculateUserBadges(stats);
      checkForNewBadges(badges);
    }, 2000); // Only check badges 2s after posts stop changing

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, currentUserId, userFollowerCounts, followedUserIds]);

  const getUserFollowerCount = (userId: string) => {
    if (userFollowerCounts[userId] !== undefined) {
      return userFollowerCounts[userId];
    }
    return 0;
  };

  const getUserFollowingCount = (userId: string) => {
    if (userId === currentUserId) return followedUserIds.size;
    if (userFollowingCounts[userId] !== undefined) {
      return userFollowingCounts[userId];
    }
    return 0;
  };

  const handleFollowToggle = (targetUserId: string) => {
    const isFollowing = followedUserIds.has(targetUserId);
    const previousFollowState = new Set(followedUserIds);
    const previousCounts = { ...userFollowerCounts };
    
    // Optimistic update - apply immediately
    const optimisticUpdate = () => {
      setFollowedUserIds(prev => {
        const next = new Set(prev);
        if (isFollowing) next.delete(targetUserId);
        else next.add(targetUserId);
        return next;
      });
      
      setUserFollowerCounts(prev => {
        const currentCount = prev[targetUserId] !== undefined ? prev[targetUserId] : getUserFollowerCount(targetUserId);
        return {
          ...prev,
          [targetUserId]: isFollowing ? Math.max(0, currentCount - 1) : currentCount + 1
        };
      });

      // Keep followedUserProfiles in sync
      if (isFollowing) {
        setFollowedUserProfiles(prev => {
          const next = new Map(prev);
          next.delete(targetUserId);
          return next;
        });
      } else {
        // When following, cache the profile from posts/stories or viewingUserProfile
        const userPost = posts.find(p => p.userId === targetUserId);
        const userStory = stories.find(s => s.userId === targetUserId);
        const userData = userPost || userStory;
        const profileFromViewing = viewingUserProfile?.userId === targetUserId ? viewingUserProfile : null;

        const name = profileFromViewing?.username || userData?.username || targetUserId;
        const avatar = profileFromViewing?.avatar || userData?.userAvatar
          || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
        const bio = profileFromViewing?.bio || '';

        setFollowedUserProfiles(prev => {
          const next = new Map(prev);
          next.set(targetUserId, { name, username: name, avatar, bio });
          return next;
        });
      }
    };
    
    // Rollback function if API fails
    const rollback = () => {
      setFollowedUserIds(previousFollowState);
      setUserFollowerCounts(previousCounts);
      toast.error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user. Please try again.`);
    };
    
    const apiUpdate = async () => {
      if (isRestApi()) {
        if (isFollowing) await backendApi.unfollowUser(targetUserId);
        else await backendApi.followUser(targetUserId);
        return;
      }
      if (isFollowing) {
        return await apiCall(
          `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/follow/${currentUserId}/${targetUserId}`,
          { 
            method: 'DELETE', 
            headers: { Authorization: `Bearer ${publicAnonKey}` },
            retry: 2
          }
        );
      } else {
        return await apiCall(
          `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/follow`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
            body: JSON.stringify({ followerId: currentUserId, followingId: targetUserId }),
            retry: 2
          }
        );
      }
    };
    
    // Execute optimistic update
    createOptimisticUpdate(optimisticUpdate, apiUpdate, rollback)
      .then(() => {
        console.log(`✅ ${isFollowing ? 'Unfollowed' : 'Followed'} user ${targetUserId}`);
        // No notification popup for your own follow action
      })
      .catch((error) => {
        console.error('❌ Error updating follow relationship:', error);
      });
  };

   const handleAddPost = (
    newPost: Omit<Post, 'id' | 'userId' | 'username' | 'userAvatar' | 'timestamp' | 'likes' | 'comments' | 'shares' | 'isLiked' | 'isSaved'>,
    blobs?: { masterBlobs: Blob[]; thumbBlobs: Blob[] }
  ) => {
    let post: Post;
    
    // Blobs carry actual image binary for uploading to Storage.
    // imageUrls/thumbnailUrls in newPost are lightweight blob:// URLs for rendering.
    const masterBlobs = blobs?.masterBlobs || [];
    const thumbBlobs  = blobs?.thumbBlobs  || [];

    try {
      console.log('📝 Creating new post:', { 
        hasCaption: !!newPost.caption, 
        imageCount: newPost.imageUrls?.length || 0,
        hasVideo: !!newPost.videoUrl,
        hasPoll: !!newPost.poll,
        blobCount: masterBlobs.length,
      });
      
      // Validate post has content
      if (!newPost.caption?.trim() && !newPost.imageUrls?.length && !newPost.videoUrl && !newPost.poll) {
        console.error('❌ Post has no content');
        alert('Please add some content to your post (text, images, video, or poll).');
        return;
      }
      
      post = {
        ...newPost,
        id: `post-${Date.now()}`,
        userId: currentUserId,
        username: userProfile.username || 'You',
        userAvatar: userProfile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        timestamp: 'now',
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        isSaved: false,
      };
      
      // Limit posts array to prevent memory issues (keep only last 100 posts)
      setPosts(prevPosts => {
        const newPosts = [post, ...prevPosts];
        return newPosts.slice(0, 100);
      });
      // Also add to For You feed so it appears on both tabs
      setForYouPosts(prevPosts => {
        const newPosts = [post, ...prevPosts];
        return newPosts.slice(0, 100);
      });
      console.log('✅ Post created in local state (blob URLs — zero base64 in memory)');
      incrementStreak();
    } catch (error) {
      console.error('❌ Error creating post in local state:', error);
      alert('Error creating post. Please try again with smaller files.');
      return;
    }
    
    // ── Upload images to Supabase Storage, then persist post ─────────────────
    // Uses Blob objects from CreatePostPage — each is uploaded as raw binary
    // via multipart/form-data. No base64 conversion needed!
    const uploadAndSavePost = async () => {
      try {
        const postId = post.id;

        if (isRestApi()) {
          const urls: string[] = [];
          for (let i = 0; i < masterBlobs.length; i++) {
            const up = await backendApi.uploadImage(masterBlobs[i], `${postId}-img-${i}.jpg`);
            urls.push(up.url);
          }
          if (
            urls.length === 0 &&
            post.imageUrl?.startsWith("http")
          ) {
            urls.push(post.imageUrl);
          }
          const created = await backendApi.createPostApi({
            caption: post.caption,
            location: post.location,
            mediaUrls: urls,
          });
          const mapped = mapRestFeedPostToPost(created);
          setPosts((prev) => [mapped, ...prev.filter((p) => p.id !== postId)].slice(0, 100));
          setForYouPosts((prev) => [mapped, ...prev.filter((p) => p.id !== postId)].slice(0, 100));
          toast.success("Post published successfully!");
          return;
        }
        
        // 1. Upload master images — one at a time (raw Blobs via FormData)
        let remoteImageUrls: string[] | undefined;
        if (masterBlobs.length > 0) {
          console.log(`📤 Uploading ${masterBlobs.length} post image(s) to Storage (sequential, binary)…`);
          const results: string[] = [];
          for (let i = 0; i < masterBlobs.length; i++) {
            try {
              const r = await uploadToStorage(
                masterBlobs[i],
                `${postId}-img-${i}.jpg`,
                `posts/${currentUserId}`,
                'image/jpeg'
              );
              if (r.success && r.url) results.push(r.url);
              else console.warn(`⚠️ Image ${i} upload failed:`, r.error);
            } catch (imgErr) {
              console.warn(`⚠️ Image ${i} upload error:`, imgErr);
            }
          }
          remoteImageUrls = results.length > 0 ? results : undefined;
          console.log(`✅ ${results.length}/${masterBlobs.length} images uploaded to Storage`);
        }
        
        // 2. Upload thumbnails — one at a time (raw Blobs via FormData)
        let remoteThumbnailUrls: string[] | undefined;
        if (thumbBlobs.length > 0) {
          console.log(`📤 Uploading ${thumbBlobs.length} thumbnail(s) to Storage (sequential, binary)…`);
          const results: string[] = [];
          for (let i = 0; i < thumbBlobs.length; i++) {
            try {
              const r = await uploadToStorage(
                thumbBlobs[i],
                `${postId}-thumb-${i}.jpg`,
                `posts/${currentUserId}/thumbs`,
                'image/jpeg'
              );
              if (r.success && r.url) results.push(r.url);
              else console.warn(`⚠️ Thumb ${i} upload failed:`, r.error);
            } catch (thumbErr) {
              console.warn(`⚠️ Thumb ${i} upload error:`, thumbErr);
            }
          }
          remoteThumbnailUrls = results.length > 0 ? results : undefined;
        }
        
        // 3. Build server post with remote URLs
        const serverPost: any = {
          ...post,
          imageUrls: remoteImageUrls && remoteImageUrls.length > 0 ? remoteImageUrls : undefined,
          imageUrl: remoteImageUrls && remoteImageUrls.length > 0 ? remoteImageUrls[0] : 
                    (post.imageUrl?.startsWith('http') ? post.imageUrl : undefined),
          thumbnailUrls: remoteThumbnailUrls && remoteThumbnailUrls.length > 0 ? remoteThumbnailUrls : undefined,
          // Blob URLs cannot survive a page reload — omit them
          videoUrl: post.videoUrl?.startsWith('blob:') ? undefined : post.videoUrl,
          // Keep only remote avatar URL
          userAvatar: post.userAvatar?.startsWith('http') ? post.userAvatar : undefined,
        };
        
        // Deep sanitize: strip any remaining data:/blob: URIs that slipped through
        const deepSanitize = (obj: any): any => {
          if (obj === null || obj === undefined) return obj;
          if (typeof obj === 'string') {
            if (obj.startsWith('data:') || obj.startsWith('blob:')) return undefined;
            return obj;
          }
          if (Array.isArray(obj)) {
            const cleaned = obj.map(deepSanitize).filter(v => v !== undefined);
            return cleaned.length > 0 ? cleaned : undefined;
          }
          if (typeof obj === 'object') {
            const result: any = {};
            for (const [key, val] of Object.entries(obj)) {
              const sanitized = deepSanitize(val);
              if (sanitized !== undefined) result[key] = sanitized;
            }
            return result;
          }
          return obj;
        };
        
        const cleanPost = deepSanitize(serverPost);
        const dataSize = JSON.stringify(cleanPost).length;
        console.log(`📊 Server post size: ${(dataSize / 1024).toFixed(2)} KB`);
        
        if (dataSize > 900 * 1024) {
          console.warn('⚠️ Post data still too large after upload, skipping server save');
          toast.warning('Post visible locally. Data too large to sync.');
          return;
        }
        
        // 4. Save post metadata to KV
        await apiCall(
          `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/posts`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
            body: JSON.stringify(cleanPost),
            retry: 2,
            timeout: 15000, // Generous timeout for upload flow
          }
        );
        
        console.log('✅ Post saved to Supabase with remote image URLs');
        toast.success('Post published successfully!');
        
        // 5. Update local state to use remote URLs (so they survive refresh)
        if (remoteImageUrls && remoteImageUrls.length > 0) {
          const urlUpdater = (p: Post) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              imageUrls: remoteImageUrls,
              imageUrl: remoteImageUrls![0],
              thumbnailUrls: remoteThumbnailUrls || p.thumbnailUrls,
            };
          };
          setPosts(prev => prev.map(urlUpdater));
          setForYouPosts(prev => prev.map(urlUpdater));
          console.log('✅ Local post state updated with remote URLs (both feeds)');
        }
        
      } catch (error: any) {
        console.error('❌ Error in upload-and-save flow:', error);
        toast.error('Post visible locally but failed to sync to server.');
      }
    };
    
    // Fire async upload + save (non-blocking — post is already in local state)
    // Catch any unhandled rejection to prevent app crash
    uploadAndSavePost().catch(err => {
      console.error('❌ Unhandled error in uploadAndSavePost:', err);
    });
  };

  const handleAddStory = (newStory: Story) => {
    const story: Story = {
      ...newStory,
      userId: currentUserId,
      username: userProfile.username || 'You',
      userAvatar: userProfile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    };
    setStories(prev => [story, ...prev]);
  };

  const handleViewProfileChange = (id: string | null) => {
    setViewingProfileId(id);
  };

  const handleNavigateToMessages = (user?: { userId: string; username: string; userAvatar: string }) => {
    setViewingProfileId(null); // Close profile overlay if open
    
    if (user) {
      setInitialChatUser(user);
    } else {
      // If navigating generally, we can clear the deep link user to avoid auto-opening
      setInitialChatUser(null);
    }
    setCurrentScreen('messages');
  };

  const handleMessageBack = () => {
    // Return to home by default from messages
    console.log('⬅️ [App] Messages back button - returning to home feed');
    setCurrentScreen('home');
    setInitialChatUser(null);
    // Clear navigation context to prevent search modal from reopening
    setNavigationContext({});
  };

  const handleNavigateToPost = (postId: string) => {
    setTargetPostId(postId);
    setCurrentScreen('home');
  };

  const handleNavigation = (screen: Screen) => {
    // Always clear overlays when navigating between tabs
    setViewingProfileId(null);
    setTargetPostId(null);
    setIsOverlayOpen(false);
    
    // Only clear navigation context if not navigating to venture
    // This preserves search state when returning to venture via bottom nav
    if (screen !== 'venture') {
      setNavigationContext({});
    }
    
    setCurrentScreen(screen);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#/${screen}`);
    }
  };

  // Deep link: sync screen from URL hash (#/messages, #/home, …)
  useEffect(() => {
    const valid: Screen[] = [
      'home',
      'leaderboard',
      'venture',
      'messages',
      'profile',
      'create',
      'settings',
      'notifications',
      'vibecheck',
      'spotlight',
      'discover',
      'viberecap',
      'analytics',
    ];
    const fromHash = () => {
      const seg = window.location.hash.replace(/^#\/?/, '').split('/')[0] as Screen;
      if (valid.includes(seg)) setCurrentScreen(seg);
    };
    window.addEventListener('hashchange', fromHash);
    fromHash();
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  // Logic to resolve user data for the profile overlay
  // Merge all posts to find user data - OPTIMIZED with useMemo
  const uniquePosts = useMemo(() => {
    const allPosts = [...posts, ...forYouPosts, ...explorePosts, ...topPosts, ...fetchedProfilePosts];
    const uniquePostsMap = new Map();
    allPosts.forEach(post => {
      if (!uniquePostsMap.has(post.id)) {
        uniquePostsMap.set(post.id, post);
      }
    });
    return Array.from(uniquePostsMap.values());
  }, [posts, forYouPosts, fetchedProfilePosts]);

  const getProfileData = (id: string) => {
    const userFromPosts = uniquePosts.find(p => p.userId === id);
    if (userFromPosts) {
      return {
        userId: userFromPosts.userId,
        username: userFromPosts.username,
        avatar: userFromPosts.userAvatar,
        bio: `${userFromPosts.username} shares amazing content on Vibe!`
      };
    }
    if (id === currentUserId && userProfile) {
      return {
        userId: currentUserId,
        username: userProfile.username,
        avatar: userProfile.avatar,
        bio: userProfile.bio
      };
    }
    return null;
  };

  const viewingUser = viewingProfileId ? getProfileData(viewingProfileId) : null;
  const viewingUserPosts = useMemo(() => viewingProfileId ? uniquePosts.filter(p => p.userId === viewingProfileId) : [], [viewingProfileId, uniquePosts]);
  // Resolved profile: prefer backend-fetched profile, fall back to post-derived data
  const resolvedViewingProfile = viewingUserProfile || viewingUser;

  // Generate followed users list for ProfilePage
  const generateFollowedUsersList = () => {
    const followedUsers: Array<{ id: string; name: string; username: string; avatar: string; isFollowing: boolean }> = [];
    
    followedUserIds.forEach(userId => {
      // 1. Try from posts/stories (mock or real)
      const userPost = posts.find(p => p.userId === userId);
      const userStory = stories.find(s => s.userId === userId);

      if (userPost || userStory) {
        const userData = userPost || userStory;
        followedUsers.push({
          id: userId,
          name: userData!.username,
          username: userData!.username,
          avatar: userData!.userAvatar,
          isFollowing: true
        });
        return;
      }

      // 2. Fallback: use cached profile data fetched from the server
      const cached = followedUserProfiles.get(userId);
      if (cached) {
        followedUsers.push({
          id: userId,
          name: cached.name || cached.username,
          username: cached.username,
          avatar: cached.avatar,
          isFollowing: true
        });
      }
    });
    
    return followedUsers;
  };

  const followedUsersList = useMemo(() => generateFollowedUsersList(), [followedUserIds, posts, stories, followedUserProfiles]);

  // Filter home feed to show posts and stories from followed users + your own content
  // If you follow people, show only those + yourself. If you follow nobody, show all posts (discovery mode)
  const homeFeedPosts = useMemo(() => followedUserIds.size > 0
    ? posts.filter(p => followedUserIds.has(p.userId) || p.userId === currentUserId)
    : posts, [posts, followedUserIds, currentUserId]);

  const homeFeedStories = useMemo(() => followedUserIds.size > 0
    ? stories.filter(s => followedUserIds.has(s.userId) || s.userId === currentUserId)
    : stories, [stories, followedUserIds, currentUserId]);

  // Memoize filtered arrays for ProfilePage to avoid creating new refs each render
  const currentUserPosts = useMemo(() => {
    // Include both main posts and any fetched profile posts for completeness
    const allPosts = [...posts, ...fetchedProfilePosts];
    const seen = new Set<string>();
    return allPosts.filter(p => {
      if (p.userId !== currentUserId || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [posts, fetchedProfilePosts, currentUserId]);
  const currentUserStories = useMemo(() => stories.filter(s => s.userId === currentUserId), [stories, currentUserId]);
  const viewingUserStories = useMemo(() => viewingProfileId ? stories.filter(s => s.userId === viewingProfileId) : [], [stories, viewingProfileId]);

  if (!isLoggedIn) {
    return <LoginPage />; // Callback not needed as onAuthStateChange handles it
  }

  return (
    <div ref={outerWrapperRef} style={{ width: '100vw', height: `${viewportHeight}px`, overflow: 'hidden' }} className="bg-background">
      <div 
        ref={scaledContainerRef}
        style={{
          width: '430px', // Fixed reference width of iPhone 16 Pro Max
          height: `${virtualHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          overflow: 'hidden',
        }}
        className="bg-background text-foreground font-sans selection:bg-foreground selection:text-background relative"
      >
        {/* Background and particles removed for performance */}

        {/* Onboarding flow — shown on first login.
            Gate on !isLoadingProfile so it doesn't flash briefly on re-login
            while we wait for the Supabase profile check to resolve. */}
        {showOnboarding && !isLoadingProfile && (
          <OnboardingPage
            currentUserId={currentUserId}
            onComplete={({ interests, followedUsers: toFollow, displayName }) => {
              setShowOnboarding(false);
              localStorage.setItem('vibe_onboarding_complete', '1');
              // Update display name if provided
              if (displayName && displayName.trim() && displayName !== userProfile.username) {
                setUserProfile(prev => ({ ...prev, name: displayName }));
              }
              // Auto-follow suggested users
              toFollow.forEach(uid => {
                if (!followedUserIds.has(uid)) handleFollowToggle(uid);
              });
            }}
            onSkip={() => {
              setShowOnboarding(false);
              localStorage.setItem('vibe_onboarding_complete', '1');
            }}
            username={userProfile.username}
          />
        )}

        {/* Badge/Achievement Notifications - Only notification system enabled */}
        <BadgeNotification
          badges={badgeNotifications}
          onDismiss={dismissBadgeNotification}
          onClick={(badge) => {
            // Navigate to profile stats tab when a badge notification is tapped
            setCurrentScreen('profile');
          }}
        />

        {/* Confetti burst for milestones */}
        <ConfettiBurst active={confettiBurst.active} originX={confettiBurst.x} originY={confettiBurst.y} count={22} />



        {/* Notification Popup */}
        <NotificationPopup
          notification={notificationPopup}
          onClose={handleNotificationPopupClose}
          onClick={() => {
            if (notificationPopup) {
              // Handle notification click based on type
              if (notificationPopup.type === 'follow' && notificationPopup.userId) {
                setViewingProfileId(notificationPopup.userId);
              } else if (notificationPopup.type === 'message') {
                setCurrentScreen('messages');
              } else if (notificationPopup.type === 'leaderboard') {
                setCurrentScreen('leaderboard');
              } else if (notificationPopup.postId) {
                handleNavigateToPost(notificationPopup.postId);
              } else if (notificationPopup.userId) {
                setViewingProfileId(notificationPopup.userId);
              }
              handleNotificationPopupClose();
            }
          }}
        />

        {/* Notification Toast System - DISABLED: Only showing badge/achievement notifications now */}
        {/* <NotificationToast 
          notifications={toastNotifications} 
          onDismiss={dismissToast}
          onNotificationClick={(notification) => {
            if (notification.type === 'follow') {
              setViewingProfileId(notification.userId || '');
            } else if (notification.postId) {
              handleNavigateToPost(notification.postId);
            } else if (notification.type === 'message') {
              setCurrentScreen('messages');
            }
            dismissToast(notification.id);
          }}
        /> */}
        
        {/* Screen Content */}
        <div 
          className={`absolute inset-0 z-10 overflow-hidden flex flex-col bg-background ${['messages', 'create', 'story', 'camera', 'vibecheck', 'spotlight', 'discover', 'viberecap', 'analytics'].includes(currentScreen) ? '' : 'pb-[104px]'}`}
          onScroll={(e) => { e.currentTarget.scrollTop = 0; e.currentTarget.scrollLeft = 0; }}
        >
          
          {/* Profile Overlay */}
          {viewingProfileId && (
            <div className="absolute inset-0 z-[60] bg-background animate-in slide-in-from-right duration-200" style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden' }}>
              {isLoadingViewingProfile ? (
                <div className="h-full flex flex-col items-center justify-center bg-background p-4 text-center">
                  <div className="w-12 h-12 border-4 border-foreground border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-foreground font-black uppercase">Loading profile...</p>
                </div>
              ) : resolvedViewingProfile ? (
                <UserProfile
                  userId={resolvedViewingProfile.userId}
                  username={resolvedViewingProfile.username}
                  displayName={resolvedViewingProfile.username}
                  avatar={resolvedViewingProfile.avatar}
                  bio={resolvedViewingProfile.bio || 'Vibing on Vibe!'}
                  followers={getUserFollowerCount(resolvedViewingProfile.userId)}
                  following={getUserFollowingCount(resolvedViewingProfile.userId)}
                  postsCount={viewingUserPosts.length}
                  isFollowing={followedUserIds.has(resolvedViewingProfile.userId)}
                  posts={viewingUserPosts}
                  stories={viewingUserStories}
                  onStoryView={(storyId) => {
                    setStories(prevStories => 
                      prevStories.map(s => s.id === storyId ? { ...s, viewed: true } : s)
                    );
                  }}
                  onBack={() => {
                    console.log('⬅️ [App] Back button clicked. Navigation context:', navigationContext);
                    
                    // Always clear overlay/post states to prevent nav from getting stuck hidden
                    setIsOverlayOpen(false);
                    setTargetPostId(null);
                    
                    // Return to the specific screen based on where we came from
                    if (navigationContext.from === 'venture-search') {
                      // Return to Venture page with search state preserved
                      console.log('✅ [App] Returning to Venture search page');
                      setCurrentScreen('venture');
                      setViewingProfileId(null);
                      // Keep navigation context so search state is preserved
                    } else if (navigationContext.from === 'home-feed') {
                      // Return to Home feed
                      console.log('✅ [App] Returning to Home feed');
                      setCurrentScreen('home');
                      setViewingProfileId(null);
                      setNavigationContext({}); // Clear context
                    } else if (navigationContext.from === 'home-search') {
                      // Return to Home page with search state preserved
                      console.log('✅ [App] Returning to Home search page');
                      setCurrentScreen('home');
                      setViewingProfileId(null);
                      // Increment trigger to force HomePage to reopen search modal
                      setNavigationContext(prev => ({
                        ...prev,
                        reopenSearchTrigger: (prev.reopenSearchTrigger || 0) + 1
                      }));
                    } else if (navigationContext.from === 'vibecheck') {
                      console.log('✅ [App] Returning to Vibe Check');
                      setCurrentScreen('vibecheck');
                      setViewingProfileId(null);
                      setNavigationContext({});
                    } else if (navigationContext.from === 'spotlight') {
                      console.log('✅ [App] Returning to Spotlight');
                      setCurrentScreen('spotlight');
                      setViewingProfileId(null);
                      setNavigationContext({});
                    } else if (navigationContext.from === 'discover') {
                      console.log('✅ [App] Returning to Discover');
                      setCurrentScreen('discover');
                      setViewingProfileId(null);
                      setNavigationContext({});
                    } else if (navigationContext.from === 'profile') {
                      console.log('✅ [App] Returning to Profile');
                      setCurrentScreen('profile');
                      setViewingProfileId(null);
                      setNavigationContext({});
                    } else {
                      // Default: close profile and stay on current screen
                      console.log('✅ [App] Default back - closing profile');
                      setViewingProfileId(null);
                      setNavigationContext({});
                    }
                  }}
                  isOwnProfile={viewingProfileId === currentUserId}
                  initialPostId={targetPostId}
                  onFollowToggle={() => handleFollowToggle(resolvedViewingProfile.userId)}
                  onNavigateToSettings={() => {
                    setViewingProfileId(null);
                    setCurrentScreen('settings');
                  }}
                  onNavigateToMessages={handleNavigateToMessages}
                  onViewProfile={(userId) => {
                    setViewingProfileId(userId);
                    setTargetPostId(null);
                    setNavigationContext({ from: 'home-feed' });
                  }}
                  currentUserId={currentUserId}
                  currentUsername={userProfile.username}
                  currentUserAvatar={userProfile.avatar}
                  onHashtagClick={handleHashtagClick}
                  onSharePost={(post) => setSharePost(post)}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-background p-4 text-center">
                  <div className="mb-4 p-4 bg-foreground text-background border-4 border-foreground">
                    <p className="text-4xl font-black">ERROR</p>
                  </div>
                  <h2 className="text-xl font-black text-foreground uppercase mb-2">User not found</h2>
                  <p className="text-sm text-foreground/60 font-mono font-bold mb-4">This profile doesn't exist in the database</p>
                  <button 
                      onClick={() => setViewingProfileId(null)}
                      className="px-6 py-3 bg-foreground text-background border-4 border-foreground font-black uppercase shadow-[4px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] transition-all"
                  >
                      Go Back
                  </button>
                </div>
              )}
            </div>
          )}

          {currentScreen === 'home' && (
              <HomePage 
                posts={homeFeedPosts} 
                setPosts={setPosts} 
                setForYouPosts={setForYouPosts}
                stories={homeFeedStories}
                setStories={setStories}
                feedLoading={isRestApi() ? feedLoading : false}
                feedError={isRestApi() ? feedError : null}
                onAddStory={handleAddStory}
                onNavigateToMessages={handleNavigateToMessages} 
                viewingProfileId={null} // Pass null to prevent HomePage from rendering its internal profile view
                onViewProfile={(userId) => {
                  // Check if we're in search mode - if navigationContext has searchQuery, we're coming from search
                  const isFromSearch = navigationContext.searchQuery && navigationContext.searchQuery.trim().length > 0;
                  
                  console.log('📍 [App] HomePage onViewProfile called. isFromSearch:', isFromSearch, 'searchQuery:', navigationContext.searchQuery);
                  
                  if (isFromSearch) {
                    // Set navigation context to indicate we came from home search - preserve all existing context
                    console.log('📍 [App] Opening profile from Home search');
                    setNavigationContext({ ...navigationContext, from: 'home-search' });
                  } else {
                    // Set navigation context to indicate we came from home feed - preserve any existing search data
                    console.log('📍 [App] Opening profile from Home feed');
                    setNavigationContext({ ...navigationContext, from: 'home-feed' });
                  }
                  handleViewProfileChange(userId);
                }}
                userProfile={userProfile}
                currentUserId={currentUserId}
                initialPostId={targetPostId}
                onClearInitialPost={() => setTargetPostId(null)}
                onOverlayStateChange={setIsOverlayOpen}
                onNavigateToNotifications={() => setCurrentScreen('notifications')}
                unreadNotificationCount={unreadCount}
                onManualRefresh={handleManualRefresh}
                isRefreshing={isRefreshing}
                forYouPosts={forYouPosts}
                initialSearchQuery={navigationContext.searchQuery}
                initialSearchResults={navigationContext.searchResults}
                reopenSearchTrigger={navigationContext.reopenSearchTrigger}
                onSearchStateChange={(query, results) => {
                  // Update navigation context with current search state (same as Venture)
                  console.log('📝 [App] Home search state changed - query:', query, 'results:', results.length);
                  setNavigationContext(prev => ({
                    ...prev,
                    searchQuery: query,
                    searchResults: results,
                  }));
                }}
                onNavigateToCreate={(prompt) => {
                  setDailyPrompt(prompt);
                  setCurrentScreen('create');
                }}
                onShowNotification={showNotificationBanner}
                onSharePost={(post) => setSharePost(post)}
                onNavigate={handleNavigation}
                currentScreen={currentScreen}
                onNavigateToDiscover={() => setCurrentScreen('discover')}
                scrollToTopTrigger={homeScrollToTopTrigger}
                followedUserIds={followedUserIds}
                onFollowToggle={handleFollowToggle}
                onHashtagClick={handleHashtagClick}
              />
          )}
          {currentScreen === 'leaderboard' && (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-foreground border-t-transparent animate-spin" /></div>}>
              <LeaderboardPage 
                onNavigateToPost={handleNavigateToPost}
                onOverlayStateChange={setIsOverlayOpen}
                onViewProfile={(userId, postId) => {
                  setViewingProfileId(userId);
                  if (postId) setTargetPostId(postId);
                  // Don't switch screen, just overlay profile
                }}
                currentUserId={currentUserId}
                currentUsername={userProfile.username}
                currentUserAvatar={userProfile.avatar}
                onSharePost={(post) => setSharePost(post)}
                onHashtagClick={handleHashtagClick}
              />
              </Suspense>
          )}
          {currentScreen === 'venture' && (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-foreground border-t-transparent animate-spin" /></div>}>
              <VenturePage 
                userPosts={posts}
                onViewProfile={(userId, postId) => {
                  // Save current navigation context (keep existing searchQuery and searchResults)
                  console.log('📍 [App] Opening profile from search. Current context:', navigationContext);
                  const newContext = {
                    ...navigationContext,
                    from: 'venture-search',
                  };
                  console.log('📍 [App] Setting new context:', newContext);
                  setNavigationContext(newContext);
                  setViewingProfileId(userId);
                  if (postId) setTargetPostId(postId);
                  // Don't switch screen, just overlay profile
                }}
                initialSearchQuery={navigationContext.searchQuery}
                initialSearchResults={navigationContext.searchResults}
                reopenSearchTrigger={navigationContext.reopenSearchTrigger}
                onSearchStateChange={(query, results) => {
                  // Update navigation context with current search state
                  console.log('📝 [App] Search state changed - query:', query, 'results:', results.length);
                  setNavigationContext(prev => ({
                    ...prev,
                    searchQuery: query,
                    searchResults: results,
                  }));
                }}
                onHashtagClick={handleHashtagClick}
                currentUserId={currentUserId}
                currentUsername={userProfile.username}
                currentUserAvatar={userProfile.avatar}
                onSharePost={(post) => setSharePost(post)}
              />
              </Suspense>
          )}
          {currentScreen === 'messages' && (
              <MessagesPage 
                initialChatUser={initialChatUser} 
                onBack={handleMessageBack}
                onViewPost={(postId) => {
                  setTargetPostId(postId);
                  setCurrentScreen('home');
                }}
                onViewProfile={(user) => {
                  const userId = typeof user === 'string' ? user : user.userId;
                  setViewingProfileId(userId);
                  // Don't switch screen
                  
                  if (typeof user !== 'string' && user) {
                    setInitialChatUser(user);
                  }
                }}
                currentUserProfile={{
                  userId: currentUserId,
                  username: userProfile.username,
                  userAvatar: userProfile.avatar
                }}
                cachedConversations={cachedConversations}
              />
          )}
          {currentScreen === 'profile' && (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-foreground border-t-transparent animate-spin" /></div>}>
              <ProfilePage 
                userId={currentUserId} 
                userProfile={userProfile}
                posts={currentUserPosts}
                stories={currentUserStories}
                followersCount={getUserFollowerCount(currentUserId)}
                followingCount={followedUserIds.size}
                followedUsers={followedUsersList}
                onOpenSettings={() => setCurrentScreen('settings')}
                onStoryView={(storyId) => {
                  setStories(prevStories => 
                    prevStories.map(s => s.id === storyId ? { ...s, viewed: true } : s)
                  );
                }}
                onFollowToggle={handleFollowToggle}
                onNavigateToProfile={(userId) => {
                  console.log('📍 [App] Navigating to profile from ProfilePage following list:', userId);
                  setNavigationContext({ from: 'profile' });
                  handleViewProfileChange(userId);
                }}
                onNavigateToPost={(postId) => {
                  setTargetPostId(postId);
                  setCurrentScreen('home');
                }}
                allPosts={[...posts, ...forYouPosts]}
                onNavigateToRecap={() => setCurrentScreen('viberecap')}
              />
              </Suspense>
          )}
          {currentScreen === 'settings' && (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-foreground border-t-transparent animate-spin" /></div>}>
              <SettingsPage 
                onBack={() => setCurrentScreen('profile')} 
                onLogout={() => {
                  if (isRestApi()) useAuthStore.getState().logout();
                  else supabase.auth.signOut();
                  // Selective clear — preserve keys that should survive logout
                  const preserve = ['vibe_onboarding_complete', 'vibe_interests'];
                  const saved: Record<string, string> = {};
                  preserve.forEach(k => { const v = localStorage.getItem(k); if (v !== null) saved[k] = v; });
                  localStorage.clear();
                  preserve.forEach(k => { if (saved[k] !== undefined) localStorage.setItem(k, saved[k]); });
                  window.location.reload();
                }}
                userProfile={userProfile}
                currentUserId={currentUserId}
                followedUsers={followedUsersList.map(u => ({ id: u.id, username: u.username, avatar: u.avatar }))}
                onNavigateToAnalytics={() => setCurrentScreen('analytics')}
                onUpdateProfile={async (updatedProfile) => {
                  setUserProfile(updatedProfile);
                  try {
                    let avatarUrl = updatedProfile.avatar;

                    if (isRestApi()) {
                      if (avatarUrl && (avatarUrl.startsWith('data:') || avatarUrl.startsWith('blob:'))) {
                        let blob: Blob;
                        if (avatarUrl.startsWith('blob:')) {
                          const resp = await fetch(avatarUrl);
                          blob = await resp.blob();
                        } else {
                          const resp = await fetch(avatarUrl);
                          blob = await resp.blob();
                        }
                        const up = await backendApi.uploadImage(blob, `avatar-${currentUserId}.jpg`);
                        avatarUrl = up.url;
                        setUserProfile((prev) => ({ ...prev, avatar: avatarUrl! }));
                      }
                      await backendApi.patchMyProfile({
                        fullName: updatedProfile.name,
                        bio: updatedProfile.bio,
                        username: updatedProfile.username,
                        avatarUrl: avatarUrl?.startsWith('http') ? avatarUrl : undefined,
                      });
                      return;
                    }

                    // Upload avatar to Storage if it's a local data/blob URL
                    if (avatarUrl && (avatarUrl.startsWith('data:') || avatarUrl.startsWith('blob:'))) {
                      console.log('📤 Uploading avatar to Storage…');
                      // Convert blob:/data: URL to actual Blob for binary upload
                      let avatarBlob: Blob | string = avatarUrl;
                      if (avatarUrl.startsWith('blob:')) {
                        try {
                          const resp = await fetch(avatarUrl);
                          avatarBlob = await resp.blob();
                        } catch (e) {
                          console.warn('⚠️ Could not fetch blob URL for avatar:', e);
                        }
                      }
                      const uploadResult = await uploadToStorage(
                        avatarBlob,
                        `avatar-${currentUserId}.jpg`,
                        `avatars/${currentUserId}`,
                        'image/jpeg'
                      );
                      if (uploadResult.success && uploadResult.url) {
                        avatarUrl = uploadResult.url;
                        // Update local state with remote URL too
                        setUserProfile(prev => ({ ...prev, avatar: avatarUrl! }));
                        console.log('✅ Avatar uploaded to Storage');
                      } else {
                        console.warn('⚠️ Avatar upload failed, saving without avatar');
                        avatarUrl = undefined;
                      }
                    }
                    
                    await fetch(
                      `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/users/profile/${currentUserId}`,
                      {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
                        body: JSON.stringify({
                          username: updatedProfile.username,
                          displayName: updatedProfile.name,
                          bio: updatedProfile.bio,
                          avatar: avatarUrl?.startsWith('http') ? avatarUrl : undefined,
                        }),
                      }
                    );
                    console.log('✅ Profile updated in Supabase');
                  } catch (error) {
                    console.error('❌ Error updating profile:', error);
                  }
                }}
                savedPosts={posts.filter(p => p.isSaved)}
              />
              </Suspense>
          )}
          {currentScreen === 'create' && (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-foreground border-t-transparent animate-spin" /></div>}>
              <CreatePostPage 
                onAddPost={handleAddPost} 
                onAddStory={handleAddStory} 
                onClose={() => {
                  setCurrentScreen('home');
                  setDailyPrompt(undefined); // Clear daily prompt when closing
                }}
                dailyPrompt={dailyPrompt}
              />
              </Suspense>
          )}
          {currentScreen === 'notifications' && (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-foreground border-t-transparent animate-spin" /></div>}>
              <NotificationsPage 
                notifications={systemNotifications}
                onBack={() => setCurrentScreen('home')}
                onNotificationClick={(notification) => {
                  markNotificationAsRead(notification.id);
                  // Navigate based on notification type
                  if (notification.type === 'follow' && notification.userId) {
                    setViewingProfileId(notification.userId);
                    setCurrentScreen('home');
                  } else if (notification.type === 'message') {
                    setCurrentScreen('messages');
                  } else if (notification.type === 'leaderboard') {
                    setCurrentScreen('leaderboard');
                  } else if (notification.postId) {
                    handleNavigateToPost(notification.postId);
                  } else if (notification.userId) {
                    // Fallback: navigate to the user's profile for like/comment/dislike without postId
                    setViewingProfileId(notification.userId);
                    setCurrentScreen('home');
                  }
                }}
                onMarkAsRead={markNotificationAsRead}
                onMarkAllAsRead={markAllNotificationsAsRead}
                onDeleteNotification={deleteNotification}
                onClearAll={clearAllNotifications}
              />
              </Suspense>
          )}
          {currentScreen === 'vibecheck' && (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-foreground border-t-transparent animate-spin" /></div>}>
              <VibeCheckPage
                onBack={() => setCurrentScreen('home')}
                currentUserId={currentUserId}
                userProfile={userProfile}
                onViewProfile={(userId) => {
                  setNavigationContext({ from: 'vibecheck' });
                  handleViewProfileChange(userId);
                }}
              />
              </Suspense>
          )}
          {currentScreen === 'spotlight' && (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-foreground border-t-transparent animate-spin" /></div>}>
              <SpotlightPage
                onBack={() => setCurrentScreen('home')}
                onViewProfile={(userId) => {
                  setNavigationContext({ from: 'spotlight' });
                  handleViewProfileChange(userId);
                }}
                onFollowToggle={handleFollowToggle}
                onViewPost={(postId) => {
                  setTargetPostId(postId);
                  setCurrentScreen('home');
                }}
                currentUserId={currentUserId}
                posts={posts}
              />
              </Suspense>
          )}
          {currentScreen === 'discover' && (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-foreground border-t-transparent animate-spin" /></div>}>
              <DiscoverPage
                currentUserId={currentUserId}
                onBack={() => setCurrentScreen('home')}
                onViewProfile={(userId) => {
                  setNavigationContext({ from: 'discover' });
                  handleViewProfileChange(userId);
                }}
                onNavigateToPost={handleNavigateToPost}
                onHashtagClick={handleHashtagClick}
                onNavigateToRecap={() => setCurrentScreen('viberecap')}
              />
              </Suspense>
          )}
          {currentScreen === 'viberecap' && (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-foreground border-t-transparent animate-spin" /></div>}>
              <VibeRecapPage
                onBack={() => setCurrentScreen('profile')}
                posts={posts}
                currentUserId={currentUserId}
                followersCount={getUserFollowerCount(currentUserId)}
                followingCount={followedUserIds.size}
                username={userProfile.username}
                avatar={userProfile.avatar}
              />
              </Suspense>
          )}
          {currentScreen === 'analytics' && (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-foreground border-t-transparent animate-spin" /></div>}>
              <AnalyticsPage
                onBack={() => setCurrentScreen('settings')}
                posts={posts}
                currentUserId={currentUserId}
                followersCount={getUserFollowerCount(currentUserId)}
                followingCount={followedUserIds.size}
                username={userProfile.username}
              />
              </Suspense>
          )}

          {/* Hashtag overlay */}
          {activeHashtag && (
            <div className="absolute inset-0 z-[60] bg-background animate-in slide-in-from-right duration-200" style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden' }}>
              <HashtagPage
                hashtag={activeHashtag}
                allPosts={[...posts, ...forYouPosts]}
                onBack={() => {
                  setActiveHashtag(null);
                  if (hashtagSourcePostId) {
                    setTargetPostId(hashtagSourcePostId);
                    setHashtagSourcePostId(null);
                    setCurrentScreen('home');
                  }
                }}
                onViewPost={(postId) => {
                  setActiveHashtag(null);
                  setTargetPostId(postId);
                  setCurrentScreen('home');
                }}
                onViewProfile={(userId) => {
                  setActiveHashtag(null);
                  setViewingProfileId(userId);
                }}
              />
            </div>
          )}
        </div>

        {/* Share Sheet Overlay - rendered at app level for full-screen coverage */}
        {sharePost && (
          <div className="absolute inset-0 z-[70]">
            <ShareSheet
              post={sharePost}
              onClose={() => setSharePost(null)}
              onNavigateToMessages={handleNavigateToMessages}
              currentUserId={currentUserId}
              currentUsername={userProfile.username}
              currentUserAvatar={userProfile.avatar}
              onRepost={(post) => {
                const repost = {
                  ...post,
                  id: `repost-${Date.now()}`,
                  userId: currentUserId,
                  username: userProfile.username,
                  userAvatar: userProfile.avatar,
                  timestamp: 'Just now',
                  likes: 0,
                  comments: 0,
                  shares: 0,
                  isLiked: false,
                  isSaved: false,
                  caption: `🔁 @${post.username}: ${post.caption}`,
                };
                setPosts(prev => [repost, ...prev].slice(0, 100));
                setForYouPosts(prev => [repost, ...prev].slice(0, 100));
              }}
            />
          </div>
        )}

        {/* Bottom Navigation */}
        <BottomNav 
          currentScreen={currentScreen} 
          onNavigate={handleNavigation} 
          isHidden={isOverlayOpen || !!viewingProfileId || !!sharePost || !!activeHashtag || currentScreen === 'analytics'} 
          userAvatar={userProfile.avatar}
          onScrollToTop={() => setHomeScrollToTopTrigger(t => t + 1)}
        />
        
        {/* Toast Notifications */}
        <ToastContainer 
          toasts={toast.toasts} 
          onRemove={toast.removeToast} 
        />
      </div>
    </div>
  );
}

// Wrap app with Error Boundary
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}