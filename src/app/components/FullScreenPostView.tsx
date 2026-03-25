import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, MessageCircle, Send, Bookmark, Share2, MoreVertical, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, Link as LinkIcon, EyeOff, UserX, Flag, Trash2, Archive } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { Post, Comment } from "../types";
import { ShareModal } from "./ShareModal";
import { CommentsModal } from "./CommentsModal";
import { ProgressiveImage } from "./ProgressiveImage";
import { getFilterStyle } from "./PhotoFilterPicker";
import { getCameraEraFilter, getCameraEraOverlay, getCameraEraGrain, getCameraEraLightLeak } from "./PhotoFilterPicker";
import { VHSNightVisionOverlay, isVHSFilter } from "./VHSNightVisionOverlay";

interface FullScreenPostViewProps {
  post?: Post; // Legacy support
  posts?: Post[]; // List of posts to scroll through
  initialPostId?: string; // ID to start at
  onClose: () => void;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onComment: (postId: string) => void;
  onNavigateToProfile?: (userId: string, postId?: string) => void;
  // Optional props for comments management if parent provides them
  onAddComment?: (postId: string, comment: Comment) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onDelete?: (postId: string) => void; // Added to match PostCard capability if passed
  onArchive?: (postId: string) => void;
  isArchived?: boolean;
  currentUserId?: string;
  currentUsername?: string;
  currentUserAvatar?: string;
  onHashtagClick?: (tag: string, sourcePostId?: string) => void;
  onSharePost?: (post: Post) => void;
}

