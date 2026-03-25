import { useState, useRef, useEffect, memo } from 'react';
import { Post } from "../types";
import { Heart, MessageCircle, Bookmark, Share2, MoreVertical, Volume2, VolumeX, ThumbsDown, ChevronLeft, ChevronRight, Flame, Play, Link2, EyeOff, Flag, Send, MapPin, Clock, Users, BarChart2, TrendingUp, UserPlus, AlertTriangle, Loader2, Trash2, Archive } from 'lucide-react';
import { motion } from 'motion/react';
import { FullScreenImageViewer } from "./FullScreenImageViewer";
import { ReportModal } from "./ReportModal";
import { useSounds } from "../hooks/useSounds";
import { projectId, publicAnonKey } from "../supabaseClient";
import { EmojiReactionPicker } from "./EmojiReactionPicker";
import { PostStatsModal } from "./PostStatsModal";
import { PostFeedImage } from "./PostFeedImage";
import { getFilterStyle } from "./PhotoFilterPicker";
import { getCameraEraFilter, getCameraEraOverlay, getCameraEraGrain, getCameraEraLightLeak } from "./PhotoFilterPicker";
import { VHSNightVisionOverlay, isVHSFilter } from "./VHSNightVisionOverlay";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDislike?: (postId: string) => void;
  onSave: (postId: string) => void;
  onComment: (postId: string) => void;
  onNavigateToMessages: () => void;
  onNavigateToProfile: (userId: string) => void;
  onDelete?: (postId: string) => void;
  onHide?: (postId: string) => void;
  onImageFullScreenToggle?: (isOpen: boolean) => void;
  onShareSheetToggle?: (isOpen: boolean) => void;
  onSharePost?: (post: Post) => void;
  currentUserId?: string;
  onHashtagClick?: (tag: string) => void;
}

