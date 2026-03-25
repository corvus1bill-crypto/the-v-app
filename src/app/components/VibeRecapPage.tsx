import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Heart, MessageCircle, Users, TrendingUp, Flame, Eye, Clock, Zap, Star, Award, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Post } from '../types';

interface VibeRecapPageProps {
  onBack: () => void;
  posts: Post[];
  currentUserId: string;
  followersCount: number;
  followingCount: number;
  username: string;
  avatar: string;
}

interface RecapCard {
  id: string;
  type: 'stat' | 'highlight' | 'insight' | 'badge';
  title: string;
  value: string;
  subtitle: string;
  emoji: string;
  color: string;
}

export function VibeRecapPage({ onBack, posts, currentUserId, followersCount, followingCount, username, avatar }: VibeRecapPageProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const userPosts = posts.filter(p => p.userId === currentUserId);
  const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = userPosts.reduce((sum, p) => sum + p.comments, 0);
  const totalShares = userPosts.reduce((sum, p) => sum + (p.shares || 0), 0);
  const topPost = userPosts.length > 0 ? userPosts.reduce((max, p) => p.likes > max.likes ? p : max, userPosts[0]) : null;
  const avgLikes = userPosts.length > 0 ? Math.round(totalLikes / userPosts.length) : 0;
  const engagementRate = userPosts.length > 0 ? ((totalLikes + totalComments) / (userPosts.length * Math.max(followersCount, 1)) * 100).toFixed(1) : '0';

  // AI-generated insights
  const insights = [
    userPosts.length > 5 ? 'You\'re on a posting streak! Your consistency is paying off.' : 'Post more to grow your audience. Consistency is key!',
    totalLikes > 10000 ? 'Your content is resonating. The community loves your vibes!' : 'Keep experimenting with different content styles.',
    followersCount > 100 ? `Your ${followersCount} followers are actively engaging.` : 'Growing steadily! Quality content attracts quality followers.',
  ];

  const recapCards: RecapCard[] = [
    { id: 'posts', type: 'stat', title: 'Posts Created', value: userPosts.length.toString(), subtitle: 'this week', emoji: '📝', color: '#3B82F6' },
    { id: 'likes', type: 'stat', title: 'Total Likes', value: totalLikes.toLocaleString(), subtitle: 'across all posts', emoji: '❤️', color: '#EF4444' },
    { id: 'comments', type: 'stat', title: 'Comments', value: totalComments.toLocaleString(), subtitle: 'conversations started', emoji: '💬', color: '#8B5CF6' },
    { id: 'shares', type: 'stat', title: 'Shares', value: totalShares.toLocaleString(), subtitle: 'times shared', emoji: '🔄', color: '#10B981' },
    { id: 'engagement', type: 'stat', title: 'Engagement Rate', value: `${engagementRate}%`, subtitle: 'above average', emoji: '📊', color: '#F59E0B' },
    { id: 'followers', type: 'stat', title: 'Followers', value: followersCount.toLocaleString(), subtitle: `following ${followingCount}`, emoji: '👥', color: '#EC4899' },
    { id: 'top', type: 'highlight', title: 'Top Post', value: topPost ? `${topPost.likes.toLocaleString()} likes` : 'N/A', subtitle: topPost?.caption?.slice(0, 40) || 'No posts yet', emoji: '🏆', color: '#FFC107' },
    { id: 'vibe', type: 'badge', title: 'Vibe Score', value: Math.min(99, Math.round(totalLikes / 100 + userPosts.length * 5 + followersCount / 10)).toString(), subtitle: 'out of 100', emoji: '⚡', color: '#ff7a2e' },
  ];

  useEffect(() => {
    if (!showAll) {
      const timer = setInterval(() => {
        setCurrentCard(prev => {
          if (prev >= recapCards.length - 1) {
            setShowAll(true);
            clearInterval(timer);
            return prev;
          }
          return prev + 1;
        });
      }, 2200);
      return () => clearInterval(timer);
    }
  }, [showAll, recapCards.length]);

  return (
    <div className="flex flex-col bg-background" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Header */}
      <div className="shrink-0 z-40 bg-background border-b-4 border-foreground px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all active:scale-95">
            <ArrowLeft className="text-foreground" size={20} strokeWidth={3} />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground uppercase italic tracking-tight flex items-center gap-2" style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) both' }}>
              <Sparkles size={22} strokeWidth={3} />
              VIBE RECAP
            </h1>
            <p className="text-[10px] font-mono font-bold text-foreground/50 uppercase">AI-Powered Weekly Summary</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-8">
        {/* Profile Summary Card */}
        <div className="mt-5 mb-6 bg-card border-4 border-foreground shadow-[6px_6px_0px_0px_var(--foreground)] p-5 text-center" style={{ animation: 'bounceIn 0.5s cubic-bezier(.22,.68,0,1.2) both' }}>
          <div className="w-20 h-20 mx-auto border-4 border-foreground bg-foreground overflow-hidden shadow-[4px_4px_0px_0px_var(--foreground)] mb-3">
            <img src={avatar} alt={username} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-black text-foreground uppercase">{username}'s Week</h2>
          <p className="text-xs font-mono font-bold text-foreground/50 mt-1">March 10 - March 16, 2026</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="px-3 py-1 bg-foreground text-background border-2 border-foreground font-black text-sm" style={{ animation: 'badgePop 0.5s cubic-bezier(.22,.68,0,1.2) 0.3s both' }}>
              ⚡ VIBE SCORE: {Math.min(99, Math.round(totalLikes / 100 + userPosts.length * 5 + followersCount / 10))}
            </div>
          </div>
        </div>

        {/* Animated Stats Cards */}
        {!showAll ? (
          <div className="relative h-48 mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={recapCards[currentCard].id}
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -20 }}
                transition={{ duration: 0.4, type: 'spring' }}
                className="absolute inset-0 bg-card border-4 border-foreground shadow-[6px_6px_0px_0px_var(--foreground)] p-6 flex flex-col items-center justify-center"
              >
                <div className="text-5xl mb-3" style={{ animation: 'floatY 2s ease-in-out infinite' }}>{recapCards[currentCard].emoji}</div>
                <p className="text-xs font-black text-foreground/50 uppercase mb-1">{recapCards[currentCard].title}</p>
                <p className="text-4xl font-black text-foreground">{recapCards[currentCard].value}</p>
                <p className="text-xs font-mono font-bold text-foreground/60 mt-1">{recapCards[currentCard].subtitle}</p>
              </motion.div>
            </AnimatePresence>
            {/* Progress dots */}
            <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 flex gap-1.5">
              {recapCards.map((_, i) => (
                <div key={i} className={`w-2 h-2 transition-all ${i <= currentCard ? 'bg-foreground scale-110' : 'bg-foreground/20'}`} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {recapCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.08, type: 'spring' }}
                  className="bg-card border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] p-4 text-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all cursor-pointer"
                >
                  <div className="text-3xl mb-2">{card.emoji}</div>
                  <p className="text-[9px] font-black text-foreground/40 uppercase">{card.title}</p>
                  <p className="text-2xl font-black text-foreground">{card.value}</p>
                  <p className="text-[10px] font-mono font-bold text-foreground/50">{card.subtitle}</p>
                </motion.div>
              ))}
            </div>

            {/* AI Insights */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={18} strokeWidth={3} className="text-foreground" />
                <h2 className="text-sm font-black text-foreground uppercase">AI Insights</h2>
              </div>
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.15 }}
                    className="bg-card border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] p-4 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 shrink-0 bg-foreground text-background flex items-center justify-center font-black text-sm border-2 border-foreground">
                      <Sparkles size={14} strokeWidth={3} />
                    </div>
                    <p className="text-sm font-bold text-foreground font-mono leading-relaxed">{insight}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Top Post Highlight */}
            {topPost && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Award size={18} strokeWidth={3} className="text-foreground" />
                  <h2 className="text-sm font-black text-foreground uppercase">Top Performing Post</h2>
                </div>
                <div className="bg-card border-4 border-foreground shadow-[6px_6px_0px_0px_var(--foreground)] overflow-hidden" style={{ animation: 'breatheGlow 3s ease-in-out infinite' }}>
                  {topPost.imageUrl && (
                    <div className="aspect-video bg-black overflow-hidden">
                      <img src={topPost.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm font-bold text-foreground mb-3">{topPost.caption}</p>
                    <div className="flex items-center gap-4 text-foreground/60">
                      <span className="flex items-center gap-1 text-xs font-black"><Heart size={14} strokeWidth={3} /> {topPost.likes.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-xs font-black"><MessageCircle size={14} strokeWidth={3} /> {topPost.comments.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-xs font-black"><Share2 size={14} strokeWidth={3} /> {(topPost.shares || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Milestones */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Star size={18} strokeWidth={3} className="text-foreground" />
                <h2 className="text-sm font-black text-foreground uppercase">Milestones</h2>
              </div>
              <div className="space-y-2">
                {[
                  { label: `${userPosts.length} posts created`, reached: userPosts.length > 0, icon: '📝' },
                  { label: `${totalLikes.toLocaleString()} total likes`, reached: totalLikes > 100, icon: '❤️' },
                  { label: `${followersCount} followers`, reached: followersCount > 0, icon: '👥' },
                  { label: 'First viral post (1K+ likes)', reached: topPost ? topPost.likes >= 1000 : false, icon: '🔥' },
                  { label: 'Community contributor', reached: totalComments > 50, icon: '💬' },
                ].map((milestone, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 border-2 transition-all ${milestone.reached ? 'border-foreground bg-foreground/5' : 'border-foreground/20 opacity-50'}`}>
                    <span className="text-xl">{milestone.icon}</span>
                    <span className="text-xs font-black text-foreground uppercase flex-1">{milestone.label}</span>
                    {milestone.reached && (
                      <div className="w-6 h-6 bg-foreground text-background flex items-center justify-center" style={{ animation: 'badgePop 0.4s ease both' }}>
                        <span className="text-xs font-black">✓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Share Recap */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="w-full py-4 bg-foreground text-background border-4 border-foreground font-black uppercase text-sm shadow-[4px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] transition-all mb-4 flex items-center justify-center gap-2"
            >
              <Share2 size={18} strokeWidth={3} />
              Share My Vibe Recap
            </motion.button>
          </>
        )}

        {/* Skip button when animating */}
        {!showAll && (
          <button
            onClick={() => { setShowAll(true); setCurrentCard(recapCards.length - 1); }}
            className="w-full mt-8 py-3 bg-card border-2 border-foreground text-foreground font-black uppercase text-xs hover:bg-foreground hover:text-background transition-all"
          >
            Skip Animation →
          </button>
        )}
      </div>
    </div>
  );
}