export function FullScreenPostView({ 
  post: singlePost,
  posts: providedPosts,
  initialPostId,
  onClose,
  onLike,
  onSave,
  onComment,
  onNavigateToProfile,
  onAddComment,
  onDeleteComment,
  onDelete,
  onArchive,
  isArchived,
  currentUserId,
  currentUsername,
  currentUserAvatar,
  onHashtagClick,
  onSharePost
}: FullScreenPostViewProps) {
  // Normalize posts and initialize local state for optimistic updates
  const initialPosts = providedPosts || (singlePost ? [singlePost] : []);
  const [posts, setPosts] = useState(initialPosts);
  
  const initialIndex = initialPostId 
    ? initialPosts.findIndex(p => p.id === initialPostId) 
    : 0;
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);

  // Per-post media carousel index (keyed by post id)
  const [mediaIndices, setMediaIndices] = useState<Record<string, number>>({});
  // Swipe state for media carousel
  const [mediaTouchStart, setMediaTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [mediaTouchCurrent, setMediaTouchCurrent] = useState<{ x: number; y: number } | null>(null);
  const [mediaIsSwiping, setMediaIsSwiping] = useState(false);

  const getMediaIndex = (postId: string) => mediaIndices[postId] || 0;
  const setMediaIndex = (postId: string, idx: number) => {
    setMediaIndices(prev => ({ ...prev, [postId]: idx }));
  };

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      // Migrate or read from new key
      const savedDataRaw = localStorage.getItem('vibe_saved_posts_data');
      let savedPostIds: string[] = [];
      
      if (savedDataRaw) {
        const savedPosts = JSON.parse(savedDataRaw);
        if (Array.isArray(savedPosts)) {
          savedPostIds = savedPosts.map((p: Post) => p.id);
        }
      } else {
        // Fallback/Migration from old ID list if exists
        const oldSavedIdsRaw = localStorage.getItem('vibe_saved_posts');
        if (oldSavedIdsRaw) {
          savedPostIds = JSON.parse(oldSavedIdsRaw);
        }
      }

      if (savedPostIds.length > 0) {
        setPosts(currentPosts => currentPosts.map(p => ({
          ...p,
          isSaved: savedPostIds.includes(p.id) || p.isSaved
        })));
      }
    } catch (error) {
      console.error('Error loading saved posts:', error);
    }
  }, []);

  // Scroll to initial post on mount
  useEffect(() => {
    if (containerRef.current && !hasScrolledToInitial) {
      const element = containerRef.current.children[currentIndex] as HTMLElement;
      if (element) {
        // Use direct scrollTop instead of scrollIntoView to avoid parent-scroll bug inside scaled container
        containerRef.current.scrollTop = element.offsetTop;
        setHasScrolledToInitial(true);
      }
    }
  }, [currentIndex, hasScrolledToInitial]);

  // Track scroll to update current index (for URL updates or logic if needed)
  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
      if (index !== currentIndex && index >= 0 && index < posts.length) {
        setCurrentIndex(index);
      }
    }
  };

  const currentPost = posts[currentIndex];

  const handleLike = (post: Post) => {
    // Optimistic update
    const updatedPosts = posts.map(p => {
      if (p.id === post.id) {
        const isLiked = !p.isLiked;
        return {
          ...p,
          isLiked,
          likes: isLiked ? p.likes + 1 : p.likes - 1
        };
      }
      return p;
    });
    setPosts(updatedPosts);
    onLike(post.id);
  };

  const handleSave = (post: Post) => {
    const newIsSaved = !post.isSaved;
    
    // Optimistic update in UI
    const updatedPosts = posts.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          isSaved: newIsSaved
        };
      }
      return p;
    });
    setPosts(updatedPosts);
    
    // Persist full post object to localStorage
    try {
      const savedDataRaw = localStorage.getItem('vibe_saved_posts_data');
      let savedPosts: Post[] = savedDataRaw ? JSON.parse(savedDataRaw) : [];
      
      if (newIsSaved) {
        // Add if not exists
        if (!savedPosts.some(p => p.id === post.id)) {
          // Store with isSaved = true — strip large base64 data to avoid exceeding localStorage limits
          const leanPost = {
            ...post,
            isSaved: true,
            imageUrls: post.imageUrls?.filter(u => u.startsWith('http')),
            imageUrl: post.imageUrl?.startsWith('http') ? post.imageUrl : undefined,
            thumbnailUrls: undefined,
            videoUrl: post.videoUrl?.startsWith('http') ? post.videoUrl : undefined,
            userAvatar: post.userAvatar?.startsWith('http') ? post.userAvatar : undefined,
          };
          savedPosts.push(leanPost);
        }
      } else {
        // Remove
        savedPosts = savedPosts.filter(p => p.id !== post.id);
      }
      
      localStorage.setItem('vibe_saved_posts_data', JSON.stringify(savedPosts));
      
      // Also update the old key for backward compatibility or other components using it (optional, but good for safety)
      localStorage.setItem('vibe_saved_posts', JSON.stringify(savedPosts.map(p => p.id)));
      
    } catch (error) {
      console.error('Error saving post state:', error);
    }

    onSave(post.id);
  };

  const handleShare = () => {
    if (onSharePost && currentPost) {
      onSharePost(currentPost);
    } else {
      setShowShareModal(true);
    }
  };
  
  const handleCopyLink = () => {
    if (!currentPost) return;
    const postUrl = `https://vibe.app/p/${currentPost.id}`;
    
    // Use fallback directly to avoid NotAllowedError from Permissions Policy in some environments
    fallbackCopyToClipboard(postUrl);
    
    setShowOptionsMenu(false);
  };

  // Fallback copy method for when Clipboard API is blocked
  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Ensure it's part of the layout but invisible
    textArea.style.position = 'absolute';
    textArea.style.left = '0';
    textArea.style.top = '0';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert('Link copied to clipboard!');
      } else {
        throw new Error('Copy command failed');
      }
    } catch (err) {
      console.error('Copy failed', err);
      prompt('Copy this link:', text);
    }
    
    document.body.removeChild(textArea);
  };

  return createPortal(
    <div className="absolute inset-0 z-50 bg-black animate-in slide-in-from-bottom duration-300">
      {/* Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory bg-background scroll-smooth no-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {posts.map((post, index) => (
          <div 
            key={post.id} 
            className="w-full h-full flex flex-col items-center relative snap-start shrink-0"
          >
            {/* Full Screen Post Container */}
            <div className="w-full h-full flex flex-col relative">
              
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 px-4 py-4 flex items-start justify-between z-30 pointer-events-none">
                {/* User Info Badge */}
                <div 
                  className="pointer-events-auto mt-12 flex items-center gap-3 bg-background border-2 border-foreground px-3 py-2 shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all cursor-pointer active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('🔗 [FullScreenPostView] Badge clicked for user:', post.userId, post.username);
                    // Close the fullscreen view first
                    onClose();
                    // Then navigate to profile (use setTimeout to ensure close happens first)
                    if (onNavigateToProfile) {
                      setTimeout(() => {
                        onNavigateToProfile(post.userId, post.id);
                      }, 50);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="relative group">
                    <div className="w-10 h-10 border-2 border-foreground overflow-hidden bg-secondary">
                      <img
                        src={post.userAvatar}
                        alt={post.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-sm text-foreground uppercase tracking-tight hover:underline decoration-2">
                      {post.username}
                    </span>
                    <span className="text-[10px] text-foreground/70 font-bold uppercase tracking-widest leading-none mt-0.5">Original Audio</span>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="pointer-events-auto mt-12 flex items-center gap-3">
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptionsMenu(!showOptionsMenu);
                    }}
                    className="w-10 h-10 bg-background border-2 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_var(--foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all hover:bg-secondary"
                  >
                    <MoreVertical className="text-foreground" size={20} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="w-10 h-10 bg-background border-2 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_var(--foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    <X className="text-foreground" size={24} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Main Content - Full Height Flex */}
              <div className="flex-1 flex flex-col relative h-full">
                
                {/* Image Area - Takes available space */}
                <div className="flex-1 w-full h-full flex items-center justify-center relative p-0 overflow-hidden bg-black/5">
                  {/* Unified media carousel with swipe */}
                  {(() => {
                    const images = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
                    const allMedia: { type: 'image' | 'video'; url: string; thumbnail?: string }[] = [];
                    images.forEach((url, i) => {
                      allMedia.push({ type: 'image', url, thumbnail: post.thumbnailUrls?.[i] });
                    });
                    if (post.videoUrl) {
                      allMedia.push({ type: 'video', url: post.videoUrl });
                    }
                    if (allMedia.length === 0) {
                      allMedia.push({ type: 'image', url: 'https://images.unsplash.com/photo-1643473218649-7b3e02239423?w=800&q=80' });
                    }

                    const totalMedia = allMedia.length;
                    const hasMultiple = totalMedia > 1;
                    const mIdx = Math.min(getMediaIndex(post.id), totalMedia - 1);
                    const current = allMedia[mIdx];

                    const handleMediaTouchStart = (e: React.TouchEvent) => {
                      if (!hasMultiple) return;
                      const t = e.touches[0];
                      if (!t) return;
                      setMediaTouchStart({ x: t.clientX, y: t.clientY });
                      setMediaTouchCurrent({ x: t.clientX, y: t.clientY });
                    };
                    const handleMediaTouchMove = (e: React.TouchEvent) => {
                      if (!hasMultiple || !mediaTouchStart) return;
                      const t = e.touches[0];
                      if (!t) return;
                      setMediaTouchCurrent({ x: t.clientX, y: t.clientY });
                      const dx = Math.abs(t.clientX - mediaTouchStart.x);
                      const dy = Math.abs(t.clientY - mediaTouchStart.y);
                      if (dx > dy && dx > 10) setMediaIsSwiping(true);
                    };
                    const handleMediaTouchEnd = () => {
                      if (!hasMultiple || !mediaTouchStart || !mediaTouchCurrent) {
                        setMediaTouchStart(null); setMediaTouchCurrent(null); setMediaIsSwiping(false);
                        return;
                      }
                      const dx = mediaTouchCurrent.x - mediaTouchStart.x;
                      const dy = Math.abs(mediaTouchCurrent.y - mediaTouchStart.y);
                      if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
                        if (dx > 0) setMediaIndex(post.id, (mIdx - 1 + totalMedia) % totalMedia);
                        else setMediaIndex(post.id, (mIdx + 1) % totalMedia);
                      }
                      setMediaTouchStart(null); setMediaTouchCurrent(null); setMediaIsSwiping(false);
                    };

                    const swipeOffset = mediaIsSwiping && mediaTouchStart && mediaTouchCurrent
                      ? mediaTouchCurrent.x - mediaTouchStart.x : 0;

                    return (
                      <div
                        className="w-full h-full relative"
                        onTouchStart={handleMediaTouchStart}
                        onTouchMove={handleMediaTouchMove}
                        onTouchEnd={handleMediaTouchEnd}
                      >
                        {current.type === 'image' ? (
                          <div
                            style={
                              mediaIsSwiping
                                ? { transform: `translateX(${swipeOffset}px)`, transition: 'none' }
                                : { transform: 'translateX(0)', transition: 'transform 0.3s ease-out' }
                            }
                            className="w-full h-full"
                          >
                            <ProgressiveImage
                              thumbnailSrc={current.thumbnail}
                              masterSrc={current.url}
                              alt={post.caption}
                              filterStyle={post.filter ? getFilterStyle(post.filter) : undefined}
                              filterId={post.filter}
                              cameraEra={post.cameraEra}
                            />
                          </div>
                        ) : (
                          <div
                            className="w-full h-full bg-black flex items-center justify-center"
                            style={
                              mediaIsSwiping
                                ? { transform: `translateX(${swipeOffset}px)`, transition: 'none' }
                                : { transform: 'translateX(0)', transition: 'transform 0.3s ease-out' }
                            }
                          >
                            {isVHSFilter(post.filter) ? (
                              <VHSNightVisionOverlay className="w-full h-full">
                                <video
                                  src={current.url}
                                  className="w-full h-full object-cover"
                                  loop
                                  playsInline
                                  preload="metadata"
                                  muted
                                  controls
                                />
                              </VHSNightVisionOverlay>
                            ) : (
                              <video
                                src={current.url}
                                className="w-full h-full object-cover"
                                style={post.cameraEra && getCameraEraFilter(post.cameraEra) ? { filter: getCameraEraFilter(post.cameraEra)! } : undefined}
                                loop
                                playsInline
                                preload="metadata"
                                muted
                                controls
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
                          </div>
                        )}

                        {/* Tap zones for desktop */}
                        {hasMultiple && (
                          <>
                            <button
                              onClick={() => setMediaIndex(post.id, (mIdx - 1 + totalMedia) % totalMedia)}
                              className="absolute left-0 top-0 bottom-0 w-1/5 z-10"
                              aria-label="Previous"
                            />
                            <button
                              onClick={() => setMediaIndex(post.id, (mIdx + 1) % totalMedia)}
                              className="absolute right-0 top-0 bottom-0 w-1/5 z-10"
                              aria-label="Next"
                            />
                          </>
                        )}

                        {/* Counter badge */}
                        {hasMultiple && (
                          <div className="absolute top-4 right-4 bg-black/80 text-white text-xs font-mono font-bold px-2.5 py-1 border-2 border-white/60 z-20">
                            {mIdx + 1}/{totalMedia}
                          </div>
                        )}

                        {/* Dot indicators */}
                        {hasMultiple && (
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                            {allMedia.map((item, i) => (
                              <button
                                key={i}
                                onClick={() => setMediaIndex(post.id, i)}
                                className={`transition-all duration-200 border border-white/60 ${
                                  i === mIdx
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
                </div>

                {/* Footer Controls */}
                <div className="absolute bottom-0 left-0 right-0 z-20 pt-12 pb-12 px-6 md:pt-6 md:pb-6 md:px-4 pointer-events-none">
                  
                  {/* Action Buttons - Symmetrical Layout */}
                  <div className="flex items-center justify-start gap-3 mb-3 pointer-events-auto">
                    <button
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                        handleLike(post);
                      }}
                      className="w-12 h-12 flex items-center justify-center bg-background border-[3px] border-foreground shadow-[5px_5px_0px_0px_var(--foreground)] hover:shadow-[6px_6px_0px_0px_var(--foreground)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_var(--foreground)] transition-all duration-150 hover:bg-secondary group"
                    >
                      <Heart
                        className={`${post.isLiked ? 'text-red-600 fill-red-600' : 'text-foreground'} transition-all duration-200 group-active:scale-75 group-hover:scale-110`}
                        size={22}
                        strokeWidth={2.5}
                      />
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                        setShowComments(true);
                      }}
                      className="w-12 h-12 flex items-center justify-center bg-background border-[3px] border-foreground shadow-[5px_5px_0px_0px_var(--foreground)] hover:shadow-[6px_6px_0px_0px_var(--foreground)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_var(--foreground)] transition-all duration-150 hover:bg-secondary group"
                    >
                      <MessageCircle className="text-foreground transition-all duration-200 group-hover:-rotate-12 group-hover:scale-110" size={22} strokeWidth={2.5} />
                    </button>

                    <button 
                      onClick={async () => {
                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                        if (typeof navigator !== 'undefined' && navigator.share) {
                          try {
                            await navigator.share({
                              title: `Post by ${post.username}`,
                              text: post.caption,
                              url: `https://vibe.app/p/${post.id}`
                            });
                          } catch (err) {
                            // If user cancels or share fails, fallback to internal modal
                            handleShare();
                          }
                        } else {
                          handleShare();
                        }
                      }}
                      className="w-12 h-12 flex items-center justify-center bg-background border-[3px] border-foreground shadow-[5px_5px_0px_0px_var(--foreground)] hover:shadow-[6px_6px_0px_0px_var(--foreground)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_var(--foreground)] transition-all duration-150 hover:bg-secondary group"
                    >
                      <Send className="text-foreground transition-all duration-200 group-hover:scale-125 group-hover:translate-x-0.5 -ml-0.5 mt-0.5" size={20} strokeWidth={2.5} />
                    </button>

                    <button
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                        handleSave(post);
                      }}
                      className="w-12 h-12 flex items-center justify-center bg-background border-[3px] border-foreground shadow-[5px_5px_0px_0px_var(--foreground)] hover:shadow-[6px_6px_0px_0px_var(--foreground)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_var(--foreground)] transition-all duration-150 hover:bg-secondary group"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="22" 
                        height="22" 
                        viewBox="0 0 24 24" 
                        fill={post.isSaved ? "currentColor" : "none"} 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className={`text-foreground transition-all duration-200 group-hover:scale-110 ${post.isSaved ? 'fill-current' : ''}`}
                      >
                        <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>
                      </svg>
                    </button>
                  </div>

                  {/* Likes Count & Text Content */}
                  <div className="pointer-events-auto space-y-2 px-1">
                     <div className="mb-1">
                        <p className="font-black text-foreground text-lg tracking-wide uppercase">
                           {post.likes.toLocaleString()} likes
                        </p>
                     </div>

                    <div className="text-sm text-foreground leading-relaxed line-clamp-3 font-medium">
                      <span className="font-black text-foreground mr-2 uppercase tracking-tight">{post.username}</span>
                      {onHashtagClick
                        ? (post.caption || '').split(/(#\w+)/g).map((part, i) =>
                            /^#\w+$/.test(part)
                              ? <button key={i} onClick={(e) => { e.stopPropagation(); onHashtagClick(part.slice(1), post.id); onClose(); }} className="text-primary font-bold hover:underline">{part}</button>
                              : <span key={i}>{part}</span>
                          )
                        : post.caption}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowComments(true);
                      }}
                      className="text-foreground/70 text-xs font-black hover:text-foreground transition-colors uppercase tracking-wide hover:underline decoration-2"
                    >
                      View all {post.comments} comments
                    </button>
                    <div className="text-[10px] text-foreground/50 font-black uppercase tracking-widest pt-1">
                      {post.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        postUrl={`https://vibe.app/p/${currentPost?.id}`} 
        post={currentPost}
        currentUserId={currentUserId}
        currentUsername={currentUsername}
        currentUserAvatar={currentUserAvatar}
      />
      
      {showComments && currentPost && (
        <CommentsModal 
          post={currentPost}
          onClose={() => setShowComments(false)}
          onAddComment={onAddComment || ((postId, comment) => {})}
          onDeleteComment={onDeleteComment || ((postId, commentId) => {})}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
          currentUserAvatar={currentUserAvatar}
        />
      )}

      {/* Options Menu - Matching PostCard Style */}
      {showOptionsMenu && currentPost && (
        <div 
          className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowOptionsMenu(false)}
        >
          <div 
            className="w-full max-w-sm bg-background/95 backdrop-blur-2xl rounded-3xl border border-accent/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
             {/* Menu Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-accent/10 to-transparent border-b border-accent/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={currentPost.userAvatar} 
                  alt={currentPost.username} 
                  className="w-8 h-8 rounded-full object-cover border border-accent/30"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground leading-none">{currentPost.username}</span>
                  <span className="text-[10px] text-muted-foreground font-medium leading-none mt-1">Post Options</span>
                </div>
              </div>
              <button
                onClick={() => setShowOptionsMenu(false)}
                className="w-6 h-6 rounded-lg bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors"
              >
                <X className="text-accent" size={14} />
              </button>
            </div>

            <div className="flex flex-col py-2">
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/10 transition-colors"
                onClick={handleCopyLink}
              >
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                   <LinkIcon size={16} className="text-accent" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">Copy Link</p>
                  <p className="text-xs text-muted-foreground">Share this post</p>
                </div>
              </button>

              <button 
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/10 transition-colors"
                onClick={() => {
                  handleSave(currentPost);
                  setShowOptionsMenu(false);
                }}
              >
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                   <Bookmark size={16} className={currentPost.isSaved ? 'text-accent fill-accent' : 'text-accent'} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{currentPost.isSaved ? 'Unsave Post' : 'Save Post'}</p>
                  <p className="text-xs text-muted-foreground">{currentPost.isSaved ? 'Remove from saved' : 'Add to your collection'}</p>
                </div>
              </button>
              
              <div className="my-2 mx-4 border-t border-accent/10" />

              <button 
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/10 transition-colors"
                onClick={() => {
                  setShowOptionsMenu(false);
                  // alert('We\'ll show you fewer posts like this');
                }}
              >
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                   <EyeOff size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">Not Interested</p>
                  <p className="text-xs text-muted-foreground">See fewer posts like this</p>
                </div>
              </button>
              
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/10 transition-colors"
                onClick={() => {
                  setShowOptionsMenu(false);
                  // alert(`Unfollowed ${currentPost.username}`);
                }}
              >
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                   <UserX size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">Unfollow {currentPost.username}</p>
                  <p className="text-xs text-muted-foreground">Stop seeing their posts</p>
                </div>
              </button>

              <div className="my-2 mx-4 border-t border-accent/10" />

              <button 
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors"
                onClick={() => {
                  setShowOptionsMenu(false);
                  // alert('Post reported. Thank you for helping keep Vibe safe!');
                }}
              >
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                   <Flag size={16} className="text-red-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-red-500">Report Post</p>
                  <p className="text-xs text-muted-foreground">Report inappropriate content</p>
                </div>
              </button>

              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                      onDelete(currentPost.id);
                      setShowOptionsMenu(false);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Trash2 className="text-red-500" size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-red-500">Delete Post</p>
                    <p className="text-xs text-muted-foreground">Permanently remove this post</p>
                  </div>
                </button>
              )}

              {onArchive && (
                <button
                  onClick={() => {
                    if (isArchived) {
                      onArchive(currentPost.id);
                      setShowOptionsMenu(false);
                    } else if (confirm('Are you sure you want to archive this post?')) {
                      onArchive(currentPost.id);
                      setShowOptionsMenu(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${isArchived ? 'hover:bg-green-500/10' : 'hover:bg-red-500/10'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isArchived ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <Archive className={isArchived ? 'text-green-600' : 'text-red-500'} size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${isArchived ? 'text-green-600' : 'text-red-500'}`}>{isArchived ? 'Unarchive Post' : 'Archive Post'}</p>
                    <p className="text-xs text-muted-foreground">{isArchived ? 'Restore this post to your profile' : 'Move this post to your archive'}</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}