export const PostCard = memo(function PostCard({ post, onLike, onDislike, onSave, onComment, onNavigateToMessages, onNavigateToProfile, onDelete, onHide, onImageFullScreenToggle, onShareSheetToggle, onSharePost, currentUserId, onHashtagClick }: PostCardProps) {
  const sounds = useSounds();
  const isHot = post.likes > 5000;
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(post.isMuted ?? false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [saveAnimating, setSaveAnimating] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | undefined>(undefined);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(post.reactions || {});
  const [pollVotes, setPollVotes] = useState<number[]>(post.poll?.votes || []);
  const [votedOption, setVotedOption] = useState<number | null>(() => {
    // Restore from localStorage so vote persists across sessions
    if (post.poll) {
      try {
        const stored = localStorage.getItem(`poll-vote:${post.id}`);
        if (stored !== null) return parseInt(stored);
      } catch {}
    }
    return null;
  });
  const [showLikePlus, setShowLikePlus] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [inlineToast, setInlineToast] = useState<string | null>(null);
  const lastTapRef = useRef<number>(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Track component mount state to avoid setState on unmounted component
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Video state
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);
  // Reset video state whenever the videoUrl changes
  useEffect(() => {
    setIsVideoError(false);
    setIsVideoLoading(false);
    setIsVideoBuffering(false);
    setIsPlaying(false);
  }, [post.videoUrl]);

  // Autoplay video when it scrolls into view (loop + respect mute setting)
  useEffect(() => {
    if (!post.videoUrl) return;
    const vid = videoRef.current;
    if (!vid) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!isMountedRef.current) return;
        if (entry.isIntersecting) {
          // Try unmuted first, fall back to muted if browser blocks it
          vid.muted = isMuted;
          const p = vid.play();
          if (p !== undefined) {
            p.then(() => {
              if (isMountedRef.current) setIsPlaying(true);
            }).catch(() => {
              // Autoplay with sound blocked — retry muted
              vid.muted = true;
              if (isMountedRef.current) setIsMuted(true);
              vid.play().then(() => {
                if (isMountedRef.current) setIsPlaying(true);
              }).catch(() => {});
            });
          }
        } else {
          vid.pause();
          if (isMountedRef.current) setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(vid);
    return () => observer.disconnect();
  }, [post.videoUrl, currentImageIndex]);

  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchCurrent, setTouchCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  // Expiring post countdown
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!post.expiresAt) return;
    const update = () => {
      const diff = new Date(post.expiresAt!).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(h > 0 ? `${h}h ${m}m left` : `${m}m left`);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [post.expiresAt]);

  const handleImageTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      const rect = imageContainerRef.current?.getBoundingClientRect();
      const x = rect ? e.clientX - rect.left : 80;
      const y = rect ? e.clientY - rect.top : 80;
      const heartId = now;
      setFloatingHearts(prev => [...prev, { id: heartId, x, y }]);
      setTimeout(() => setFloatingHearts(prev => prev.filter(h => h.id !== heartId)), 900);
      if (!post.isLiked) {
        sounds.like();
        onLike(post.id);
        setLikeAnimating(true);
        setTimeout(() => setLikeAnimating(false), 420);
      }
      if (navigator.vibrate) navigator.vibrate(40);
    }
    lastTapRef.current = now;
  };

  const handleReaction = (emoji: string) => {
    setShowReactionPicker(false);
    const isRemoving = activeReaction === emoji;
    setReactionCounts(prev => {
      const next = { ...prev };
      if (isRemoving) {
        next[emoji] = Math.max(0, (next[emoji] || 1) - 1);
        if (next[emoji] === 0) delete next[emoji];
      } else {
        if (activeReaction) next[activeReaction] = Math.max(0, (next[activeReaction] || 1) - 1);
        next[emoji] = (next[emoji] || 0) + 1;
      }
      return next;
    });
    setActiveReaction(isRemoving ? undefined : emoji);
    if (!isRemoving) {
      sounds.like();
      if (navigator.vibrate) navigator.vibrate(30);
    }
  };

  const handlePollVote = async (optionIndex: number) => {
    if (votedOption !== null) return;
    setVotedOption(optionIndex);
    setPollVotes(prev => prev.map((v, i) => i === optionIndex ? v + 1 : v));
    if (navigator.vibrate) navigator.vibrate(30);
    // Persist vote to localStorage so it survives page reloads
    try { localStorage.setItem(`poll-vote:${post.id}`, String(optionIndex)); } catch {}
    // Persist to backend (fire-and-forget, best effort)
    try {
      const userId = currentUserId || 'anon';
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/posts/${post.id}/poll-vote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ userId, optionIndex })
        }
      );
    } catch { /* non-critical */ }
  };

  useEffect(() => {
    if (onImageFullScreenToggle) {
      onImageFullScreenToggle(showFullScreen);
    }
  }, [showFullScreen, onImageFullScreenToggle]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    if (showOptionsMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptionsMenu]);

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      setInlineToast('Link copied to clipboard!');
      setTimeout(() => setInlineToast(null), 2000);
    }).catch(() => {
      setInlineToast('Link copied!');
      setTimeout(() => setInlineToast(null), 2000);
    });
    setShowOptionsMenu(false);
  };
  
  // Re-use logic for handlers
  const handleReport = () => { setShowReportModal(true); setShowOptionsMenu(false); };
  const handleNotInterested = () => {
    if (onHide) {
      onHide(post.id);
    }
    setInlineToast('Post hidden from your feed');
    setTimeout(() => setInlineToast(null), 2000);
    setShowOptionsMenu(false);
  };
  const handleUnfollow = () => {
    setInlineToast(`Unfollowed ${post.username}`);
    setTimeout(() => setInlineToast(null), 2000);
    setShowOptionsMenu(false);
  };

  const handleSubmitReport = async (reason: string, details: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/reports`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            postId: post.id,
            postUsername: post.username,
            reason,
            details,
            reporterId: currentUserId || 'anonymous'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      console.log('Report submitted successfully');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  const togglePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Never attempt play/pause on a broken or loading video
    if (isVideoError) return;
    const vid = videoRef.current;
    if (!vid) return;
    // Guard: video element must have a valid readyState to play
    if (vid.readyState === 0 && !isPlaying) {
      // HAVE_NOTHING — not safe to call play yet; loading overlay will show
      return;
    }
    if (isPlaying) {
      vid.pause();
      if (isMountedRef.current) setIsPlaying(false);
    } else {
      // Guard against calling play() when the element is already in an error state
      if (vid.error) {
        if (isMountedRef.current) setIsVideoError(true);
        return;
      }
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (isMountedRef.current) setIsPlaying(true);
          })
          .catch((err: Error) => {
            // AbortError is normal (e.g. rapid play/pause), others are real failures
            if (err.name !== 'AbortError') {
              console.warn('Video play() failed:', err.name, err.message);
            }
            if (isMountedRef.current) setIsPlaying(false);
          });
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent, totalImages: number) => {
    if (totalImages <= 1) return;
    const touch = e.touches[0];
    if (!touch) return;
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchCurrent({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent, totalImages: number) => {
    if (totalImages <= 1 || !touchStart) return;
    const touch = e.touches[0];
    if (!touch) return;
    setTouchCurrent({ x: touch.clientX, y: touch.clientY });
    
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // If horizontal swipe is dominant, prevent vertical scroll
    if (deltaX > deltaY && deltaX > 10) {
      setIsSwiping(true);
    }
  };

  const handleTouchEnd = (totalImages: number) => {
    if (totalImages <= 1 || !touchStart || !touchCurrent) {
      setTouchStart(null);
      setTouchCurrent(null);
      setIsSwiping(false);
      return;
    }

    const deltaX = touchCurrent.x - touchStart.x;
    const deltaY = Math.abs(touchCurrent.y - touchStart.y);
    const swipeThreshold = 50;

    // Only process as swipe if horizontal movement is dominant
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        // Swipe right - previous image
        setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
        sounds.button();
      } else {
        // Swipe left - next image
        setCurrentImageIndex((prev) => (prev + 1) % totalImages);
        sounds.button();
      }
    }

    setTouchStart(null);
    setTouchCurrent(null);
    setIsSwiping(false);
  };

  return (
    <div className="relative group mb-6 px-2 overflow-visible"
         style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) both', contain: 'layout paint' }}>
      {/* Neo-Brutalist Card Container */}
      <div className="relative bg-card border-4 border-foreground shadow-[8px_8px_0px_0px_var(--foreground)] hover:shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 overflow-visible">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-4 border-foreground bg-background">
          <div className="flex items-center gap-3">
            {/* Collab: show two avatars stacked if collabUserId exists */}
            {post.collabUserId ? (
              <div className="relative w-10 h-10 cursor-pointer" onClick={() => onNavigateToProfile(post.userId)}>
                <div className="absolute top-0 left-0 w-7 h-7 border-2 border-foreground overflow-hidden bg-foreground z-10">
                  <img src={post.isAnonymous ? 'https://api.dicebear.com/7.x/shapes/svg?seed=anon' : post.userAvatar} alt={post.username} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-7 h-7 border-2 border-foreground overflow-hidden bg-foreground">
                  <img src={post.collabUserAvatar || ''} alt={post.collabUsername || ''} className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <button onClick={() => onNavigateToProfile(post.userId)} className="relative group/avatar cursor-pointer">
                <div className="w-10 h-10 border-2 border-foreground overflow-hidden bg-foreground group-hover/avatar:scale-105 transition-transform">
                  <img
                    src={post.isAnonymous ? 'https://api.dicebear.com/7.x/shapes/svg?seed=anon&backgroundColor=000000' : post.userAvatar}
                    alt={post.username}
                    className="w-full h-full object-cover transition-all"
                  />
                </div>
              </button>
            )}
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onNavigateToProfile(post.userId)}
                  className="font-bold text-base text-foreground uppercase hover:underline decoration-2 underline-offset-2"
                >
                  {post.isAnonymous ? '👤 Anonymous' : post.username}
                </button>
                {post.collabUserId && (
                  <span className="text-xs font-black text-foreground/40">×</span>
                )}
                {post.collabUsername && (
                  <button
                    onClick={() => onNavigateToProfile(post.collabUserId!)}
                    className="font-bold text-sm text-background uppercase hover:underline"
                  >
                    {post.collabUsername}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-mono font-bold text-foreground/60 bg-foreground/5 px-1 rounded-sm">
                  {post.timestamp}
                </p>
                {post.location && (
                  <span className="flex items-center gap-0.5 text-[10px] font-black text-foreground/50 uppercase">
                    <MapPin size={9} strokeWidth={3} />
                    {post.location}
                  </span>
                )}
                {post.expiresAt && timeLeft && (
                  <span className="flex items-center gap-0.5 text-[10px] font-black text-red-500 uppercase bg-red-50 px-1 border border-red-200">
                    <Clock size={9} strokeWidth={3} />
                    {timeLeft}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="w-8 h-8 border-2 border-foreground text-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
            >
              <MoreVertical size={20} strokeWidth={3} />
            </button>
            {showOptionsMenu && (
               <div className="absolute right-0 top-10 w-48 bg-card border-2 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] z-50">
                  <button onClick={handleCopyLink} className="w-full text-left px-4 py-2 font-bold text-foreground hover:bg-background border-b-2 border-foreground flex items-center gap-2"><Link2 size={16}/> Copy Link</button>
                  <button onClick={() => { onSave(post.id); setShowOptionsMenu(false); }} className="w-full text-left px-4 py-2 font-bold text-foreground hover:bg-background border-b-2 border-foreground flex items-center gap-2"><Bookmark size={16}/> {post.isSaved ? 'Unsave' : 'Save'}</button>
                  {currentUserId === post.userId && (
                    <button onClick={() => { setShowStats(true); setShowOptionsMenu(false); }} className="w-full text-left px-4 py-2 font-bold text-foreground hover:bg-background border-b-2 border-foreground flex items-center gap-2"><BarChart2 size={16}/> Insights</button>
                  )}
                  {currentUserId === post.userId && onHide && (
                    <button onClick={() => { onHide(post.id); setShowOptionsMenu(false); }} className="w-full text-left px-4 py-2 font-bold text-foreground hover:bg-background border-b-2 border-foreground flex items-center gap-2"><Archive size={16}/> Hide Post</button>
                  )}
                  {currentUserId === post.userId && onDelete && (
                    <button onClick={() => { setShowDeleteConfirm(true); setShowOptionsMenu(false); }} className="w-full text-left px-4 py-2 font-bold text-red-500 hover:bg-red-500 hover:text-white border-b-2 border-foreground flex items-center gap-2"><Trash2 size={16}/> Delete Post</button>
                  )}
                  <button onClick={handleNotInterested} className="w-full text-left px-4 py-2 font-bold text-foreground hover:bg-background border-b-2 border-foreground flex items-center gap-2"><EyeOff size={16}/> Hide</button>
                  <button onClick={handleReport} className="w-full text-left px-4 py-2 font-bold hover:bg-red-500 hover:text-white flex items-center gap-2 text-foreground"><Flag size={16}/> Report</button>
               </div>
            )}
          </div>
        </div>

        {/* Unified Media Carousel — images + videos in one swipeable container */}
        {(() => {
          // Build unified media items array: images first, then video(s)
          const images = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
          const mediaItems: { type: 'image' | 'video'; url: string; thumbnail?: string }[] = [];
          images.forEach((url, i) => {
            mediaItems.push({ type: 'image', url, thumbnail: post.thumbnailUrls?.[i] });
          });
          if (post.videoUrl) {
            mediaItems.push({ type: 'video', url: post.videoUrl });
          }
          if (mediaItems.length === 0) return null;

          const totalMedia = mediaItems.length;
          const hasMultiple = totalMedia > 1;
          const safeIndex = Math.min(currentImageIndex, totalMedia - 1);
          const currentMedia = mediaItems[safeIndex];

          return (
            <div className="relative border-b-4 border-foreground bg-foreground/10">
              <div 
                className="aspect-[4/5] w-full relative overflow-hidden" 
                ref={imageContainerRef}
                style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
                onTouchStart={(e) => handleTouchStart(e, totalMedia)}
                onTouchMove={(e) => handleTouchMove(e, totalMedia)}
                onTouchEnd={() => handleTouchEnd(totalMedia)}
              >
                {currentMedia.type === 'image' ? (
                  <>
                    <PostFeedImage
                      thumbnailSrc={currentMedia.thumbnail}
                      masterSrc={currentMedia.url}
                      alt="Post"
                      onClick={handleImageTap}
                      swipeStyle={
                        isSwiping && touchStart && touchCurrent
                          ? { transform: `translate3d(${touchCurrent.x - touchStart.x}px,0,0)`, transition: 'none', willChange: 'transform' }
                          : { transform: 'translate3d(0,0,0)', transition: 'transform 0.28s cubic-bezier(.25,.46,.45,.94)', willChange: 'auto' }
                      }
                      filterStyle={(() => {
                        const perMediaFilter = post.filters?.[safeIndex];
                        const filterId = perMediaFilter || post.filter;
                        return filterId ? getFilterStyle(filterId) : undefined;
                      })()}
                      filterId={post.filters?.[safeIndex] || post.filter}
                      cameraEra={post.cameraEras?.[safeIndex] || post.cameraEra}
                    />
                    {/* Floating hearts on double-tap */}
                    {floatingHearts.map(heart => (
                      <div
                        key={heart.id}
                        className="absolute pointer-events-none text-5xl select-none z-20"
                        style={{
                          left: heart.x - 24,
                          top: heart.y - 24,
                          animation: 'floatingHeart 0.9s ease-out forwards',
                          willChange: 'transform, opacity',
                        }}
                      >
                        ❤️
                      </div>
                    ))}
                  </>
                ) : (
                  /* Video slide */
                  <div className="w-full h-full relative bg-black"
                    style={
                      isSwiping && touchStart && touchCurrent
                        ? { transform: `translate3d(${touchCurrent.x - touchStart.x}px,0,0)`, transition: 'none', willChange: 'transform' }
                        : { transform: 'translate3d(0,0,0)', transition: 'transform 0.28s cubic-bezier(.25,.46,.45,.94)', willChange: 'auto' }
                    }
                  >
                    {isVHSFilter(post.filter) ? (
                      <VHSNightVisionOverlay className="w-full h-full" showHUD={isPlaying}>
                        <video
                          ref={videoRef}
                          src={currentMedia.url}
                          className="w-full h-full object-cover"
                          loop
                          playsInline
                          preload="metadata"
                          muted={isMuted}
                          onLoadedData={() => isMountedRef.current && setIsVideoLoading(false)}
                          onWaiting={() => isMountedRef.current && setIsVideoBuffering(true)}
                          onCanPlay={() => isMountedRef.current && setIsVideoBuffering(false)}
                          onPlaying={() => isMountedRef.current && setIsVideoBuffering(false)}
                          onError={() => { if (isMountedRef.current) { setIsVideoError(true); setIsVideoLoading(false); setIsVideoBuffering(false); setIsPlaying(false); } }}
                          onLoadStart={() => isMountedRef.current && setIsVideoLoading(true)}
                          onLoadedMetadata={() => isMountedRef.current && setIsVideoLoading(false)}
                        />
                      </VHSNightVisionOverlay>
                    ) : (
                      <video
                        ref={videoRef}
                        src={currentMedia.url}
                        className="w-full h-full object-cover"
                        style={post.cameraEra && getCameraEraFilter(post.cameraEra) ? { filter: getCameraEraFilter(post.cameraEra)! } : undefined}
                        loop
                        playsInline
                        preload="metadata"
                        muted={isMuted}
                        onLoadedData={() => isMountedRef.current && setIsVideoLoading(false)}
                        onWaiting={() => isMountedRef.current && setIsVideoBuffering(true)}
                        onCanPlay={() => isMountedRef.current && setIsVideoBuffering(false)}
                        onPlaying={() => isMountedRef.current && setIsVideoBuffering(false)}
                        onError={() => { if (isMountedRef.current) { setIsVideoError(true); setIsVideoLoading(false); setIsVideoBuffering(false); setIsPlaying(false); } }}
                        onLoadStart={() => isMountedRef.current && setIsVideoLoading(true)}
                        onLoadedMetadata={() => isMountedRef.current && setIsVideoLoading(false)}
                      />
                    )}
                    {/* Camera era overlays for video */}
                    {post.cameraEra && !isVHSFilter(post.filter) && (() => {
                      const eraOverlay = getCameraEraOverlay(post.cameraEra);
                      const grain = getCameraEraGrain(post.cameraEra);
                      const lightLeak = getCameraEraLightLeak(post.cameraEra);
                      return (
                        <>
                          {eraOverlay && (
                            <div
                              className="absolute inset-0 pointer-events-none z-[1]"
                              style={{ background: eraOverlay.gradient, mixBlendMode: eraOverlay.blend as any }}
                            />
                          )}
                          {grain && (
                            <div
                              className="absolute inset-0 pointer-events-none z-[2]"
                              style={{
                                backgroundImage: grain.backgroundImage,
                                backgroundSize: '300px 300px',
                                opacity: grain.opacity,
                                mixBlendMode: 'overlay',
                                animation: 'grainDrift 0.8s steps(4) infinite',
                              }}
                            />
                          )}
                          {lightLeak && (
                            <div
                              className="absolute inset-0 pointer-events-none z-[3]"
                              style={{
                                background: lightLeak.gradient,
                                mixBlendMode: lightLeak.blend as any,
                                animation: 'lightLeakPulse 4s ease-in-out infinite',
                              }}
                            />
                          )}
                        </>
                      );
                    })()}
                    {/* Play/pause overlay */}
                    <button
                      onClick={(e) => togglePlayPause(e)}
                      className="absolute inset-0 flex items-center justify-center transition-colors"
                      style={{ background: isPlaying ? 'transparent' : 'rgba(0,0,0,0.18)' }}
                    >
                      {!isPlaying && !isVideoLoading && !isVideoBuffering && !isVideoError && (
                        <div className="w-16 h-16 bg-card border-2 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_var(--foreground)]">
                          <Play size={32} className="text-foreground ml-1" strokeWidth={3} style={{ fill: 'var(--foreground)' }} />
                        </div>
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                      className="absolute bottom-4 right-4 w-10 h-10 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-foreground z-10"
                    >
                      {isMuted ? <VolumeX size={20} strokeWidth={3} /> : <Volume2 size={20} strokeWidth={3} />}
                    </button>
                    {/* Loading / buffering overlay */}
                    {(isVideoLoading || isVideoBuffering) && !isVideoError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 size={36} className="animate-spin text-white" />
                          <span className="text-white text-xs font-black uppercase tracking-widest">
                            {isVideoLoading ? 'Loading…' : 'Buffering…'}
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Error overlay */}
                    {isVideoError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 pointer-events-none gap-3">
                        <AlertTriangle size={36} className="text-red-400" />
                        <p className="text-white text-xs font-black uppercase tracking-widest text-center px-4">
                          Video unavailable
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tap zones for prev/next on desktop */}
                {hasMultiple && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + totalMedia) % totalMedia); sounds.button(); }}
                      className="absolute left-0 top-0 bottom-0 w-1/5 z-10 cursor-pointer"
                      aria-label="Previous"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % totalMedia); sounds.button(); }}
                      className="absolute right-0 top-0 bottom-0 w-1/5 z-10 cursor-pointer"
                      aria-label="Next"
                    />
                  </>
                )}
              </div>

              {/* Counter badge (top-right) */}
              {hasMultiple && (
                <div className="absolute top-4 right-4 bg-black/80 text-white text-xs font-mono font-bold px-2.5 py-1 border-2 border-white/60 z-20">
                  {safeIndex + 1}/{totalMedia}
                </div>
              )}

              {/* Dot indicators (bottom-center) */}
              {hasMultiple && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                  {mediaItems.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentImageIndex(i); sounds.button(); }}
                      className={`transition-all duration-200 border border-white/60 ${
                        i === safeIndex
                          ? 'w-6 h-2.5 bg-background shadow-[1px_1px_0px_0px_var(--foreground)]'
                          : 'w-2.5 h-2.5 bg-white/60 hover:bg-white'
                      }`}
                      aria-label={`Go to ${item.type} ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Poll */}
        {post.poll && (
          <div className="border-b-4 border-foreground px-4 py-3 bg-card">
            <p className="text-sm font-black text-foreground uppercase mb-3">{post.poll.question}</p>
            {post.poll.options.map((option, i) => {
              const totalVotes = pollVotes.reduce((a, b) => a + b, 0);
              const pct = totalVotes > 0 ? Math.round((pollVotes[i] / totalVotes) * 100) : 0;
              const isWinner = votedOption !== null && pct === Math.max(...pollVotes.map((v, j) => totalVotes > 0 ? Math.round(v / totalVotes * 100) : 0));
              return (
                <button
                  key={i}
                  onClick={() => handlePollVote(i)}
                  disabled={votedOption !== null}
                  className={`relative w-full mb-2 h-11 border-2 border-foreground text-left overflow-hidden transition-all ${
                    votedOption === null ? 'hover:translate-x-[2px] hover:translate-y-[2px] bg-card shadow-[3px_3px_0px_0px_var(--foreground)] hover:shadow-[1px_1px_0px_0px_var(--foreground)]' :
                    votedOption === i ? 'border-background bg-background/10' : 'bg-card opacity-70'
                  }`}
                >
                  {votedOption !== null && (
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-700 ${votedOption === i ? 'bg-background/30' : 'bg-foreground/5'}`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                  <div className="relative px-3 flex items-center justify-between h-full">
                    <span className="text-sm font-black text-foreground uppercase">{option}</span>
                    {votedOption !== null && <span className="text-xs font-black text-foreground/60">{pct}%</span>}
                  </div>
                </button>
              );
            })}
            {votedOption !== null && (
              <p className="text-[10px] font-mono font-bold text-foreground/40 mt-1 uppercase">{pollVotes.reduce((a, b) => a + b, 0)} total votes</p>
            )}
          </div>
        )}

        {/* Actions Bar */}
        <div className="px-4 py-3 flex items-center justify-between bg-background border-b-4 border-foreground">
           <div className="flex gap-2 items-center">
              {/* Like button with long-press for reactions */}
              <div className="relative">
                {showReactionPicker && (
                  <EmojiReactionPicker
                    onSelect={handleReaction}
                    onClose={() => setShowReactionPicker(false)}
                    activeReaction={activeReaction}
                  />
                )}
                <motion.button
                  whileTap={post.isDisliked ? {} : { scale: 0.72, rotate: -10 }}
                  whileHover={post.isDisliked ? {} : { scale: 1.12 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                  onClick={() => {
                    if (post.isDisliked) return; // Can't like while disliked
                    if (activeReaction) return; // Already reacted — toggle off handled by picker
                    sounds.like();
                    onLike(post.id);
                    // Show floating +1 only when going from unliked → liked
                    if (!post.isLiked) {
                      setShowLikePlus(true);
                      setTimeout(() => setShowLikePlus(false), 700);
                    }
                    // Also save the post when liking (if not already saved)
                    if (!post.isLiked && !post.isSaved) {
                      onSave(post.id);
                    }
                    setLikeAnimating(true);
                    setTimeout(() => setLikeAnimating(false), 420);
                  }}
                  onContextMenu={(e) => { e.preventDefault(); if (!post.isDisliked) setShowReactionPicker(true); }}
                  onMouseDown={(e) => {
                    if (e.button !== 0 || post.isDisliked) return;
                    longPressTimer.current = setTimeout(() => setShowReactionPicker(true), 400);
                  }}
                  onMouseUp={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
                  onTouchStart={() => {
                    if (post.isDisliked) return;
                    longPressTimer.current = setTimeout(() => setShowReactionPicker(true), 400);
                  }}
                  onTouchEnd={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
                  className={`w-9 h-9 flex items-center justify-center border-2 border-foreground font-bold shadow-[1px_1px_0px_0px_var(--foreground)] transition-colors ${
                    post.isDisliked
                      ? 'opacity-30 cursor-not-allowed bg-background text-foreground'
                      : post.isLiked || activeReaction === '❤️'
                        ? 'bg-red-500 text-white hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'
                        : 'bg-background text-foreground hover:bg-red-100 hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'
                  }`}
                >
                  {activeReaction && activeReaction !== '❤️' ? (
                    <span className="text-base leading-none" style={likeAnimating ? { animation: 'heartPop 0.42s cubic-bezier(.22,.68,0,1.2)' } : {}}>{activeReaction}</span>
                  ) : (
                    <Heart
                      size={14}
                      className={post.isLiked ? 'fill-current' : ''}
                      strokeWidth={3}
                      style={likeAnimating ? { animation: 'heartPop 0.42s cubic-bezier(.22,.68,0,1.2)' } : {}}
                    />
                  )}
                </motion.button>
                {/* Floating +1 bounce on like */}
                {showLikePlus && (
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none z-30 font-black text-red-500 text-sm select-none"
                    style={{ animation: 'floatingHeart 0.7s ease-out forwards' }}
                  >+1</div>
                )}
              </div>
              
              {onDislike && (
                <motion.button
                  whileTap={(post.isLiked || !!activeReaction) ? {} : { scale: 0.8, rotate: 8 }}
                  whileHover={(post.isLiked || !!activeReaction) ? {} : { scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  onClick={() => {
                    if (post.isLiked || activeReaction) return; // Can't dislike while liked/reacted
                    sounds.button();
                    onDislike(post.id);
                  }}
                  className={`w-9 h-9 flex items-center justify-center border-2 border-foreground font-bold shadow-[1px_1px_0px_0px_var(--foreground)] transition-colors ${
                    (post.isLiked || activeReaction)
                      ? 'opacity-30 cursor-not-allowed bg-background text-foreground'
                      : post.isDisliked
                        ? 'bg-gray-500 text-white hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'
                        : 'bg-background text-foreground hover:bg-gray-100 hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'
                  }`}
                >
                  <ThumbsDown size={14} className={post.isDisliked ? 'fill-current' : ''} strokeWidth={3} />
                </motion.button>
              )}
              
              <motion.button
                whileTap={{ scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  sounds.comment();
                  onComment(post.id); 
                }}
                className="w-9 h-9 flex items-center justify-center border-2 border-foreground bg-background text-foreground font-bold shadow-[1px_1px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-blue-100 transition-colors"
              >
                <MessageCircle size={14} strokeWidth={3} />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.8, rotate: 15 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                onClick={() => {
                  sounds.share();
                  if (onSharePost) {
                    onSharePost(post);
                  }
                }}
                className="w-9 h-9 flex items-center justify-center border-2 border-foreground bg-background text-foreground font-bold shadow-[1px_1px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-green-100 transition-colors"
              >
                <Send size={14} strokeWidth={3} />
              </motion.button>

              {isHot && (
                <div className="w-9 h-9 flex items-center justify-center border-2 border-foreground bg-background shadow-[1px_1px_0px_0px_var(--foreground)]">
                  <Flame size={16} className="text-foreground" strokeWidth={3}
                    style={{ animation: 'flameDance 1.1s ease-in-out infinite', fill: 'var(--foreground)' }} />
                </div>
              )}
           </div>
           
           <button
             onClick={() => {
               sounds.save();
               setSaveAnimating(true);
               setTimeout(() => setSaveAnimating(false), 420);
               onSave(post.id);
             }}
             className={`w-9 h-9 flex items-center justify-center border-2 border-foreground font-bold shadow-[1px_1px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all ${
               post.isSaved ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-yellow-100'
             }`}
           >
             <Bookmark
               size={14}
               className={post.isSaved ? 'fill-current' : ''}
               strokeWidth={3}
               style={saveAnimating ? { animation: 'heartPop 0.42s cubic-bezier(.22,.68,0,1.2)' } : {}}
             />
           </button>
        </div>

        {/* Reaction counts strip */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="px-4 py-1.5 flex gap-2 flex-wrap border-b-2 border-foreground/10 bg-card">
            {Object.entries(reactionCounts).filter(([, v]) => v > 0).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 border-2 border-foreground text-xs font-black transition-all hover:scale-105 ${
                  activeReaction === emoji ? 'bg-background border-background' : 'bg-card'
                }`}
              >
                <span>{emoji}</span>
                <span className="text-foreground">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content & Stats */}
        <div className="p-4 bg-background">
           <button
             onClick={() => currentUserId === post.userId ? setShowStats(true) : undefined}
             className="flex items-center gap-4 mb-3 font-mono text-xs font-bold border-b-2 border-foreground/10 pb-2 text-foreground w-full text-left"
           >
              <span className="flex items-center gap-1">
                 <Heart size={12} style={{ fill: 'var(--foreground)' }} /> {post.likes.toLocaleString()}
              </span>
              {post.dislikes !== undefined && post.dislikes > 0 && (
                <span className="flex items-center gap-1 text-foreground/60">
                  <ThumbsDown size={12} /> {post.dislikes.toLocaleString()}
                </span>
              )}
              <span className="flex items-center gap-1">
                 <MessageCircle size={12} /> {post.comments}
              </span>
              <span className="flex items-center gap-1">
                 <Share2 size={12} /> {post.shares}
              </span>
              {currentUserId === post.userId && (
                <span className="ml-auto flex items-center gap-1 text-background">
                  <BarChart2 size={12} strokeWidth={3} /> Insights
                </span>
              )}
           </button>
           
           <div className="space-y-1 text-foreground">
              <span className="font-black uppercase mr-2 text-sm">{post.isAnonymous ? '👤 Anonymous' : post.username}</span>
              <span className="text-sm font-medium leading-relaxed">
                {post.caption.split(/(#\w+)/g).map((part, i) =>
                  part.startsWith('#') && onHashtagClick ? (
                    <button
                      key={i}
                      onClick={() => onHashtagClick(part)}
                      className="font-black text-foreground underline decoration-dotted underline-offset-2 hover:no-underline transition-all"
                    >
                      {part}
                    </button>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </span>
           </div>
           
           {post.comments > 0 && (
              <button 
                onClick={() => onComment(post.id)}
                className="mt-2 text-xs font-bold text-foreground/50 hover:text-foreground transition-colors"
              >
                View all {post.comments} comments
              </button>
           )}
        </div>
      </div>

      {showFullScreen && (
        <FullScreenImageViewer
          images={post.imageUrls || (post.imageUrl ? [post.imageUrl] : [])}
          initialIndex={currentImageIndex}
          onClose={() => setShowFullScreen(false)}
        />
      )}

      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          onSubmit={handleSubmitReport}
        />
      )}

      {showStats && (
        <PostStatsModal post={post} onClose={() => setShowStats(false)} />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="w-[320px] bg-card border-4 border-foreground shadow-[8px_8px_0px_0px_var(--foreground)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500 border-2 border-foreground flex items-center justify-center">
                <Trash2 size={20} className="text-white" strokeWidth={3} />
              </div>
              <h3 className="font-black text-lg uppercase text-foreground">Delete Post?</h3>
            </div>
            <p className="text-sm font-bold text-foreground/70 mb-6">
              This action cannot be undone. Your post, likes, and comments will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 font-black uppercase text-sm border-2 border-foreground text-foreground bg-card shadow-[3px_3px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete?.(post.id);
                }}
                className="flex-1 py-2.5 px-4 font-black uppercase text-sm border-2 border-foreground text-white bg-red-500 shadow-[3px_3px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Toast Feedback */}
      {inlineToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[110] px-4 py-2 bg-foreground text-background text-xs font-black uppercase tracking-wider border-2 border-foreground shadow-[4px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] animate-in fade-in pointer-events-none"
          style={{ animation: 'fadeSlideUp 0.3s ease both' }}
        >
          {inlineToast}
        </div>
      )}
    </div>
  );
});