import { useState, useRef, useEffect } from 'react';
import { TrendingUp, Crown, Medal, Award, ChevronRight, X, Heart, MessageCircle, Users, ThumbsDown } from 'lucide-react';
import { Post } from '../types';
import { topPosts } from '../data/posts';
import { motion } from 'motion/react';
import { FullScreenPostView } from './FullScreenPostView';
import { CommentsModal } from './CommentsModal';

// Mock friends list for friends-only view
const mockFriends = ['l-user1', 'l-user3', 'l-user5', 'l-user7'];

interface LeaderboardPageProps {
  onNavigateToPost?: (postId: string) => void;
  onViewProfile?: (userId: string, postId?: string) => void;
  onOverlayStateChange?: (isOpen: boolean) => void;
  currentUserId?: string;
  currentUsername?: string;
  currentUserAvatar?: string;
  onSharePost?: (post: Post) => void;
  onHashtagClick?: (tag: string) => void;
}

export function LeaderboardPage({ onNavigateToPost, onViewProfile, onOverlayStateChange, currentUserId, currentUsername, currentUserAvatar, onSharePost, onHashtagClick }: LeaderboardPageProps = {}) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [viewMode, setViewMode] = useState<'global' | 'friends'>('global');
  const [sortMode, setSortMode] = useState<'liked' | 'disliked'>('liked');
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerContentRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Measure the inner header content height (not the collapsing wrapper)
  useEffect(() => {
    const el = headerContentRef.current;
    if (!el) return;
    const measure = () => setHeaderHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Track scroll position to hide/show header
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      setIsScrolled(el.scrollTop > 50);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Notify parent about overlay state
  useEffect(() => {
    onOverlayStateChange?.(!!selectedPost);
  }, [selectedPost, onOverlayStateChange]);

  // Filter posts based on view mode
  const displayedPosts = viewMode === 'global' 
    ? topPosts 
    : topPosts.filter(post => mockFriends.includes(post.userId)).map((post, index) => ({
        ...post,
        rank: index + 1 // Re-rank for friends view
      }));

  // Sort posts based on sortMode (liked = highest to lowest, disliked = lowest to highest)
  const sortedPosts = [...displayedPosts].sort((a, b) => {
    if (sortMode === 'liked') {
      return b.likes - a.likes; // Descending order
    } else {
      return (b.dislikes || 0) - (a.dislikes || 0); // Descending order for dislikes (most disliked first)
    }
  }).map((post, index) => ({
    ...post,
    rank: index + 1 // Re-rank after sorting
  }));

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#B9F2FF" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
          <path d="M6 3h12l4 6-10 13L2 9Z" />
          <path d="M11 3 8 9l4 13 4-13-3-6" />
          <path d="M2 9h20" />
        </svg>;
      case 2:
        return <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#9333EA" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
          <circle cx="12" cy="4" r="2.5" />
          <path d="M7 7h10l-1.5 12h-7z" />
          <path d="M12 7v12" />
          <rect x="5" y="19" width="14" height="3" />
        </svg>;
      case 3:
        return <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#10b981" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
          <path d="M6 3h12l4 6-10 13L2 9Z" />
          <path d="M2 9h20" />
          <path d="M10 12h4v2h-2v2h2v2h-4" />
        </svg>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header - collapses smoothly on scroll */}
      <div
        className="shrink-0 z-40 overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          height: isScrolled ? '0px' : `${headerHeight}px`,
          opacity: isScrolled ? 0 : 1,
        }}
      >
        <div
          ref={headerContentRef}
          className="bg-background border-b-4 border-foreground shadow-[0px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_10%,transparent)]"
        >
          <div style={{
            paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
            paddingRight: 'calc(1rem + env(safe-area-inset-right))',
            paddingTop: '1rem',
            paddingBottom: '1rem'
          }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-foreground border-2 border-foreground shadow-[2px_2px_0px_0px_var(--background)]"
                style={{ animation: 'badgePop 0.5s cubic-bezier(.22,.68,0,1.2) 0.1s both' }}>
                {sortMode === 'liked' ? (
                  <TrendingUp className="text-background dark:text-white" size={24} strokeWidth={3} />
                ) : (
                  <ThumbsDown className="text-background dark:text-white" size={24} strokeWidth={3} />
                )}
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight uppercase italic"
                style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) 0.15s both' }}>TOP 10 WEEKLY</h1>
            </div>
            <p className="text-foreground/70 text-sm font-bold font-mono mb-4 ml-1 uppercase">
              {sortMode === 'liked' ? 'Most liked posts of the week' : 'Most disliked posts of the week'}
            </p>
            
            {/* Sort Mode Toggle */}
            <div className="flex bg-background border-2 border-foreground p-1 shadow-[4px_4px_0px_0px_var(--foreground)] mb-3">
              <button
                onClick={() => setSortMode('liked')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-black uppercase transition-all ${
                  sortMode === 'liked' 
                    ? 'bg-foreground text-background' 
                    : 'text-foreground hover:bg-foreground/5'
                }`}
              >
                <Heart size={16} strokeWidth={3} />
                Most Liked
              </button>
              <button
                onClick={() => setSortMode('disliked')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-black uppercase transition-all ${
                  sortMode === 'disliked' 
                    ? 'bg-foreground text-background' 
                    : 'text-foreground hover:bg-foreground/5'
                }`}
              >
                <ThumbsDown size={16} strokeWidth={3} />
                Most Disliked
              </button>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-background border-2 border-foreground p-1 shadow-[4px_4px_0px_0px_var(--foreground)]">
              <button
                onClick={() => setViewMode('global')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-black uppercase transition-all ${
                  viewMode === 'global' 
                    ? 'bg-foreground text-background' 
                    : 'text-foreground hover:bg-foreground/5'
                }`}
              >
                <Crown size={16} strokeWidth={3} />
                Global
              </button>
              <button
                onClick={() => setViewMode('friends')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-black uppercase transition-all ${
                  viewMode === 'friends' 
                    ? 'bg-foreground text-background' 
                    : 'text-foreground hover:bg-foreground/5'
                }`}
              >
                <Users size={16} strokeWidth={3} />
                Friends
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard - scrollable area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" ref={scrollRef}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {sortedPosts.length > 0 ? (
            sortedPosts.map((post) => {
              // Define shadow colors based on rank and sort mode
              let shadowColor = 'rgba(0,0,0,1)';
              if (post.rank === 1) {
                shadowColor = sortMode === 'liked' ? '#FFC107' : '#9ACD32';
              } else if (post.rank === 2) {
                shadowColor = sortMode === 'liked' ? '#94A3B8' : '#8B4513';
              } else if (post.rank === 3) {
                shadowColor = sortMode === 'liked' ? '#34D399' : '#BDB76B';
              }

              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`group cursor-pointer relative bg-background border-4 border-foreground overflow-hidden transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px]`}
                  style={{
                    boxShadow: `8px 8px 0px 0px ${shadowColor}`,
                    animation: `rankSlideIn 0.38s cubic-bezier(.22,.68,0,1.2) ${(post.rank - 1) * 70}ms both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `4px 4px 0px 0px ${shadowColor}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `8px 8px 0px 0px ${shadowColor}`;
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Rank */}
                      <div className="flex flex-col items-center justify-start w-20 flex-shrink-0">
                        {post.rank <= 3 ? (
                          <div className="flex flex-col items-center gap-1 transform group-hover:scale-105 transition-transform">
                             {post.rank === 1 && (
                               <>
                                 <div className="flex items-center gap-1">
                                   <span className="text-xl font-black text-foreground">1</span>
                                   <motion.svg 
                                     xmlns="http://www.w3.org/2000/svg" 
                                     width="48" 
                                     height="48" 
                                     viewBox="0 0 24 24" 
                                     fill="none" 
                                     stroke="currentColor" 
                                     strokeWidth="2" 
                                     strokeLinecap="round" 
                                     strokeLinejoin="round" 
                                     className="text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                                     style={{ animation: 'crownFloat 2.5s ease-in-out infinite' }}
                                     whileHover={{ rotate: [0, -10, 10, -10, 10, 0], scale: 1.1 }}
                                     transition={{ duration: 0.5 }}
                                   >
                                     {sortMode === 'liked' ? (
                                       <>
                                         <ellipse cx="12" cy="21" rx="6" ry="2" fill="#FFC107" stroke="black" />
                                         <path d="M12 21C10.5 17 9 11 5 3L8 3C10 8 11 11 12 13C13 11 14 8 16 3L19 3C15 11 13.5 17 12 21Z" fill="#FFC107" stroke="black" />
                                       </>
                                     ) : (
                                       <>
                                         {/* Trash Can */}
                                         <rect x="7" y="7" width="10" height="14" rx="1" fill="#9ACD32" stroke="black" strokeWidth="2" />
                                         <path d="M6 7h12" stroke="black" strokeWidth="2" />
                                         <rect x="8" y="4" width="8" height="3" fill="#9ACD32" stroke="black" strokeWidth="2" />
                                         {/* Trash lines */}
                                         <line x1="10" y1="10" x2="10" y2="18" stroke="black" strokeWidth="1.5" />
                                         <line x1="12" y1="10" x2="12" y2="18" stroke="black" strokeWidth="1.5" />
                                         <line x1="14" y1="10" x2="14" y2="18" stroke="black" strokeWidth="1.5" />
                                       </>
                                     )}
                                    </motion.svg>
                                 </div>
                                 <span className={`text-[11px] font-black uppercase tracking-tight leading-none text-center bg-black px-2 py-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                                   sortMode === 'liked' ? 'text-[#FFC107]' : 'text-[#9ACD32]'
                                 }`}>
                                   {sortMode === 'liked' ? "It's lonely at the top" : "Congrats, everyone hates you"}
                                 </span>
                               </>
                             )}
                             {post.rank === 2 && (
                               <>
                                 <div className="flex items-center gap-1">
                                   <span className="text-xl font-black text-foreground">2</span>
                                   <motion.svg 
                                     xmlns="http://www.w3.org/2000/svg" 
                                     width="48" 
                                     height="48" 
                                     viewBox="0 0 24 24" 
                                     fill="none" 
                                     stroke="currentColor" 
                                     strokeWidth="2" 
                                     strokeLinecap="round" 
                                     strokeLinejoin="round" 
                                     className="text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                                     whileHover={{ rotate: [0, -5, 5, -5, 5, 0], scale: 1.1 }}
                                     transition={{ duration: 0.5 }}
                                   >
                                     {sortMode === 'liked' ? (
                                       <>
                                         <ellipse cx="12" cy="21" rx="6" ry="2" fill="#CBD5E1" stroke="black" />
                                         <path d="M12 21C10.5 17 9 11 5 3L8 3C10 8 11 11 12 13C13 11 14 8 16 3L19 3C15 11 13.5 17 12 21Z" fill="#CBD5E1" stroke="black" />
                                       </>
                                     ) : (
                                       <>
                                         {/* Poop Emoji */}
                                         <ellipse cx="12" cy="19" rx="6" ry="3" fill="#8B4513" stroke="black" strokeWidth="2" />
                                         <path d="M6 16C6 16 6 13 8 12C8 12 7 10 9 9C9 9 9 7 12 7C15 7 15 9 15 9C17 10 16 12 16 12C18 13 18 16 18 16" fill="#8B4513" stroke="black" strokeWidth="2" strokeLinejoin="round" />
                                         {/* Eyes */}
                                         <circle cx="10" cy="13" r="1" fill="black" />
                                         <circle cx="14" cy="13" r="1" fill="black" />
                                         {/* Mouth */}
                                         <path d="M10 15C10 15 11 16 12 16C13 16 14 15 14 15" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                       </>
                                     )}
                                   </motion.svg>
                                 </div>
                                 <span className={`text-[11px] font-black uppercase tracking-tight leading-none text-center bg-black px-2 py-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                                   sortMode === 'liked' ? 'text-[#CBD5E1]' : 'text-[#8B4513]'
                                 }`}>
                                   {sortMode === 'liked' ? 'The person above me sucks' : 'Second worst. Sad!'}
                                 </span>
                               </>
                             )}
                             {post.rank === 3 && (
                               <>
                                 <div className="flex items-center gap-1">
                                   <span className="text-xl font-black text-foreground">3</span>
                                   <motion.svg 
                                     xmlns="http://www.w3.org/2000/svg" 
                                     width="48" 
                                     height="48" 
                                     viewBox="0 0 24 24" 
                                     fill="none" 
                                     stroke="currentColor" 
                                     strokeWidth="2" 
                                     strokeLinecap="round" 
                                     strokeLinejoin="round" 
                                     className="text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                                     whileHover={{ rotate: [0, -5, 5, -5, 5, 0], scale: 1.1 }}
                                     transition={{ duration: 0.5 }}
                                   >
                                     {sortMode === 'liked' ? (
                                       <>
                                         <ellipse cx="12" cy="21" rx="6" ry="2" fill="#34D399" stroke="black" />
                                         <path d="M12 21C10.5 17 9 11 5 3L8 3C10 8 11 11 12 13C13 11 14 8 16 3L19 3C15 11 13.5 17 12 21Z" fill="#34D399" stroke="black" />
                                       </>
                                     ) : (
                                       <>
                                         {/* Rotten Tomato */}
                                         <circle cx="12" cy="12" r="7" fill="#BDB76B" stroke="black" strokeWidth="2" />
                                         {/* Stem */}
                                         <path d="M12 5C12 5 10 3 8 4" stroke="#6B8E23" strokeWidth="2" fill="none" />
                                         {/* Spots/rot marks */}
                                         <circle cx="10" cy="11" r="1.5" fill="#5A5A3A" />
                                         <circle cx="14" cy="13" r="1.5" fill="#5A5A3A" />
                                         <circle cx="12" cy="15" r="1" fill="#5A5A3A" />
                                         {/* Drip line */}
                                         <path d="M12 19L12 21" stroke="#5A5A3A" strokeWidth="1.5" />
                                       </>
                                     )}
                                   </motion.svg>
                                 </div>
                                 <span className={`text-[11px] font-black uppercase tracking-tight leading-none text-center bg-black px-2 py-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                                   sortMode === 'liked' ? 'text-[#34D399]' : 'text-[#BDB76B]'
                                 }`}>
                                   {sortMode === 'liked' ? "At least I'm on the leaderboard" : "Bronze medal of shame"}
                                 </span>
                               </>
                             )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-foreground text-background font-black text-xl border-2 border-foreground">
                            #{post.rank}
                          </div>
                        )}
                      </div>

                      {/* Post Preview */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 border-2 border-foreground overflow-hidden bg-foreground flex-shrink-0">
                               <img
                                src={post.userAvatar}
                                alt={post.username}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-sm text-foreground uppercase truncate">{post.username}</p>
                            </div>
                          </div>
                          <p className="text-sm text-foreground font-bold line-clamp-2 leading-relaxed">{post.caption}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-foreground border-t-2 border-foreground/10 pt-1.5">
                          {sortMode === 'liked' ? (
                            <span className="flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 border-2 border-foreground shadow-[3px_3px_0px_0px_var(--foreground)] font-black text-sm">
                              <Heart size={14} fill="currentColor" className="text-red-500" />
                              {post.likes.toLocaleString()}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 border-2 border-foreground shadow-[3px_3px_0px_0px_var(--foreground)] font-black text-sm">
                              <ThumbsDown size={14} fill="currentColor" className="text-orange-500" />
                              {(post.dislikes || 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Post Image */}
                      <div className="w-24 h-24 bg-foreground border-2 border-foreground flex-shrink-0 shadow-[4px_4px_0px_0px_var(--foreground)]">
                        <img
                          src={post.imageUrl}
                          alt="Post"
                          className="w-full h-full object-cover transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-foreground">
              <div className="w-16 h-16 bg-card border-4 border-foreground flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_var(--foreground)]">
                <Users size={32} strokeWidth={3} />
              </div>
              <p className="font-black text-lg uppercase">No friends ranked yet</p>
              <p className="text-sm font-mono bg-card px-2 border border-foreground mt-2">Follow more people to see their top posts here!</p>
            </div>
          )}
        </div>
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <FullScreenPostView
          post={selectedPost}
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
          onAddComment={(postId, comment) => {
            // Handle add comment
          }}
          onDeleteComment={(postId, commentId) => {
            // Handle delete comment
          }}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
          currentUserAvatar={currentUserAvatar}
        />
      )}
    </div>
  );
}